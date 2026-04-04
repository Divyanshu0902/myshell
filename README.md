# Mini Shell for Windows

A simple custom mini shell written in C that runs on Windows and keeps several commands similar to a Linux shell.

This project is meant as a small learning-oriented shell implementation. It provides an interactive prompt, a set of built-in Unix-like commands, and a fallback path that runs unsupported commands through `cmd.exe /C`.

Builds are versioned as separate executables such as `myshell_v2.exe`, `myshell_v3.exe`, and so on as new milestones are implemented.

The repository is now organized into dedicated areas:

- `shell-core/` for the shell engine and shell executables
- `terminal-app/` for the future desktop app
- `concepts/` for terminal app concept docs

## Current Features

- Interactive shell prompt
- Prompt displays the current working directory
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
- `terminal-app/` - future dedicated desktop terminal app
- `concepts/` - concept docs for the terminal app directions
- `FEATURES.md` - quick feature status document
- `DEVELOPMENT_LOG.md` - version-by-version project change log
- `VERSIONING_METHOD.md` - project versioning approach
- `WORKFLOW.md` - fixed implementation workflow

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
myshell:D:\Projects\myShell$ pwd
D:\Projects\myShell

myshell:D:\Projects\myShell$ history
   1  pwd
   2  history

myshell:D:\Projects\myShell$ ls
shell-core/
terminal-app/
concepts/
README.md
FEATURES.md

myshell:D:\Projects\myShell$ help
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
