# How to Install apnaShell

This guide is for friends or testers who want to install and use apnaShell on Windows.

## What You Need

- A Windows PC
- The apnaShell installer file
- Permission to install desktop applications on the machine

You do not need Node.js, npm, or a C compiler to use the installed app.

## Install Steps

1. Download the apnaShell installer from the shared release location.
2. Double-click the installer file.
3. If Windows shows a security prompt, choose the option to run the installer.
4. Follow the installation wizard.
5. Leave the default install location unless you have a reason to change it.
6. Finish the install and launch apnaShell.

## First Launch

When the app opens for the first time:

- wait for the boot screen to finish
- confirm the terminal window appears
- check that the working directory is visible
- type a simple command such as `pwd` or `help`

## What To Expect

The installed app should open a branded terminal window with:

- the `bolBhai>>` shell prompt
- the `sunBhai>` output style
- a working-directory display in the header
- a normal Windows app installer footprint

## If Something Goes Wrong

- If the installer will not open, try running it as administrator.
- If the app does not start, reinstall it and try again.
- If Windows warns about an unknown publisher, that is expected until the project is code-signed.
- If the terminal opens but commands fail, report the exact command and any error text.

## Uninstall

To remove apnaShell:

1. Open Windows Settings.
2. Go to installed apps or programs.
3. Find apnaShell.
4. Choose Uninstall.

## Notes For Testers

If you are testing a release build, verify these items:

- the app starts without developer tools installed
- the shell process launches correctly
- built-in commands work
- external commands still work
- the cwd display updates as expected
