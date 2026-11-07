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

## Frog Book and new content

One **Book** button opens a tabbed Frog Book (also the `T` key):

- **Daily:** three daily challenges plus a weekly one, a "finish all three" bonus, a free swap per challenge, and a reset timer. Group challenges (bugs, sweets, sea creatures and so on) only use foods from your current and next chapter, so you never get an impossible one. Rewards are coins, and the weekly one also gives an Ancestor point.
- **Frogdex:** every food you eat is added to a collection book (80 entries across all worlds). Each entry gives +0.5% food forever, with coin rewards at 10%, 25%, 50%, 75% and 100%.
- **Trophies:** now 56, including ones for the new features.
- **Family:** a rebirth upgrade tree with three branches (Feast, Hunt, Legacy) and nine permanent upgrades. You earn one Ancestor point for every rebirth and every world finished, plus bonuses from challenges and the Frogdex. Each upgrade unlocks the next in its row, and points can be refunded.

Also new:

- **Storm Skies**, a fifth world with four chapters (Cloud Meadow, Storm Front, Rainbow Bridge, Skyport Orbit), four bosses, its own backgrounds, weather and news. Its trick is **Thunder Bite**: every 7th bite zaps four extra foods for double. It unlocks after you finish Neon Factory.
- **Boss attack patterns:** single throw, volley, barrage from above and swirl. Later chapters mix them, and a boss below 35% health attacks faster.
- **Snack Catch**, a 15-second bonus round where you tap falling snacks. Stars are worth 5, clocks add time, and streaks double points. It's a new Lucky Spin segment and also playable from the Daily tab every 15 minutes.
- **Trophy skins:** Gilded Frog, Storm Frog, Collector Frog and Ancient Frog, each unlocked by a trophy and worn from the Shop.

## Worlds 2 to 5 rebuilt, balance changes

- **300 levels per world** (was 60), in **8 chapters** each, with a boss at the end of every chapter and a finale at level 300.
- **One continuous world instead of swapping backdrops.** Like the Frog Planet, the scenery now stays the same and grows: as the frog gets bigger and the camera zooms out, bigger objects appear in the background and small ones shrink away. The sky colours drift smoothly (candy goes pink to starry sugar space, the ocean goes bright to abyss, neon goes smog to night, storm goes blue to space).
- **Many more foods per world** (Frog Planet 60, Candy Kingdom 49, Ocean Deep 44, Neon Factory 48, Storm Skies 45), all with new art in the same glossy style, and each food swims, flies, walks or sits as fits it. 129 new sprites in total.
- **New journey maps** for worlds 2 to 5: eight chapter bands in each world's palette with its own scenery, the same road and unlock fog as the first map.
- **New rebirth cutscene:** the universe is pulled into the frog, she becomes light, a big bang makes a new universe around an egg, the egg cracks and a bigger frog hatches with orbiting stars. Choosing a world plays a themed warp tunnel with that world's foods and title card.
- **Rebirth only at the end:** the mid-game Rebirth button is gone. You can rebirth once you have eaten everything in a world.
- **Ancestor points come only from rebirths** (1 per rebirth).
- **Economy:** power-ups, skins, tongues and hats cost 10 to 30 times more (Golden Tongue 6,000, Eternal Feast 30,000), and coin income from missions, daily rewards, race prizes, trophies, challenges, the spin and the bonus round is roughly halved.
- **Bosses:** a boss level needs 3.5 times the food, attacks about twice as often and faster, and every unblocked hit takes 14 to 17 percent of the level's bar.
- **Dark mode:** the Frog Race leaderboard, Shop cards, world picker and Frog Book gold cards are readable.

## Art upgrade

- **New hero frog.** Redrawn at high resolution with whole-silhouette shading, rim light, glossy eyes, blush and freckles, in three poses (idle, mouth open, chewing). It keeps the old size and mouth position, so the tongue still comes out of the mouth, and the colour skins still work.
- **All 76 existing sprites** were cleaned and re-rendered at 3x to 4x resolution (compression noise flattened, outlines kept crisp, smooth silhouettes), so they stay sharp on big screens instead of going soft and fuzzy.
- **18 flat code-drawn sprites** (blimp, tornado, rainbow, bolt, crown, calendar, coffee, cursor, fish bowl, night moon, play button, pulsar, Wi-Fi, wormhole, heart and three upgrade icons) were redrawn in the same glossy sticker style.
- Sprites are drawn through **mipmaps** with high-quality smoothing, so they don't shimmer when scaled down.
- Want fully painted art? `art/CHATGPT_ART_PROMPT.md` has a style bible and a request for every sprite, and `tools/import_sprites.py` imports the results into the game. See `art/README.md`.

Backgrounds are still drawn in code and were not redone.

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
