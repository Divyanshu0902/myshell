const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..');
const rendererUrl = process.env.ELECTRON_RENDERER_URL;
const SHELL_CWD_PREFIX = '__MYSHELL_CWD__=';
const SHELL_PROMPT_ANSI = '\x1b[38;2;119;178;255mbolBhai\x1b[0m>> ';
const SHELL_PROMPT_PLAIN = 'bolBhai>> ';

let mainWindow = null;
let shellProcess = null;
let shellStdoutBuffer = '';

function resolveShellPath() {
  const candidates = [
    path.join(repoRoot, 'shell-core', 'myshell_v6.exe'),
    path.join(repoRoot, 'shell-core', 'myshell.exe')
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

function broadcast(channel, payload) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send(channel, payload);
}

function stripShellPrompt(text) {
  let sanitized = text;

  while (sanitized.startsWith(SHELL_PROMPT_ANSI) || sanitized.startsWith(SHELL_PROMPT_PLAIN)) {
    if (sanitized.startsWith(SHELL_PROMPT_ANSI)) {
      sanitized = sanitized.slice(SHELL_PROMPT_ANSI.length);
      continue;
    }

    sanitized = sanitized.slice(SHELL_PROMPT_PLAIN.length);
  }

  return sanitized;
}

function handleShellStdout(chunk) {
  shellStdoutBuffer += chunk;
  const lines = shellStdoutBuffer.split(/\r?\n/);
  shellStdoutBuffer = lines.pop() ?? '';

  const visibleLines = [];
  for (const line of lines) {
    if (line.startsWith(SHELL_CWD_PREFIX)) {
      if (visibleLines.length > 0) {
        broadcast('shell:data', `${visibleLines.join('\n')}\n`);
        visibleLines.length = 0;
      }
      broadcast('shell:cwd', { cwd: line.slice(SHELL_CWD_PREFIX.length) });
      continue;
    }

    const sanitizedLine = stripShellPrompt(line);
    if (sanitizedLine.length > 0) {
      visibleLines.push(sanitizedLine);
    }
  }

  if (visibleLines.length > 0) {
    broadcast('shell:data', `${visibleLines.join('\n')}\n`);
  }
}

function flushShellStdoutBuffer() {
  if (!shellStdoutBuffer) {
    return;
  }

  if (shellStdoutBuffer.startsWith(SHELL_CWD_PREFIX)) {
    broadcast('shell:cwd', { cwd: shellStdoutBuffer.slice(SHELL_CWD_PREFIX.length) });
  } else {
    const sanitizedBuffer = stripShellPrompt(shellStdoutBuffer);
    if (sanitizedBuffer.length > 0) {
      broadcast('shell:data', sanitizedBuffer);
    }
  }

  shellStdoutBuffer = '';
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 780,
    minWidth: 920,
    minHeight: 620,
    frame: false,
    thickFrame: true,
    resizable: true,
    titleBarStyle: 'hidden',
    backgroundColor: '#05070b',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', () => {
    startShell();
  });

  if (rendererUrl) {
    mainWindow.loadURL(rendererUrl);
  } else {
    mainWindow.loadFile(path.join(appRoot, 'dist', 'index.html'));
  }
}

function stopShell() {
  if (shellProcess) {
    shellProcess.kill();
    shellProcess = null;
  }
  shellStdoutBuffer = '';
}

function startShell() {
  if (shellProcess) {
    return { ok: true, shellPath: resolveShellPath(), cwd: repoRoot, reused: true };
  }

  const shellPath = resolveShellPath();
  shellStdoutBuffer = '';

  shellProcess = spawn(shellPath, [], {
    cwd: repoRoot,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true
  });

  shellProcess.stdout.setEncoding('utf8');
  shellProcess.stderr.setEncoding('utf8');

  shellProcess.stdout.on('data', handleShellStdout);
  shellProcess.stderr.on('data', (chunk) => broadcast('shell:data', chunk));

  shellProcess.on('exit', (code, signal) => {
    flushShellStdoutBuffer();
    broadcast('shell:exit', { code, signal });
    shellProcess = null;
  });

  shellProcess.on('error', (error) => {
    flushShellStdoutBuffer();
    broadcast('shell:error', { message: error.message });
    shellProcess = null;
  });

  return { ok: true, shellPath, cwd: repoRoot, reused: false };
}

ipcMain.handle('shell:start', () => startShell());
ipcMain.handle('shell:write', (_event, data) => {
  if (!shellProcess || shellProcess.stdin.destroyed) {
    return { ok: false };
  }
  shellProcess.stdin.write(data);
  return { ok: true };
});
ipcMain.handle('shell:stop', () => {
  stopShell();
  return { ok: true };
});
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.handle('window:maximize', () => {
  if (!mainWindow) {
    return { isMaximized: false };
  }
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
  return { isMaximized: mainWindow.isMaximized() };
});
ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopShell();
});
