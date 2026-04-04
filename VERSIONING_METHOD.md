# Versioning Method

This project will use Git-based versioning instead of keeping multiple copied source-code folders for each version.

## Core Rule

- Maintain one active source file path for development, for example `myshell.c`
- Use Git commits, branches, and tags to represent project history and released versions
- Do not create separate source-code copies for each version as the primary versioning method

## Why This Method Is Used

- It avoids duplicated source code
- It keeps bug fixes and new features in one maintainable code path
- It makes it easier to compare versions using Git history
- It supports clean rollback and traceability
- It scales better as the project grows to more versions

## How Versions Will Be Represented

- Source code version history:
  - Git commits
  - Feature branches
  - Optional Git tags such as `v1`, `v2`, `v3`, `v4`
- Built executable history:
  - Versioned executables such as `myshell_v2.exe`, `myshell_v3.exe`, `myshell_v4.exe`
- Documentation history:
  - Shared evolving docs such as `README.md`, `FEATURES.md`, and `DEVELOPMENT_LOG.md`
  - Optional version-specific docs can be added later if needed

## What Will Not Be Done

- No separate source-code folders like `v1/`, `v2/`, `v3/` each containing copied C source as the main workflow
- No manual file-copy versioning as a replacement for Git history

## Practical Project Rule

For each new version:

- update the single active codebase
- build the next versioned executable
- record the changes in project documentation
- commit the changes in Git
- push the branch to GitHub

This keeps the repository clean while still preserving version-by-version history.
