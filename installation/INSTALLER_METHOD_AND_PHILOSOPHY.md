# Installer Creation Method and Philosophy

This document defines how apnaShell should be packaged for friends to install and use on Windows.

## Goal

The goal is to produce a single, easy-to-share Windows installer that includes:

- the Electron desktop terminal app
- the native shell executable
- the files needed for the app to run after installation

The installer should let a user download one file, run it, and start using apnaShell without needing Node.js, GCC, or source code access.

## Recommended Packaging Approach

The recommended approach is:

- build the native shell executable first
- build the Electron renderer and main process for production
- package the Electron app with a Windows installer target such as NSIS
- include the shell executable as part of the final app bundle

This is the simplest path because the current project already uses Electron as the desktop wrapper and keeps the shell in a separate executable.

## Philosophy

### 1. Keep the source of truth in one place

The installer should be a release artifact, not a second codebase. The real source of truth stays in:

- `shell-core/myshell.c`
- `terminal-app/`
- the repository documentation

### 2. Bundle, do not depend on the developer machine

A friend installing the app should not need:

- Node.js
- npm
- a C compiler
- Visual Studio build tools
- a repo checkout

Everything required to run should ship inside the installer or the installed app directory.

### 3. Make the runtime path stable

The Electron app should resolve the bundled shell binary from the installed app location, not from the repository path used during development.

### 4. Prefer reproducible builds

The packaging process should be repeatable so that the same inputs produce the same style of release output every time.

### 5. Keep release artifacts separate from source

Built installers and packaged binaries should be treated as release outputs. They should not replace the source tree.

### 6. Optimize for a clean Windows install experience

The installer should behave like a normal Windows desktop application installer:

- shortcut creation
- uninstall support
- predictable install location
- no manual setup after installation

## Suggested Technical Plan

- use `electron-builder` for packaging
- target Windows `nsis`
- copy `myshell_v6.exe` into the packaged app as an extra resource
- resolve the shell path from the installed app at runtime
- rebuild the shell executable before packaging each release

## Packaging Rules

- do not hardcode repo-relative shell paths in the released app
- do not assume the app is launched from the development folder
- do not require users to run terminal commands after installation
- do not make the installer depend on files outside the package

## Release Criteria

A release is acceptable when:

- the installer launches on a clean Windows machine
- the app opens without missing dependency errors
- the shell process starts successfully
- built-in shell commands work
- the cwd sync between shell and UI still works
- uninstall removes the app cleanly

## Long-Term Direction

If the project grows, the same method can support:

- automatic versioned installers
- code signing
- update channels
- release notes per build

The packaging strategy should remain simple until the project needs more advanced distribution.
