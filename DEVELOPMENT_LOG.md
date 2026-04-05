# Mini Shell Development Log

This document records the major stages of the project from the initial version up to the current feature branch work. Each stage includes the related commit reference and the main features or modifications introduced at that point.

## Stage 1: Initial Shell Implementation

- Commit: `543435f` (`first commit`)
- Main files introduced:
  - `shell.c`
  - `myshell.exe`
  - `FEATURES.md`
- Relevant features added:
  - Interactive prompt loop
  - Prompt showing the current working directory
  - Built-in commands:
    - `help`
    - `exit`
    - `quit`
    - `cd <path>`
    - `pwd`
    - `ls`
    - `ls -l`
    - `cat <file>`
    - `mkdir <dir>`
    - `rmdir <dir>`
    - `rm <file>`
    - `cp <src> <dest>`
    - `mv <src> <dest>`
    - `touch <file>`
    - `clear`
  - Fallback command execution through `cmd.exe /C`
  - Basic whitespace trimming
  - Basic quoted-path handling for commands like `cd "My Folder"`

## Stage 2: Source File Rename

- Commit: `005936a` (`change name to myshell.c`)
- Main modification:
  - Renamed `shell.c` to `myshell.c`
- Relevant impact:
  - Standardized the project source filename to match the shell name

## Stage 3: Project Documentation Added

- Commit: `a12e000` (`add README.md`)
- Main files introduced:
  - `README.md`
- Relevant additions:
  - GitHub-ready project overview
  - Current feature summary
  - Missing feature summary
  - Build instructions
  - Run instructions
  - Example shell session
  - Future improvement notes

## Stage 4: README Corrected for Renamed Source File

- Commit: `0cf918c` (`Update README for myshell source rename`)
- Main modification:
  - Updated documentation references from `shell.c` to `myshell.c`
- Relevant updates:
  - Fixed source file mention in project file list
  - Fixed build command to compile `myshell.c`
  - Fixed example output in README

## Stage 5: v2 Milestone on Feature Branch

- Commit: `adb7886` (`Add v2 history and shell operator support`)
- Branch:
  - `feature/v2-pipes-redirection`
- Main files updated:
  - `myshell.c`
  - `README.md`
  - `FEATURES.md`
  - `myshell_v2.exe`
- Relevant features added:
  - `history` built-in command
  - In-memory command history storage
  - Detection of shell operators:
    - `|`
    - `<`
    - `>`
    - `>>`
  - Commands containing those operators are passed through `cmd.exe /C`
  - Console output flush before launching external commands
  - Versioned executable output: `myshell_v2.exe`
- Relevant behavioral improvement:
  - The project started using versioned executables for milestone builds

## Stage 6: v3 Milestone on Feature Branch

- Commit: `223afbc` (`Add v3 history expansion support`)
- Branch:
  - `feature/v2-pipes-redirection`
- Main files updated:
  - `myshell.c`
  - `README.md`
  - `FEATURES.md`
  - `myshell_v3.exe`
- Relevant features added:
  - `!!` to rerun the previous command
  - `!n` to rerun a numbered command from history
  - Help text updated to document history expansion
  - Shell startup banner versioning through `SHELL_VERSION`
  - Versioned executable output: `myshell_v3.exe`
- Relevant behavioral improvement:
  - History expansion became part of the interactive shell flow instead of being documentation-only

## Stage 7: v4 Milestone on Feature Branch

- Commit:
  - Pending at the time of writing this update step; commit created in the current v4 workflow
- Branch:
  - `feature/v2-pipes-redirection`
- Main files updated:
  - `myshell.c`
  - `FEATURES.md`
  - `DEVELOPMENT_LOG.md`
  - `myshell_v4.exe`
- Relevant features added:
  - Arrow-key input with basic line editing
  - Left and right cursor movement while editing the current command line
  - Up and down arrow history navigation during input
  - Home, End, Backspace, and Delete support in the interactive editor
  - Better quoted argument parsing for built-in commands
  - Correct handling for built-ins using paths with spaces, for example:
    - `touch "alpha beta.txt"`
    - `cp "old name.txt" "new name.txt"`
    - `mkdir "temp dir"`
- Relevant testing performed:
  - Built cleanly as `myshell_v4.exe`
  - Verified quoted-path behavior for `touch`, `cat`, `cp`, `mv`, `mkdir`, `rmdir`, `cd`, and `pwd`
  - Arrow-key behavior was implemented for interactive console input, but not fully automatable in the current non-interactive test harness

## Stage 8: v5 Milestone on Feature Branch

