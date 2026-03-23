import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { AppConfig } from '../shared/types';

const isDev = process.env.PORTAL_DEV === 'true' || process.env.NODE_ENV === 'development';

function getConfigPath(): string {
  return path.join(os.homedir(), '.portal', 'config.json');
}

function getLogPath(): string {
  return path.join(os.homedir(), '.portal', 'logs', 'error.log');
}

function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function loadConfig(): AppConfig {
  const defaultConfig: AppConfig = {
    signalingUrl: process.env.PORTAL_SIGNALING_URL || 'ws://localhost:8080',
    deviceId: process.env.PORTAL_DEVICE_ID || `kiosk-${Math.random().toString(36).slice(2, 8)}`,
    secret: process.env.PORTAL_SECRET || 'portal-secret-change-me',
    kioskMode: process.env.PORTAL_KIOSK_MODE === 'true' || !isDev,
  };

  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    try {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as Partial<AppConfig>;
      return { ...defaultConfig, ...fileConfig };
    } catch {
      // Use defaults if file parse fails
    }
  } else {
    ensureDir(path.dirname(configPath));
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  }

  return defaultConfig;
}

let mainWindow: BrowserWindow | null = null;
const config = loadConfig();

function createWindow(): void {
  const preloadPath = path.join(__dirname, 'preload.js');

  mainWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    autoHideMenuBar: true,
    kiosk: config.kioskMode && !isDev,
    alwaysOnTop: config.kioskMode && !isDev,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0a0a0f',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  }

  mainWindow.on('close', (event) => {
    if (config.kioskMode && !isDev) {
      event.preventDefault();
    }
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (config.kioskMode && !isDev) {
      if (
        (input.key === 'F5') ||
        (input.key === 'r' && input.control) ||
        (input.key === 'F4' && input.alt) ||
        (input.key === 'Escape')
      ) {
        event.preventDefault();
      }
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register('Ctrl+Shift+Q', () => {
    app.quit();
  });

  if (config.kioskMode && !isDev) {
    globalShortcut.register('F5', () => { /* blocked */ });
    globalShortcut.register('CommandOrControl+R', () => { /* blocked */ });
    globalShortcut.register('CommandOrControl+Shift+R', () => { /* blocked */ });
  }
});

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('render-process-gone', (_event, _webContents, details) => {
  console.error('Renderer process gone:', details.reason);
  if (mainWindow) {
    mainWindow.close();
  }
  setTimeout(createWindow, 1000);
});

ipcMain.handle('get-config', () => {
  return config;
});

ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.exit(0);
});

ipcMain.on('log-error', (_event, message: string) => {
  try {
    const logPath = getLogPath();
    ensureDir(path.dirname(logPath));
    const entry = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(logPath, entry, 'utf-8');
  } catch {
    // Ignore logging errors
  }
});
