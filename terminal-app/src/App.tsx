import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';

const BASE_FONT_SIZE = 15;
const BOOT_STEPS = ['authenticating runtime', 'binding transport', 'warming output log', 'linking apnaShell'];
const WELCOME_MESSAGE = 'Welcome to apnaShell. Thanks for using it';
const WELCOME_AUTHOR = ' - Divyanshu';
const OUTPUT_CONTENT_COLUMN = 'sunBhai> '.length + 1;
const THEME_ORDER = ['soft', 'standard', 'hacker'] as const;
const HACKER_PROFILE_ORDER = ['stealth', 'breach', 'forensic'] as const;

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
      chipHoverBg: 'rgba(120, 158, 255, 0.14)',
      titleGradStart: '#9fbfff',
      titleGradMid: '#f4fbff',
      titleGradEnd: '#c6b9ff',
      captionColor: 'rgba(208, 222, 250, 0.72)',
      promptAnsi: '\x1b[38;2;154;188;255m',
      outputAnsi: '\x1b[38;2;255;145;168m',
      welcomeMsgAnsi: '\x1b[38;2;210;172;255m',
      welcomeAuthorAnsi: '\x1b[38;2;145;227;255m'
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
      chipHoverBg: 'rgba(116, 167, 255, 0.12)',
      titleGradStart: '#8fd2ff',
      titleGradMid: '#d7ebff',
      titleGradEnd: '#b8a8ff',
      captionColor: 'rgba(210, 224, 255, 0.62)',
      promptAnsi: '\x1b[38;2;119;178;255m',
      outputAnsi: '\x1b[38;2;255;92;92m',
      welcomeMsgAnsi: '\x1b[38;2;255;120;214m',
      welcomeAuthorAnsi: '\x1b[38;2;116;244;201m'
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
  hacker: {
    label: 'Hacker',
    css: {
      bgRadialLeft: 'rgba(43, 255, 144, 0.34)',
      bgRadialRight: 'rgba(92, 255, 87, 0.24)',
      bgTop: '#021107',
      bgBottom: '#010704',
      text: '#d9ffe6',
      muted: 'rgba(154, 255, 179, 0.72)',
      line: 'rgba(96, 255, 146, 0.36)',
      glass: 'rgba(6, 30, 13, 0.74)',
      blue: '#6fff9f',
      violet: '#4dff84',
      green: '#95ffba',
      danger: '#ff4f71',
      orbLeft: '#1eff74',
      orbRight: '#4cff5a',
      orbOpacity: '0.38',
      outputBg: 'rgba(8, 24, 12, 0.88)',
      cwdBorder: 'rgba(103, 255, 151, 0.52)',
      cwdTop: 'rgba(103, 255, 151, 0.18)',
      cwdBottom: 'rgba(8, 34, 15, 0.82)',
      chipBorder: 'rgba(97, 255, 147, 0.44)',
      chipBg: 'rgba(11, 42, 18, 0.68)',
      chipHoverBorder: 'rgba(172, 255, 154, 0.86)',
      chipHoverBg: 'rgba(97, 255, 147, 0.24)',
      titleGradStart: '#7effab',
      titleGradMid: '#d8ffe8',
      titleGradEnd: '#9fff7c',
      captionColor: 'rgba(176, 255, 195, 0.78)',
      promptAnsi: '\x1b[38;2;126;255;168m',
      outputAnsi: '\x1b[38;2;166;255;112m',
      welcomeMsgAnsi: '\x1b[38;2;255;120;214m',
      welcomeAuthorAnsi: '\x1b[38;2;119;178;255m'
    },
    terminal: {
      background: '#061208',
      foreground: '#b9ffd0',
      cursor: '#6bff93',
      cursorAccent: '#061208',
      selectionBackground: 'rgba(111, 255, 139, 0.24)',
      black: '#0f1d12',
      red: '#ff5a79',
      green: '#64ff8b',
      yellow: '#9fff7f',
      blue: '#7eff9f',
      magenta: '#84ffb3',
      cyan: '#b2ff8e',
      white: '#ecffee',
      brightBlack: '#2a5e34',
      brightRed: '#ff8ca7',
      brightGreen: '#8cffad',
      brightYellow: '#c8ffad',
      brightBlue: '#abffc0',
      brightMagenta: '#9affb3',
      brightCyan: '#ccffb9',
      brightWhite: '#ffffff'
    }
  }
};
const THEME_VISUAL_MAP = {
  soft: 'standard',
  standard: 'soft',
  hacker: 'hacker'
} as const;
const STORAGE_KEYS = {
  fontScale: 'myshell-terminal:font-scale',
  themeMode: 'myshell-terminal:theme-mode',
  hackerProfile: 'myshell-terminal:hacker-profile',
  hackerFocusMode: 'myshell-terminal:hacker-focus-mode',
  hackerModulesOpen: 'myshell-terminal:hacker-modules-open'
} as const;

