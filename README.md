# Wonderful-Color

[English](./README.md) | [中文](./README_zh.md)

A simple yet interactive color palette generator built with Vue 3 (Composition API) and chroma.js.

## Overview

Wonderful-Color is a lightweight web tool for generating and exploring color palettes. It supports dynamic palette generation, color locking, and automatic contrast adjustment for readability.

Inspired by tools like Coolors, this project focuses on simplicity, interactivity, and learning modern frontend concepts through hands-on implementation.

## Features

- Generate color palettes with a single click or by pressing the Space key
- Lock specific colors to keep them unchanged during regeneration
- Intelligent palette generation:
  - Gradient or complementary colors when no colors are locked
  - Harmonized colors based on locked hues
- Automatic text color adjustment using brightness (YIQ algorithm)
- Responsive full-screen layout with vertical color strips
- Copy-friendly color display (hex values visible)

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

- When no colors are locked:
  - Randomly generates either:
    - A gradient scale between two colors
    - A complementary color pair
  - Uses `chroma.scale(...).mode('lch')` for perceptually smooth transitions

- When colors are locked:
  - Uses the first locked color as a base
  - Generates new colors by slightly varying:
    - Hue (±20° range)
    - Saturation and lightness (small random offsets)

### Contrast Handling

Text color is determined using the YIQ brightness formula:
```

Y = (R * 299 + G * 587 + B * 114) / 1000

```
- Y ≥ 128 → black text
- Y < 128 → white text

## Usage

1. Open the page in a browser
2. Press Space or click "Refresh Colors" to generate a new palette
3. Click the lock icon to fix a color
4. Generate again to explore variations

## Future Improvements

- Copy color to clipboard on click
- Support multiple locked colors as gradient anchors
- Export palette (JSON / CSS variables)
- Drag-and-drop reordering
- Keyboard shortcuts for advanced control
- Migration to Vite + component-based architecture

## License

MIT