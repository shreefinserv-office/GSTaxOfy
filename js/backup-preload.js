// backup-preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('backupAPI', {
  start:          ()       => ipcRenderer.invoke('backup:start'),
  cancel:         ()       => ipcRenderer.invoke('backup:cancel'),
  cleanupChoice:  (choice) => ipcRenderer.invoke('backup:cleanup-choice', choice),
  onLine:         (cb)     => ipcRenderer.on('backup:line',   (_e, line) => cb(line)),
  onClosed:       (cb)     => ipcRenderer.on('backup:closed', (_e, code) => cb(code)),
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('backup:line');
    ipcRenderer.removeAllListeners('backup:closed');
  },
});