type AppStatus = 'booting' | 'online' | 'offline';
type ThemeMode = keyof typeof THEME_PRESETS;
type ThemeCssTokens = (typeof THEME_PRESETS)[ThemeMode]['css'];
type ThemeTerminalTokens = (typeof THEME_PRESETS)[ThemeMode]['terminal'];
type ThemePreset = {
  label: string;
  css: ThemeCssTokens;
  terminal: ThemeTerminalTokens;
};
type HackerProfile = (typeof HACKER_PROFILE_ORDER)[number];

const HACKER_PROFILE_PRESETS: Record<
  HackerProfile,
  {
    label: string;
    css: Partial<ThemeCssTokens>;
    terminal: Partial<ThemeTerminalTokens>;
  }
> = {
  stealth: {
    label: 'Stealth',
    css: {
      orbOpacity: '0.24',
      outputBg: 'rgba(4, 16, 8, 0.92)',
      line: 'rgba(96, 255, 146, 0.28)',
      chipHoverBg: 'rgba(97, 255, 147, 0.18)',
      promptAnsi: '\x1b[38;2;120;245;160m',
      outputAnsi: '\x1b[38;2;149;245;122m'
    },
    terminal: {
      foreground: '#a7efbe',
      cursor: '#5ee584',
      selectionBackground: 'rgba(111, 255, 139, 0.16)'
    }
  },
  breach: {
    label: 'Breach',
    css: {
      orbOpacity: '0.46',
      line: 'rgba(114, 255, 158, 0.48)',
      chipHoverBg: 'rgba(97, 255, 147, 0.32)',
      danger: '#ff5b67',
      promptAnsi: '\x1b[38;2;140;255;182m',
      outputAnsi: '\x1b[38;2;185;255;129m'
    },
    terminal: {
      cursor: '#87ffa9',
      red: '#ff6a7d',
      brightRed: '#ff95a4',
      selectionBackground: 'rgba(111, 255, 139, 0.3)'
    }
  },
  forensic: {
    label: 'Forensic',
    css: {
      orbOpacity: '0.3',
      muted: 'rgba(177, 255, 216, 0.78)',
      blue: '#8dffc0',
      violet: '#86f9b3',
      chipBorder: 'rgba(121, 255, 209, 0.5)',
      chipHoverBorder: 'rgba(171, 255, 222, 0.9)',
      promptAnsi: '\x1b[38;2;150;255;204m',
      outputAnsi: '\x1b[38;2;174;255;165m'
    },
    terminal: {
      foreground: '#c7ffe2',
      cursor: '#93ffd4',
      cyan: '#9effd7',
      brightCyan: '#c7ffe6'
    }
  }
};

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
  if (stored === 'hackerTerminal') {
    return 'hacker';
  }
  return stored && stored in THEME_PRESETS ? (stored as ThemeMode) : 'soft';
}

function readStoredHackerProfile(): HackerProfile {
  if (typeof window === 'undefined') {
    return 'stealth';
  }

  const stored = window.localStorage.getItem(STORAGE_KEYS.hackerProfile);
  return stored && stored in HACKER_PROFILE_PRESETS ? (stored as HackerProfile) : 'stealth';
}

function readStoredHackerFocusMode() {
  if (typeof window === 'undefined') {
    return true;
  }

  const stored = window.localStorage.getItem(STORAGE_KEYS.hackerFocusMode);
  if (stored === null) {
    return true;
  }
  return stored === '1';
}

