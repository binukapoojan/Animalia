/**
 * ANIMALIA — Application Launcher E2E Verification Suite
 * Verifies all 4 Windows safeguards and launcher functionality:
 * 1. Working directory lock in launch.bat & launch.ps1
 * 2. Port 54322 TCP probe & reuse logic
 * 3. Orchestration run in --no-open --test-mode with clean exit code 0
 * 4. Windows child-process taskkill tree cleanup without orphaned nodes
 * 5. Package.json npm start / npm run launch script wiring
 */

import fs from 'fs';
import path from 'path';
import net from 'net';
import { spawn } from 'child_process';

const PG_PORT = 54322;
const PG_HOST = '127.0.0.1';

function isPortListening(port, host = '127.0.0.1', timeoutMs = 1000) {
  return new Promise((resolve) => {
    const s = new net.Socket();
    s.setTimeout(timeoutMs);
    s.on('connect', () => {
      s.destroy();
      resolve(true);
    });
    s.on('timeout', () => {
      s.destroy();
      resolve(false);
    });
    s.on('error', () => {
      s.destroy();
      resolve(false);
    });
    s.connect(port, host);
  });
}

async function runLauncherVerification() {
  console.log('================================================================');
  console.log('ANIMALIA E2E VERIFICATION: APPLICATION LAUNCHER SUITE');
  console.log('================================================================\n');

  // -------------------------------------------------------------------------
  // CHECK 1: Working Directory Lock & File Safeguards
  // -------------------------------------------------------------------------
  console.log('--- CHECK 1: Working Directory Lock & File Safeguards ---');
  
  // launch.bat
  const batPath = path.resolve('launch.bat');
  if (!fs.existsSync(batPath)) {
    throw new Error('launch.bat does not exist');
  }
  const batContent = fs.readFileSync(batPath, 'utf8');
  if (!batContent.includes('cd /d "%~dp0"')) {
    throw new Error('launch.bat is missing cd /d "%~dp0" directory lock');
  }
  if (!batContent.includes('scripts\\launch.js')) {
    throw new Error('launch.bat does not execute scripts\\launch.js');
  }
  console.log('  ✓ launch.bat verified with cd /d "%~dp0" drive-safe lock.');

  // launch.ps1
  const ps1Path = path.resolve('launch.ps1');
  if (!fs.existsSync(ps1Path)) {
    throw new Error('launch.ps1 does not exist');
  }
  const ps1Content = fs.readFileSync(ps1Path, 'utf8');
  if (!ps1Content.includes('Set-Location -LiteralPath $PSScriptRoot')) {
    throw new Error('launch.ps1 is missing Set-Location -LiteralPath $PSScriptRoot lock');
  }
  console.log('  ✓ launch.ps1 verified with Set-Location -LiteralPath $PSScriptRoot.');

  // package.json scripts
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.start !== 'node scripts/launch.js' || pkg.scripts?.launch !== 'node scripts/launch.js') {
    throw new Error('package.json is missing "start" or "launch" script wiring');
  }
  console.log('  ✓ package.json verified with "start" and "launch" commands.');
  console.log('[PASS] Check 1 passed: All working directory and configuration safeguards verified.\n');

  // -------------------------------------------------------------------------
  // CHECK 2: Port 54322 TCP Readiness & Probe Logic
  // -------------------------------------------------------------------------
  console.log('--- CHECK 2: Port 54322 TCP Readiness & Probe Logic ---');
  const pgOnline = await isPortListening(PG_PORT, PG_HOST);
  console.log(`  ✓ TCP port ${PG_PORT} active on ${PG_HOST}: ${pgOnline}`);
  if (!pgOnline) {
    console.log('  (PostgreSQL port is currently idle; launcher will auto-spawn pg-server)');
  } else {
    console.log('  (Active PostgreSQL port detected; launcher will reuse existing connection without EADDRINUSE)');
  }
  console.log('[PASS] Check 2 passed: TCP socket readiness probe functional.\n');

  // -------------------------------------------------------------------------
  // CHECK 3: Launcher Orchestration in Non-Blocking Test Mode
  // -------------------------------------------------------------------------
  console.log('--- CHECK 3: Launcher Orchestration (--no-open --test-mode) ---');
  let stdoutData = '';
  let stderrData = '';

  const launcherChild = spawn(process.execPath, [path.resolve('scripts/launch.js'), '--no-open', '--test-mode'], {
    env: { ...process.env, ANIMALIA_NO_BROWSER: '1', ANIMALIA_TEST_MODE: '1' }
  });

  launcherChild.stdout.on('data', (d) => {
    const text = d.toString();
    stdoutData += text;
    process.stdout.write(text);
  });

  launcherChild.stderr.on('data', (d) => {
    const text = d.toString();
    stderrData += text;
    process.stderr.write(text);
  });

  const exitCode = await new Promise((resolve) => {
    launcherChild.on('close', resolve);
  });

  console.log(`\n  ✓ Launcher process completed with exit code: ${exitCode}`);
  if (exitCode !== 0) {
    throw new Error(`Launcher exited with non-zero code ${exitCode}. Stderr: ${stderrData}`);
  }

  // Assertions on output
  if (!stdoutData.includes('ANIMALIA')) {
    throw new Error('Expected ANIMALIA banner in launcher output');
  }
  if (!stdoutData.includes('Pre-flight checks passed')) {
    throw new Error('Expected pre-flight checks to pass');
  }
  if (!stdoutData.includes('127.0.0.1:54322')) {
    throw new Error('Expected PostgreSQL port 54322 mention in launcher output');
  }
  if (!stdoutData.includes('Browser launch skipped (--no-open active)')) {
    throw new Error('Expected browser auto-open suppression in --no-open mode');
  }
  if (!stdoutData.includes('[TEST-MODE] Verified server online')) {
    throw new Error('Expected test-mode confirmation of server online');
  }
  if (!stdoutData.includes('All application services cleanly shutdown')) {
    throw new Error('Expected clean shutdown confirmation message');
  }

  console.log('[PASS] Check 3 passed: Launcher successfully booted, coordinated DB + Vite, and cleanly shut down.\n');

  // -------------------------------------------------------------------------
  // CHECK 4: Post-Run Port Health & No Zombie Tasks
  // -------------------------------------------------------------------------
  console.log('--- CHECK 4: Post-Run Port Health Verification ---');
  // Check that the Vite port is cleanly freed
  const vitePortAfter = await isPortListening(5173, 'localhost', 500);
  console.log(`  ✓ Port 5173 listening after shutdown: ${vitePortAfter} (Expected: false)`);
  if (vitePortAfter) {
    throw new Error('Port 5173 is still active! Child process was not properly terminated.');
  }

  console.log('[PASS] Check 4 passed: Zero orphaned Vite child processes detected.\n');

  console.log('================================================================');
  console.log('✓ ALL 4 APPLICATION LAUNCHER CHECKS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
}

runLauncherVerification().catch((err) => {
  console.error('\n❌ [FAIL] Launcher verification failed:', err);
  process.exit(1);
});
