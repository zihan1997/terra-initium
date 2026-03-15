const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createDesktopServer } = require('../server/openlens-server');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const DEFAULT_PORT = 8364;
const OPENLENS_URL = `http://127.0.0.1:${DEFAULT_PORT}/openlens`;

let backendServer = null;
let mainWindow = null;
let shuttingDown = false;

function runtimePaths() {
  if (app.isPackaged) {
    return {
      envCandidates: [
        path.join(path.dirname(process.execPath), '.env.local'),
        path.join(process.resourcesPath, '.env.local'),
      ],
      openlensStaticDir: path.join(process.resourcesPath, 'openlens_static'),
      openlensConfigPath: path.join(process.resourcesPath, 'openlens.config.json'),
    };
  }

  return {
    envCandidates: [
      path.join(ROOT_DIR, '.env.local'),
    ],
    openlensStaticDir: path.join(ROOT_DIR, 'app', 'static', 'openlens'),
    openlensConfigPath: path.join(ROOT_DIR, 'openlens_ui', 'openlens.config.json'),
  };
}

function loadEnvFile() {
  for (const envPath of runtimePaths().envCandidates) {
    if (fs.existsSync(envPath)) {
      return dotenv.parse(fs.readFileSync(envPath));
    }
  }
  return {};
}

async function waitForServer(url, timeoutMs = 20000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch (_) {
      // Retry until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    autoHideMenuBar: true,
    title: 'OpenLens',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(OPENLENS_URL);
}

async function bootstrap() {
  try {
    Object.assign(process.env, loadEnvFile());
    backendServer = await createDesktopServer(DEFAULT_PORT, runtimePaths());
    await waitForServer(OPENLENS_URL);
    createWindow();
  } catch (error) {
    dialog.showErrorBox(
      'OpenLens Desktop Failed to Start',
      `${error.message}\n\nMake sure the OpenLens frontend bundle has been built and that port ${DEFAULT_PORT} is available.\n\nBuild first with:\ncd openlens_ui && npm install && npm run build:terra`
    );
    app.quit();
  }
}

function stopBackend() {
  shuttingDown = true;

  if (!backendServer) {
    return;
  }

  backendServer.close();
  backendServer = null;
}

app.whenReady().then(bootstrap);

app.on('window-all-closed', () => {
  stopBackend();
  app.quit();
});

app.on('before-quit', () => {
  stopBackend();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && !mainWindow) {
    createWindow();
  }
});
