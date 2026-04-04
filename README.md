# Mini Shell for Windows

A simple custom mini shell written in C that runs on Windows and keeps several commands similar to a Linux shell.

This project is meant as a small learning-oriented shell implementation. It provides an interactive prompt, a set of built-in Unix-like commands, and a fallback path that runs unsupported commands through `cmd.exe /C`.

Builds are versioned as separate executables such as `myshell_v2.exe`, `myshell_v3.exe`, and so on as new milestones are implemented.

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
- Pipe and redirection detection for commands containing `|`, `<`, `>`, and `>>`
- Fallback execution for other commands using `cmd.exe /C`

## Not Implemented Yet

- Arrow-key navigation
- Tab completion
- Background jobs
- Environment variable expansion like `$HOME`
- Wildcard or glob expansion like `*.txt` inside built-in commands
- Native built-in support inside pipelines and redirection

## Project Files

- `myshell.c` - main source code for the shell
- `myshell_v2.exe` - versioned executable built from the current v2 milestone
- `FEATURES.md` - quick feature status document

## Requirements

- Windows
- A C compiler such as MinGW GCC

## Build

If you have `gcc` installed:

```powershell
gcc -Wall -Wextra -std=c11 myshell.c -o myshell_v2.exe
```

## Run

```powershell
.\myshell_v2.exe
```

## Example Session

```text
myshell:D:\Projects\myShell$ pwd
D:\Projects\myShell

myshell:D:\Projects\myShell$ ls
myshell.c
myshell_v2.exe
README.md
FEATURES.md

myshell:D:\Projects\myShell$ help
```

## Notes

- This shell is not a full replacement for Bash, Zsh, PowerShell, or CMD.
- Built-in commands are implemented directly in C for a more Linux-like feel on Windows.
- Commands that are not built in are passed to `cmd.exe /C`.

## Future Improvements

- Add piping and redirection
- Add native built-in support for piping and redirection
- Add arrow-key editing
- Add tab completion
- Improve parsing for quoted arguments
- Support recursive file operations and more Unix-style flags

## License

You can add a license here before publishing to GitHub. The common choice is the MIT License.
