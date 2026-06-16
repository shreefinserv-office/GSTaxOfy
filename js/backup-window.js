/**
 * backup-window.js
 * Add this to your Electron main.js
 * Handles spawning PowerShell + streaming output to the backup progress window
 */

const { BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let backupWin = null;
let psProcess = null;

function openBackupWindow(parentWin) {
  if (backupWin && !backupWin.isDestroyed()) {
    backupWin.focus();
    return;
  }

  backupWin = new BrowserWindow({
    width: 780,
    height: 620,
    minWidth: 640,
    minHeight: 500,
    parent: parentWin || null,
    modal: false,
    resizable: true,
    title: 'System Data Backup',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'scripts', 'backup-preload.js'),
    },
    backgroundColor: '#0f172a',
    show: false,
  });

  backupWin.loadFile(path.join(__dirname, 'pages', 'Masters', 'backup-progress.html'));

  backupWin.once('ready-to-show', () => {
    backupWin.show();
  });

  backupWin.on('closed', () => {
    // Kill PS if still running when window is closed
    if (psProcess) {
      try { psProcess.kill(); } catch (_) {}
      psProcess = null;
    }
    backupWin = null;
  });
}

// ── IPC: renderer asks to start backup ───────────────────────────────────────
ipcMain.handle('backup:start', async () => {
  if (psProcess) return { error: 'Backup already running' };

  const scriptPath = path.join(__dirname, 'scripts', 'databackup.ps1');

  psProcess = spawn('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy', 'Bypass',
    '-File', scriptPath,
  ], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Stream stdout line by line to renderer
  let buffer = '';
  psProcess.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line
    for (const raw of lines) {
      const line = raw.trim();
      if (line && backupWin && !backupWin.isDestroyed()) {
        backupWin.webContents.send('backup:line', line);
      }
    }
  });

  psProcess.stderr.on('data', (chunk) => {
    const msg = chunk.toString().trim();
    if (msg && backupWin && !backupWin.isDestroyed()) {
      backupWin.webContents.send('backup:line', `[LOG] ⚠ ${msg}`);
    }
  });

  psProcess.on('close', (code) => {
    psProcess = null;
    if (backupWin && !backupWin.isDestroyed()) {
      backupWin.webContents.send('backup:closed', code);
    }
  });

  return { ok: true };
});

// ── IPC: renderer sends cleanup choice (1=Delete all, 2=Keep all) ────────────
ipcMain.handle('backup:cleanup-choice', async (_event, choice) => {
  if (psProcess && psProcess.stdin.writable) {
    psProcess.stdin.write(choice + '\n');
  }
});

// ── IPC: renderer asks to cancel ─────────────────────────────────────────────
ipcMain.handle('backup:cancel', async () => {
  if (psProcess) {
    try { psProcess.kill(); } catch (_) {}
    psProcess = null;
  }
});

// ── Export for use in main.js ─────────────────────────────────────────────────
module.exports = { openBackupWindow };

/*
  ── HOW TO WIRE IN main.js ──────────────────────────────────────────────────

  const { openBackupWindow } = require('./backup-window');

  // In your IPC handler where backup.html calls window.electronAPI.openBackupWindow():
  ipcMain.handle('open-backup-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    openBackupWindow(win);
  });

  ── IN YOUR MAIN PRELOAD (preload.js) ────────────────────────────────────────

  contextBridge.exposeInMainWorld('electronAPI', {
    // ...your existing APIs...
    openBackupWindow: () => ipcRenderer.invoke('open-backup-window'),
  });
*/
