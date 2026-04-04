const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('terminalApp', {
  startShell: () => ipcRenderer.invoke('shell:start'),
  writeToShell: (data) => ipcRenderer.invoke('shell:write', data),
  stopShell: () => ipcRenderer.invoke('shell:stop'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  onShellData: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('shell:data', listener);
    return () => ipcRenderer.removeListener('shell:data', listener);
  },
  onShellExit: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('shell:exit', listener);
    return () => ipcRenderer.removeListener('shell:exit', listener);
  },
  onShellError: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on('shell:error', listener);
    return () => ipcRenderer.removeListener('shell:error', listener);
  }
});