- Commit:
  - Pending at the time of writing this update step; commit created in the current v5 workflow
- Branch:
  - `feature/v2-pipes-redirection`
- Main files updated:
  - `myshell.c`
  - `FEATURES.md`
  - `DEVELOPMENT_LOG.md`
  - `README.md`
  - `VERSIONING_METHOD.md`
  - `WORKFLOW.md`
  - `myshell_v5.exe`
- Relevant features added:
  - Tab completion for files and directories in the interactive console
  - Completion listing when multiple matching names are found
  - Better `ls` option handling
  - Support for combined flags such as `-la` and `-al`
  - Support for separated flags such as `-l -a`
  - Rejection of unsupported `ls` flags with a clear error
- Relevant testing performed:
  - Built cleanly as `myshell_v5.exe`
  - Verified `ls`, `ls -l`, `ls -a`, `ls -la`, `ls -al`, `ls -l .`, `ls -a .`, and invalid flag handling
  - Tab completion was implemented for interactive console input, but not fully automatable in the current non-interactive test harness

## Stage 9: v6 Milestone on Feature Branch

- Commit:
  - Pending at the time of writing this update step; commit created in the current v6 workflow
- Branch:
  - `feature/v2-pipes-redirection`
- Main files updated:
  - `myshell.c`
  - `FEATURES.md`
  - `DEVELOPMENT_LOG.md`
  - `README.md`
  - `myshell_v6.exe`
- Relevant features added:
  - Environment variable expansion for `%VAR%` and `$VAR`
  - Native output redirection using `>`
  - Native append redirection using `>>`
  - Native input redirection using `<`
  - Native simple pipeline support using `|`
  - Pipeline execution between shell built-ins and standard external commands
  - External commands now run inside the shell execution path with inherited redirected handles
- Relevant testing performed:
  - Built cleanly as `myshell_v6.exe`
  - Verified `%USERPROFILE%` and `$USERPROFILE` expansion
  - Verified `pwd > file`, `echo ... > file`, `echo ... >> file`, and `findstr ... < file`
  - Verified pipelines such as `ls | findstr README` and `echo hello world | findstr hello`
  - Found and fixed a child-process stdio handle inheritance bug during testing

## Stage 10: Repository Reorganization For Shell Core Separation

- Commit:
  - `26ac9ca` (`Reorganize repo into shell-core and app concept folders`)
- Branch:
  - `feature/v2-pipes-redirection`
- Main files updated:
  - moved `myshell.c` to `shell-core/myshell.c`
  - moved all shell executables into `shell-core/`
  - updated `README.md`
  - updated `DEVELOPMENT_LOG.md`
  - updated `VERSIONING_METHOD.md`
  - updated `terminal-app/README.md`
  - added and tracked `concepts/` docs
- Relevant changes:
  - introduced `shell-core/` as the dedicated home for the shell engine
  - kept root-level docs at the repository root
  - preserved `terminal-app/` and `concepts/` as sibling project areas
  - cleaned the repository layout ahead of desktop app development
- Relevant testing performed:
  - rebuilt the shell from `shell-core/myshell.c`
  - verified the versioned executable still runs from its new location
  - confirmed documentation and project structure were updated to match the move

## Stage 11: Terminal App Startup Fix And Launch Verification

- Commit:
  - Pending at the time of writing this update step; commit created in the current terminal-app workflow
- Branch:
  - `feature/v2-pipes-redirection`
- Main files updated:
  - `terminal-app/electron/main.cjs`
  - `terminal-app/electron/preload.cjs`
  - `terminal-app/package.json`
  - `terminal-app/scripts/electron-launch.cjs`
  - `terminal-app/README.md`
  - `README.md`
  - `FEATURES.md`
  - `DEVELOPMENT_LOG.md`
- Relevant changes:
  - identified the Electron startup blocker as an inherited global `ELECTRON_RUN_AS_NODE=1` environment variable in the local shell session
  - restored the standard Electron runtime imports in the main and preload processes
  - added a dedicated Electron launcher script that clears `ELECTRON_RUN_AS_NODE` before booting the app
  - added a stable `npm run start` entrypoint for production-style Electron launch verification
  - started the `myshell_v6.exe` child process when the window finishes loading so the shell bridge is available as soon as the app is ready
- Relevant testing performed:
  - rebuilt the renderer successfully with `npm run build`
  - verified the Electron app stayed running when launched through the new launcher with no stderr output
  - verified a live `myshell_v6.exe` child process was started by the desktop app during launch

## Stage 12: Concept A Startup Sequence And Support Panel

- Commit:
  - Pending at the time of writing this update step; commit created in the current terminal-app workflow
