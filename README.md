# Gem Rush

A one-file portrait clicker built for screen recording. Tap the gem, grab upgrades, and watch it evolve through 8 tiers (Quartz, Citrine, Emerald, Sapphire, Ruby, Amethyst, Diamond, Cosmic).

Open `index.html` in any browser. No build step, no dependencies.

## What's in it

- Eight procedurally drawn gem cuts, one per tier: crystal cluster, brilliant, emerald cut, round, heart, marquise, diamond, star. Moving light sweep, squash-and-tilt on every tap, a 360 spin on crits and big moments, orbiting sparks, combo fire
- **Mystery Gem.** Every so often a gem shows up with a health bar pinned to the top of the screen (health left, time left). Break it down by tapping, then a **spin wheel** decides its rarity: Common 62%, Uncommon 22%, Rare 10%, Epic 4%, Legendary 1.5%, Mythic 0.45%, Secret 0.1% (the slices are sized by a squashed version of the odds so the rare ones stay visible). The rarity sets your payout (x1 up to x400). Your collection screen counts how many of each you got, and Secret stays "???" until you land it.
- **Wheel results give a timed buff.** Uncommon x1.25 for 12s, Rare x1.5, Epic x2, Legendary x3, Mythic x4, Secret x10 for 45s, on both taps and auto income. A colored aura and a buff bar show while it lasts. The result card shows your gem in that rarity's color.
- **Bad luck protection.** After 6 Commons in a row, the next wheel cannot land on Common.
- **Rare shards.** Every wheel result gives 90 shards, times its rarity step (Common 90, Uncommon 180 ... Secret 630). Each shard adds 0.04% to all gems, forever, and the count shows next to your tier.
- **RGB lighting.** Rainbow rim and halo around the gem, rainbow taps and sparks, animated rainbow on the Upgrades button, progress bar, tier chip and affordable upgrades. Turn it off in the Gems screen (RGB lights).
- **Four upgrades to break gems faster** (they unlock after your first boss or Emerald): Crack Hammer (extra damage per tap), Drill Bit (damage on its own every second), Time Warp (more time), Treasure Radar (rarer gems, spawning sooner).
- Gem Rain: 9 seconds of falling gems to catch
- Generative music (pad, bass, arp) that adds drums as your combo climbs, plus a three-way sound button (music and sound, sound only, off)
- Daily gift with a streak bonus
- Slim top bar. Upgrades live behind an **Upgrades** button (with a badge for how many you can afford, pulses when you can buy). The panel slides up, the gem shrinks above it so you can keep tapping, and the X closes it. Press U on a keyboard to toggle it.
- Shop reveals upgrades step by step, every locked card shows a bar for how close you are to buying it, press and hold a card to keep buying
- Combo pill glows orange, then pink, then rainbow as the streak grows; status bars slide in and out instead of popping
- Gem collection screen (locked gems show as silhouettes)
- **Share card**: a 1080x1920 image of your gem, tier and gem count with "Can you beat it?" on it. On a phone the Share button opens the share sheet with the image attached, so it goes straight to TikTok, Instagram or Messages. The speedrun result screen makes one too.
- Gems keep coming while the app is in the background, and short tips appear the first time you can buy an upgrade and when you reach Emerald
- Combo meter (up to x3), crits, and milestone callouts (NICE, SWEET, INSANE, UNREAL, GODLIKE)
- Golden gem flies across the screen. Tap it for Frenzy: everything x7 for 15 seconds
- 8 upgrades with milestone bonuses (output doubles at levels 10, 25, 50, 100, 150, 200) and buy x1 / x10 / MAX
- 60 second Speedrun: 3-2-1 countdown, timer, result card with your tier, gems, taps, combo and a saved personal best
- Ascend: after Cosmic, reset for Star Shards that give permanent bonus gems
- 13 trophies, each worth +2% gems
- Synth sound that climbs with your combo, haptics, offline earnings, autosave

## Performance

No blur filters, glow and rays come from cached sprites, gem edges are batched. If the frame rate drops below about 28 fps the game lowers its own quality (lower canvas resolution, fewer particles, no rays or dust). Tested under a 4x CPU slowdown: 14 fps before the auto drop, 56 fps after.

## Pacing (bot play)

First evolve about 4s, Ruby about 35s, Amethyst about 100s, Cosmic about 3 to 4.5 min for a perfect bot (expect 7 to 10 min by hand).

## Recording for TikTok

When you post, drop the share card in as the last frame of the video or as a photo post.

1. Host it (see below) and open it on your phone. Add it to your home screen for a full-screen view.
2. **Clean view** (eye button) hides the shop so the gem and counter fill the screen.
3. **Auto-play** (circle button) taps with a human rhythm, buys upgrades and grabs golden gems. Start the recording and let it run.
4. **Speedrun** (stopwatch button) is the best hook: "How far can I get in 60 seconds?" The result card is made for the last second of the video. Turn on Auto-play for a hands-free run, or tap it yourself.

Video ideas:

- "Reach Amethyst in 60 seconds" with a live attempt, then the result card
- "POV: you catch the golden gem" cut into Frenzy
- Stitch with "beat my tier" and the share button text

## Screens

Works in portrait on phones from 320px wide up, in landscape (gem on the left, stats and shop on the right), and on desktop (Space bar taps). Includes a web app manifest and icons, so Add to Home Screen opens it full screen with its own icon.

## Hosting

Any static host works (Netlify Drop, Cloudflare Pages, Vercel). Upload `index.html`, `manifest.webmanifest` and the three `icon-*.png` files.

GitHub Pages with the included workflow:

1. Merge this branch into the default branch (Pages only deploys from there).
2. Settings, Pages, Source = GitHub Actions.
3. Actions tab, "Deploy Gem Rush to GitHub Pages", Run workflow.
4. Open `https://<user>.github.io/<repo>/`.

Private repos need a plan that allows Pages. The workflow has not been run yet.
