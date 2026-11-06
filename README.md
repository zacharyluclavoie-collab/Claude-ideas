# Frog Eats Everything

A single-file browser game: tap to feed a hungry frog and grow from a pond to eating the whole universe.
Open `index.html` in any modern browser. There is no build step.

## What's new in this version

- **Trophies** (`T`, or the trophy button on the right): 41 achievements covering eating, levels, combos, bubbles, golden flies, bosses, rebirths, worlds, missions, streaks and play time. Each one pays out coins and shows a slide-in toast. The trophy screen also shows lifetime stats (total eaten, play time, best combo, and more).
- **Welcome back**: after you've been away for 90 seconds or more, your frog earns a modest amount of food, capped at 4 hours. Collect it, or take x2 through the rewarded-ad hook. It never skips a level.
- **Feeding Frenzy**: every minute or two, a timed event drops a swarm of food and gives x2 food for 12 seconds.
- **Save backup**: copy your save as a code and load it on another device (Settings).
- **Vibration toggle** in Settings.
- Added theme-color, description and share meta tags.

All of this lives in one self-contained `EXTRAS` block near the end of the game script. It hooks the game's `gain` and `track` functions and doesn't change the existing gameplay code.

## CrazyGames compliance

Checked against the CrazyGames developer requirements (technical, gameplay, advertisement, account integration, SDK v3 docs).

| Requirement | Status |
|---|---|
| Initial download | Single 1 MB file, relative paths only, no external game assets |
| SDK v3 loaded in `<head>`, `await SDK.init()` before the game starts | Done. Game also runs if the SDK is missing or blocked |
| `gameplayStart` / `gameplayStop` on every break | Done. One tracker covers menus, popups, cutscenes, the ending and ads, and ignores tab focus changes |
| `loadingStart` / `loadingStop` | Done |
| Land directly in gameplay | Done. The intro cutscene is gone, so new players start tapping straight away with the tutorial hand |
| Midgame ads only at natural pauses, with a warning | Done. Only after a newspaper or rebirth, never on a menu button, with a 3 second "Ad starting in 3" notice, and it waits while the player is holding down |
| Game paused and UI blocked during an ad | Done |
| Audio muted when the ad actually starts, restored on finish or error | Done. SDK `muteAudio` always takes priority over the in-game toggle |
| Rewarded ads never pay on `adError` | Fixed. They used to pay out on error |
| No rewarded button over active gameplay | Fixed. The floating "watch ad" pop-up is removed. Rewarded options live in the Shop, the Lucky Spin menu and the Welcome Back popup |
| Rewarded options have a cooldown timer and a non-ad alternative | Done. Shop cards show "Ready in Ns". Each ad reward has a no-ad route: the free timed Lucky Spin, the plain Collect button, or a similar boost you can buy with coins in the Shop. Coins also come from missions and golden flies |
| No-ad option same size, font and colour as the ad option | Done (Welcome Back, Lucky Spin) |
| Ad blocker support | Done. The game never blocks players. Rewarded cards are disabled with a "Blocked by ad blocker" notice |
| Basic Launch (`adsDisabled`) | Rewarded buttons hide themselves instead of doing nothing |
| Progress saved with the Data module | Done. Data module is the save store, with `localStorage` only as a fallback or one-time migration. Account changes reload the save |
| `happytime`, `reportGameCompletedPercentage`, `setGameContext` | Added |
| No custom fullscreen button, no cross-promotion, no external links | Confirmed. The Share button is removed because it exposed the iframe URL |
| Hotkeys follow the keyboard layout | Done. They use the printed letter, so AZERTY works |
| iOS audio resume after interruption | Done |
| Readable at CrazyGames iframe sizes (800x450 up to 1920x1080) | Done. Short viewports get a compact HUD and a larger frog |
| PEGI 12, English | Cartoon content only, English text |

### On the CrazyGames submission form
- Turn on **Progress Save: Yes, using the Data Module**. Without it the Data module is disabled, and the game falls back to `localStorage`.
- Set the supported orientation to portrait and landscape, since the game letterboxes on desktop.

### Not covered
- In-game banners are optional and not added.
- No username or avatar integration. The game has no accounts, so this is not required.
- Real ads and the live SDK can only be exercised on CrazyGames or in the Developer Portal QA tool. They were tested here against a mock of the SDK API.
