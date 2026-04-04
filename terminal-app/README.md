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
- local input layer for hosted shell interaction
- cwd synchronization from shell to app UI
- production renderer build with `npm run build`
- Electron app startup through the project launcher

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

## Notes

- the app launches the shell from the repository root
- the terminal UI includes a local prompt/input layer because the shell is hosted over standard process pipes rather than a native TTY session
- the visible prompt label in the hosted terminal is `bolBhai>>`
- visible command output is labeled as `sunBhai>`
- the Electron launcher clears inherited `ELECTRON_RUN_AS_NODE` before startup so the runtime uses real Electron APIs
- if you bypass the npm launcher and start Electron manually, clear `ELECTRON_RUN_AS_NODE` first or use the project launcher instead
