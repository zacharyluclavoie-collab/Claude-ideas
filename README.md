# Gem Rush

A one-file portrait clicker built for screen recording. Tap the gem, grab upgrades, and watch it evolve through 8 tiers (Quartz, Citrine, Emerald, Sapphire, Ruby, Amethyst, Diamond, Cosmic).

Open `index.html` in any browser. No build step, no dependencies.

## What's in it

- Eight procedurally drawn gem cuts, one per tier: crystal cluster, brilliant, emerald cut, round, heart, marquise, diamond, star. Moving light sweep, squash-and-tilt on every tap, a 360 spin on crits and big moments, orbiting sparks, combo fire
- Boss Gem: the gem cracks, you have 13 seconds of fast tapping to shatter it for a big payout
- Gem Rain: 9 seconds of falling gems to catch
- Generative music (pad, bass, arp) that adds drums as your combo climbs, plus a three-way sound button (music and sound, sound only, off)
- Daily gift with a streak bonus
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

First evolve about 4s, Ruby about 35s, Amethyst about 100s, Cosmic about 4 to 6 min for a perfect bot (expect 8 to 10 min by hand).

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

## Hosting

Any static host works. For GitHub Pages: Settings, Pages, deploy from the branch root, then open `https://<user>.github.io/<repo>/`.
