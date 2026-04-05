# Terminal App Project

This folder contains the Electron desktop terminal application for `apnaShell`.

## Overview

The app hosts `shell-core/myshell_v6.exe` inside a dedicated desktop window and provides:

- Electron main/preload shell bridge
- React + TypeScript + Vite renderer
- `xterm.js` terminal surface
- branded `bolBhai>>` prompt rendering
- branded `sunBhai>` output labeling
- centered terminal welcome banner
- boxed working-directory indicator in the terminal section header
- custom frameless window chrome

## Current Status

Implemented and verified:

- Electron app shell
- preload IPC bridge
- child-process launch of `../shell-core/myshell_v6.exe`
- shell stdout/stderr rendering in `xterm.js`
- terminal-only input via the hosted `xterm.js` surface
- cwd synchronization from shell to app UI
- production renderer build with `npm run build`
- Electron app startup through the project launcher
- Windows NSIS packaging through `electron-builder`
- packaged shell executable resolution from installed resources
- release output written to `release/`

## Quick Start

From the repository root:

```powershell
cd terminal-app
npm install
npm run dev
```

Production-style build and launch:

```powershell
cd terminal-app
npm run build
npm run start
```

Windows installer build:

```powershell
cd terminal-app
npm run dist:win
```

## Notes

- the dev app launches the shell from the repository root
- the packaged app launches the bundled shell from installed resources and starts in the user home directory
- the terminal UI accepts commands directly in the terminal surface; the bottom command palette has been removed
- the visible prompt label in the hosted terminal is `bolBhai>>`
- visible command output is labeled as `sunBhai>`
- the Electron launcher clears inherited `ELECTRON_RUN_AS_NODE` before startup so the runtime uses real Electron APIs
- if you bypass the npm launcher and start Electron manually, clear `ELECTRON_RUN_AS_NODE` first or use the project launcher instead
- theme and font controls now live on the right side of the working-directory header bar
- the top chrome is intentionally slimmed down to leave more room for terminal output
