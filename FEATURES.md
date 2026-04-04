# Mini Shell Feature Status

## Features Added So Far

- Interactive prompt loop
- Prompt shows current working directory
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
- Fallback execution for other commands through `cmd.exe /C`
- Pipe and redirection detection for commands using `|`, `<`, `>`, and `>>`
- Basic trimming of whitespace
- Basic quoted path handling for single-path commands like `cd "My Folder"`

## Features Not Yet Added

- Arrow-key navigation
- Tab completion
- Background jobs
- Environment variable expansion like `$HOME`
- Linux-style wildcard or glob expansion like `*.txt` inside built-ins
- Native built-in support inside pipelines, for example `ls | ...`
- Native built-in support with input and output redirection
