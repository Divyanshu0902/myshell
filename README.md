# apnaShell

`apnaShell` is a custom Windows shell written in C, paired with a dedicated Electron desktop terminal host.

The shell provides a Linux-like command set on Windows, while the desktop app provides the branded terminal UI, prompt/output formatting, and working-directory aware chrome.

Builds are versioned as separate executables such as `myshell_v2.exe`, `myshell_v3.exe`, and so on as new milestones are implemented.

The repository is organized into:

- `shell-core/` for the shell engine and shell executables
- `terminal-app/` for the Electron desktop terminal app
- `concepts/` for terminal app concept docs

## Current Features

- Interactive shell prompt
- Current shell prompt label: `bolBhai>>`
- Built-in commands:
  - `help`
  - `exit`
  - `quit`
  - `cd <path>`
  - `pwd`
  - `history`
  - `!!`
  - `!n`
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
- Basic trimming of extra whitespace
- Basic quoted path handling for commands such as `cd "My Folder"`
- Arrow-key input with basic line editing in the interactive console
- Tab completion for files and directories in the interactive console
- Better quoted argument parsing for built-in commands with spaced paths
- Better `ls` option handling including combined flags like `-la`
- Environment variable expansion for `%VAR%` and `$VAR`
- Native simple pipeline support using `|`
- Native redirection support using `>`, `>>`, and `<`
- External command execution through `cmd.exe /C` within the shell execution engine
- Machine-readable cwd control line for the desktop app shell bridge
- Dedicated Electron desktop terminal app with:
  - branded `bolBhai>>` prompt rendering
  - `sunBhai>` output labeling
  - centered welcome banner in the terminal
  - boxed working-directory indicator in the terminal header
  - custom frameless app chrome

## Not Implemented Yet

- Background jobs
- Wildcard or glob expansion like `*.txt` inside built-in commands
- Linux-style `${VAR}` expansion
- Native built-in input streaming from redirected stdin

## Project Structure

- `shell-core/myshell.c` - main source code for the shell
- `shell-core/myshell.exe` - early shell executable
- `shell-core/myshell_v2.exe` - versioned executable for the v2 milestone
- `shell-core/myshell_v3.exe` - versioned executable for the v3 milestone
- `shell-core/myshell_v4.exe` - versioned executable for the v4 milestone
- `shell-core/myshell_v5.exe` - versioned executable for the v5 milestone
- `shell-core/myshell_v6.exe` - versioned executable for the current v6 milestone
- `terminal-app/` - dedicated desktop terminal app
- `concepts/` - concept docs for the terminal app directions
- `FEATURES.md` - quick feature status document
- `DEVELOPMENT_LOG.md` - version-by-version project change log
- `VERSIONING_METHOD.md` - project versioning approach
- `WORKFLOW.md` - fixed implementation workflow

## Terminal App

The desktop app lives in `terminal-app/` and launches through a dedicated Electron bootstrap that clears inherited `ELECTRON_RUN_AS_NODE` state before startup.

Build and launch it from the repository root with:

```powershell
cd terminal-app
npm install
npm run build
npm run start
```

To build the Windows installer from the terminal app folder:

```powershell
cd terminal-app
npm run dist:win
```

The installer output is written to `terminal-app/release/` and includes the packaged shell executable.

## Requirements

- Windows
- A C compiler such as MinGW GCC

## Build

If you have `gcc` installed:

```powershell
gcc -Wall -Wextra -std=c11 shell-core/myshell.c -o shell-core/myshell_v6.exe
```

## Run

```powershell
.\shell-core\myshell_v6.exe
```

## Example Session

```text
bolBhai>> pwd
D:\Projects\myShell

bolBhai>> history
   1  pwd
   2  history

bolBhai>> ls
shell-core/
terminal-app/
concepts/
README.md
FEATURES.md

bolBhai>> help
```

## Notes

- This shell is not a full replacement for Bash, Zsh, PowerShell, or CMD.
- Built-in commands are implemented directly in C for a more Linux-like feel on Windows.
- External commands are launched through `cmd.exe /C` while redirection and simple pipelines are coordinated by the shell itself.

## Future Improvements

- Add wildcard expansion for built-ins
- Add background job execution
- Add Linux-style `${VAR}` expansion
- Support recursive file operations and more Unix-style flags

## License

You can add a license here before publishing to GitHub. The common choice is the MIT License.

