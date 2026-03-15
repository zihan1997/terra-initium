const { app, BrowserWindow, dialog } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const APP_DIR = path.join(ROOT_DIR, 'app');
const ENV_PATH = path.join(ROOT_DIR, '.env.local');
const DEFAULT_PORT = 8000;
const OPENLENS_URL = `http://127.0.0.1:${DEFAULT_PORT}/openlens`;

let backendProcess = null;
let mainWindow = null;
let shuttingDown = false;

function candidateCommand(candidate) {
  if (candidate === 'py') {
    return {
      command: 'py',
      args: ['-3', '-m', 'uvicorn', 'src.main:app', '--host', '127.0.0.1', '--port', String(DEFAULT_PORT)],
    };
  }

  return {
    command: candidate,
    args: ['-m', 'uvicorn', 'src.main:app', '--host', '127.0.0.1', '--port', String(DEFAULT_PORT)],
  };
}

function loadEnvFile() {
  if (!fs.existsSync(ENV_PATH)) {
    return {};
  }

  const parsed = dotenv.parse(fs.readFileSync(ENV_PATH));
  return parsed;
}

function pythonCandidates() {
  const windows = process.platform === 'win32';
  const candidates = windows
    ? [
        path.join(APP_DIR, '.venv', 'Scripts', 'python.exe'),
        'py',
        'python',
      ]
    : [
        path.join(APP_DIR, '.venv', 'bin', 'python'),
        'python3',
        'python',
      ];

  return candidates;
}

function spawnBackend() {
  const env = {
    ...process.env,
    ...loadEnvFile(),
  };

  const candidates = pythonCandidates();
  let lastError = null;

  const startupErrors = [];

  for (const candidate of candidates) {
    try {
      const { command, args } = candidateCommand(candidate);

      const child = spawn(command, args, {
        cwd: APP_DIR,
        env,
        stdio: 'pipe',
      });

      let bootOutput = '';

      child.stdout.on('data', (chunk) => {
        bootOutput += chunk.toString();
        process.stdout.write(`[backend] ${chunk}`);
      });

      child.stderr.on('data', (chunk) => {
        bootOutput += chunk.toString();
        process.stderr.write(`[backend] ${chunk}`);
      });

      child.on('exit', (code, signal) => {
        startupErrors.push(
          `${command} ${args.join(' ')} -> ${signal ? `signal ${signal}` : `code ${code}`}\n${bootOutput.trim()}`
        );

        if (shuttingDown) {
          return;
        }

        const reason = signal ? `signal ${signal}` : `code ${code}`;
        dialog.showErrorBox(
          'Backend Stopped',
          `The local backend exited unexpectedly with ${reason}.\n\n${bootOutput.trim() || 'No backend output was captured.'}\n\nIf dependencies are missing, run:\ncd desktop && npm run setup:backend`
        );
        app.quit();
      });

      backendProcess = child;
      return;
    } catch (error) {
      lastError = error;
      startupErrors.push(`${candidate}: ${error.message}`);
    }
  }

  const details = startupErrors.join('\n\n');
  throw lastError || new Error(`Could not start the backend process.\n\n${details}`);
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
    spawnBackend();
    await waitForServer(OPENLENS_URL);
    createWindow();
  } catch (error) {
    dialog.showErrorBox(
      'OpenLens Desktop Failed to Start',
      `${error.message}\n\nMake sure Python dependencies are installed for the backend and that port ${DEFAULT_PORT} is available.\n\nIf this is the first run, use:\ncd desktop && npm run setup:backend`
    );
    app.quit();
  }
}

function stopBackend() {
  shuttingDown = true;

  if (!backendProcess) {
    return;
  }

  backendProcess.kill();
  backendProcess = null;
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
