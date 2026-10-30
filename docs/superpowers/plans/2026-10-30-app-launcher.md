# Implementation Plan: ANIMALIA Unified Multi-Target Application Launcher

This plan implements a zero-friction, cross-platform launcher system for ANIMALIA, providing a 1-click Windows desktop/explorer launcher, PowerShell script, and Node.js multi-process orchestrator that connects the PGlite PostgreSQL wire server on `127.0.0.1:54322` with the Vite dev server on `http://localhost:5173`, automatically opens the browser, and ensures clean multi-process lifecycle management.

---

### User Review Required

> [!IMPORTANT]
> - The launcher will default to automatically opening your system's default browser to `http://localhost:5173` upon server readiness.
> - A `--no-open` flag is supported if you wish to run headless in the terminal without opening a browser window.
> - The launcher is resilient to existing PostgreSQL instances on port `54322`: if `scripts/pg-server.js` is already running, it seamlessly reuses the active database connection rather than throwing `EADDRINUSE`.

---

## Proposed Changes

### Task 1: Core Node.js Orchestrator (`scripts/launch.js`)
- Implement `scripts/launch.js` in ESM (`"type": "module"`).
- Add stylized ASCII art banner with version and platform details.
- Implement pre-flight checks:
  - Verify Node.js version (>= 18.0.0).
  - Verify `animalia-handoff-bundle.json` exists.
- Implement TCP port prober (`checkPortReady(port, host, timeoutMs)`).
- Implement database manager:
  - If port `54322` is already responding, log reuse and proceed.
  - If port `54322` is idle, spawn `node scripts/pg-server.js` and poll readiness every 250ms until ready.
- Implement frontend dev server manager:
  - Spawn `npx vite` with stdio monitoring.
  - Dynamically detect local URL and port from Vite output (`http://localhost:5173/` or alternative if busy).
- Implement cross-platform browser opener:
  - Windows: `start <url>`
  - macOS: `open <url>`
  - Linux: `xdg-open <url>`
  - Guarded by `--no-open` and `--test-mode` flags.
- Implement unified process teardown:
  - Intercept `SIGINT` (Ctrl+C), `SIGTERM`, `exit`.
  - Terminate spawned child processes cleanly.

### Task 2: Windows Double-Clickable Launcher (`launch.bat`)
- Create `launch.bat` in the workspace root.
- Ensure proper working directory resolution using `%~dp0`.
- Check if `node.exe` is accessible in `%PATH%`; show readable prompt if missing.
- Check if `node_modules` exists; if missing, invoke `npm.cmd install` automatically.
- Invoke `node scripts/launch.js %*`.
- Include error pause so command window remains open if an error occurs.

### Task 3: PowerShell Script Launcher (`launch.ps1`)
- Create `launch.ps1` in the workspace root.
- Set current directory to `$PSScriptRoot`.
- Output colored status headers.
- Pass through any CLI flags to `node scripts/launch.js $args`.

### Task 4: Package Scripts Integration & Automated Verification
- Update `package.json` to include `"start": "node scripts/launch.js"` and `"launch": "node scripts/launch.js"`.
- Create a test verification script `scripts/verify-launcher-e2e.js` to test:
  1. Port detection and reuse logic.
  2. Orchestrator launch in `--test-mode --no-open` with automatic timeout and clean shutdown.
  3. Exit code assertion.
- Run `npm run build` and verification suite to ensure 100% stability.

---

## Verification Plan

### Automated Tests
- Run `node scripts/verify-launcher-e2e.js` to verify:
  - Pre-flight checks pass.
  - Database connectivity probe works on port 54322.
  - Vite dev server spawns and reports ready port.
  - SIGINT/process termination cleans up all child processes without zombies.
- Run `npm.cmd run build` to ensure no workspace syntax or build issues.

### Manual Verification
- Execute `npm start -- --no-open --test-mode` to verify console output.
- Test `launch.bat` from terminal.
