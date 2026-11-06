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