function readStoredHackerModulesOpen() {
  if (typeof window === 'undefined') {
    return true;
  }

  const stored = window.localStorage.getItem(STORAGE_KEYS.hackerModulesOpen);
  if (stored === null) {
    return true;
  }
  return stored === '1';
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
  const promptLabelRef = useRef('\x1b[38;2;119;178;255mbolBhai\x1b[0m>> ');
  const outputPrefixRef = useRef('\x1b[38;2;255;92;92msunBhai\x1b[0m> ');
  const statusRef = useRef<AppStatus>('booting');
  const [status, setStatus] = useState<AppStatus>('booting');
  const [shellPath, setShellPath] = useState('shell-core/myshell_v6.exe');
  const [bootIndex, setBootIndex] = useState(0);
  const [bootVisible, setBootVisible] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState('workspace pending');
  const [fontScale, setFontScale] = useState(readStoredFontScale);
  const [themeMode, setThemeMode] = useState<ThemeMode>(readStoredThemeMode);
  const [hackerProfile, setHackerProfile] = useState<HackerProfile>(readStoredHackerProfile);
  const [hackerFocusMode, setHackerFocusMode] = useState(readStoredHackerFocusMode);
  const [hackerModulesOpen, setHackerModulesOpen] = useState(readStoredHackerModulesOpen);
  const [commandCount, setCommandCount] = useState(0);
  const baseThemeMode = THEME_VISUAL_MAP[themeMode];
  const baseTheme = THEME_PRESETS[baseThemeMode];
  const standardLegacyOverrides =
    themeMode === 'standard'
      ? {
          css: {
            bgRadialLeft: 'rgba(180, 190, 205, 0.1)',
            bgRadialRight: 'rgba(120, 140, 165, 0.1)',
            bgTop: '#0b0b0b',
            bgBottom: '#010101',
            text: '#e3e3e3',
            muted: 'rgba(180, 180, 180, 0.64)',
            line: 'rgba(130, 130, 130, 0.3)',
            glass: 'rgba(10, 10, 10, 0.82)',
            blue: '#7ea6d9',
            violet: '#8a8a8a',
            green: '#c8c8c8',
            danger: '#cf6f6f',
            orbLeft: '#5f6a76',
            orbRight: '#363c46',
            orbOpacity: '0.14',
            outputBg: 'rgba(2, 2, 2, 0.92)',
            cwdBorder: 'rgba(152, 152, 152, 0.34)',
            cwdTop: 'rgba(170, 170, 170, 0.08)',
            cwdBottom: 'rgba(10, 10, 10, 0.9)',
            chipBorder: 'rgba(150, 150, 150, 0.28)',
            chipBg: 'rgba(19, 19, 19, 0.7)',
            chipHoverBorder: 'rgba(188, 188, 188, 0.52)',
            chipHoverBg: 'rgba(124, 124, 124, 0.16)',
            titleGradStart: '#cfcfcf',
            titleGradMid: '#f0f0f0',
            titleGradEnd: '#b4b4b4',
            captionColor: 'rgba(177, 177, 177, 0.72)',
            promptAnsi: '\x1b[38;2;167;167;167m',
            outputAnsi: '\x1b[38;2;212;212;212m',
            welcomeMsgAnsi: '\x1b[38;2;255;120;214m',
            welcomeAuthorAnsi: '\x1b[38;2;119;178;255m'
          },
          terminal: {
            background: '#000000',
            foreground: '#d4d4d4',
            cursor: '#cfcfcf',
            cursorAccent: '#000000',
            selectionBackground: 'rgba(128, 128, 128, 0.3)',
            black: '#000000',
            red: '#c85b5b',
            green: '#d6d6d6',
            yellow: '#bdbdbd',
            blue: '#8fb8ee',
            magenta: '#b0b0b0',
            cyan: '#b8c8dc',
            white: '#e6e6e6',
            brightBlack: '#505050',
            brightRed: '#df8282',
            brightGreen: '#f1f1f1',
            brightYellow: '#d8d8d8',
            brightBlue: '#b3d0f5',
            brightMagenta: '#c9c9c9',
            brightCyan: '#d1deee',
            brightWhite: '#ffffff'
          }
        }
      : null;
  const hackerProfileConfig = baseThemeMode === 'hacker' ? HACKER_PROFILE_PRESETS[hackerProfile] : null;
  let themeConfig: ThemePreset = hackerProfileConfig
    ? {
        label: baseTheme.label,
        css: {
          ...baseTheme.css,
          ...hackerProfileConfig.css
        },
        terminal: {
          ...baseTheme.terminal,
          ...hackerProfileConfig.terminal
        }
      }
    : baseTheme;

  if (standardLegacyOverrides) {
    themeConfig = {
      label: themeConfig.label,
      css: {
        ...themeConfig.css,
        ...standardLegacyOverrides.css
      },
      terminal: {
        ...themeConfig.terminal,
        ...standardLegacyOverrides.terminal
      }
    };
  }

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.fontScale, fontScale.toFixed(2));
  }, [fontScale]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.themeMode, themeMode);
  }, [themeMode]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.hackerProfile, hackerProfile);
  }, [hackerProfile]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.hackerFocusMode, hackerFocusMode ? '1' : '0');
  }, [hackerFocusMode]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.hackerModulesOpen, hackerModulesOpen ? '1' : '0');
  }, [hackerModulesOpen]);

  useEffect(() => {
    const activeTheme = themeConfig.css;
    const promptAnsi =
      themeMode === 'soft'
        ? '\x1b[38;2;119;178;255m'
        : themeMode === 'standard'
          ? '\x1b[38;2;167;167;167m'
          : activeTheme.promptAnsi;
    promptLabelRef.current = `${promptAnsi}bolBhai\x1b[0m>> `;
    outputPrefixRef.current = `${activeTheme.outputAnsi}sunBhai\x1b[0m> `;
  }, [themeConfig, themeMode]);

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
      terminalRef.current.write(`\r\n${outputPrefixRef.current}`);
      terminalRef.current.scrollToBottom();
    };

    const renderPrompt = () => {
      if (!terminalRef.current || promptVisibleRef.current || statusRef.current === 'offline') {
        return;
      }

      promptVisibleRef.current = true;
      inputBufferRef.current = '';
      historyIndexRef.current = null;
      terminalRef.current.write(`\r\n${promptLabelRef.current}`);
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
      setCommandCount((count) => count + 1);
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

    const writeCenteredWelcome = (themeCss: ThemeCssTokens) => {
      fitAddonRef.current?.fit();
      const totalWelcome = `${WELCOME_MESSAGE}${WELCOME_AUTHOR}`;
      const cols = terminalRef.current?.cols ?? 80;
      const welcomePadding = ' '.repeat(Math.max(0, Math.floor((cols - totalWelcome.length) / 2)));
      terminalRef.current?.write(
        `\r\n\x1b[2K\x1b[1G${welcomePadding}${themeCss.welcomeMsgAnsi}${WELCOME_MESSAGE}\x1b[0m${themeCss.welcomeAuthorAnsi}${WELCOME_AUTHOR}\x1b[0m\r\n`
      );
    };

    window.terminalApp.startShell().then((result) => {
      const normalizedShellPath = result.shellPath.replace(/\\/g, '/');
      const normalizedCwd = normalizeWindowsPath(result.cwd);
      setShellPath(normalizedShellPath);
      setCurrentDirectory(normalizedCwd);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          writeCenteredWelcome(themeConfig.css);
        });
      });
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
  const linkState = status === 'online' ? 'stable' : status === 'booting' ? 'syncing' : 'down';
  const ioState = status === 'online' ? 'active' : status === 'booting' ? 'init' : 'idle';
  const securityState = status === 'offline' ? 'breach' : status === 'booting' ? 'handshake' : 'secure';
  const telemetryLatency = status === 'online' ? `${11 + (commandCount % 9)}ms` : '--';
  const telemetryPackets = status === 'online' ? `${88 + (commandCount % 21)} pk/s` : '--';
  const telemetryIntegrity = status === 'offline' ? 'fault' : status === 'booting' ? 'sync' : 'green';
  const isHackerTheme = themeMode === 'hacker';
  const hackerSignalStrength = status === 'online' ? 78 + (commandCount % 20) : status === 'booting' ? 52 : 12;
  const hackerWaveSamples = Array.from({ length: 18 }, (_, idx) => {
    const amplitude = Math.sin((commandCount + idx + 1) * 0.65);
    return Math.round(((amplitude + 1) / 2) * 100);
  });
  const hackerHexSeed = (commandCount * 97 + hackerSignalStrength * 13).toString(16).toUpperCase();
  const hackerHexRows = Array.from({ length: 4 }, (_, idx) => {
    const seed = Number.parseInt(hackerHexSeed || '0', 16);
    const value = (seed + idx * 4093).toString(16).toUpperCase().padStart(8, '0');
    const channel = (hackerSignalStrength + idx * 3).toString(16).toUpperCase().padStart(2, '0');
    return `${value} A7 ${channel}`;
  });
  const hackerAlertLabel =
    status === 'offline' ? 'critical: link compromised' : status === 'booting' ? 'syncing secure channel' : 'nominal secure channel';

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
    '--title-grad-start': themeConfig.css.titleGradStart,
    '--title-grad-mid': themeConfig.css.titleGradMid,
    '--title-grad-end': themeConfig.css.titleGradEnd,
    '--caption-color': themeConfig.css.captionColor,
    '--font-scale': fontScale.toFixed(2)
  } as CSSProperties;

  return (
    <div
      className={`app-shell glass-shell app-theme-${themeMode} ${isHackerTheme ? `app-hacker-profile-${hackerProfile}` : ''} ${isHackerTheme && hackerFocusMode ? 'hacker-focus-mode' : ''} ${isHackerTheme && hackerModulesOpen ? 'hacker-modules-open' : ''} runtime-status-${status} ${appReady ? 'app-ready' : ''}`}
      style={appStyle}
    >
      {isHackerTheme && hackerFocusMode ? null : <div className="ambient-orb ambient-orb-left" />}
      {isHackerTheme && hackerFocusMode ? null : <div className="ambient-orb ambient-orb-right" />}

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
              {isHackerTheme ? (
                <div className="hacker-mode-controls">
                  <div className="hacker-profile-options">
                    {HACKER_PROFILE_ORDER.map((profileId) => (
                      <button
                        key={profileId}
                        className={`settings-chip compact profile-chip ${hackerProfile === profileId ? 'selected' : ''}`}
                        onClick={() => setHackerProfile(profileId)}
                        type="button"
                      >
                        {HACKER_PROFILE_PRESETS[profileId].label}
                      </button>
                    ))}
                  </div>
                  <button
                    className={`settings-chip compact modules-chip ${hackerModulesOpen ? 'selected' : ''}`}
                    onClick={() => setHackerModulesOpen((prev) => !prev)}
                    type="button"
                  >
                    Modules {hackerModulesOpen ? 'On' : 'Off'}
                  </button>
                  <button
                    className={`settings-chip compact focus-chip ${hackerFocusMode ? 'selected' : ''}`}
                    onClick={() => setHackerFocusMode((prev) => !prev)}
                    type="button"
                  >
                    Focus {hackerFocusMode ? 'On' : 'Off'}
                  </button>
                </div>
              ) : null}
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
          {isHackerTheme ? <div className={`hacker-alert-ribbon hacker-alert-${status}`}>{hackerAlertLabel}</div> : null}
          {isHackerTheme && !hackerFocusMode ? (
            <div className="ops-strip">
              <div className="ops-chips">
                <span className="ops-chip ops-chip-link">LINK {linkState}</span>
                <span className="ops-chip ops-chip-io">IO {ioState}</span>
                <span className="ops-chip ops-chip-security">SEC {securityState}</span>
                {isHackerTheme ? <span className="ops-chip ops-chip-profile">PROFILE {hackerProfile}</span> : null}
              </div>
              <div className="ops-metrics">
                <span>lat {telemetryLatency}</span>
                <span>packets {telemetryPackets}</span>
                <span>integrity {telemetryIntegrity}</span>
                <span>cmds {commandCount}</span>
              </div>
            </div>
          ) : null}
          <div className="glass-output" onClick={() => terminalRef.current?.focus()}>
            <div ref={terminalHostRef} className="terminal-host" />
          </div>
          {isHackerTheme && hackerModulesOpen && !hackerFocusMode ? (
            <aside className="hacker-diagnostics glass-panel" aria-label="Hacker diagnostics modules">
              <div className="diag-widget">
                <p className="diag-label">signal waveform</p>
                <div className="wave-strip">
                  {hackerWaveSamples.map((sample, idx) => (
                    <span key={`wave-${idx}`} style={{ height: `${18 + sample * 0.68}%` }} />
                  ))}
                </div>
              </div>
              <div className="diag-widget">
                <p className="diag-label">hex readout</p>
                <div className="hex-grid">
                  {hackerHexRows.map((row, idx) => (
                    <span key={`hex-${idx}`}>{row}</span>
                  ))}
                </div>
              </div>
              <div className="diag-widget">
                <p className="diag-label">signal integrity</p>
                <div className="signal-track">
                  <div className="signal-fill" style={{ width: `${hackerSignalStrength}%` }} />
                </div>
                <p className="diag-value">{hackerSignalStrength}% secure</p>
              </div>
            </aside>
          ) : null}
        </section>
      </main>
    </div>
  );
}
