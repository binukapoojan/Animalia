/**
 * ANIMALIA — Unified Multi-Target Application Launcher & Orchestrator
 * Connects PostgreSQL wire server on 127.0.0.1:54322,
 * boots Vite frontend dev server on http://localhost:5173,
 * automatically opens the default web browser, and coordinates
 * clean multi-process lifecycle shutdown across Windows, macOS, and Linux.
 */

import { spawn, exec, execSync } from 'child_process';
import net from 'net';
import fs from 'fs';
import path from 'path';

// Parse CLI flags and Environment variables
const args = process.argv.slice(2);
const noOpen = args.includes('--no-open') || process.env.ANIMALIA_NO_BROWSER === '1';
const isTestMode = args.includes('--test-mode') || process.env.ANIMALIA_TEST_MODE === '1';

const PG_PORT = 54322;
const PG_HOST = '127.0.0.1';
const DEFAULT_VITE_PORT = 5173;

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  amber: '\x1b[38;5;214m'
};

function banner() {
  console.log(`
${COLORS.amber}${COLORS.bright}     _    _   _ ___ __  __    _    _     ___    _    
    / \\  | \\ | |_ _|  \\/  |  / \\  | |   |_ _|  / \\   
   / _ \\ |  \\| || || |\\/| | / _ \\ | |    | |  / _ \\  
  / ___ \\| |\\  || || |  | |/ ___ \\| |___ | | / ___ \\ 
 /_/   \\_\\_| \\_|___|_|  |_/_/   \\_\\_____|___/_/   \\_\\${COLORS.reset}
  ${COLORS.cyan}Interactive Biodiversity Expedition Platform${COLORS.reset}
  ${COLORS.dim}Node: ${process.version} | Platform: ${process.platform} (${process.arch})${COLORS.reset}
`);
}

function logInfo(msg) {
  console.log(`${COLORS.cyan}ℹ [INFO]${COLORS.reset} ${msg}`);
}

function logSuccess(msg) {
  console.log(`${COLORS.green}✓ [SUCCESS]${COLORS.reset} ${msg}`);
}

function logWarn(msg) {
  console.log(`${COLORS.yellow}⚠ [WARN]${COLORS.reset} ${msg}`);
}

function logError(msg) {
  console.log(`${COLORS.red}✖ [ERROR]${COLORS.reset} ${msg}`);
}

/**
 * Check if a TCP port is currently open and accepting connections
 */
function isPortOpen(port, host = '127.0.0.1', timeoutMs = 800) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      isConnected = true;
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

/**
 * Poll until TCP port is accepting connections
 */
async function waitForPort(port, host = '127.0.0.1', maxWaitMs = 15000, intervalMs = 250) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    if (await isPortOpen(port, host, 200)) {
      return true;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

/**
 * Open default browser cross-platform
 */
function openBrowser(url) {
  try {
    if (process.platform === 'win32') {
      exec(`start "" "${url}"`);
    } else if (process.platform === 'darwin') {
      exec(`open "${url}"`);
    } else {
      exec(`xdg-open "${url}"`);
    }
  } catch (err) {
    logWarn(`Could not open browser automatically: ${err.message}`);
  }
}

// Track child processes
let pgProcess = null;
let viteProcess = null;
let reusedPgServer = false;
let isShuttingDown = false;

function terminateChild(child, name) {
  if (!child || child.killed) return;
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
    } else {
      child.kill('SIGTERM');
    }
    logInfo(`Cleaned up ${name} (PID: ${child.pid})`);
  } catch {
    // Process might have already exited
  }
}

