import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';

const BASE_FONT_SIZE = 15;
const BOOT_STEPS = ['authenticating runtime', 'binding transport', 'warming output log', 'linking apnaShell'];
const PROMPT_LABEL = '\x1b[38;2;119;178;255mbolBhai\x1b[0m>> ';
const OUTPUT_LABEL = '\x1b[38;2;255;92;92msunBhai\x1b[0m>';
const OUTPUT_PREFIX = `${OUTPUT_LABEL}> `;
const OUTPUT_INDENT = ' '.repeat('sunBhai> '.length);
const WELCOME_MESSAGE = 'Welcome to apnaShell. Thanks for using it';
const WELCOME_AUTHOR = ' - Divyanshu';
const OUTPUT_CONTENT_COLUMN = 'sunBhai> '.length + 1;
const THEME_OPTIONS = [
  { id: 'soft', label: 'soft', intensity: 0.78 },
  { id: 'standard', label: 'standard', intensity: 1 },
  { id: 'surge', label: 'surge', intensity: 1.18 }
] as const;
const STORAGE_KEYS = {
  fontScale: 'myshell-terminal:font-scale',
  themeMode: 'myshell-terminal:theme-mode'
} as const;

type AppStatus = 'booting' | 'online' | 'offline';
type ThemeMode = (typeof THEME_OPTIONS)[number]['id'];

function normalizeChunk(chunk: string) {
  return chunk.replace(/\r?\n/g, '\r\n');
}

function inferShellVersion(shellPath: string) {
  const match = shellPath.match(/myshell_(v\d+)/i);
  return match?.[1]?.toUpperCase() ?? 'V6';
}

function normalizeWindowsPath(value: string) {
  return value.replace(/\//g, '\\').replace(/\\+/g, '\\');
}

function readStoredFontScale() {
  if (typeof window === 'undefined') {
    return 1;
  }

  const stored = window.localStorage.getItem(STORAGE_KEYS.fontScale);
  const parsed = stored ? Number(stored) : NaN;
  return Number.isFinite(parsed) && parsed >= 0.85 && parsed <= 1.35 ? parsed : 1;
}

function readStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'standard';
  }

  const stored = window.localStorage.getItem(STORAGE_KEYS.themeMode);
  return THEME_OPTIONS.some((option) => option.id === stored) ? (stored as ThemeMode) : 'standard';
}

function centerText(text: string, columns: number) {
  const padding = Math.max(0, Math.floor((columns - text.length) / 2));
  return `${' '.repeat(padding)}${text}`;
}

function formatOutputChunk(chunk: string) {
  return normalizeChunk(chunk).replace(/\r\n/g, `\r\n\x1b[${OUTPUT_CONTENT_COLUMN}G`);
}

