import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';

const isDev = !app.isPackaged;

let win: BrowserWindow | null = null;
let viteProcess: any = null;

async function waitForVite(url: string, maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log('Vite dev server is ready!');
        return;
      }
    } catch (e) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Vite dev server failed to start');
}

async function startViteServer() {
  return new Promise<void>((resolve, reject) => {
    viteProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      shell: true,
      stdio: 'inherit',
    });

    viteProcess.on('error', (error: Error) => {
      console.error('Failed to start Vite server:', error);
      reject(error);
    });

    // Wait a bit for the server to start
    setTimeout(() => resolve(), 2000);
  });
}

async function createWindow() {
  win = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0a0e15',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win?.show());

  if (isDev) {
    try {
      console.log('Starting Vite dev server...');
      await startViteServer();
      console.log('Waiting for Vite dev server...');
      await waitForVite('http://localhost:5173');
      await win.loadURL('http://localhost:5173');
      win.webContents.openDevTools({ mode: 'detach' });
    } catch (error) {
      console.error('Failed to start development server:', error);
      app.quit();
    }
  } else {
    await win.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (viteProcess) {
    viteProcess.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (viteProcess) {
    viteProcess.kill();
  }
});

ipcMain.handle('save-base64-pdf', async (_e, args: { fileName: string; base64: string }) => {
  const { fileName, base64 } = args;
  const result = await dialog.showSaveDialog({
    title: 'PDF 저장',
    defaultPath: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
    filters: [{ name: 'PDF', extensions: ['pdf'] }],
  });
  if (result.canceled || !result.filePath) return { canceled: true };

  const buffer = Buffer.from(base64, 'base64');
  await fs.writeFile(result.filePath, buffer);
  return { canceled: false, filePath: result.filePath };
});

