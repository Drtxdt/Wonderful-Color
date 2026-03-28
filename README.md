# Wonderful-Color

[English](./README.md) | [中文](./README_zh.md)

A simple yet interactive color palette generator built with Vue 3 (Composition API) and chroma.js.

## Overview

Wonderful-Color is a lightweight web tool for generating and exploring color palettes. It supports dynamic palette generation, color locking, and automatic contrast adjustment for readability.

Inspired by tools like Coolors, this project focuses on simplicity, interactivity, and learning modern frontend concepts through hands-on implementation.

## Features

- Generate color palettes with a single click or by pressing the Space key
- Lock specific colors to keep them unchanged during regeneration
- Dual generation modes:
  - `Smart`: multi-strategy palette generation with scoring-based selection
  - `Gradient`: smooth interpolation mode inspired by classic Coolors-style flow
- Style profiles for generation (`Auto`, `Soft`, `Vivid`)
- Contrast-priority option to enforce stronger color separation
- Lock-aware generation:
  - Locked slots are treated as hard constraints
  - Unlocked slots are optimized around locked anchors
- Automatic text color adjustment using contrast ratio (black/white best choice)
- Responsive full-screen layout with vertical color strips
- URL hash synchronization for palette sharing and restore

## Demo

Deploy via GitHub Pages:
```

https://drtxdt.github.io/Wonderful-Color/

```
## Tech Stack

- Vue 3 (Composition API)
- chroma.js (color manipulation and interpolation)

## How It Works

### Palette Generation

The project uses two coexisting generation modes:

- Smart mode:
  - Builds multiple candidate palettes using harmony strategies:
    - analogous
    - complementary
    - split-complementary
    - triadic
    - tetradic
    - monochrome
    - hybrid
  - Scores each candidate by:
    - minimum pairwise color distance
    - hue distribution balance
    - lightness/saturation spread
    - readability penalty
  - Selects the best-scored candidate as output

- Gradient mode:
  - No locks: generates a smooth palette from either complementary endpoints or two random distant colors
  - With locks: performs segmented LCH interpolation between locked anchors and fills unlocked slots continuously
  - Applies lock constraints after generation and then optimizes unlocked slots

Both modes use `chroma.scale(...).mode('lch')` and lock-aware post-optimization.

### Contrast Handling

Text color is chosen by contrast ratio:
- Compare `contrast(background, black)` and `contrast(background, white)`
- Use whichever gives stronger readability

## Usage

1. Open the page in a browser
2. Press Space or click "Refresh Colors" to generate a new palette
3. Click the lock icon to fix a color
4. Generate again to explore variations

## Future Improvements

- Copy color to clipboard on click
- Export palette (JSON / CSS variables)
- Drag-and-drop reordering
- Keyboard shortcuts for mode/style switching
- Seeded random mode for fully reproducible palettes
- Palette history and favorites management

## License

Apache-2.0
