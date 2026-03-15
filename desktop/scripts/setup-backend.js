const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const APP_DIR = path.join(ROOT_DIR, 'app');
const VENV_DIR = path.join(APP_DIR, '.venv');
const REQUIREMENTS_PATH = path.join(APP_DIR, 'requirements.txt');

const isWindows = process.platform === 'win32';
const venvPython = isWindows
  ? path.join(VENV_DIR, 'Scripts', 'python.exe')
  : path.join(VENV_DIR, 'bin', 'python');

function removeDir(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function getPythonVersion(command, args = ['--version']) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    return null;
  }

  const output = `${result.stdout || ''}${result.stderr || ''}`;
  const match = output.match(/Python\s+(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw: `${match[1]}.${match[2]}.${match[3]}`,
  };
}

function isSupportedPython(version) {
  return version && (version.major > 3 || (version.major === 3 && version.minor >= 10));
}

function findBootstrapPython() {
  const candidates = isWindows
    ? ['py', 'python']
    : ['python3.13', 'python3.12', 'python3.11', 'python3.10', 'python3', 'python'];

  for (const candidate of candidates) {
    const version = getPythonVersion(candidate);
    if (isSupportedPython(version)) {
      return candidate;
    }
  }

  throw new Error('No compatible Python interpreter was found. Install Python 3.10 or newer first.');
}

function shouldRecreateVenv() {
  if (!fs.existsSync(VENV_DIR)) {
    return true;
  }

  if (!fs.existsSync(venvPython)) {
    return true;
  }

  const version = getPythonVersion(venvPython);
  return !isSupportedPython(version);
}

function main() {
  if (!fs.existsSync(REQUIREMENTS_PATH)) {
    throw new Error(`Missing requirements file: ${REQUIREMENTS_PATH}`);
  }

  const bootstrapPython = findBootstrapPython();

  if (shouldRecreateVenv()) {
    removeDir(VENV_DIR);
    run(bootstrapPython, ['-m', 'venv', VENV_DIR], { cwd: APP_DIR });
  }

  run(venvPython, ['-m', 'pip', 'install', '--upgrade', 'pip'], { cwd: APP_DIR });
  run(venvPython, ['-m', 'pip', 'install', '-r', REQUIREMENTS_PATH], { cwd: APP_DIR });
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
