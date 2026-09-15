#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Video F — סרטים. Vertical clip feed · tap a word to collect · Hebrew on demand.
All clip imagery is synthetic placeholder art — no real film content is depicted."""
import math, os, random
from PIL import Image, ImageDraw
from render_kol import (S, LW, LH, W, H, FPS, C, clamp, lerp, lerpc, ease_out,
                        ease_in_out, ease_back, seg, glow, status_bar, touch,
                        scene_label, bottom_nav, BORDER_SUB, BORDER_STRONG, INK,
                        INK_MUTED, BRAND, BRAND_SURFACE, BRAND_ON, SUCCESS, DANGER,
                        icon_check, icon_gear, icon_books)
from msgs_ui import bg, grad_rr
import render_world as RW

OUT = "/home/claude/frames_f"
GOLD = (250, 204, 74)

RW.APPS["סרטים"] = (icon_books, "למידה", "לימוד מתוך קליפים עם כתוביות")
RING = ["זירת קרב", "הודעות", "סרטים", "סיפורים", "אמירנט", "אוצר מילים"]
CLIP_NODE = 2

# ---------------------------------------------------------------- clip art
def clip_frame(c, y0, h, seed, t):
    """synthetic cinematic frame — a stand-in, never real footage"""
    rnd = random.Random(seed)
    pal = [((22, 30, 58), (96, 62, 120), (232, 140, 96)),
           ((14, 34, 40), (32, 96, 104), (168, 224, 210)),
           ((40, 20, 28), (128, 52, 62), (250, 176, 120))][seed % 3]
    top, mid, warm = pal
    g = Image.new("RGB", (1, int(h*S)))
    gd = ImageDraw.Draw(g)
    for i in range(int(h*S)):
        f = i / max(1, h*S - 1)
        gd.point((0, i), fill=lerpc(top, mid, f) if f < .62
                 else lerpc(mid, warm, (f - .62) / .38))
    c.img.paste(g.resize((W, int(h*S))), (0, int(y0*S)))
    c.d = ImageDraw.Draw(c.img, "RGBA")
    # sun / light source
    cx, cy = LW * (.3 + .4 * ((seed * 7) % 5) / 5), y0 + h * .34
    for k in range(9, 0, -1):
        f = k / 9
        c.circ(cx, cy, 70 * f, fill=warm + (int(16 * (1 - f) * 9),))
    # horizon + silhouettes
    hy = y0 + h * .62
    c.d.rectangle([0, hy*S, W, (y0+h)*S], fill=tuple(int(v*.35) for v in mid))
    for i in range(6):
        bx = (i * 71 + seed * 23) % LW
        bh = 40 + (i * 37 + seed * 11) % 90
        c.rr(bx, hy - bh, 34 + (i % 3) * 18, bh, 3,
             fill=tuple(int(v*.22) for v in mid))
    for i, (fx, fs) in enumerate([(.36, 1.0), (.62, .82)]):
        px, ps = LW * fx, 74 * fs
        c.d.ellipse([(px-ps*.19)*S, (hy-ps)*S, (px+ps*.19)*S, (hy-ps*.62)*S],
                    fill=(10, 12, 20))
        c.d.polygon([((px-ps*.3)*S, hy*S), ((px+ps*.3)*S, hy*S),
                     ((px+ps*.2)*S, (hy-ps*.66)*S), ((px-ps*.2)*S, (hy-ps*.66)*S)],
                    fill=(10, 12, 20))
    # grain
    for _ in range(120):
        gx, gy = rnd.uniform(0, LW), rnd.uniform(y0, y0 + h)
        c.circ(gx, gy, rnd.uniform(.4, 1.1), fill=(255, 255, 255, rnd.randint(8, 26)))
    # vignette
    for k in range(14):
        f = k / 14
        c.rr(-LW*.2 + LW*f*.2, y0 - h*.2 + h*f*.2, LW*1.4 - LW*f*.4,
             h*1.4 - h*f*.4, 40, outline=(0, 0, 0, 16), width=10)

SUB1 = [("This", None), ("is", None), ("absolutely", None), ("ridiculous", "hit"), ("!", None)]
SUB0 = [("You", None), ("have", None), ("no", None), ("idea", None),
        ("what", None), ("you", None), ("started", None), (".", None)]

def sub_line(c, y, tokens, size=21, hi=None, hidden=None, alpha=255):
    total = sum(c.tw(w + " ", size, "Bold") for w, _ in tokens)
    x = LW/2 - total/2
    boxes = {}
    for w, key in tokens:
        wpx = c.tw(w + " ", size, "Bold")
        col = GOLD if (hi and key == hi) else (255, 255, 255)
        if not (hidden and key == hidden):
            c.txt(x + 1.6, y + 1.6, w, size, "Bold", (0, 0, 0, int(alpha*.75)),
                  anchor="lm", rtl=False)
            c.txt(x, y, w, size, "Bold", col + (alpha,), anchor="lm", rtl=False)
        if key: boxes[key] = (x + wpx/2 - c.tw(" ", size, "Bold")/2, y)
        x += wpx
    return boxes

def vault(c, count, pulse=0.0):
    x, y = LW - 44, 106
    r = 22 + 4 * pulse
    if pulse > 0:
        glow(c, x, y, r, GOLD, spread=18, a0=int(150 * pulse))
    c.circ(x, y, r, fill=(20, 28, 46, 220))
    c.circ(x, y, r, outline=GOLD + (230,), width=1.8)
    c.rr(x - 10, y - 7, 20, 14, 3, outline=GOLD, width=1.8)
    c.line(x - 10, y - 1, x + 10, y - 1, GOLD, 1.6)
    c.circ(x, y + 3, 2.4, fill=GOLD)
    cw = c.tw(str(count), 11, "Bold") + 12
    c.rr(x - cw/2, y + r - 2, cw, 18, 9, fill=GOLD)
    c.txt(x, y + r + 7, str(count), 11, "Bold", (30, 24, 8), rtl=False)

def chrome(c, count, pulse=0.0, gear_press=0.0, hebrew=False, note=None):
    c.rr(0, 84, LW, 60, 0, fill=(0, 0, 0, 90))
    c.txt(24, 114, "סרטים", 15, "Bold", (255, 255, 255), anchor="lm")
    c.txt(24, 134, "קליפ 3 מתוך 12 · רמה B1", 10.5, "Regular",
          (220, 228, 240, 200), anchor="lm")
    vault(c, count, pulse)
    gx, gy = 34, LH - 236
    c.circ(gx, gy, 21 - 2 * gear_press, fill=(0, 0, 0, 120))
    c.circ(gx, gy, 21 - 2 * gear_press, outline=(255, 255, 255, 150), width=1.3)
    icon_gear(c, gx, gy, (255, 255, 255, 220), sc=1.0)
    if hebrew:
        c.rr(gx + 30, gy - 13, 62, 26, 13, fill=BRAND_SURFACE)
        c.txt(gx + 61, gy, "עברית", 11.5, "Bold", BRAND_ON)
    if note:
        nw = c.tw(note, 12.5, "Bold") + 34
        c.rr(LW/2 - nw/2, 176, nw, 34, 17, fill=(0, 0, 0, 175))
        c.txt(LW/2, 193, note, 12.5, "Bold", (255, 255, 255))

# =========================================================== scenes
def scene_ring(t):
    c = C(); bg(c); status_bar(c)
    tap = 1.5
    RW.draw_ring(c, RING)
    bottom_nav(c, active="העולם", world_pulse=t * .5)
    if t >= tap:
        p = ease_in_out(clamp(seg(t, tap, tap + 1.1)))
        lay = C(); lay.img = c.img.copy()
        clip_frame(lay, 0, LH, 1, t)
        chrome(lay, 41)
        sub_line(lay, LH - 178, SUB0)
        mask = Image.new("L", (W, H), 0)
        R_ = p * math.hypot(W, H) * .85
        ImageDraw.Draw(mask).ellipse([RW.RING_CX*S - R_, RW.RING_CY*S - R_,
                                      RW.RING_CX*S + R_, RW.RING_CY*S + R_], fill=255)
        c.img.paste(lay.img, (0, 0), mask)
        c.d = ImageDraw.Draw(c.img, "RGBA")
    if abs(t - tap) < .45:
        x, y = RW.pos_of(CLIP_NODE, len(RING))
        touch(c, x, y, press=clamp(1 - abs(t - tap) / .3), ripple=seg(t, tap, tap + .45))
    scene_label(c, t, "העולם · סרטים")
    return c.img

def scene_feed(t):
    c = C()
    sw = 2.0
    if t < sw:
        clip_frame(c, 0, LH, 1, t)
        sub_line(c, LH - 178, SUB0)
        chrome(c, 41)
    else:
        p = ease_out(clamp(seg(t, sw, sw + .45)))
        off = LH * p
        clip_frame(c, -off, LH, 1, t)
        clip_frame(c, LH - off, LH, 2, t)
        if p < .8: sub_line(c, LH - 178 - off, SUB0, alpha=int(255 * (1 - p)))
        sub_line(c, LH * 2 - 178 - off, SUB1, alpha=int(255 * p))
        chrome(c, 41)
    status_bar(c)
    if sw - .5 <= t < sw + .3:
        p2 = clamp(seg(t, sw - .5, sw + .1))
        touch(c, LW/2, LH * .62 - 190 * p2, press=.8)
    scene_label(c, t, "פיד אנכי · החלקה למעלה")
    return c.img

def scene_collect(t):
    c = C()
    tap, fly0, fly1 = 1.3, 1.55, 2.35
    clip_frame(c, 0, LH, 2, t)
    hidden = "hit" if t >= fly0 else None
    hi = "hit" if tap <= t < fly0 else None
    boxes = sub_line(c, LH - 178, SUB1, hi=hi, hidden=hidden)
    wx, wy = boxes["hit"]
    pulse = 0.0
    if fly1 <= t < fly1 + .5:
        pulse = 1 - seg(t, fly1, fly1 + .5)
    chrome(c, 41 if t < fly1 else 42, pulse=pulse)
    if fly0 <= t < fly1:
        p = ease_in_out(seg(t, fly0, fly1))
        tx, ty = LW - 44, 106
        px = lerp(wx, tx, p)
        py = lerp(wy, ty, p) - 150 * math.sin(p * math.pi) * .55
        sc = lerp(21, 9, p)
        for k in range(3, 0, -1):
            q = clamp(p - k * .16)
            if q <= 0: continue
            gx = lerp(wx, tx, q)
            gy = lerp(wy, ty, q) - 150 * math.sin(q * math.pi) * .55
            c.txt(gx, gy, "ridiculous", lerp(21, 9, q), "Bold",
                  GOLD + (int(46 * (1 - k / 3)),), rtl=False)
        glow(c, px, py, 16, GOLD, spread=12, a0=int(120 * (1 - p)))
        c.txt(px, py, "ridiculous", sc, "Bold", GOLD, rtl=False)
    if t >= fly1 + .1:
        a = int(255 * (1 - seg(t, fly1 + .7, fly1 + 1.3)))
        if a > 0:
            c.txt(LW - 44, 152, "נוספה לאוצר", 11, "Bold", GOLD + (a,))
    status_bar(c)
    if abs(t - tap) < .4:
        touch(c, wx, wy, press=clamp(1 - abs(t - tap) / .25),
              ripple=seg(t, tap, tap + .4))
    scene_label(c, t, "הקשה על מילה · נאספת לאוצר")
    return c.img

def scene_hebrew(t):
    c = C()
    tap = 1.2
    clip_frame(c, 0, LH, 2, t)
    on = t >= tap + .1
    sub_line(c, LH - 200 if on else LH - 178, SUB1)
    if on:
        p = ease_back(clamp(seg(t, tap + .1, tap + .5)))
        a = int(255 * clamp(p * 1.3))
        c.txt(LW/2 + 1.4, LH - 164 + 1.4, "זה פשוט מגוחך!", 18, "Bold",
              (0, 0, 0, int(a*.7)))
        c.txt(LW/2, LH - 166, "זה פשוט מגוחך!", 18, "Bold", (168, 214, 255, a))
    chrome(c, 42, gear_press=clamp(1 - abs(t - tap) / .25) if abs(t - tap) < .25 else 0,
           hebrew=on, note="שליטה מלאה בקצב שלך" if 1.9 <= t < 3.3 else None)
    status_bar(c)
    if abs(t - tap) < .4:
        touch(c, 34, LH - 236, press=clamp(1 - abs(t - tap) / .25),
              ripple=seg(t, tap, tap + .4))
    scene_label(c, t, "כתוביות עברית לפי בחירה")
    return c.img

def scene_end(t):
    c = C()
    sw = .6
    p = ease_out(clamp(seg(t, sw, sw + .45)))
    off = LH * p
    clip_frame(c, -off, LH, 2, t)
    clip_frame(c, LH - off, LH, 3, t)
    sub_line(c, LH * 2 - 178 - off, SUB0, alpha=int(255 * p))
    chrome(c, 42)
    fade = clamp(seg(t, 1.6, 2.3))
    if fade > 0:
        c.d.rectangle([0, 0, W, H], fill=(13, 19, 33, int(240 * fade)))
        a = int(255 * clamp(seg(t, 1.9, 2.5)))
        glow(c, LW/2, LH/2 - 30, 52, BRAND, spread=28, a0=int(80 * fade))
        c.circ(LW/2, LH/2 - 30, 52, fill=(24, 34, 54, a))
        c.circ(LW/2, LH/2 - 30, 52, outline=BRAND + (int(190 * fade),), width=1.8)
        c.txt(LW/2, LH/2 - 30, "קול", 30, "Bold", INK + (a,))
        c.txt(LW/2, LH/2 + 62, "ללמוד אנגלית מתוך מה שאתם אוהבים", 14, "SemiBold",
              INK + (a,))
        c.txt(LW/2, LH/2 + 92, "כל הקליפים מוטמעים · אין אחסון מקומי", 11, "Regular",
              INK_MUTED + (int(a*.8),))
    status_bar(c)
    return c.img

SCENES = [(scene_ring, 3.4), (scene_feed, 3.2), (scene_collect, 4.2),
          (scene_hebrew, 4.0), (scene_end, 3.4)]
XF = .3

def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
    total = sum(d for _, d in SCENES) - XF * (len(SCENES) - 1)
    n = int(total * FPS)
    starts, acc = [], 0.0
    for fn, d in SCENES:
        starts.append(acc); acc += d - XF
    print(f"video F: {total:.2f}s  {n} frames", flush=True)
    for i in range(n):
        gt = i / FPS
        img = None
        for si, (fn, d) in enumerate(SCENES):
            lt = gt - starts[si]
            if 0 <= lt < d:
                cur = fn(lt)
                img = cur if img is None else Image.blend(img, cur, clamp((gt - starts[si]) / XF))
        if img is None: img = SCENES[-1][0](SCENES[-1][1] - .01)
        img.save(f"{OUT}/f_{i:05d}.png")
        if i % 90 == 0: print(f"  {i}/{n}", flush=True)
    print("done", flush=True)

if __name__ == "__main__":
    main()
