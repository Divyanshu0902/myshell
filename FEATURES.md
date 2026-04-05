# Mini Shell Feature Status

## Features Added So Far

- Interactive prompt loop
- Prompt label is `bolBhai>>`
- `help` command
- `exit` and `quit`
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
- `history`
- `!!` and `!n` history expansion
- Arrow-key input with basic line editing
- Better quoted argument parsing for built-in commands
- Tab completion for files and directories
- Better `ls` option handling with combined flags like `-la` and `-al`
- Environment variable expansion for `%VAR%` and `$VAR`
- Native simple pipeline support using `|`
- Native redirection support using `>`, `>>`, and `<`
- External command execution through `cmd.exe /C` inside the shell execution engine
- Basic trimming of whitespace
- Basic quoted path handling for single-path commands like `cd "My Folder"`
- Machine-readable cwd control line for the Electron app bridge

## Features Not Yet Added

- Background jobs
- Linux-style wildcard or glob expansion like `*.txt` inside built-ins
- Linux-style `${VAR}` expansion
- Native built-in input streaming from redirected stdin

## Terminal App Status

- Electron + React + TypeScript + Vite desktop app scaffold
- xterm.js terminal renderer with the current branded apnaShell UI
- Electron launcher script that clears inherited ELECTRON_RUN_AS_NODE before boot
- Verified Electron startup and myshell_v6.exe shell bridge inside the desktop app
- Branded `bolBhai>>` prompt rendering in the hosted terminal
- `sunBhai>` output labeling and aligned multiline output formatting
- Centered welcome banner rendered inside the terminal surface
- Boxed working-directory indicator in the terminal section header
- Constrained terminal viewport height so long output stays visible inside the app window
- Automatic terminal refit on resize and layout changes
- Terminal-only command input through the hosted xterm surface
- Removed the bottom command palette and lower dock controls
- Moved theme and font controls into the working-directory header bar
- Slimmed the top chrome to preserve more vertical space for output
- Prompt now auto-focuses and keeps cursor blinking during terminal-only command sessions
- Terminal output and prompt auto-scroll to bottom so the live cursor stays visible
- Soft, Standard, and Surge now use distinct full palettes across app chrome and terminal colors