- Branch:
  - `feature/v2-pipes-redirection`
- Main files updated:
  - `terminal-app/src/App.tsx`
  - `terminal-app/src/styles.css`
  - `terminal-app/MILESTONES.md`
  - `terminal-app/README.md`
  - `FEATURES.md`
  - `DEVELOPMENT_LOG.md`
- Relevant changes:
  - added a cinematic boot overlay with staged startup progress
  - reworked the renderer into a two-column Concept A layout with a right-side support panel
  - surfaced runtime metadata, quick command hints, and recent command history outside the terminal pane
  - preserved the main terminal surface as the primary workspace while adding the missing support context from Concept A
- Relevant testing performed:
  - rebuilt the renderer successfully with `npm run build`
  - verified the Electron app stayed running after the milestone 5 UI changes
  - verified a live `myshell_v6.exe` child process still launched correctly during startup

## Stage 13: Concept A Settings Strip And Runtime Polish

- Commit:
  - Pending at the time of writing this update step; commit created in the current terminal-app workflow
- Branch:
  - `feature/v2-pipes-redirection`
- Main files updated:
  - `terminal-app/electron/main.cjs`
  - `terminal-app/src/App.tsx`
  - `terminal-app/src/styles.css`
  - `terminal-app/src/vite-env.d.ts`
  - `terminal-app/MILESTONES.md`
  - `terminal-app/README.md`
  - `FEATURES.md`
  - `DEVELOPMENT_LOG.md`
- Relevant changes:
  - added persistent theme intensity and terminal font scale controls
  - added a bottom status strip with runtime metadata and a working-directory mirror
  - surfaced launch cwd metadata from the Electron main process into the renderer
  - added a best-effort current-directory mirror that tracks shell `cd` commands in the app UI
  - refined the visual polish so the first complete Concept A pass is in place
- Relevant testing performed:
  - rebuilt the renderer successfully with `npm run build`
  - verified the Electron app stayed running after the milestone 6 changes
  - verified a live `myshell_v6.exe` child process still launched correctly during startup

## Stage 14: True Shell Cwd Synchronization

- Commit:
  - Pending at the time of writing this update step; commit created in the current terminal-app workflow
- Branch:
  - `feature/v2-pipes-redirection`
- Main files updated:
  - `shell-core/myshell.c`
  - `shell-core/myshell_v6.exe`
  - `terminal-app/electron/main.cjs`
  - `terminal-app/electron/preload.cjs`
  - `terminal-app/src/App.tsx`
  - `terminal-app/src/vite-env.d.ts`
  - `terminal-app/MILESTONES.md`
  - `terminal-app/README.md`
  - `FEATURES.md`
  - `DEVELOPMENT_LOG.md`
- Relevant changes:
  - added a machine-readable cwd control line from the shell so the app can receive exact working-directory updates
  - filtered cwd control messages in the Electron main process and routed them to the renderer as a dedicated IPC event
  - removed the renderer-side cwd guessing logic in favor of true shell-reported synchronization
  - updated the terminal app UI and docs to reflect exact cwd synchronization
- Relevant testing performed:
  - rebuilt `shell-core/myshell_v6.exe`
  - verified the shell emits cwd control lines during startup and after directory changes
  - rebuilt the renderer successfully with `npm run build`
  - verified the Electron app stayed running and still launched a live `myshell_v6.exe` child process

## Current State Summary (Release Prep)

- Main branch latest documented commit:
  - `0cf918c`
- Feature branch latest commit:
  - `507de5c`
- Current feature branch:
  - `feature/v2-pipes-redirection`
- Current versioned executables present:
  - `shell-core/myshell.exe`
  - `shell-core/myshell_v2.exe`
  - `shell-core/myshell_v3.exe`
  - `shell-core/myshell_v4.exe`
  - `shell-core/myshell_v5.exe`
  - `shell-core/myshell_v6.exe`

## Features Still Not Implemented

- Background jobs
- Linux-style wildcard or glob expansion inside built-ins
- Linux-style `${VAR}` expansion
- Native built-in input streaming from redirected stdin

## Stage 15: Production UI Branding And Terminal Output Formatting

- Commit:
  - Current local main branch work after the terminal-app MVP merge
- Branch:
  - `main`
- Main files updated:
  - `shell-core/myshell.c`
  - `shell-core/myshell_v6.exe`
  - `terminal-app/electron/main.cjs`
  - `terminal-app/src/App.tsx`
  - `terminal-app/src/styles.css`
  - `terminal-app/README.md`
  - `README.md`
  - `FEATURES.md`
  - `DEVELOPMENT_LOG.md`
