# Health AI 🇮🇳 (Full-Stack)

Health AI is a full-stack calorie and nutrition tracking app inspired by CAL AI, designed for Indian customers and food habits.

## What makes it Indian-first
- AI scan estimation tuned with common Indian meals (dal-chawal, paneer, idli, dosa, biryani, poha).
- INR-based daily food budget tracking and meal budget tip.
- Localized coaching tone in AI insights (Hindi + English style).
- Starter barcode examples relevant to Indian products.

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

## Preview option
In the **AI Meal Scan** card:
1. Upload meal photo and enter note.
2. Click **Preview Estimate** to see calories/macros.
3. Click **Add From Preview** to log it in timeline/dashboard.
