# Solomon Admin UI (Next.js static export)

Build tool for the local Solomon admin panel. Output is copied to `../Solomon.AdminUI/wwwroot/` and served by Kestrel as static files.

## Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Production build

```bash
npm run build
```

This runs `next build` (static export to `out/`) and copies files to `../Solomon.AdminUI/wwwroot/`.

## Architecture

- **Next.js** with `output: 'export'` — no Node runtime in production
- **Tailwind CSS v4** + design tokens from Claude Design export
- **Recharts** for dashboard charts
- **SPA navigation** via client state (no URL routing)

## Data

All pages load live data from Solomon Worker `/api/*` endpoints when the panel is served at `http://127.0.0.1:5050`.
