import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';

const PROMPT = 'neon@myshell > ';
const BASE_FONT_SIZE = 15;
const BOOT_STEPS = [
  'authenticating Electron runtime',
  'binding renderer transport',
  'warming terminal surface',
  'linking myshell bridge'
];
const HELP_COMMANDS = ['help', 'pwd', 'ls -la', 'history', 'echo hello | findstr hello'];
const THEME_OPTIONS = [
  { id: 'soft', label: 'soft', intensity: 0.82 },
  { id: 'standard', label: 'standard', intensity: 1 },
  { id: 'surge', label: 'surge', intensity: 1.22 }
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

export default function App() {
  const terminalHostRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBufferRef = useRef('');
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number | null>(null);
  const promptVisibleRef = useRef(false);
  const promptTimerRef = useRef<number | null>(null);
  const statusRef = useRef<AppStatus>('booting');
  const [status, setStatus] = useState<AppStatus>('booting');
  const [shellPath, setShellPath] = useState('shell-core/myshell_v6.exe');
  const [sessionLabel, setSessionLabel] = useState('Neon Session');
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [bootIndex, setBootIndex] = useState(0);
  const [bootVisible, setBootVisible] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState('workspace pending');
  const [fontScale, setFontScale] = useState(readStoredFontScale);
  const [themeMode, setThemeMode] = useState<ThemeMode>(readStoredThemeMode);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.fontScale, fontScale.toFixed(2));
  }, [fontScale]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.themeMode, themeMode);
  }, [themeMode]);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: '"JetBrains Mono", "Cascadia Code", monospace',
      fontSize: BASE_FONT_SIZE * fontScale,
      lineHeight: 1.3,
      letterSpacing: 0.5,
      theme: {
        background: '#05070b',
        foreground: '#d8f6ff',
        cursor: '#71f7ff',
        cursorAccent: '#05070b',
        selectionBackground: 'rgba(113, 247, 255, 0.18)',
        black: '#0a0d12',
        red: '#ff537a',
        green: '#6bffb3',
        yellow: '#ffd166',
        blue: '#69b4ff',
        magenta: '#ff64d6',
        cyan: '#71f7ff',
        white: '#f5fbff',
        brightBlack: '#30414f',
        brightRed: '#ff7f9d',
        brightGreen: '#8cffc6',
        brightYellow: '#ffe08a',
        brightBlue: '#9cd2ff',
        brightMagenta: '#ff98e6',
        brightCyan: '#a0ffff',
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
    }, 420);

    const updateStatus = (nextStatus: AppStatus) => {
      statusRef.current = nextStatus;
      setStatus(nextStatus);
    };

    const updateRecentCommands = (command: string) => {
      setRecentCommands((current) => [command, ...current.filter((item) => item !== command)].slice(0, 6));
    };

    const renderPrompt = () => {
      if (!terminalRef.current || promptVisibleRef.current || statusRef.current === 'offline') {
        return;
      }

      promptVisibleRef.current = true;
      inputBufferRef.current = '';
      historyIndexRef.current = null;
      terminalRef.current.write(`\r\n${PROMPT}`);
    };

    const schedulePrompt = () => {
      if (promptTimerRef.current !== null) {
        window.clearTimeout(promptTimerRef.current);
      }

      promptTimerRef.current = window.setTimeout(() => {
        renderPrompt();
      }, 110);
    };

    const echoBackspace = () => {
      if (!terminalRef.current || inputBufferRef.current.length === 0) {
        return;
      }
      inputBufferRef.current = inputBufferRef.current.slice(0, -1);
      terminalRef.current.write('\b \b');
    };

    const replaceCurrentLine = (value: string) => {
      if (!terminalRef.current) {
        return;
      }

      const previousLength = inputBufferRef.current.length;
      terminalRef.current.write('\b \b'.repeat(previousLength));
      inputBufferRef.current = value;
      terminalRef.current.write(value);
    };

    const handleUpHistory = () => {
      if (historyRef.current.length === 0) {
        return;
      }

      if (historyIndexRef.current === null) {
        historyIndexRef.current = historyRef.current.length - 1;
      } else if (historyIndexRef.current > 0) {
        historyIndexRef.current -= 1;
      }

      replaceCurrentLine(historyRef.current[historyIndexRef.current]);
    };

    const handleDownHistory = () => {
      if (historyRef.current.length === 0 || historyIndexRef.current === null) {
        return;
      }

      if (historyIndexRef.current < historyRef.current.length - 1) {
        historyIndexRef.current += 1;
        replaceCurrentLine(historyRef.current[historyIndexRef.current]);
      } else {
        historyIndexRef.current = null;
        replaceCurrentLine('');
      }
    };

    const writeCommand = async (command: string) => {
      promptVisibleRef.current = false;
      terminalRef.current?.write('\r\n');

      if (command.trim() !== '') {
        historyRef.current.push(command);
        updateRecentCommands(command);
      }
      historyIndexRef.current = null;
      inputBufferRef.current = '';

      const response = await window.terminalApp.writeToShell(`${command}\n`);
      if (!response.ok) {
        terminalRef.current?.write('shell bridge offline');
        updateStatus('offline');
        schedulePrompt();
      }
    };

    const disposable = term.onData(async (data) => {
      if (statusRef.current === 'offline') {
        return;
      }

      if (data === '\r') {
        await writeCommand(inputBufferRef.current);
        return;
      }

      if (data === '\u007F') {
        echoBackspace();
        return;
      }

      if (data === '\u001b[A') {
        handleUpHistory();
        return;
      }

      if (data === '\u001b[B') {
        handleDownHistory();
        return;
      }

      if (data === '\u0003') {
        replaceCurrentLine('');
        terminalRef.current?.write('^C');
        schedulePrompt();
        return;
      }

      if (data >= ' ' && data !== '\u007f') {
        inputBufferRef.current += data;
        terminalRef.current?.write(data);
      }
    });

    const onResize = () => fitAddon.fit();
    window.addEventListener('resize', onResize);

    const removeData = window.terminalApp.onShellData((payload) => {
      if (!terminalRef.current) {
        return;
      }

      terminalRef.current.write(normalizeChunk(payload));
      updateStatus('online');
      schedulePrompt();
    });

    const removeCwd = window.terminalApp.onShellCwd((payload) => {
      setCurrentDirectory(normalizeWindowsPath(payload.cwd));
    });

    const removeExit = window.terminalApp.onShellExit((payload) => {
      updateStatus('offline');
      promptVisibleRef.current = false;
      terminalRef.current?.write(
        `\r\n[session terminated: code=${payload.code ?? 'null'}, signal=${payload.signal ?? 'null'}]\r\n`
      );
    });

    const removeError = window.terminalApp.onShellError((payload) => {
      updateStatus('offline');
      promptVisibleRef.current = false;
      terminalRef.current?.write(`\r\n[shell error: ${payload.message}]\r\n`);
    });

    term.write('\r\n  MYSHELL CONCEPT A // MINIMAL NEON TERMINAL\r\n');
    term.write('  boot sequence active...\r\n');
    term.write('  renderer online\r\n');
    term.write('  linking shell-core\r\n');

    window.terminalApp.startShell().then((result) => {
      const normalizedShellPath = result.shellPath.replace(/\\/g, '/');
      const normalizedCwd = normalizeWindowsPath(result.cwd);
      setShellPath(normalizedShellPath);
      setCurrentDirectory(normalizedCwd);
      setSessionLabel(result.reused ? 'Reused Session' : 'Fresh Session');
      window.setTimeout(() => setBootIndex(BOOT_STEPS.length - 1), 100);
      window.setTimeout(() => setAppReady(true), 500);
      window.setTimeout(() => setBootVisible(false), 1500);
      schedulePrompt();
    });

    return () => {
      disposable.dispose();
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

  const shellVersion = inferShellVersion(shellPath);
  const themeConfig = THEME_OPTIONS.find((option) => option.id === themeMode) ?? THEME_OPTIONS[1];
  const appStyle = {
    '--theme-intensity': themeConfig.intensity.toString(),
    '--font-scale': fontScale.toFixed(2)
  } as CSSProperties;

  return (
    <div className={`app-shell app-theme-${themeMode} ${appReady ? 'app-ready' : ''}`} style={appStyle}>
      <div className="ambient-grid" />
      {bootVisible ? (
        <div className={`boot-overlay ${appReady ? 'boot-overlay-hide' : ''}`}>
          <div className="boot-core">
            <p className="boot-label">Concept A boot</p>
            <h2>Minimal neon terminal</h2>
            <p className="boot-copy">A focused desktop shell launcher with restrained cyberpunk energy.</p>
            <div className="boot-progress-track">
              <div
                className="boot-progress-fill"
                style={{ width: `${((bootIndex + 1) / BOOT_STEPS.length) * 100}%` }}
              />
            </div>
            <div className="boot-steps">
              {BOOT_STEPS.map((step, index) => (
                <div key={step} className={`boot-step ${index <= bootIndex ? 'active' : ''}`}>
                  <span className="boot-step-index">0{index + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <header className="titlebar">
        <div className="title-cluster">
          <div className="brand-mark" />
          <div>
            <p className="eyebrow">Concept A</p>
            <h1>myshell neon terminal</h1>
          </div>
        </div>
        <div className="status-cluster">
          <div className={`status-pill status-${status}`}>{status}</div>
          <div className="status-pill muted">{shellVersion} shell bridge</div>
          <button
            className="window-button"
            onClick={() => void window.terminalApp.minimizeWindow()}
            aria-label="Minimize window"
          >
            _
          </button>
          <button
            className="window-button"
            onClick={() => void window.terminalApp.maximizeWindow()}
            aria-label="Maximize window"
          >
            ?
          </button>
          <button
            className="window-button danger"
            onClick={() => void window.terminalApp.closeWindow()}
            aria-label="Close window"
          >
            ×
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="console-stage">
          <div className="terminal-frame">
            <div className="terminal-overlay" />
            <div className="terminal-header">
              <div>
                <p className="frame-label">Live shell runtime</p>
                <h2>{sessionLabel}</h2>
              </div>
              <div className="shell-meta">
                <span>{shellPath}</span>
              </div>
            </div>
            <div ref={terminalHostRef} className="terminal-host" />
          </div>
        </section>

        <aside className="support-panel">
          <section className="support-block support-block-hero">
            <p className="support-kicker">Session telemetry</p>
            <h3>{sessionLabel}</h3>
            <p className="support-copy">
              Focused desktop host for {shellVersion} with a restrained support rail for operators.
            </p>
            <div className="support-pills">
              <span>{status}</span>
              <span>{shellVersion}</span>
              <span>concept A</span>
            </div>
          </section>

          <section className="support-block">
            <div className="support-heading-row">
              <p className="support-kicker">Runtime</p>
              <span className={`mini-status mini-status-${status}`} />
            </div>
            <dl className="meta-list">
              <div>
                <dt>shell target</dt>
                <dd>{shellPath}</dd>
              </div>
              <div>
                <dt>current directory</dt>
                <dd>{currentDirectory}</dd>
              </div>
              <div>
                <dt>version badge</dt>
                <dd>{shellVersion}</dd>
              </div>
            </dl>
          </section>

          <section className="support-block">
            <p className="support-kicker">Quick hints</p>
            <ul className="hint-list">
              {HELP_COMMANDS.map((command) => (
                <li key={command}>
                  <code>{command}</code>
                </li>
              ))}
            </ul>
          </section>

          <section className="support-block settings-block">
            <p className="support-kicker">Surface tuning</p>
            <div className="settings-group">
              <span className="settings-label">Theme intensity</span>
              <div className="settings-options">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    className={`settings-chip ${themeMode === option.id ? 'selected' : ''}`}
                    onClick={() => setThemeMode(option.id)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-group">
              <label className="settings-label" htmlFor="font-scale-slider">
                Font scale <span>{Math.round(fontScale * 100)}%</span>
              </label>
              <input
                id="font-scale-slider"
                className="settings-slider"
                type="range"
                min="85"
                max="135"
                step="5"
                value={Math.round(fontScale * 100)}
                onChange={(event) => setFontScale(Number(event.target.value) / 100)}
              />
            </div>
          </section>

          <section className="support-block">
            <p className="support-kicker">Recent commands</p>
            <div className="history-list">
              {recentCommands.length > 0 ? (
                recentCommands.map((command) => (
                  <div key={command} className="history-row">
                    <span className="history-mark" />
                    <code>{command}</code>
                  </div>
                ))
              ) : (
                <p className="empty-state">Commands you run in the terminal will appear here.</p>
              )}
            </div>
          </section>
        </aside>
      </main>

      <footer className="status-strip">
        <div className="status-segment">
          <span className="status-strip-label">runtime</span>
          <strong>{status}</strong>
        </div>
        <div className="status-segment status-segment-wide">
          <span className="status-strip-label">cwd</span>
          <strong>{currentDirectory}</strong>
        </div>
        <div className="status-segment">
          <span className="status-strip-label">font</span>
          <strong>{Math.round(fontScale * 100)}%</strong>
        </div>
        <div className="status-segment">
          <span className="status-strip-label">intensity</span>
          <strong>{themeMode}</strong>
        </div>
        <div className="status-segment">
          <span className="status-strip-label">bridge</span>
          <strong>{shellVersion}</strong>
        </div>
      </footer>
    </div>
  );
}
