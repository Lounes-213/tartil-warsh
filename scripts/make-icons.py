import math
from PIL import Image, ImageDraw

S = 1024
BG = (15, 26, 22, 255)
GOLD = (217, 185, 105, 255)
GOLD_SOFT = (217, 185, 105, 110)

img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# rounded background
pad = 40
d.rounded_rectangle([pad, pad, S - pad, S - pad], radius=210, fill=BG)

cx = cy = S / 2


def rotated_square(inset, color, width):
    half = S / 2 - inset
    pts = [
        (cx, cy - half),
        (cx + half, cy),
        (cx, cy + half),
        (cx - half, cy),
    ]
    d.line(pts + [pts[0]], fill=color, width=width, joint="curve")


rotated_square(180, GOLD_SOFT, 8)
rotated_square(265, GOLD, 10)

# inner square (not rotated)
half = S / 2 - 300
d.rounded_rectangle([cx - half, cy - half, cx + half, cy + half], radius=26, outline=GOLD, width=10)

# 8-point star
R, r = 150, 62
pts = []
for i in range(16):
    ang = math.pi / 8 * i - math.pi / 2
    rad = R if i % 2 == 0 else r
    pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
d.polygon(pts, fill=GOLD)

# center dot
d.ellipse([cx - 26, cy - 26, cx + 26, cy + 26], fill=BG)

img.save("web/public/icon-1024.png")
for size in (512, 384, 192, 180):
    img.resize((size, size), Image.LANCZOS).save(f"web/public/icon-{size}.png")

# maskable: safe zone (80%) -> pad more
mask = Image.new("RGBA", (S, S), BG)
inner = img.resize((int(S * 0.78), int(S * 0.78)), Image.LANCZOS)
mask.alpha_composite(inner, (int(S * 0.11), int(S * 0.11)))
mask.resize((512, 512), Image.LANCZOS).save("web/public/icon-maskable-512.png")

print("icons written")
