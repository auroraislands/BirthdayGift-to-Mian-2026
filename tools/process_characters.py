"""Extract the two supplied pixel characters without erasing interior dark pixels."""

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "人物.png"
OUTPUT = Path(__file__).resolve().parents[1] / "assets" / "characters"

# Generous crops around the two figures. Background removal happens before trim.
CHARACTERS = {
    "friend.png": (120, 60, 390, 430),
    "creator.png": (570, 70, 860, 430),
}


def is_background(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    # The source background is black with a few near-black compression/edge shades.
    # Flood filling from the crop perimeter prevents enclosed dark character pixels
    # from being removed.
    return a == 0 or (max(r, g, b) <= 42 and max(r, g, b) - min(r, g, b) <= 18)


def clear_connected_background(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    pixels = image.load()
    width, height = image.size
    queue: deque[tuple[int, int]] = deque()
    visited: set[tuple[int, int]] = set()

    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        visited.add((x, y))
        if not is_background(pixels[x, y]):
            continue
        r, g, b, _ = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        if x:
            queue.append((x - 1, y))
        if x + 1 < width:
            queue.append((x + 1, y))
        if y:
            queue.append((x, y - 1))
        if y + 1 < height:
            queue.append((x, y + 1))

    alpha = image.getchannel("A")
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError("No visible pixels remained after background removal")

    # Keep a transparent pixel border so nearest-neighbour scaling stays clean.
    left, top, right, bottom = bbox
    left = max(0, left - 2)
    top = max(0, top - 2)
    right = min(width, right + 2)
    bottom = min(height, bottom + 2)
    return image.crop((left, top, right, bottom))


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for filename, crop_box in CHARACTERS.items():
        sprite = clear_connected_background(source.crop(crop_box))
        sprite.save(OUTPUT / filename, optimize=True)
        print(f"{filename}: {sprite.size[0]}x{sprite.size[1]}")


if __name__ == "__main__":
    main()
