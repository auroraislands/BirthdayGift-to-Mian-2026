"""Build the local pixel-art assets used by the birthday forest.

The source sheets in assets/vendor are CC0 works documented in README.md.
Derived files remain deliberately small and are enlarged with nearest-neighbour
rendering in the game so their pixel grid stays compatible with the characters.
"""

from pathlib import Path
from shutil import copyfile

from PIL import Image, ImageChops, ImageDraw, ImageEnhance


ROOT = Path(__file__).resolve().parents[1]
VENDOR = ROOT / "assets" / "vendor"
FOREST = ROOT / "assets" / "forest"
PROPS = ROOT / "assets" / "props"
GALLERY = ROOT / "assets" / "gallery"
CHARACTERS = ROOT / "assets" / "characters"

for directory in (FOREST, PROPS, GALLERY):
    directory.mkdir(parents=True, exist_ok=True)


def crop_alpha(image: Image.Image, padding: int = 0) -> Image.Image:
    image = image.convert("RGBA")
    bbox = image.getchannel("A").getbbox()
    if not bbox:
        return image
    left, top, right, bottom = bbox
    return image.crop((max(0, left - padding), max(0, top - padding), min(image.width, right + padding), min(image.height, bottom + padding)))


def nearest(image: Image.Image, scale: int) -> Image.Image:
    return image.resize((image.width * scale, image.height * scale), Image.Resampling.NEAREST)


def tint_multiply(image: Image.Image, color: tuple[int, int, int], opacity: float) -> Image.Image:
    image = image.convert("RGBA")
    rgb = Image.new("RGBA", image.size, (*color, 255))
    multiplied = ImageChops.multiply(image, rgb)
    return Image.blend(image, multiplied, opacity)


# Forest of Illusion: keep the native low-resolution layers for live parallax.
copyfile(VENDOR / "forest-back-source.png", FOREST / "back.png")
copyfile(VENDOR / "forest-middle-source.png", FOREST / "middle.png")
copyfile(VENDOR / "forest-tiles-source.png", FOREST / "tiles.png")

middle = Image.open(VENDOR / "forest-middle-source.png").convert("RGBA")
foreground = middle.crop((0, 170, middle.width, middle.height))
foreground.save(FOREST / "foreground.png", optimize=True)

tiles = Image.open(VENDOR / "forest-tiles-source.png").convert("RGBA")
# Use only the continuous centre of the floating platform. Cropping the whole
# platform leaves transparent side margins which become obvious rectangular
# gaps when repeated across the path.
path_tile = tiles.crop((30, 4, 62, 28))
path_tile.save(FOREST / "path-tile.png", optimize=True)

# Build an opaque lower-ground texture from four different rock sections in
# the same sheet.  The solid backing removes the floating-platform's tapered
# alpha edge, while the varied quadrants prevent an obvious repeated crop.
earth_tile = Image.new("RGBA", (64, 56), (39, 51, 37, 255))
earth_patches = [
    (tiles.crop((108, 40, 140, 68)), (0, 0), False),
    (tiles.crop((124, 40, 156, 68)), (32, 0), True),
    (tiles.crop((104, 48, 136, 76)), (0, 28), True),
    (tiles.crop((128, 48, 160, 76)), (32, 28), False),
]
for patch, position, flip in earth_patches:
    if flip:
        patch = patch.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    earth_tile.alpha_composite(patch, position)

# A subtle low-band shade lets the texture recede without covering its pixels.
earth_shade = Image.new("RGBA", earth_tile.size, (0, 0, 0, 0))
earth_shade_draw = ImageDraw.Draw(earth_shade)
for y in range(earth_tile.height):
    alpha = max(0, int((y - 20) / 36 * 38))
    earth_shade_draw.line((0, y, earth_tile.width, y), fill=(8, 20, 18, alpha))
earth_tile = Image.alpha_composite(earth_tile, earth_shade)
earth_tile.save(FOREST / "earth-tile.png", optimize=True)


