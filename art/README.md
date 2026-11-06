# Art pipeline

All game sprites live inside `index.html` as WebP data in the `const SPRITES={...}` line (94 sprites, about 2 MB).

## What this pass did

* **76 existing sprites** (the bitmap icons and the old frog) were cleaned and re-rendered at 3x (frog and bosses 4x) with `upscale.py`: compression noise flattened, dark outlines kept crisp, smooth silhouettes. They no longer go soft or fuzzy at large sizes.
* **18 weak, code-drawn sprites** (blimp, tornado, rainbow, bolt, calendar, coffee, cursor, fishbowl, nightmoon, play, pulsar, wifi, wormhole, crown, heart and three upgrade icons) were redrawn in the same glossy sticker style by `genart.js`.
* **A new hero frog** (three poses) is drawn by `frogart.js`: whole-silhouette shading, rim light, glossy eyes, blush, freckles. It keeps the old aspect ratio and mouth position so the tongue still comes out of the mouth.
* The game draws sprites through **mipmaps** (`mipFor` in `index.html`) with high-quality smoothing, so large sprites stay sharp when scaled down.

## Regenerate or tweak

```
npm i playwright && node art/render.js          # writes art/out/*.png
python3 tools/import_sprites.py index.html art/out/   # puts them into the game
```

Edit a function in `genart.js` or `frogart.js`, re-run the two commands, reload the game.

## Replace with painted art

See `CHATGPT_ART_PROMPT.md`. It gives you a style bible, the frog pose briefs and a request for each of the 94 sprite ids, then `tools/import_sprites.py` does the rest.
