"""Cut the supplied artwork (assets-src/, never modified) into game-ready sprites and backgrounds.
Usage: python tools/prepare_assets.py   (needs pillow, numpy, scipy)"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
SRC, PUB, OUT = ROOT / "assets-src", ROOT / "public" / "assets", ROOT / "tools" / "out"

EV = ["idle", "wave", "talk", "think", "listen", "happy", "sad", "point"]
VB = ["ready", "pass", "set", "spike", "win", "sad"]
SHEETS = {  # file: (folder, cols, rows, names)
    "alya-ev": ("alya", 4, 2, EV), "mia-ev": ("mia", 4, 2, EV), "leo-ev": ("leo", 4, 2, EV),
    "teacher-gunluk": ("teacher", 4, 2, ["idle", "wave", "talk", "think", "phone", "happy", "oh", "point"]),
    "alya-voleybol": ("alyav", 3, 2, VB), "mia-voleybol": ("miav", 3, 2, VB), "teacher-voleybol": ("teacherv", 3, 2, VB),
    "kedi": ("cat", 3, 2, ["sit", "box", "crouch", "walk", "jump", "sleep"]),
    "esya-sinif": ("obj", 5, 2, ["bookcase", "board", "cupboard", "computer", "desk", "ruler", "television", "whiteboard", "pen", "book"]),
    "esya-oyuncak": ("obj", 3, 3, ["alien", "camera", "board-game", "kite", "lorry", "robot", "tablet", "watch", "teddy-bear"]),
    "esya-ev": ("obj", 5, 2, ["clock", "lamp", "mat", "mirror", "phone", "sofa", "table", "bed", "chair", "box"]),
    "esya-ayakkabi": ("obj", 3, 2, ["shoes-turquoise", "shoes-lilac", "shoes-grey", "shoes-red", "shoes-yellow", "shoes-black"]),
    "esya-sus": ("obj", 4, 3, ["whale", "bee", "nose", "plant", "cushion", "vase", "frame", "lights", "key", "volleyball", "trophy", "gift"]),
}
MAXH = {"obj": 360, "cat": 420}


def save(img, path, q=88):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=q, method=4)


def sprites():
    meta, shown = {}, {}
    for f, (folder, cols, rows, names) in SHEETS.items():
        a = np.asarray(Image.open(SRC / f"{f}.webp").convert("RGBA")).copy()
        H, W = a.shape[:2]
        solid = a[..., 3] >= 60
        lab, n = ndi.label(solid)
        size = ndi.sum(solid, lab, range(1, n + 1))
        cen = ndi.center_of_mass(solid, lab, range(1, n + 1))
        for i, name in enumerate(names):
            r, c = divmod(i, cols)
            ids = [k + 1 for k in range(n) if size[k] > 120 and int(cen[k][0] * rows / H) == r and int(cen[k][1] * cols / W) == c]
            m = np.isin(lab, ids)
            near = ndi.binary_dilation(m, iterations=3)
            s = a.copy()
            al = np.clip((s[..., 3].astype(int) - 20) * 255 // 225, 0, 255)  # drop the faint haze
            s[..., 3] = np.where(near, al, 0)
            ys, xs = np.nonzero(s[..., 3] > 8)
            im = Image.fromarray(s[ys.min():ys.max() + 1, xs.min():xs.max() + 1], "RGBA")
            mh = MAXH.get(folder, 560)
            if im.height > mh:
                im = im.resize((round(im.width * mh / im.height), mh), Image.LANCZOS)
            save(im, PUB / folder / f"{name}.webp")
            meta.setdefault(folder, {})[name] = [im.width, im.height]
            shown.setdefault(f, []).append(im)
    return meta, shown


def fix_map(im, portrait):
    """The hall is for volleyball: hide the basketball hoop behind a bush, put a net on the little court."""
    im = im.copy()
    ball = Image.open(PUB / "obj" / "volleyball.webp")
    if portrait:
        ball_c, bush, dst, net = (422, 1233, 74), (805, 1140, 941, 1262), (668, 1280, 764, 1402), ((618, 1412), (742, 1452))
    else:
        ball_c, bush, dst, net = (1336, 556, 84), (1545, 462, 1668, 570), (1558, 618, 1636, 702), ((1515, 712), (1612, 754))
    b = im.crop(bush).resize((dst[2] - dst[0], dst[3] - dst[1]), Image.LANCZOS)
    mask = Image.new("L", b.size, 0)
    ImageDraw.Draw(mask).ellipse((3, 2, b.width - 3, b.height - 2), fill=255)
    im.paste(b, dst[:2], mask.filter(ImageFilter.GaussianBlur(4)))
    cx, cy, d = ball_c
    bb = ball.resize((d, round(d * ball.height / ball.width)), Image.LANCZOS)
    im.paste(bb, (cx - bb.width // 2, cy - bb.height // 2), bb)
    dr = ImageDraw.Draw(im)
    (x0, y0), (x1, y1) = net
    h = 34
    for t in range(0, 9):
        x = x0 + (x1 - x0) * t / 8; y = y0 + (y1 - y0) * t / 8
        dr.line((x, y - h, x, y - 10), fill=(255, 255, 255), width=1)
    for k in (h, 26, 18, 10):
        dr.line((x0, y0 - k, x1, y1 - k), fill=(255, 255, 255), width=3 if k == h else 1)
    for x, y in net:
        dr.line((x, y + 2, x, y - h - 2), fill=(150, 100, 200), width=5)
    return im


def backgrounds():
    for n in ["harita", "bahce", "sinif", "oyuncak-odasi", "bebek-evi", "voleybol"]:
        for o, size in [("yatay", (1600, 900)), ("dikey", (900, 1600))]:
            im = Image.open(SRC / f"{n}-{o}.webp").convert("RGB")
            if n == "harita":
                im = fix_map(im, o == "dikey")
            save(im.resize(size, Image.LANCZOS), PUB / "bg" / f"{n}-{o}.webp", 84)


if __name__ == "__main__":
    meta, shown = sprites()
    backgrounds()
    (ROOT / "src" / "assets" / "sprites.json").write_text(json.dumps(meta))
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    for f, ims in shown.items():
        t = [i.resize((max(1, round(i.width * 110 / i.height)), 110)) for i in ims]
        w = sum(x.width + 8 for x in t)
        row = Image.new("RGBA", (max(w, 10), 118), (50, 70, 105, 255)); x = 4
        for k in t: row.alpha_composite(k, (x, 4)); x += k.width + 8
        rows.append(row)
    W = max(r.width for r in rows); c = Image.new("RGB", (W, 118 * len(rows)), (50, 70, 105))
    for i, r in enumerate(rows): c.paste(r.convert("RGB"), (0, 118 * i))
    c.save(OUT / "contact.png")
    mp = Image.new("RGB", (1600 + 507, 900)); mp.paste(Image.open(PUB/"bg"/"harita-yatay.webp"), (0, 0)); mp.paste(Image.open(PUB/"bg"/"harita-dikey.webp").resize((506, 900)), (1601, 0)); mp.resize((1400, 598)).save(OUT / "map.png")
    print("ok", sum(len(v) for v in meta.values()))
