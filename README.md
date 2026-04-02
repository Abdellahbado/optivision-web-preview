# OptiVision

OptiVision is an optician management app built with **React + TypeScript + Vite** and prepared for both:
- **Web preview** (for client testing)
- **Tauri desktop packaging** (final app target)

## Development

```bash
bun install
bun run dev
```

## Production build

```bash
bun run build
```

Output directory: `dist/`

## Deploy to Vercel

This repo is configured for SPA deployment on Vercel (`vercel.json` rewrite to `index.html`).

### Required Vercel settings
- Build command: `bun run build`
- Output directory: `dist`

### Notes
- The app now runs fully in browser for demo/testing.
- `Liste verres` uses browser local storage in web mode so it works without Tauri SQL.
