#!/usr/bin/env python3
"""
Import new sprite art into index.html.

Put one PNG per sprite in a folder, named exactly after the sprite id
(apple.png, frog_idle.png, boss_snail.png ...). The tool will:
  * remove a solid background (chroma key from the image corners) if the PNG has no transparency
  * trim empty margins, then fit the sprite to a sensible size
  * encode it as WebP and write it into the `const SPRITES={...}` line of index.html

Usage:
    python3 tools/import_sprites.py index.html art_in/ [--size 640] [--hero-size 1000] [--tolerance 60]

Needs Pillow and numpy:  pip install pillow numpy
Frogs (frog_idle, frog_open, frog_chew) and bosses (boss_*) use --hero-size, everything else --size.
Keep the three frog poses at the SAME aspect ratio as each other; the game keeps the old aspect (about 1.27 wide to 1 tall).
"""
import argparse, base64, io, json, os, sys
import numpy as np
from PIL import Image

HERO = ('frog_idle', 'frog_open', 'frog_chew')

def chroma_key(im, tol):
    """Make the background transparent: flood fill from the 4 corners using the corner colour."""
    a = np.array(im.convert('RGBA'))
    h, w = a.shape[:2]
    corner = np.array([a[0, 0, :3], a[0, w-1, :3], a[h-1, 0, :3], a[h-1, w-1, :3]], dtype=np.int32)
    if np.abs(corner - corner[0]).max() > 24:      # corners disagree: not a flat backdrop, leave as is
        return im.convert('RGBA')
    bg = corner[0]
    dist = np.abs(a[..., :3].astype(np.int32) - bg).sum(axis=2)
    cand = dist <= tol
    seen = np.zeros((h, w), bool)
    stack = [(0, 0), (0, w-1), (h-1, 0), (h-1, w-1)]
    while stack:
        y, x = stack.pop()
        if y < 0 or x < 0 or y >= h or x >= w or seen[y, x] or not cand[y, x]:
            continue
        seen[y, x] = True
        stack += [(y+1, x), (y-1, x), (y, x+1), (y, x-1)]
    a[seen, 3] = 0
    # soften the cut edge by one pixel so no coloured fringe remains
    edge = np.zeros((h, w), bool)
    edge[1:, :] |= seen[:-1, :]; edge[:-1, :] |= seen[1:, :]; edge[:, 1:] |= seen[:, :-1]; edge[:, :-1] |= seen[:, 1:]
    fringe = edge & ~seen
    a[fringe, 3] = np.minimum(a[fringe, 3], 160)
    return Image.fromarray(a, 'RGBA')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('html'); ap.add_argument('folder')
    ap.add_argument('--size', type=int, default=640)
    ap.add_argument('--hero-size', type=int, default=1000)
    ap.add_argument('--tolerance', type=int, default=60)
    ap.add_argument('--quality', type=int, default=90)
    o = ap.parse_args()

    text = open(o.html, encoding='utf-8').read()
    i = text.index('const SPRITES={'); j = text.index('\n', i)
    sprites = json.loads(text[i + len('const SPRITES='):j].rstrip(';'))

    files = sorted(f for f in os.listdir(o.folder) if f.lower().endswith('.png'))
    if not files:
        sys.exit('no PNG files found in ' + o.folder)
    for f in files:
        name = f[:-4]
        im = Image.open(os.path.join(o.folder, f)).convert('RGBA')
        if np.array(im)[..., 3].min() == 255:      # fully opaque: remove the flat background
            im = chroma_key(im, o.tolerance)
        bb = im.getbbox()
        if not bb:
            print('skip (empty):', f); continue
        im = im.crop(bb)
        lim = o.hero_size if (name in HERO or name.startswith('boss_')) else o.size
        if max(im.size) != lim:
            k = lim / max(im.size)
            im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.LANCZOS)
        buf = io.BytesIO(); im.save(buf, 'WEBP', quality=o.quality, method=6, alpha_quality=100)
        sprites[name] = 'data:image/webp;base64,' + base64.b64encode(buf.getvalue()).decode()
        print('%-14s %4dx%-4d %4d KB%s' % (name, im.width, im.height, len(buf.getvalue()) // 1024, '' if name in sprites else ' (new)'))

    new_line = 'const SPRITES=' + json.dumps(sprites) + ';'
    open(o.html, 'w', encoding='utf-8').write(text[:i] + new_line + text[j:])
    print('updated', o.html, '-', len(files), 'sprite(s)')

if __name__ == '__main__':
    main()
