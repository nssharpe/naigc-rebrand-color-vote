# NAIGC Rebrand — Color Palette Vote

Internal voting site for the NAIGC ops team to rank 10 logo + palette candidates. 10 voters each assign 1st/2nd/3rd choice (3/2/1 pts). Live leaderboard updates in real time.

- **Live site:** https://nssharpe.github.io/naigc-rebrand-color-vote/
- **Repo:** https://github.com/nssharpe/naigc-rebrand-color-vote (public, Pages from `main /docs`)
- **Local path:** `C:\Users\nssha\Steinsharpe Dropbox\Nate Sharpe\Documents\Misc\Gymnastics\NAIGC\NAIGC Rebrand\naigc-rebrand-color-vote\`

## Stack

Vanilla HTML/CSS/JS + Firebase Firestore (projectId: `naigc-rebrand-color-vote`). No build step. PNGs committed directly into `docs/images/`.

## Key files

| File | Purpose |
|------|---------|
| `docs/app.js` | All logic: Firestore wiring, identity dropdown, ballot rendering, leaderboard |
| `docs/firebase-config.js` | Firebase credentials — **must have real values before pushing** (see warning below) |
| `docs/images/` | Logos1–8.png, Palette1–10.png |
| `firestore.rules` | Open read/write on `votes/{userId}` — must be published in Firebase console |
| `.git/hooks/pre-push` | Blocks push if `REPLACE_ME` placeholder is still in `docs/` |

## ⚠️ firebase-config.js — lesson learned

`docs/firebase-config.js` is committed to the repo with real credentials (Firebase web API keys are public by design; security is enforced by Firestore Rules, not key secrecy). **Do not replace it with a placeholder.** If you ever recreate the project or rotate the config:

1. Paste the new config into `docs/firebase-config.js`
2. `git add docs/firebase-config.js && git commit` immediately — do not leave it as the only uncommitted file
3. The pre-push hook will catch any remaining `REPLACE_ME` strings and block the push

## Deployment

Push to `main` — GitHub Pages redeploys automatically in ~1 minute. No build step needed.

## Adding or changing options

1. Drop new `Logos*.png` / `Palette*.png` into `docs/images/`
2. Update the `OPTIONS` array in `docs/app.js`
3. Commit and push

## Voters

Chandler, Dot, Ilana, Jayden, Jules, Nate, Olivia, Scarlett, Eric, Kristin

## Testing checklist (end-to-end)

Run through this after any significant change or after initial setup:

1. **Basic vote flow**
   - Open the live URL; select a voter name from the dropdown
   - Click 1st, 2nd, 3rd on three different option cards — confirm buttons highlight and ballot status updates

2. **Persistence (most important)**
   - After ranking, do a **hard refresh** (Ctrl+Shift+R / Cmd+Shift+R)
   - Your three rankings should still be shown — they're reloaded from Firestore, not localStorage
   - If they're gone after refresh, votes are not reaching Firestore (check Firestore Rules and firebase-config.js)

3. **Live sync**
   - Open the site in a second browser tab (or incognito window), pick a different voter name, assign rankings
   - Switch back to the first tab — the leaderboard should update within ~1 second without refreshing

4. **Firestore data check**
   - Go to Firebase console → Firestore → Data tab
   - Confirm `votes` collection has documents for each voter who voted, with a `ranks` map like `{"1": "opt3", "2": "opt7", "3": "opt1"}`

5. **Toggle & clear**
   - Click an active rank button — it should clear (deselect)
   - Click "Show results" — leaderboard should appear; click again to hide

6. **Clean up test votes** — after testing, clear your dummy votes by clicking each active rank to deselect it, or delete the test docs from the Firestore console Data tab
