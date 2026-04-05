import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
const THEME_ORDER = ['soft', 'standard', 'surge'] as const;

const THEME_PRESETS = {
  soft: {
    label: 'soft',
    css: {
      bgRadialLeft: 'rgba(167, 145, 244, 0.22)',
      bgRadialRight: 'rgba(129, 165, 236, 0.18)',
      bgTop: '#101426',
      bgBottom: '#080b17',
      text: '#e8efff',
      muted: 'rgba(207, 219, 247, 0.66)',
      line: 'rgba(150, 173, 235, 0.22)',
      glass: 'rgba(27, 32, 54, 0.62)',
      blue: '#8daefc',
      violet: '#9d8bff',
      green: '#90e6c3',
      danger: '#ff8ea8',
      orbLeft: '#8e7df0',
      orbRight: '#6e95e6',
      orbOpacity: '0.24',
      outputBg: 'rgba(10, 16, 34, 0.74)',
      cwdBorder: 'rgba(146, 231, 181, 0.36)',
      cwdTop: 'rgba(146, 231, 181, 0.12)',
      cwdBottom: 'rgba(20, 28, 44, 0.76)',
      chipBorder: 'rgba(150, 173, 235, 0.26)',
      chipBg: 'rgba(34, 40, 66, 0.56)',
      chipHoverBorder: 'rgba(159, 189, 255, 0.46)',
      chipHoverBg: 'rgba(120, 158, 255, 0.14)'
    },
    terminal: {
      background: '#0c111a',
      foreground: '#dbe7ff',
      cursor: '#a0b9ff',
      cursorAccent: '#0c111a',
      selectionBackground: 'rgba(144, 177, 255, 0.22)',
      black: '#121824',
      red: '#ff8ea8',
      green: '#9fe7ca',
      yellow: '#efd3a2',
      blue: '#9db9ff',
      magenta: '#b49fff',
      cyan: '#9edbff',
      white: '#f2f7ff',
      brightBlack: '#3a4660',
      brightRed: '#ffabc0',
      brightGreen: '#b8f7de',
      brightYellow: '#f7dfb7',
      brightBlue: '#b7ccff',
      brightMagenta: '#cab9ff',
      brightCyan: '#b9e7ff',
      brightWhite: '#ffffff'
    }
  },
  standard: {
    label: 'standard',
    css: {
      bgRadialLeft: 'rgba(127, 107, 255, 0.22)',
      bgRadialRight: 'rgba(116, 167, 255, 0.18)',
      bgTop: '#070911',
      bgBottom: '#04060d',
      text: '#eef4ff',
      muted: 'rgba(210, 224, 255, 0.62)',
      line: 'rgba(133, 166, 255, 0.18)',
      glass: 'rgba(13, 16, 26, 0.54)',
      blue: '#74a7ff',
      violet: '#7f6bff',
      green: '#86f3ca',
      danger: '#ff7fa8',
      orbLeft: '#7f6bff',
      orbRight: '#4b8cff',
      orbOpacity: '0.28',
      outputBg: 'rgba(6, 10, 18, 0.72)',
      cwdBorder: 'rgba(118, 244, 138, 0.3)',
      cwdTop: 'rgba(118, 244, 138, 0.08)',
      cwdBottom: 'rgba(12, 18, 26, 0.72)',
      chipBorder: 'rgba(133, 166, 255, 0.2)',
      chipBg: 'rgba(20, 24, 36, 0.48)',
      chipHoverBorder: 'rgba(133, 166, 255, 0.42)',
      chipHoverBg: 'rgba(116, 167, 255, 0.12)'
    },
    terminal: {
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
  },
  surge: {
    label: 'surge',
    css: {
      bgRadialLeft: 'rgba(35, 111, 255, 0.36)',
      bgRadialRight: 'rgba(16, 236, 255, 0.24)',
      bgTop: '#020816',
      bgBottom: '#01040b',
      text: '#d9f2ff',
      muted: 'rgba(170, 223, 255, 0.7)',
      line: 'rgba(70, 174, 255, 0.34)',
      glass: 'rgba(7, 20, 36, 0.7)',
      blue: '#3fa4ff',
      violet: '#6786ff',
      green: '#47ffd0',
      danger: '#ff678d',
      orbLeft: '#256eff',
      orbRight: '#00d7ff',
      orbOpacity: '0.36',
      outputBg: 'rgba(2, 13, 25, 0.86)',
      cwdBorder: 'rgba(71, 255, 210, 0.44)',
      cwdTop: 'rgba(71, 255, 210, 0.16)',
      cwdBottom: 'rgba(5, 26, 34, 0.78)',
      chipBorder: 'rgba(75, 177, 255, 0.38)',
      chipBg: 'rgba(5, 30, 47, 0.62)',
      chipHoverBorder: 'rgba(70, 224, 255, 0.74)',
      chipHoverBg: 'rgba(16, 155, 255, 0.2)'
    },
    terminal: {
      background: '#040a14',
      foreground: '#d7f2ff',
      cursor: '#32d5ff',
      cursorAccent: '#040a14',
      selectionBackground: 'rgba(50, 213, 255, 0.22)',
      black: '#071423',
      red: '#ff5f7c',
      green: '#54ffc0',
      yellow: '#ffe169',
      blue: '#3ea2ff',
      magenta: '#a57dff',
      cyan: '#39ecff',
      white: '#e8f9ff',
      brightBlack: '#2c4b66',
      brightRed: '#ff87a0',
      brightGreen: '#85ffd7',
      brightYellow: '#ffee97',
      brightBlue: '#79beff',
      brightMagenta: '#c0a6ff',
      brightCyan: '#8ff4ff',
      brightWhite: '#ffffff'
    }
  }
} as const;
const THEME_VISUAL_MAP = {
  soft: 'standard',
  standard: 'soft',
  surge: 'surge'
} as const;
const STORAGE_KEYS = {
  fontScale: 'myshell-terminal:font-scale',
  themeMode: 'myshell-terminal:theme-mode'
} as const;

type AppStatus = 'booting' | 'online' | 'offline';
type ThemeMode = keyof typeof THEME_PRESETS;

function normalizeChunk(chunk: string) {
  return chunk.replace(/\r?\n/g, '\r\n');
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
    return 'soft';
  }

  const stored = window.localStorage.getItem(STORAGE_KEYS.themeMode);
  return stored && stored in THEME_PRESETS ? (stored as ThemeMode) : 'soft';
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
  const themeConfig = THEME_PRESETS[THEME_VISUAL_MAP[themeMode]];

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
      theme: THEME_PRESETS[themeMode].terminal
    });

    const fitAddon = new FitAddon();
    fitAddonRef.current = fitAddon;
    term.loadAddon(fitAddon);
    term.open(terminalHostRef.current as HTMLDivElement);
    const scheduleFit = () => {
      window.requestAnimationFrame(() => fitAddon.fit());
    };

    scheduleFit();
    term.focus();
    terminalRef.current = term;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof window.ResizeObserver !== 'undefined' && terminalHostRef.current) {
      resizeObserver = new ResizeObserver(() => {
        scheduleFit();
      });
      resizeObserver.observe(terminalHostRef.current);
    }

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
      terminalRef.current.scrollToBottom();
    };

    const renderPrompt = () => {
      if (!terminalRef.current || promptVisibleRef.current || statusRef.current === 'offline') {
        return;
      }

      promptVisibleRef.current = true;
      inputBufferRef.current = '';
      historyIndexRef.current = null;
      terminalRef.current.write(`\r\n${PROMPT_LABEL}`);
      terminalRef.current.scrollToBottom();
      terminalRef.current.focus();
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
      terminalRef.current.write(value);
    };

    const submitTerminalCommand = async (rawCommand: string) => {
      const command = rawCommand.trim();
      promptVisibleRef.current = false;
      terminalRef.current?.write('\r\n');
      terminalRef.current?.scrollToBottom();

      if (!command) {
        inputBufferRef.current = '';
        renderPrompt();
        return;
      }

      commandHistoryRef.current.push(command);
      historyIndexRef.current = null;
      inputBufferRef.current = '';
      outputBlockOpenRef.current = false;

      const response = await window.terminalApp.writeToShell(`${command}\n`);
      if (!response.ok) {
        terminalRef.current?.write('[shell bridge offline]\r\n');
        updateStatus('offline');
      }
    };

    const onResize = () => scheduleFit();
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
        terminalRef.current?.write(data);
      }
    });

    const removeData = window.terminalApp.onShellData((payload) => {
      if (!terminalRef.current) {
        return;
      }

      beginOutputBlock();
      terminalRef.current.write(formatOutputChunk(payload));
      terminalRef.current.scrollToBottom();
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
      resizeObserver?.disconnect();
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

  useEffect(() => {
    if (!terminalRef.current) {
      return;
    }

    terminalRef.current.options.theme = themeConfig.terminal;
    if (terminalRef.current.rows > 0) {
      terminalRef.current.refresh(0, terminalRef.current.rows - 1);
    }
  }, [themeConfig]);

  useEffect(() => {
    if (!fitAddonRef.current || !appReady) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      fitAddonRef.current?.fit();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [appReady, bootVisible]);

  const shellVersion = 'v1 (April 05, 2026)';
  const appStyle = {
    '--bg-radial-left': themeConfig.css.bgRadialLeft,
    '--bg-radial-right': themeConfig.css.bgRadialRight,
    '--bg-top': themeConfig.css.bgTop,
    '--bg-bottom': themeConfig.css.bgBottom,
    '--text': themeConfig.css.text,
    '--muted': themeConfig.css.muted,
    '--line': themeConfig.css.line,
    '--glass': themeConfig.css.glass,
    '--blue': themeConfig.css.blue,
    '--violet': themeConfig.css.violet,
    '--green': themeConfig.css.green,
    '--danger': themeConfig.css.danger,
    '--orb-left': themeConfig.css.orbLeft,
    '--orb-right': themeConfig.css.orbRight,
    '--orb-opacity': themeConfig.css.orbOpacity,
    '--output-bg': themeConfig.css.outputBg,
    '--cwd-border': themeConfig.css.cwdBorder,
    '--cwd-top': themeConfig.css.cwdTop,
    '--cwd-bottom': themeConfig.css.cwdBottom,
    '--chip-border': themeConfig.css.chipBorder,
    '--chip-bg': themeConfig.css.chipBg,
    '--chip-hover-border': themeConfig.css.chipHoverBorder,
    '--chip-hover-bg': themeConfig.css.chipHoverBg,
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
          <button className="window-button" onClick={() => void window.terminalApp.maximizeWindow()} aria-label="Maximize window" type="button">□</button>
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
            <div className="settings-strip">
              <div className="settings-options compact">
                {THEME_ORDER.map((themeId) => (
                  <button
                    key={themeId}
                    className={`settings-chip compact ${themeMode === themeId ? 'selected' : ''}`}
                    onClick={() => setThemeMode(themeId)}
                    type="button"
                  >
                    {THEME_PRESETS[themeId].label}
                  </button>
                ))}
              </div>
              <div className="font-dock compact">
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
            </div>
          </div>
          <div className="glass-output" onClick={() => terminalRef.current?.focus()}>
            <div ref={terminalHostRef} className="terminal-host" />
          </div>
        </section>
      </main>
    </div>
  );
}