export default function App() {
  const terminalHostRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number | null>(null);
  const inputBufferRef = useRef('');
  const outputBlockOpenRef = useRef(false);
  const promptVisibleRef = useRef(false);
  const promptTimerRef = useRef<number | null>(null);
  const statusRef = useRef<AppStatus>('booting');
  const [status, setStatus] = useState<AppStatus>('booting');
  const [shellPath, setShellPath] = useState('shell-core/myshell_v6.exe');
  const [bootIndex, setBootIndex] = useState(0);
  const [bootVisible, setBootVisible] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState('workspace pending');
  const [fontScale, setFontScale] = useState(readStoredFontScale);
  const [themeMode, setThemeMode] = useState<ThemeMode>(readStoredThemeMode);
  const [commandValue, setCommandValue] = useState('');

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.fontScale, fontScale.toFixed(2));
  }, [fontScale]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.themeMode, themeMode);
  }, [themeMode]);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: '"JetBrains Mono", "Cascadia Code", monospace',
      fontSize: BASE_FONT_SIZE * fontScale,
      lineHeight: 1.35,
      letterSpacing: 0.4,
      theme: {
        background: '#070b12',
        foreground: '#ffd37d',
        cursor: '#75a9ff',
        cursorAccent: '#070b12',
        selectionBackground: 'rgba(117, 169, 255, 0.18)',
        black: '#0a0e16',
        red: '#ff6b9a',
        green: '#76f7c7',
        yellow: '#ffd37d',
        blue: '#77b2ff',
        magenta: '#8b6dff',
        cyan: '#79d4ff',
        white: '#f5fbff',
        brightBlack: '#344156',
        brightRed: '#ff8ab0',
        brightGreen: '#8dffe0',
        brightYellow: '#ffe29f',
        brightBlue: '#9dc5ff',
        brightMagenta: '#ac97ff',
        brightCyan: '#a7e8ff',
        brightWhite: '#ffffff'
      }
    });

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    term.open(terminalHostRef.current as HTMLDivElement);
    fitAddon.fit();
    term.focus();
    terminalRef.current = term;

    let bootStepTimer: number | null = window.setInterval(() => {
      setBootIndex((current) => {
        if (current >= BOOT_STEPS.length - 1) {
          if (bootStepTimer !== null) {
            window.clearInterval(bootStepTimer);
            bootStepTimer = null;
          }
          return current;
        }
        return current + 1;
      });
    }, 260);

    const updateStatus = (nextStatus: AppStatus) => {
      statusRef.current = nextStatus;
      setStatus(nextStatus);
    };

    const schedulePrompt = () => {
      if (promptTimerRef.current !== null) {
        window.clearTimeout(promptTimerRef.current);
      }

      promptTimerRef.current = window.setTimeout(() => {
        promptTimerRef.current = null;
        renderPrompt();
      }, 24);
    };

    const beginOutputBlock = () => {
      if (!terminalRef.current || outputBlockOpenRef.current) {
        return;
      }

      outputBlockOpenRef.current = true;
      terminalRef.current.write(`\r\n${OUTPUT_PREFIX}`);
    };

    const renderPrompt = () => {
      if (!terminalRef.current || promptVisibleRef.current || statusRef.current === 'offline') {
        return;
      }

      promptVisibleRef.current = true;
      inputBufferRef.current = '';
      historyIndexRef.current = null;
      terminalRef.current.write(`\r\n${PROMPT_LABEL}`);
    };

    const replaceCurrentLine = (value: string) => {
      if (!terminalRef.current || !promptVisibleRef.current) {
        return;
      }

      const previousLength = inputBufferRef.current.length;
      if (previousLength > 0) {
        terminalRef.current.write('\b \b'.repeat(previousLength));
      }

      inputBufferRef.current = value;
      setCommandValue(value);
      terminalRef.current.write(value);
    };

    const submitTerminalCommand = async (rawCommand: string) => {
      const command = rawCommand.trim();
      promptVisibleRef.current = false;
      terminalRef.current?.write('\r\n');

      if (!command) {
        inputBufferRef.current = '';
        setCommandValue('');
        renderPrompt();
        return;
      }

      commandHistoryRef.current.push(command);
      historyIndexRef.current = null;
      inputBufferRef.current = '';
      setCommandValue('');
      outputBlockOpenRef.current = false;

      const response = await window.terminalApp.writeToShell(`${command}\n`);
      if (!response.ok) {
        terminalRef.current?.write('[shell bridge offline]\r\n');
        updateStatus('offline');
      }
    };

    const onResize = () => fitAddon.fit();
    window.addEventListener('resize', onResize);

    const removeDataInput = term.onData((data) => {
      if (statusRef.current === 'offline') {
        return;
      }

      if (!promptVisibleRef.current) {
        renderPrompt();
      }

      if (data === '\r') {
        void submitTerminalCommand(inputBufferRef.current);
        return;
      }

      if (data === '\u007F') {
        if (inputBufferRef.current.length === 0) {
          return;
        }
        inputBufferRef.current = inputBufferRef.current.slice(0, -1);
        setCommandValue(inputBufferRef.current);
        terminalRef.current?.write('\b \b');
        return;
      }

      if (data === '\u001b[A') {
        if (commandHistoryRef.current.length === 0) {
          return;
        }

        if (historyIndexRef.current === null) {
          historyIndexRef.current = commandHistoryRef.current.length - 1;
        } else if (historyIndexRef.current > 0) {
          historyIndexRef.current -= 1;
        }

        replaceCurrentLine(commandHistoryRef.current[historyIndexRef.current]);
        return;
      }

      if (data === '\u001b[B') {
        if (commandHistoryRef.current.length === 0 || historyIndexRef.current === null) {
          return;
        }

        if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
          historyIndexRef.current += 1;
          replaceCurrentLine(commandHistoryRef.current[historyIndexRef.current]);
        } else {
          historyIndexRef.current = null;
          replaceCurrentLine('');
        }
        return;
      }

      if (data === '\u0003') {
        replaceCurrentLine('');
        terminalRef.current?.write('^C');
        renderPrompt();
        return;
      }

      if (data >= ' ' && data !== '\u007f') {
        inputBufferRef.current += data;
        setCommandValue(inputBufferRef.current);
        terminalRef.current?.write(data);
      }
    });

    const removeData = window.terminalApp.onShellData((payload) => {
      if (!terminalRef.current) {
        return;
      }

      beginOutputBlock();
      terminalRef.current.write(formatOutputChunk(payload));
      updateStatus('online');
      if (promptTimerRef.current !== null) {
        schedulePrompt();
      }
    });

    const removeCwd = window.terminalApp.onShellCwd((payload) => {
      setCurrentDirectory(normalizeWindowsPath(payload.cwd));
      updateStatus('online');
      outputBlockOpenRef.current = false;
      schedulePrompt();
    });

    const removeExit = window.terminalApp.onShellExit((payload) => {
      updateStatus('offline');
      promptVisibleRef.current = false;
      outputBlockOpenRef.current = false;
      terminalRef.current?.write(
        `\r\n[session terminated: code=${payload.code ?? 'null'}, signal=${payload.signal ?? 'null'}]\r\n`
      );
    });

    const removeError = window.terminalApp.onShellError((payload) => {
      updateStatus('offline');
      promptVisibleRef.current = false;
      outputBlockOpenRef.current = false;
      terminalRef.current?.write(`\r\n[shell error: ${payload.message}]\r\n`);
    });

    window.terminalApp.startShell().then((result) => {
      const normalizedShellPath = result.shellPath.replace(/\\/g, '/');
      const normalizedCwd = normalizeWindowsPath(result.cwd);
      const totalWelcome = `${WELCOME_MESSAGE}${WELCOME_AUTHOR}`;
      const welcomePadding = ' '.repeat(
        Math.max(0, Math.floor(((terminalRef.current?.cols ?? 80) - totalWelcome.length) / 2))
      );
      setShellPath(normalizedShellPath);
      setCurrentDirectory(normalizedCwd);
      terminalRef.current?.write(
        `\r\n${welcomePadding}\x1b[38;2;255;120;214m${WELCOME_MESSAGE}\x1b[0m\x1b[38;2;116;244;201m${WELCOME_AUTHOR}\x1b[0m\r\n`
      );
      window.setTimeout(() => setBootIndex(BOOT_STEPS.length - 1), 60);
      window.setTimeout(() => setAppReady(true), 220);
      window.setTimeout(() => setBootVisible(false), 760);
    });

    return () => {
      removeDataInput.dispose();
      removeData();
      removeCwd();
      removeExit();
      removeError();
      window.removeEventListener('resize', onResize);
      if (promptTimerRef.current !== null) {
        window.clearTimeout(promptTimerRef.current);
      }
      if (bootStepTimer !== null) {
        window.clearInterval(bootStepTimer);
      }
      fitAddonRef.current = null;
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (!terminalRef.current || !fitAddonRef.current) {
      return;
    }

    terminalRef.current.options.fontSize = BASE_FONT_SIZE * fontScale;
    fitAddonRef.current.fit();
  }, [fontScale]);

  async function submitCommand() {
    const command = commandValue.trim();
    if (!command) {
      return;
    }

    if (promptVisibleRef.current && inputBufferRef.current.length > 0) {
      terminalRef.current?.write('\b \b'.repeat(inputBufferRef.current.length));
    }

    promptVisibleRef.current = false;
    inputBufferRef.current = '';
    outputBlockOpenRef.current = false;
    commandHistoryRef.current.push(command);
    historyIndexRef.current = null;
    setCommandValue('');
    terminalRef.current?.focus();

    const response = await window.terminalApp.writeToShell(`${command}\n`);
    if (!response.ok) {
      terminalRef.current?.write('[shell bridge offline]\r\n');
      setStatus('offline');
    }
  }

  function handleCommandKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      void submitCommand();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (commandHistoryRef.current.length === 0) {
        return;
      }

      if (historyIndexRef.current === null) {
        historyIndexRef.current = commandHistoryRef.current.length - 1;
      } else if (historyIndexRef.current > 0) {
        historyIndexRef.current -= 1;
      }

      const historyValue = commandHistoryRef.current[historyIndexRef.current];
      inputBufferRef.current = historyValue;
      setCommandValue(historyValue);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (commandHistoryRef.current.length === 0 || historyIndexRef.current === null) {
        return;
      }

      if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
        historyIndexRef.current += 1;
        const historyValue = commandHistoryRef.current[historyIndexRef.current];
        inputBufferRef.current = historyValue;
        setCommandValue(historyValue);
      } else {
        historyIndexRef.current = null;
        inputBufferRef.current = '';
        setCommandValue('');
      }
    }
  }

  const shellVersion = inferShellVersion(shellPath);
  const themeConfig = THEME_OPTIONS.find((option) => option.id === themeMode) ?? THEME_OPTIONS[1];
  const appStyle = {
    '--theme-intensity': themeConfig.intensity.toString(),
    '--font-scale': fontScale.toFixed(2)
  } as CSSProperties;

  return (
    <div className={`app-shell glass-shell app-theme-${themeMode} ${appReady ? 'app-ready' : ''}`} style={appStyle}>
      <div className="ambient-orb ambient-orb-left" />
      <div className="ambient-orb ambient-orb-right" />

      {bootVisible ? (
        <div className={`boot-overlay ${appReady ? 'boot-overlay-hide' : ''}`}>
          <div className="boot-core glass-panel">
            <div className="boot-mark" />
            <h2>apnaShell</h2>
            <div className="boot-progress-track">
              <div
                className="boot-progress-fill"
                style={{ width: `${((bootIndex + 1) / BOOT_STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <header className="titlebar glass-panel">
        <div className="brand-cluster">
          <div>
            <div className="brand-head">
              <span className="brand-light brand-light-orange" />
              <span className="brand-light brand-light-white" />
              <span className="brand-light brand-light-green" />
              <p className="eyebrow eyebrow-brand">apnaShell</p>
            </div>
            <h1>runtime console</h1>
          </div>
        </div>
        <div className="title-meta">{shellVersion}</div>
        <div className="window-controls">
          <button className="window-button" onClick={() => void window.terminalApp.minimizeWindow()} aria-label="Minimize window" type="button">_</button>
          <button className="window-button" onClick={() => void window.terminalApp.maximizeWindow()} aria-label="Maximize window" type="button">?</button>
          <button className="window-button danger" onClick={() => void window.terminalApp.closeWindow()} aria-label="Close window" type="button">×</button>
        </div>
      </header>

      <main className="workspace glass-workspace">
        <section className="output-shell glass-panel">
          <div className="output-header">
            <div className="cwd-badge glass-panel">
              <span className="cwd-caption">Working Directory :</span>
              <strong>{currentDirectory}</strong>
            </div>
            <span className="output-meta">{currentDirectory}</span>
          </div>
          <div
            ref={terminalHostRef}
            className="terminal-host glass-output"
            onClick={() => terminalRef.current?.focus()}
          />
        </section>

        <section className="command-palette-wrap">
          <div className={`command-palette glass-panel status-${status}`}>
            <div className="palette-head">
              <span className="palette-label">command</span>
              <span className="palette-status">{status}</span>
            </div>
            <div className="palette-input-row">
              <span className="palette-prompt">›</span>
              <input
                className="palette-input"
                value={commandValue}
                onChange={(event) => {
                  inputBufferRef.current = event.target.value;
                  setCommandValue(event.target.value);
                }}
                onKeyDown={handleCommandKeyDown}
                placeholder="Type a command and press Enter"
                autoFocus
              />
            </div>
            <div className="palette-foot">
              <span>{currentDirectory}</span>
              <span>{commandHistoryRef.current.length} history</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="dock glass-panel">
        <div className="dock-item dock-item-wide">
          <span className="dock-label">cwd</span>
          <strong>{currentDirectory}</strong>
        </div>
        <div className="dock-item">
          <span className="dock-label">theme</span>
          <div className="settings-options compact">
            {THEME_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`settings-chip compact ${themeMode === option.id ? 'selected' : ''}`}
                onClick={() => setThemeMode(option.id)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="dock-item font-dock">
          <label className="dock-label" htmlFor="font-scale-slider">font {Math.round(fontScale * 100)}%</label>
          <input
            id="font-scale-slider"
            className="settings-slider compact"
            type="range"
            min="85"
            max="135"
            step="5"
            value={Math.round(fontScale * 100)}
            onChange={(event) => setFontScale(Number(event.target.value) / 100)}
          />
        </div>
      </footer>
    </div>
  );
}