function shutdown(exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${COLORS.amber}[ANIMALIA] Shutting down application services...${COLORS.reset}`);

  if (viteProcess) {
    terminateChild(viteProcess, 'Vite Frontend Server');
  }

  // Only terminate PostgreSQL if spawned by this launcher instance!
  if (pgProcess && !reusedPgServer) {
    terminateChild(pgProcess, 'PostgreSQL Server');
  } else if (reusedPgServer) {
    logInfo('Preserved pre-existing PostgreSQL server instance on 127.0.0.1:54322.');
  }

  logSuccess('All application services cleanly shutdown.');
  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('exit', () => shutdown(0));

async function main() {
  banner();

  // 1. Pre-flight Checks
  logInfo('Running pre-flight environment checks...');
  const majorNodeVersion = parseInt(process.versions.node.split('.')[0], 10);
  if (majorNodeVersion < 18) {
    logError(`Node.js version 18+ is required (found ${process.version}). Please update Node.js.`);
    process.exit(1);
  }

  const bundlePath = path.resolve('animalia-handoff-bundle.json');
  if (!fs.existsSync(bundlePath)) {
    logError(`Missing ${bundlePath}. Seed bundle required to start ANIMALIA.`);
    process.exit(1);
  }

  const viteBin = path.resolve('node_modules/vite/bin/vite.js');
  if (!fs.existsSync(viteBin)) {
    logError(`Vite is not installed in node_modules. Run 'npm install' before launching.`);
    process.exit(1);
  }
  logSuccess('Pre-flight checks passed.');

  // 2. PostgreSQL Server Check & Readiness
  logInfo(`Probing PostgreSQL service on ${PG_HOST}:${PG_PORT}...`);
  const isPgActive = await isPortOpen(PG_PORT, PG_HOST);

  if (isPgActive) {
    reusedPgServer = true;
    logSuccess(`✓ Reusing active PostgreSQL server on ${PG_HOST}:${PG_PORT}`);
  } else {
    logInfo(`Starting local PostgreSQL PGlite wire server (scripts/pg-server.js)...`);
    const pgScript = path.resolve('scripts/pg-server.js');

    pgProcess = spawn(process.execPath, [pgScript], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env }
    });

    pgProcess.stdout.on('data', (d) => {
      const line = d.toString().trim();
      if (line) console.log(`${COLORS.dim}[PG] ${line}${COLORS.reset}`);
    });

    pgProcess.stderr.on('data', (d) => {
      const line = d.toString().trim();
      if (line) console.error(`${COLORS.red}[PG ERR] ${line}${COLORS.reset}`);
    });

    pgProcess.on('exit', (code) => {
      if (!isShuttingDown && code !== 0) {
        logError(`PostgreSQL process exited unexpectedly with code ${code}`);
        shutdown(1);
      }
    });

    logInfo(`Waiting for PostgreSQL TCP port ${PG_PORT} to accept connections...`);
    const isReady = await waitForPort(PG_PORT, PG_HOST, 15000);
    if (!isReady) {
      logError(`Timed out waiting for PostgreSQL server on port ${PG_PORT}.`);
      shutdown(1);
      return;
    }
    logSuccess(`PostgreSQL wire server online and accepting connections on ${PG_HOST}:${PG_PORT}`);
  }

  // 3. Start Vite Dev Server
  logInfo('Starting Vite dev server...');
  viteProcess = spawn(process.execPath, [viteBin], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  let appUrl = `http://localhost:${DEFAULT_VITE_PORT}`;
  let browserOpened = false;

  viteProcess.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);

    // Extract bound URL if Vite shifts to another port (e.g. 5174)
    const urlMatch = output.match(/Local:\s+(http:\/\/[a-zA-Z0-9.-]+:\d+\/?)/);
    if (urlMatch && urlMatch[1]) {
      appUrl = urlMatch[1].trim();
      if (!appUrl.endsWith('/')) appUrl += '/';
    }

    if (!browserOpened && (output.includes('ready in') || output.includes('Local:'))) {
      browserOpened = true;
      logSuccess(`ANIMALIA Web UI ready at ${COLORS.bright}${appUrl}${COLORS.reset}`);

      if (!noOpen) {
        logInfo(`Opening default browser to ${appUrl}...`);
        openBrowser(appUrl);
      } else {
        logInfo(`Browser launch skipped (--no-open active).`);
      }

      if (isTestMode) {
        logSuccess(`[TEST-MODE] Verified server online at ${appUrl}. Initiating clean test shutdown in 3s...`);
        setTimeout(() => {
          shutdown(0);
        }, 3000);
      }
    }
  });

  viteProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  viteProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      logWarn(`Vite frontend exited with code ${code}`);
      shutdown(code || 0);
    }
  });

  console.log(`\n${COLORS.cyan}------------------------------------------------------------${COLORS.reset}`);
  console.log(`${COLORS.bright}ANIMALIA Platform Running!${COLORS.reset}`);
  console.log(`- Web Frontend:  ${COLORS.cyan}${appUrl}${COLORS.reset}`);
  console.log(`- Database Port: ${COLORS.cyan}${PG_HOST}:${PG_PORT}${COLORS.reset}`);
  console.log(`- Press ${COLORS.yellow}Ctrl + C${COLORS.reset} to stop all services cleanly.`);
  console.log(`${COLORS.cyan}------------------------------------------------------------${COLORS.reset}\n`);
}

main().catch((err) => {
  logError(`Fatal launcher error: ${err.message}`);
  shutdown(1);
});
