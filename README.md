# Health AI 🇮🇳 (Full-Stack)

Health AI is a full-stack calorie and nutrition tracking app inspired by CAL AI, redesigned in a **Gen-Z style mobile-first UI** for Indian users.

## What makes it Indian-first
- AI scan estimation tuned with common Indian meals (dal-chawal, paneer, idli, dosa, biryani, poha).
- INR-based daily food budget tracking and meal budget tip.
- Localized coaching tone in AI insights (Hindi + English style).
- Starter barcode examples relevant to Indian products.

## Gen-Z UI Highlights
- Mobile-first glassmorphism interface with gradients.
- Login screen with mobile/email toggle flow.
- Greeting + remaining calories + streak badge.
- Progress rings for Calories, Protein, Carbs, Water.
- Visual sections: AI Coach, Scan Meal, Budget Tracker, Quick Add, Timeline.
- Sticky bottom action bar for hydration and logout.

## Full-stack architecture
- **Backend:** Node.js HTTP API (`server.js`) with JSON data persistence in `data/db.json`.
- **Frontend:** Vanilla HTML/CSS/JS (`index.html`, `styles.css`, `app.js`) consuming backend APIs.
- **Storage:** File-based persistence for profile, meals, and hydration data.

## Instant fix for `npm ERR! EJSONPARSE`
If `npm start` fails due to a broken `package.json`, run this one command:

```bash
bash scripts/repair-and-run.sh
```

This will auto-repair `package.json`, install dependencies, and start the app.

## Run
```bash
npm start
```
Open: <http://localhost:4173>

## Test
```bash
npm test
```

## Run with custom port/db
```bash
PORT=5000 DB_FILE=./data/db.json node server.js
```

## Input validation
- Invalid JSON requests return `400 Invalid JSON payload`.
- Invalid meal or water payloads return `400` with a clear error message.


## If old UI is still showing
- Stop old Node server processes and start again: `npm start`
- Open `http://localhost:4173` (not a different port)
- Hard refresh browser (`Ctrl+Shift+R` / `Cmd+Shift+R`)
- App now serves static files with `Cache-Control: no-store` to prevent stale UI cache


## GitHub clone/push error fix (`Failed to connect to github.com port 443`)
If you hit connectivity/auth errors while cloning or pushing, run:

```bash
bash scripts/github-network-diagnose.sh
```

Then apply the recommended fix from the script output:
- remove broken git proxy config
- ensure outbound 443 is allowed
- use **SSH** or **PAT** (GitHub password auth is not supported)

Quick SSH setup:
```bash
git remote set-url origin git@github.com:Namanagarwal172/Calorie.git
ssh -T git@github.com
git push -u origin main
```


## npm EJSONPARSE fix (`package.json` parse error)
If you see:
- `npm ERR! code EJSONPARSE`
- `package.json must be actual JSON`

Run:
```bash
bash scripts/fix-package-json.sh
npm install
npm test
```

Or replace `package.json` with this exact valid JSON:
```json
{
  "name": "health-ai-india",
  "version": "1.0.0",
  "description": "Full-stack Health AI calorie tracker for Indian users",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "test": "node --test"
  },
  "license": "MIT"
}
```
