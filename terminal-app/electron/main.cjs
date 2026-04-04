const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const appRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appRoot, '..');
const rendererUrl = process.env.ELECTRON_RENDERER_URL;

let mainWindow = null;
let shellProcess = null;

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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
    minWidth: 1120,
    minHeight: 720,
    frame: false,
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
}

function startShell() {
  if (shellProcess) {
    return { ok: true, shellPath: resolveShellPath(), reused: true };
  }

  const shellPath = resolveShellPath();

  shellProcess = spawn(shellPath, [], {
    cwd: repoRoot,
    stdio: ['pipe', 'pipe', 'pipe'],
    windowsHide: true
  });

  shellProcess.stdout.setEncoding('utf8');
  shellProcess.stderr.setEncoding('utf8');

  shellProcess.stdout.on('data', (chunk) => broadcast('shell:data', chunk));
  shellProcess.stderr.on('data', (chunk) => broadcast('shell:data', chunk));

  shellProcess.on('exit', (code, signal) => {
    broadcast('shell:exit', { code, signal });
    shellProcess = null;
  });

  shellProcess.on('error', (error) => {
    broadcast('shell:error', { message: error.message });
    shellProcess = null;
  });

  return { ok: true, shellPath, reused: false };
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







