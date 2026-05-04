# Parametric Glass Door Editor

A web-based 3D editor to design, visualize, and customize architectural glass doors with real-time dimension controls and hardware profile selection. Built with React, Three.js, and modern UI tooling.

## Features

- **Real-Time 3D Preview:** Rotate, zoom, and explore your glass door in 3D.
- **Parametric Controls:** Adjust width (500–1500 mm) and height (1000–2500 mm) with sliders or numeric input.
- **Hardware Profiles:** Toggle between different patch or frame hardware styles.
- **Glass Types:** Choose glass finish (clear, frosted, tinted).
- **Dimension Lines:** See technical dimensions with accurate millimeter annotation.
- **Interactive UI:** Responsive controls and clean info panel.
- **Modern UI:** Drag, scroll, and touch-friendly, designed for desktop & mobile.

## Getting Started

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Run The App

```bash
npm run dev
# or
yarn dev
```
Then visit [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build For Production

```bash
npm run build
# or
yarn build
```

## File Structure

- `src/Editor.tsx` - Main editor UI and logic.
- `src/GlassDoor.tsx` - 3D glass door and hardware models.
- `src/DimensionLines.tsx` - Technical dimension overlays.
- `src/Hardware.tsx` - Patch/frame hardware 3D components.
- `index.html` - App entry point.

## Tech Stack

- [React](https://react.dev/)
- [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) (Three.js React renderer)
- [@react-three/drei](https://docs.pmnd.rs/drei/introduction)
- [Lucide](https://lucide.dev/icons/) (icon set for UI)
- [Vite](https://vitejs.dev/) (dev server & build tool)
- [Tailwind CSS](https://tailwindcss.com/) (utility-first styling)

## Usage

1. Use the sliders or input boxes to set the glass door's width and height.
2. Select hardware profile and glass finish.
3. Rotate or zoom the 3D view using mouse or touch gestures.
4. Dimension lines update automatically as you edit.

## License

MIT

## Credits

Inspired by parametric design workflows in architecture and glass engineering.

---

**Enjoy designing your next project!**