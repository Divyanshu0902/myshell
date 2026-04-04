# Terminal App Project

This folder is for the next part of the project: the dedicated desktop terminal application for `myshell`.

The shell engine and the terminal app should now be treated as two related but separate layers:

- `shell-core/myshell.c` and versioned executables in `shell-core/` are the shell core
- this `terminal-app` folder will contain the desktop application that hosts and displays the shell

Implementation progress is tracked in:

- `terminal-app/MILESTONES.md`

## Selected Product Direction

The terminal app will be built according to:

- Concept A: Minimal Neon Terminal

Reference:

- `concepts/A/README.md`

## Agreed Initial Build Direction

The first implementation milestone for the terminal app should focus on:

1. Desktop app scaffold
2. Shell process integration
3. Terminal renderer
4. Cyberpunk visual foundation

## Initial Feature Plan

## 1. Desktop App Scaffold

Purpose:

- create the application structure for the dedicated terminal app
- establish the desktop runtime and frontend stack
- set up the project so future UI work is clean and modular

Planned stack:

- `Electron`
- `React`
- `TypeScript`
- `Vite`

Expected outcome:

- a runnable desktop shell app project
- custom window shell
- clear separation between main process and renderer process

## 2. Shell Process Integration

Purpose:

- run the `myshell` executable inside the app
- connect the app UI to the shell process
- allow the app to function as the visual host for the shell

Expected behavior:

- launch `shell-core/myshell_v6.exe` or the selected shell build
- send user input from the app into the shell process
- render shell stdout and stderr inside the app

## 3. Terminal Renderer

Purpose:

- provide a proper terminal interface inside the desktop app
- avoid building terminal rendering from scratch

Planned technology:

- `xterm.js`

Expected outcome:

- shell output displayed inside a real terminal surface
- keyboard input routed into the shell
- terminal area becomes the main interaction zone

## 4. Cyberpunk Visual Foundation

Purpose:

- establish the visual identity of the app early
- avoid ending up with a generic unstyled terminal wrapper

Visual direction:

- matte black background
- neon cyan primary glow
- magenta secondary accents
- subtle scanline/grid treatment
- sharp borders and futuristic panel styling
- custom app chrome

Expected outcome:

- a clean and modern cyberpunk base theme
- reusable visual tokens and styles
- a terminal app that already feels like the intended product

## What Is Deliberately Deferred

These are not part of the first implementation milestone:

- side support panel
- cinematic startup splash
- advanced settings
- tabs and split panes
- workstation-style multi-panel layout
- sci-fi command deck features

These can be added after the shell host app is running well.

## Goal Of This Folder

This folder should become the home for:

- desktop app source code
- app-specific assets
- app-specific docs
- future terminal UI iterations for Concept A


## Current Implementation Status

The first implementation milestone is now working end to end.

Implemented and verified:

- Electron app shell
- React + TypeScript + Vite frontend scaffold
- Electron preload bridge
- child-process launch path for `shell-core/myshell_v6.exe`
- `xterm.js` renderer integration
- first-pass Concept A cyberpunk interface
- production renderer build verified with `npm run build`
- Electron desktop launch verified through the project launcher
- shell bridge verified with a live `myshell_v6.exe` child process during app startup

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

Expected shell target:

- `../shell-core/myshell_v6.exe`

## Notes For Current State

- the app is designed to launch the shell from the repository root
- the terminal UI includes a local prompt/input layer because the shell is being hosted over standard process pipes rather than a native TTY session
- the Electron launcher clears any inherited `ELECTRON_RUN_AS_NODE` value before startup so the runtime uses the real Electron APIs
- if you bypass the npm launcher and start Electron manually, clear `ELECTRON_RUN_AS_NODE` first or use the project launcher instead