# Forest sign from thekingphoenix's 32px CC0 sheet.
forest_props = Image.open(VENDOR / "forest-props-source.png").convert("RGBA")
sign = crop_alpha(forest_props.crop((324, 6, 392, 78)), 1)
sign.save(PROPS / "sign.png", optimize=True)

# Side-view bench from the CC0 City Icons sheet.
city_icons = Image.open(VENDOR / "city-icons-source.png").convert("RGBA")
bench = crop_alpha(city_icons.crop((30, 0, 98, 31)), 1)
bench.save(PROPS / "bench.png", optimize=True)

# Parriah's tall CC0 lantern is already sized on a useful 32px grid.
lantern = crop_alpha(Image.open(VENDOR / "lantern-source.png"), 1)
lantern.save(PROPS / "lantern.png", optimize=True)


# Use the original Pav Creations CC0 rabbit requested as the fallback.  Only
# frames 2–7 from the first two rows are sampled: the complete third row,
# including its hurt/cross-eye and squashed poses, is deliberately excluded.
bunny_source = Image.open(VENDOR / "bunny-source.png").convert("RGBA")


def grey_bunny_frame(frame_index: int) -> Image.Image:
    left = (frame_index % 4) * 16
    top = (frame_index // 4) * 16
    frame = bunny_source.crop((left, top, left + 16, top + 16)).convert("RGBA")
    pixels = frame.load()
    for y in range(frame.height):
        for x in range(frame.width):
            r, g, b, a = pixels[x, y]
            if not a:
                continue
            if (r, g, b) == (255, 255, 255):
                pixels[x, y] = (160, 171, 168, a)
            elif (r, g, b) == (214, 214, 214):
                pixels[x, y] = (111, 123, 120, a)
            elif (r, g, b) == (0, 0, 0):
                pixels[x, y] = (24, 30, 30, a)
    return frame.resize((32, 32), Image.Resampling.NEAREST)


rabbit_sheet = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
selected_frames = [0, 1, 0, 2, 3, 4, 5, 1, 0]
for slot, frame_index in enumerate(selected_frames):
    rabbit_sheet.alpha_composite(
        grey_bunny_frame(frame_index),
        ((slot % 3) * 32, (slot // 3) * 32),
    )
rabbit_sheet.save(PROPS / "rabbit-sheet.png", optimize=True)


# SpiderDave's sheet is aligned to a 12x24 grid.
plants = Image.open(VENDOR / "plants-source.png").convert("RGBA")


def plant_cell(index: int) -> Image.Image:
    cell = plants.crop((index * 12, 0, index * 12 + 12, 24)).convert("RGBA")
    px = cell.load()
    for y in range(cell.height):
        for x in range(cell.width):
            r, g, b, a = px[x, y]
            # The sheet uses a dark-purple opaque preview background.
            if abs(r - 34) + abs(g - 32) + abs(b - 52) < 42:
                px[x, y] = (r, g, b, 0)
    return cell


def recolor(image: Image.Image, mapping: dict[tuple[int, int, int], tuple[int, int, int]]) -> Image.Image:
    image = image.copy().convert("RGBA")
    px = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            best = min(mapping, key=lambda key: abs(key[0] - r) + abs(key[1] - g) + abs(key[2] - b))
            if sum(abs(best[i] - (r, g, b)[i]) for i in range(3)) < 110:
                nr, ng, nb = mapping[best]
                px[x, y] = (nr, ng, nb, a)
    return image


# Purple morning glory: keep the CC0 vine cells as the base, then build a
# readable 2px-grid silhouette with heart leaves and trumpet blossoms.
morning_glory = Image.new("RGBA", (48, 52), (0, 0, 0, 0))
vine_a = nearest(plant_cell(42), 2)
vine_b = nearest(plant_cell(43).transpose(Image.Transpose.FLIP_LEFT_RIGHT), 2)
morning_glory.alpha_composite(vine_a, (1, 4))
morning_glory.alpha_composite(vine_b, (23, 2))
mg_draw = ImageDraw.Draw(morning_glory)
for points in (
    [(24, 49), (22, 39), (24, 29), (21, 19), (24, 7)],
    [(23, 37), (14, 31), (9, 20)],
    [(24, 31), (34, 25), (39, 14)],
):
    mg_draw.line(points, fill=(49, 91, 53, 255), width=3)
    mg_draw.line(points, fill=(91, 139, 70, 255), width=1)

def draw_heart_leaf(draw: ImageDraw.ImageDraw, x: int, y: int, flip: int = 1) -> None:
    draw.polygon(
        [(x, y + 8), (x - 7 * flip, y + 1), (x - 6 * flip, y - 4),
         (x - 2 * flip, y - 6), (x, y - 2), (x + 2 * flip, y - 6),
         (x + 6 * flip, y - 4), (x + 7 * flip, y + 1)],
        fill=(45, 99, 55, 255),
    )
    draw.line([(x, y - 1), (x, y + 6)], fill=(112, 158, 80, 255), width=1)

for leaf in ((14, 31, 1), (34, 27, -1), (10, 20, 1), (39, 16, -1), (25, 18, 1)):
    draw_heart_leaf(mg_draw, *leaf)

def draw_trumpet(draw: ImageDraw.ImageDraw, x: int, y: int) -> None:
    draw.polygon([(x, y + 7), (x - 7, y), (x - 5, y - 5), (x, y - 7),
                  (x + 6, y - 4), (x + 7, y + 1)], fill=(107, 59, 151, 255))
    draw.polygon([(x, y + 4), (x - 4, y), (x, y - 4), (x + 4, y)], fill=(171, 111, 202, 255))
    draw.rectangle((x - 1, y - 1, x + 1, y + 1), fill=(241, 200, 208, 255))

for blossom in ((8, 13), (25, 7), (41, 10), (31, 20)):
    draw_trumpet(mg_draw, *blossom)
morning_glory.save(PROPS / "morning-glory.png", optimize=True)

# Caladium: derive a leafy CC0 flower cluster and recolour it into green/pink leaves.
caladium = Image.new("RGBA", (50, 52), (0, 0, 0, 0))
leafy = nearest(plant_cell(74), 2)
leafy = recolor(
    leafy,
    {
        (55, 148, 110): (62, 102, 65),
        (99, 199, 77): (114, 154, 92),
        (217, 87, 99): (213, 113, 148),
        (255, 162, 116): (239, 184, 189),
    },
)
caladium.alpha_composite(leafy, (1, 3))
caladium.alpha_composite(leafy.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (25, 1))
cal_draw = ImageDraw.Draw(caladium)
for stem_end in ((9, 16), (17, 10), (25, 20), (34, 9), (43, 17), (18, 29), (34, 30)):
    cal_draw.line([(25, 50), stem_end], fill=(64, 103, 60, 255), width=2)

def draw_caladium_leaf(draw: ImageDraw.ImageDraw, x: int, y: int, size: int, pale: bool = False) -> None:
    edge = (73, 122, 73, 255) if not pale else (105, 145, 91, 255)
    inner = (199, 111, 139, 255) if not pale else (232, 164, 176, 255)
    draw.polygon(
        [(x, y + size), (x - size, y), (x - size + 2, y - size + 2),
         (x - 3, y - size), (x, y - size + 4), (x + 3, y - size),
         (x + size - 2, y - size + 2), (x + size, y)],
        fill=edge,
    )
    draw.polygon(
        [(x, y + size - 3), (x - size + 3, y), (x, y - size + 5), (x + size - 3, y)],
        fill=inner,
    )
    draw.line([(x, y - size + 3), (x, y + size - 2)], fill=(244, 204, 196, 255), width=1)

for leaf in ((9, 16, 7, False), (18, 10, 8, True), (27, 19, 9, False),
             (36, 9, 8, True), (43, 18, 7, False), (17, 29, 8, True),
             (36, 30, 9, False)):
    draw_caladium_leaf(cal_draw, *leaf)
caladium.save(PROPS / "caladium.png", optimize=True)


def forest_scene(offset: int, warmth: float = 0.0) -> Image.Image:
    back = Image.open(VENDOR / "forest-back-source.png").convert("RGBA")
    mid = Image.open(VENDOR / "forest-middle-source.png").convert("RGBA")
    scene = back.crop((0, 112, 160, 212)).convert("RGBA")
    mid_crop = mid.crop((offset, 112, offset + 160, 212))
    scene.alpha_composite(mid_crop)
    scene = tint_multiply(scene, (66, 92, 96), 0.54 - warmth * 0.18)
    if warmth:
        warm = Image.new("RGBA", scene.size, (164, 118, 61, 255))
        scene = Image.blend(scene, ImageChops.screen(scene, warm), 0.11 * warmth)
    return scene


def save_gallery(image: Image.Image, name: str) -> None:
    image = ImageEnhance.Contrast(image).enhance(1.06)
    nearest(image, 3).save(GALLERY / name, optimize=True)


scene_1 = forest_scene(0)
ImageDraw.Draw(scene_1).ellipse((119, 8, 130, 19), fill=(231, 229, 190, 255))
save_gallery(scene_1, "postcard-01.png")

scene_2 = forest_scene(80, 0.25)
mg_small = morning_glory.resize((28, 32), Image.Resampling.NEAREST)
scene_2.alpha_composite(mg_small, (14, 65))
scene_2.alpha_composite(mg_small.transpose(Image.Transpose.FLIP_LEFT_RIGHT), (118, 67))
save_gallery(scene_2, "postcard-02.png")

scene_3 = forest_scene(152, 0.45)
friend = Image.open(CHARACTERS / "friend.png").convert("RGBA").resize((25, 38), Image.Resampling.NEAREST)
creator = Image.open(CHARACTERS / "creator.png").convert("RGBA").resize((25, 38), Image.Resampling.NEAREST)
scene_3.alpha_composite(friend, (54, 58))
scene_3.alpha_composite(creator, (82, 58))
save_gallery(scene_3, "postcard-03.png")

scene_4 = forest_scene(224, 0.8)
lantern_small = lantern.resize((13, 52), Image.Resampling.NEAREST)
glow = Image.new("RGBA", scene_4.size, (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow)
for radius, alpha in ((32, 16), (22, 26), (13, 48)):
    glow_draw.ellipse((120 - radius, 47 - radius, 120 + radius, 47 + radius), fill=(255, 215, 108, alpha))
scene_4 = Image.alpha_composite(scene_4, glow)
scene_4.alpha_composite(lantern_small, (114, 45))
save_gallery(scene_4, "postcard-04.png")

lantern_scene = forest_scene(112, 1.0)
lantern_large = lantern.resize((18, 72), Image.Resampling.NEAREST)
lamp_glow = Image.new("RGBA", lantern_scene.size, (0, 0, 0, 0))
lamp_draw = ImageDraw.Draw(lamp_glow)
for radius, alpha in ((44, 18), (30, 32), (18, 58)):
    lamp_draw.ellipse((80 - radius, 34 - radius, 80 + radius, 34 + radius), fill=(255, 218, 118, alpha))
lantern_scene = Image.alpha_composite(lantern_scene, lamp_glow)
lantern_scene.alpha_composite(lantern_large, (71, 25))
lantern_scene.alpha_composite(morning_glory.resize((22, 26), Image.Resampling.NEAREST), (19, 70))
lantern_scene.alpha_composite(caladium.resize((25, 28), Image.Resampling.NEAREST), (116, 69))
save_gallery(lantern_scene, "lantern-memory.png")

print("Prepared forest layers, props, animated rabbit sheet, plants, and 5 gallery images.")