- Relevant changes:
  - renamed the visible desktop app branding to `apnaShell`
  - changed the visible shell prompt label to `bolBhai>>`
  - changed visible output labeling to `sunBhai>`
  - added a centered welcome banner inside the terminal surface
  - added a boxed working-directory indicator in the terminal section header
  - fixed prompt/output ordering issues in the Electron shell bridge
  - aligned multiline output formatting in the hosted terminal
  - adjusted titlebar branding, status lights, and laptop-friendly default window sizing
- Relevant testing performed:
  - rebuilt `shell-core/myshell_v6.exe`
  - rebuilt the renderer successfully with `npm run build`
  - verified the Electron app still launches and the shell bridge remains active

## Stage 16: Terminal Viewport Height Fix

- Commit:
  - Pending at the time of writing this update step; local workspace fix before installer packaging
- Branch:
  - `main`
- Main files updated:
  - `terminal-app/src/App.tsx`
  - `terminal-app/src/styles.css`
  - `FEATURES.md`
  - `DEVELOPMENT_LOG.md`
  - `installation/INSTALLER_CREATION_LOG.md`
- Relevant changes:
  - tightened the root and terminal layout height chain so the xterm surface stays within the visible app window
  - added a resize observer and post-layout refit so the terminal recomputes its visible rows after UI changes
  - documented the viewport fix before continuing with installer packaging work
- Relevant testing performed:
  - pending renderer build verification after the viewport height fix
  - expected outcome is that long output remains scrollable and the lowest lines stay visible inside the app window

## Stage 17: Terminal-Only Input And Header Controls

- Commit:
  - Pending at the time of writing this update step; local workspace UI refinement before installer packaging
- Branch:
  - `main`
- Main files updated:
  - `terminal-app/src/App.tsx`
  - `terminal-app/src/styles.css`
  - `terminal-app/README.md`
  - `FEATURES.md`
  - `DEVELOPMENT_LOG.md`
- Relevant changes:
  - removed the bottom command palette so command entry now happens only in the terminal surface
  - removed the lower dock and moved theme/font controls into the working-directory header bar
  - trimmed the top chrome padding so the output terminal gets more visible height without shrinking the controls themselves
  - kept cwd visible in one place only, on the left side of the header bar
- Relevant testing performed:
  - rebuilt the renderer successfully with `npm run build`
  - verified the updated layout compiles cleanly after removing the bottom control area

## Stage 18: Cursor Visibility And Bottom Anchoring Fix

- Commit:
  - Pending at the time of writing this update step; local workspace fix before installer packaging
- Branch:
  - `main`
- Main files updated:
  - `terminal-app/src/App.tsx`
  - `terminal-app/src/styles.css`
  - `FEATURES.md`
  - `DEVELOPMENT_LOG.md`
  - `installation/INSTALLER_CREATION_LOG.md`
- Relevant changes:
  - separated the padded terminal wrapper from the xterm host so fit calculations use the real drawable host area
  - forced prompt and output writes to auto-scroll to the bottom to keep the active cursor visible
  - focused the terminal whenever a prompt is rendered so cursor blinking remains stable across repeated command cycles
- Relevant testing performed:
  - pending live-session verification with multiple command rounds and long output runs
  - expected outcome is that the cursor remains visible at the bottom and keeps blinking after repeated commands

## Stage 19: Distinct Theme Palettes

- Commit:
  - Pending at the time of writing this update step; local workspace UI theming refinement before installer packaging
- Branch:
  - `main`
- Main files updated:
  - `terminal-app/src/App.tsx`
  - `terminal-app/src/styles.css`
  - `FEATURES.md`
  - `DEVELOPMENT_LOG.md`
- Relevant changes:
  - replaced intensity-only theme switching with full per-theme token sets for Soft, Standard, and Surge
  - applied separate background, panel, accent, and control styling per theme mode through CSS variables
  - applied separate xterm color palettes per theme mode so terminal foreground, cursor, and ANSI colors visibly change with theme selection
- Relevant testing performed:
  - rebuilt the renderer successfully with `npm run build`
  - verified TypeScript and stylesheet diagnostics remain clean after the theming refactor

## Current State Summary

- Active branch:
  - `main`
- Current shell executable target:
  - `shell-core/myshell_v6.exe`
- Current visible shell/app labels:
  - app brand: `apnaShell`
  - prompt label: `bolBhai>>`
  - output label: `sunBhai>`
- Current major verified flows:
  - native shell build
  - renderer production build
  - Electron startup and shell bridge
