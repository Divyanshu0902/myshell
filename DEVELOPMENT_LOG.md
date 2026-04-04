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

## Current State Summary

- Main branch latest documented commit:
  - `0cf918c`
- Feature branch latest commit:
  - `6901e1d`
- Current feature branch:
  - `feature/v2-pipes-redirection`
- Current versioned executables present:
  - `myshell.exe`
  - `myshell_v2.exe`
  - `myshell_v3.exe`
  - `myshell_v4.exe`
  - `myshell_v5.exe`
  - `myshell_v6.exe`

## Features Still Not Implemented

- Background jobs
- Linux-style wildcard or glob expansion inside built-ins
- Linux-style `${VAR}` expansion
- Native built-in input streaming from redirected stdin
