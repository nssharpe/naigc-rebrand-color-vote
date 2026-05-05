# NAIGC Rebrand — Color Palette Vote

Internal voting site for the NAIGC ops team to pick a logo + color palette combination for the brand refresh. Each of 10 voters ranks their top 3 of 10 candidate logo/palette pairs (1st = 3 pts, 2nd = 2 pts, 3rd = 1 pt). Live leaderboard updates as votes come in.

## Tech

- Vanilla HTML/CSS/JS, no build step.
- Firebase Firestore for live shared state (collection: `votes`).
- GitHub Pages from `main` branch, `/docs` folder.

## Setup

1. Create a Firebase project, register a Web app, paste the config into `docs/firebase-config.js`.
2. Set Firestore rules from `firestore.rules`.
3. Push to GitHub; enable Pages on `main` branch, `/docs` folder.

## Adding/replacing options

Drop new `Logos*.png` / `Palette*.png` into `docs/images/` and update the `OPTIONS` array in `docs/app.js`.
