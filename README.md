# ccweb-project

Web3, crypto, and AI education platform.

This repository now contains a runnable static export of the app from the
provided Lovable preview URL.

## Run locally

### Option 1: Python only

```bash
python3 serve.py --port 4173
```

### Option 2: npm scripts

```bash
npm run start
```

Then open:

- `http://localhost:4173/`
- `http://localhost:4173/about`
- `http://localhost:4173/courses`

The local server includes an SPA fallback so direct navigation to client
routes serves `index.html`.

## Included app assets

- `index.html`
- `assets/index-C4ki6RCY.js`
- `assets/index-zDexPjhq.css`
- `assets/hero-bg-BMBJL9fN.jpg`
- `serve.py` (local server with History API fallback)
