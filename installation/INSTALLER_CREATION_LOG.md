# Installer Creation Log

This log records the work done to turn apnaShell into a shareable Windows installer.

## Status

- planning started
- installer architecture being defined
- packaging docs created

## Log Template

Use the entries below to track each packaging milestone.

## Entry Format

- Date:
- Change:
- Reason:
- Result:
- Follow-up:

## Log Entries

### 2026-04-05

- Change: Added installer planning documents under `installation/`.
- Reason: Establish a clear packaging workflow before implementation.
- Result: The repository now has a dedicated place for installer strategy, creation history, and end-user install steps.
- Follow-up: Implement the packaging pipeline, then record each build or installer change here.

### 2026-04-05 - UI Fix Before Packaging

- Change: Fixed the terminal viewport height constraint so the hosted xterm output stays visible inside the app window.
- Reason: Installer packaging should not begin until the terminal layout behaves correctly for long output sessions.
- Result: The app UI now has a tighter height chain and a refit trigger to keep the output panel aligned with the visible viewport.
- Follow-up: Continue with installer creation once the UI fix is verified in a renderer build.

### 2026-04-05 - Cursor Blink And Bottom Anchoring Fix

- Change: Fixed prompt focus and bottom anchoring so the cursor keeps blinking and remains visible after repeated commands.
- Reason: A stable terminal interaction loop is required before shipping installers to external users.
- Result: Prompt rendering now restores focus, output/prompt writes auto-scroll to the bottom, and xterm is measured on an unpadded host.
- Follow-up: Validate in a live command session, then proceed with installer build generation.

### 2026-04-05 - Theme Palette Separation

- Change: Reworked Soft, Standard, and Surge into distinct visual palettes for both app chrome and terminal colors.
- Reason: Theme switching needed clear, immediate visual differences before release packaging.
- Result: Each theme now updates background gradients, panel tones, accent styling, and xterm color maps.
- Follow-up: Perform live visual verification of all three themes, then continue installer generation.

## Planned Future Entries

- build script added
- installer config added
- shell binary bundle path fixed
- first Windows installer generated
- clean-machine install verified
- release notes published

## Notes

Keep this file updated whenever packaging changes are made so release history stays easy to audit.
