import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';

const PROMPT = 'neon@myshell > ';

function normalizeChunk(chunk: string) {
  return chunk.replace(/\r?\n/g, '\r\n');
}

export default function App() {
  const terminalHostRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const inputBufferRef = useRef('');
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number | null>(null);
  const promptVisibleRef = useRef(false);
  const promptTimerRef = useRef<number | null>(null);
  const statusRef = useRef<'booting' | 'online' | 'offline'>('booting');

  const [status, setStatus] = useState<'booting' | 'online' | 'offline'>('booting');
  const [shellPath, setShellPath] = useState('shell-core/myshell_v6.exe');
  const [sessionLabel, setSessionLabel] = useState('Neon Session');

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontFamily: '"JetBrains Mono", "Cascadia Code", monospace',
      fontSize: 15,
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
    term.loadAddon(fitAddon);
    term.open(terminalHostRef.current as HTMLDivElement);
    fitAddon.fit();
    term.focus();
    terminalRef.current = term;

    const updateStatus = (nextStatus: 'booting' | 'online' | 'offline') => {
      statusRef.current = nextStatus;
      setStatus(nextStatus);
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
      setShellPath(result.shellPath.replace(/\\/g, '/'));
      setSessionLabel(result.reused ? 'Reused Session' : 'Fresh Session');
      schedulePrompt();
    });

    return () => {
      disposable.dispose();
      removeData();
      removeExit();
      removeError();
      window.removeEventListener('resize', onResize);
      if (promptTimerRef.current !== null) {
        window.clearTimeout(promptTimerRef.current);
      }
      term.dispose();
    };
  }, []);

  return (
    <div className="app-shell">
      <div className="ambient-grid" />
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
          <div className="status-pill muted">v6 shell bridge</div>
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

      <main className="console-stage">
        <section className="terminal-frame">
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
        </section>
      </main>
    </div>
  );
}
