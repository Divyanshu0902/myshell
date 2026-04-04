# Concept A: Minimal Neon Terminal

## Status

- Selected as the current direction to build next

## Core Idea

Concept A is a focused desktop terminal app for `myshell` with a strong cyberpunk identity but restrained scope. The goal is to create one polished primary experience instead of building a heavy workstation immediately.

This concept keeps the shell front and center:

- one main terminal area
- one clean side panel for support information
- a cinematic startup experience
- a visually memorable but usable cyberpunk theme

## Product Vision

This app should feel like a premium modern shell launcher, not a generic terminal emulator.

The design language should feel:

- dark
- sharp
- neon-lit
- clean
- futuristic
- intentional

It should look like a tool a hacker, operator, or systems engineer would actually want to open every day.

## Recommended Tech Stack

## App Shell

- `Electron`

Why:

- easiest path for a custom desktop terminal app on Windows
- straightforward child-process integration with `myshell_v6.exe` or later builds
- strong ecosystem
- simple packaging for desktop use

## Frontend

- `React`
- `TypeScript`
- `Vite`

Why:

- fast UI iteration
- clean component structure
- easy theming and animation
- good fit for a visually custom terminal product

## Terminal Rendering

- `xterm.js`

Why:

- mature terminal rendering library
- supports terminal behaviors better than building from scratch
- visually customizable
- widely used

## Styling

- `Tailwind CSS` or CSS modules with custom variables

Preferred direction:

- use CSS variables for theme tokens
- use deliberate gradients, glow layers, borders, scanlines, and panel framing

## Window Effects

- custom title bar
- translucent panel effects where practical
- subtle animation using CSS transitions or a light motion library

## Visual Identity

## Palette Direction

Primary direction:

- matte black background
- deep graphite surfaces
- neon cyan primary accent
- magenta secondary accent
- restrained electric green for status states

Suggested color roles:

- background: near-black
- surface: charcoal / steel-black
- accent-primary: cyan
- accent-secondary: magenta
- success: neon green
- warning: amber
- error: red

## Typography

- UI font: futuristic geometric sans
- terminal font: monospace with high readability

Possible pairing direction:

- UI: Orbitron / Space Grotesk / Exo 2
- terminal: JetBrains Mono / Cascadia Mono / IBM Plex Mono

## Main Features for This App

- boot splash screen
- main terminal pane
- shell process runner connected to `myshell`
- right-side auxiliary panel
- current session label
- shell version badge
- command history view
- small help panel for built-in commands
- settings for theme intensity and font scaling

## Layout Direction

## Main Screen

- top custom app bar
- left or center main terminal pane
- right narrow side panel
- bottom status strip

## Side Panel Contents

- shell version
- current concept name
- quick command hints
- recent commands
- current working directory if available later

## Motion Direction

- startup boot animation
- staggered panel reveal
- soft glow pulses on active states
- subtle cursor glow
- restrained scanline shimmer

## Things This Concept Should Avoid

- too many widgets
- excessive dashboard clutter
- fake sci-fi noise everywhere
- unreadable neon-on-neon combinations
- large CPU-heavy animation systems

## Why This Is The Best First Build

- lowest complexity among the three concepts
- fastest path to a real usable desktop app
- strong visual payoff
- keeps focus on the shell itself
- can later evolve into a larger workstation if desired

## Suggested Implementation Milestones

1. Create desktop app shell
2. Launch and embed `myshell` process
3. Render terminal output with `xterm.js`
4. Apply cyberpunk visual theme
5. Add startup splash and right-side panel
6. Add settings and polish

## Future Evolution

Concept A can later expand into:

- tabs
- split panes
- richer session tracking
- plugin-like utility panels

That future expansion could gradually move the app toward Concept B if desired.
