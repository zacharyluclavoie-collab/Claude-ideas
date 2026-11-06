# Art prompt for ChatGPT (image generation)

Use this if you want completely new painted-style art for Frog Eats Everything. The current game already ships with a crisp upgraded set (see `art/README.md`). This path replaces the *designs*.

## How to use it

1. Open a new ChatGPT chat with image generation. Paste **Part 1 (Style bible)** once, and attach 2 or 3 reference images (the repo's current frog and apple are good starting points; export them from the game or use your own).
2. Ask for sprites in **batches of one to four** using **Part 3**. Large sheets drift in style and size. Single sprites stay consistent.
3. Save each result as `<sprite id>.png` (the id is in the list in Part 3, for example `apple.png`, `frog_idle.png`).
4. Put them all in a folder and run:

   ```
   python3 tools/import_sprites.py index.html my_new_art/
   ```

   The tool removes the flat background, trims, resizes, and writes the sprites into `index.html`. Reload the game to see them. You can import a few at a time; sprites you don't replace stay as they are.

---

## Part 1: Style bible (paste this first)

> You are the lead artist for a cute, bright mobile game called **Frog Eats Everything**. A tiny frog grows until it eats the entire universe. I will ask you for individual game sprites. Every sprite you make must follow this style exactly, so that hundreds of them look like they came from the same artist on the same day.
>
> **Look.** Premium "glossy sticker" cartoon art, like a polished mobile game icon. Soft rounded shapes, big friendly proportions, slightly chubby. Think a hand-finished vector illustration with gentle 3D shading, not flat clip art and not photorealism.
>
> **Outline.** One consistent thick outline in a very dark green-black (#1D2416) around the whole silhouette, about 3 to 4 percent of the sprite's width. Thinner inner lines (about half as thick) in the same colour. Rounded line ends and corners. Never pure black, never coloured outlines.
>
> **Colour.** Saturated, cheerful, clean colours. Each object has a light tone, a base tone and a darker shade tone (three-step shading), plus a pale glossy highlight on the top-left (a soft white shape, never a hard stripe across the whole object) and a small secondary sparkle where it makes sense. Light always comes from the **top-left**. Shade falls on the **bottom-right**. Keep colour contrast high so the sprite reads at 60 pixels wide.
>
> **Faces.** Animals, creatures and some objects (clouds, jellyfish, starfish, coffee cup, blimp, moon) get a simple cute face: two glossy dark eyes with white highlight dots, tiny smile, optional pink cheek blush. Hostile things (the three bosses) get angry eyebrows but stay cartoon-safe: no blood, no weapons, nothing scary for ages 7+.
>
> **Composition.** One object per image, centred, three-quarter or front view, filling about 85 percent of the canvas with an even margin. Show the whole object, nothing cropped.
>
> **Background.** A single flat solid colour, pure magenta **#FF00FF**, covering the whole background edge to edge. No gradient, no vignette, no floor, **no cast shadow, no glow, no halo, no sparkles floating outside the object, no text, no watermark.** The object must not contain any magenta or pink close to #FF00FF (use a clearly different pink if needed). I will cut out the background automatically.
>
> **Format.** Square PNG, 1024 x 1024 pixels (except the frog poses, see below). Sharp, high resolution, clean edges, no JPEG artifacts, no noise or texture grain.
>
> **Do not.** No photorealism, no painterly brush texture, no pixel art, no 3D render look, no black outlines thicker than described, no drop shadows, no ground, no extra characters.
>
> Reply "Understood" and wait for my first request.

---

## Part 2: The hero frog (do this first and get it right)

Send one at a time. The three poses **must be the same character, same size, same position, same canvas**, differing only in the expression. Ask for a **1280 x 1010 pixel** canvas (that aspect ratio matters: the game keeps it).

**Base description (use in all three):**

> The player's frog. A chubby, front-facing, sitting green frog, wide head with two big bulging eyes on the top corners, small round body, cream belly, short front arms with three little fingers each, big folded back legs with webbed feet turned outward. Bright lime to leaf green (#8CF02A light, #5CD01C base, #37A016 shade), cream belly (#FFF8D2), pink cheek blush, a few darker green freckles on the head, glossy eyes with large white highlight dots. The frog sits on the bottom edge of the canvas, its feet touching the bottom with a small margin. Head takes the top 60 percent, body the lower 40 percent.

* `frog_idle.png`: "…mouth closed in a gentle happy smile, eyes open and looking slightly forward."
* `frog_open.png`: "…mouth wide open in a happy shout, deep red-brown mouth interior with a bright pink tongue visible at the bottom, eyes open and excited."
* `frog_chew.png`: "…mouth closed and cheeks puffed out wide on both sides while chewing, eyes happily squeezed shut as upside-down U shapes, wiggly small mouth line."

The mouth must stay at the same height in all three, roughly 60 percent down from the top of the canvas, because the tongue shoots out from that spot.

---

## Part 3: Everything else (copy the id into the file name)

Use this request template for each one:

> Make the sprite **`<id>`**: <description>. Follow the style bible exactly. 1024x1024, flat magenta #FF00FF background, nothing else in the image.

### Bosses (extra big and extra detailed, 1024 x 1024; slightly angry but cartoon-safe)
| id | description |
|---|---|
| `boss_snail` | King Snail: a grumpy cream snail with a swirled orange shell, angry eyebrows, a small gold crown |
| `boss_melon` | The Mega Melon: a whole striped watermelon with a furious face, jagged angry mouth and dark red eyebrows |
| `boss_octopus` | The Kraken: a purple octopus with yellow angry eyes, eight curling tentacles with pink suckers |

### Bugs and animals
`fly` (black fly with big red eyes and see-through blue-white wings) · `beetle` (brown stag beetle with big pincers) · `ladybug` (red ladybug with black spots and a smiling face) · `dragonfly` (blue dragonfly with big cute eyes) · `snail` (friendly orange snail, calm smile) · `cat` (sitting orange tabby with closed happy eyes) · `dog` (sitting brown and white beagle with floppy ears, tongue out) · `duck` (yellow rubber-duck style duck, orange beak) · `chick` (round yellow chick, tiny orange beak) · `sheep` (fluffy cream sheep with a dark face) · `fish` (blue fish, cute eye) · `crab` (red crab waving claws) · `shark` (blue shark with a toothy friendly grin) · `whale` (blue whale spouting a little water, sleepy happy eyes) · `octopus` (small cute purple octopus) · `jelly` (lilac jellyfish with face and trailing tentacles) · `starfish` (orange starfish with face) · `shell` (pink scallop shell)

### Food
`apple` (shiny red apple with leaf and brown stem) · `banana` · `strawberry` · `watermelon` (a triangle slice, red flesh, black seeds, green rind) · `pizza` (a slice with pepperoni and melting cheese) · `donut` (pink frosting with rainbow sprinkles) · `cake` (a slice with strawberry on top) · `cupcake` (blue paper cup, white frosting, cherry, sprinkles) · `icecream` (waffle cone, two scoops) · `choco` (chocolate bar half unwrapped) · `lollipop` (rainbow swirl on a white stick) · `candy` (wrapped blue striped candy) · `candycane` (red and white) · `gummy` (red gummy bear) · `coffee` (white cup of coffee with a heart on top, steam, tiny face, saucer)

### Places, nature and big things
`house` (cosy cottage with red roof, chimney, garden) · `tree` (round green tree) · `city` (tall blue skyscraper with lit windows) · `castle` (grey fairy-tale castle with blue turrets and red flags) · `mountain` (green mountain with a snowy peak) · `volcano` (brown volcano with lava and a grey smoke cloud) · `cloud` (fluffy white cloud) · `dreamcloud` (sleepy pastel cloud with closed eyes and blush) · `tornado` (grey funnel cloud with a cute worried face) · `rainbow` (a rainbow arc with a white cloud at each end) · `bolt` (yellow lightning bolt with a few sparkles) · `fishbowl` (glass bowl with a goldfish, bubbles, a bit of green plant)

### Vehicles
`car` (red hatchback, side view) · `bus` (yellow school bus) · `plane` (white and blue airliner) · `balloon` (striped red and yellow hot-air balloon with a basket) · `blimp` (white zeppelin with a red stripe, gondola, tail fins and a smiling face) · `rocket` (white rocket with red fins and an orange flame) · `submarine` (yellow submarine with three round windows) · `ufo` (silver flying saucer with a blue glass dome and coloured lights) · `drone` (white quadcopter) · `satellite` (silver satellite with blue solar panels)

### Space
`earth` · `moon` (grey with craters, not smiling) · `sun` (yellow sun with rays) · `saturn` (orange planet with a ring) · `star` (yellow five-point star) · `comet` (a cookie-brown rock with a fiery orange tail) · `asteroid` (grey cratered rock) · `galaxy` (purple spiral galaxy) · `blackhole` (swirling black hole with orange-purple ring) · `wormhole` (purple swirl portal) · `pulsar` (white star with two cyan beams) · `nightmoon` (yellow crescent moon with a sleepy face and a blue nightcap)

### Tech and objects
`robotI` (cute white robot with a blue visor face) · `laptop` · `phone` (smartphone with colourful app icons) · `controller` (black game pad) · `battery` (green full battery) · `chip` (microchip) · `gear` (grey cog) · `bulb` (yellow light bulb) · `clock` (blue-rimmed wall clock) · `hourglass` · `calendar` (white calendar with red top and rings, one pink day) · `pillow` (soft white pillow) · `chest` (wooden treasure chest full of gold coins) · `cursor` (white mouse arrow with sparkles) · `play` (red video play button) · `wifi` (blue Wi-Fi signal) · `crown` (gold crown with red, blue and green gems) · `heart` (glossy pink heart)

### Upgrade icons (shown very small, keep them bold and simple)
`tongueI` (frog mouth with a pink tongue sticking out) · `tripleI` (a mouth with three pink tongues fanning out) · `mouthI` (smiling green frog face, mouth wide open)

---

## Tips for a consistent result

* If a sprite comes back off-style, reply "same style as the reference, thicker dark outline, flat magenta background" rather than rewriting the prompt.
* If the background isn't pure magenta, ask: "Redo with a perfectly flat #FF00FF background, no shadow."
* Generate the frog poses in one chat so they match. Regenerate all three if one is off.
* Check each sprite at thumbnail size (about 80 pixels). If it isn't readable there, ask for bolder shapes and fewer tiny details.
* The game scales sprites to a fixed height, so don't worry about exact proportions between different sprites.
* Backgrounds are still drawn in code. Replacing them with painted images needs a code change, so ask for that separately.
