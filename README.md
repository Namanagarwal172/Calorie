# Health AI 🇮🇳 (Full-Stack)

Health AI is a full-stack calorie and nutrition tracking app inspired by CAL AI, redesigned in a **Gen-Z style mobile-first UI** for Indian users.
Health AI is a full-stack calorie and nutrition tracking app inspired by CAL AI, designed for Indian customers and food habits.

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

## Features
- Profile setup: name, city, calorie goal, macro goals, daily INR budget.
- AI meal scan simulation from image filename + meal note, with a dedicated **Preview Estimate** step before adding.
- Manual meal entry and barcode quick-add.
- Daily dashboard: calories, remaining target, meals, water.
- Macro progress bars and dynamic AI insights.
- Meal timeline with delete support.
- Hydration tracking (+250 ml).

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
## Preview option
In the **AI Meal Scan** card:
1. Upload meal photo and enter note.
2. Click **Preview Estimate** to see calories/macros.
3. Click **Add From Preview** to log it in timeline/dashboard.
