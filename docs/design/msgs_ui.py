#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Shared UI primitives for הודעות — one source for the video and the stills."""
import math
from PIL import Image, ImageDraw, ImageFilter
from render_kol import (S, LW, LH, W, H, C, clamp, lerp, lerpc, ease_out, seg, glow,
                        BORDER_SUB, BORDER_STRONG, INK, INK_MUTED, BRAND,
                        BRAND_SURFACE, BRAND_ON, SUCCESS, DANGER, icon_check, icon_lock)

# part-of-speech palette — scoped to the keyboard, never product status tokens
POS = {
    "V":   ((242, 181, 68),  "פועל"),
    "N":   ((91, 155, 245),  "שם עצם"),
    "ADJ": ((46, 197, 197),  "תואר"),
    "C":   ((139, 149, 171), "חיבור"),
    "P":   ((209, 120, 232), "כינוי"),
}
MSG_TABS = ["הקיר", "סיפור", "תיבה"]
MSG_NODE = 1

# ---------------------------------------------------------------- craft
def shadow(c, x, y, w, h, r, blur=9, alpha=105, dy=5):
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(lay).rounded_rectangle(
        [x*S, (y+dy)*S, (x+w)*S, (y+h+dy)*S], radius=r*S, fill=(0, 0, 0, alpha))
    lay = lay.filter(ImageFilter.GaussianBlur(blur))
    c.img.paste(Image.alpha_composite(c.img.convert("RGBA"), lay).convert("RGB"), (0, 0))
    c.d = ImageDraw.Draw(c.img, "RGBA")

def grad_rr(c, x, y, w, h, r, top, bot, outline=None, width=1.2, sh=True):
    if sh: shadow(c, x, y, w, h, r)
    gw, gh = max(1, int(w*S)), max(1, int(h*S))
    g = Image.new("RGB", (1, gh)); gd = ImageDraw.Draw(g)
    for i in range(gh):
        gd.point((0, i), fill=lerpc(top, bot, i/max(1, gh-1)))
    mask = Image.new("L", (gw, gh), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, gw-1, gh-1], radius=int(r*S), fill=255)
    c.img.paste(g.resize((gw, gh)), (int(x*S), int(y*S)), mask)
    c.d = ImageDraw.Draw(c.img, "RGBA")
    if outline: c.rr(x, y, w, h, r, outline=outline, width=width)

# 🔆 ⟦11/09, הכרעת רוי⟧ הרקע הכהה כאן הוא **קולנועי** — הקבצים האלה מייצרים פריימים
# לסרטון (`render_video_*.py`), ⛔ ולא את תמת האפליקציה. נמדד 11/09: **29 מתוך 29**
# הרנדרים ב-`docs/design/` כהים, בזמן שכל מסכי המוצר בהירים.
# ⇒ ‏`36 § 14.4` קובעת במפורש שהרקע ⛔ **אינו מחייב** ושהשפה האחת של `§ 14.2` גוברת.
# ⛔ **אין לבנות מסך מוצר כהה על סמך רנדר כהה, ו⛔ אין לדווח פער רקע כממצא.**
def bg(c):
    g = Image.new("RGB", (1, H)); gd = ImageDraw.Draw(g)
    for i in range(H):
        gd.point((0, i), fill=lerpc((17, 24, 42), (11, 16, 29), i/H))
    c.img.paste(g.resize((W, H)), (0, 0))
    c.d = ImageDraw.Draw(c.img, "RGBA")

def avatar(c, cx, cy, r, col, letter):
    shadow(c, cx-r, cy-r, r*2, r*2, r, blur=5, alpha=90, dy=3)
    for i in range(8, 0, -1):
        f = i/8
        c.circ(cx, cy - r*(1-f)*.25, r*f,
               fill=lerpc(col, tuple(int(v*.55) for v in col), 1-f))
    c.txt(cx, cy + 1, letter, r*.95, "Bold", (12, 18, 32), rtl=False)

def heart(c, cx, cy, s_, col):
    c.circ(cx - s_*.45, cy - s_*.2, s_*.48, fill=col)
    c.circ(cx + s_*.45, cy - s_*.2, s_*.48, fill=col)
    c.d.polygon([((cx - s_*.92))*S, (cy - s_*.08)*S, ((cx + s_*.92))*S, (cy - s_*.08)*S,
                 cx*S, (cy + s_*1.05)*S], fill=col)

def nav(c):
    c.rr(0, LH - 78, LW, 82, 0, fill=(17, 26, 47))
    c.line(0, LH - 78, LW, LH - 78, BORDER_SUB, 1)
    for name, fx in (("הגדרות", .10), ("אני", .30), ("העולם", .50),
                     ("כרטיסיות", .70), ("לימודים", .90)):
        cx = LW * fx
        if name == "העולם":
            glow(c, cx, LH - 72, 26, BRAND, spread=18, a0=95)
            c.circ(cx, LH - 72, 26, fill=BRAND_SURFACE)
            c.circ(cx, LH - 72, 11, outline=BRAND_ON, width=2)
            c.line(cx - 11, LH - 72, cx + 11, LH - 72, BRAND_ON, 2)
            c.txt(cx, LH - 34, name, 9.8, "SemiBold", BRAND_SURFACE)
        else:
            col = INK_MUTED + (150,)
            c.rr(cx - 9, LH - 62, 18, 18, 5, outline=col, width=1.5)
            c.txt(cx, LH - 34, name, 9.8, "Regular", col)
    c.rr(LW/2 - 45, LH - 12, 90, 4, 2, fill=(255, 255, 255, 55))

# ---------------------------------------------------------------- header
def app_header(c, sub, title):
    c.txt(LW - 24, 100, sub, 12.5, "Regular", INK_MUTED + (190,), anchor="rm")
    c.txt(LW - 24, 122, title, 22, "Bold", INK, anchor="rm")

def msg_tabs(c, pos, press=None):
    x0, w = 20, LW - 40
    sw = w / 3
    c.rr(x0, 140, w, 36, 12, fill=(20, 28, 46))
    c.rr(x0, 140, w, 36, 12, outline=BORDER_SUB, width=1)
    px = x0 + w - (pos + 1) * sw
    c.rr(px + 3, 143, sw - 6, 30, 10, fill=BRAND + (58,))
    c.rr(px + 3, 143, sw - 6, 30, 10, outline=BRAND + (200,), width=1.3)
    for i, t in enumerate(MSG_TABS):
        cx = x0 + w - (i + .5) * sw
        near = abs(pos - i) < .5
        pr = 1.5 if press == i else 0
        c.txt(cx, 158 + pr, t, 13, "Bold" if near else "Regular",
              BRAND_SURFACE if near else INK_MUTED + (200,))
    return [x0 + w - (i + .5) * sw for i in range(3)]

# ---------------------------------------------------------------- keyboard
def block(c, x, y, text, pos, press=0.0, alpha=255):
    col = POS[pos][0]
    w = c.tw(text, 14.5, "SemiBold") + 30
    p = 1.6 * press
    c.rr(x + p/2, y + p/2, w - p, 40 - p, 11, fill=col + (int(46 * alpha / 255),))
    c.rr(x + p/2, y + p/2, w - p, 40 - p, 11, outline=col + (alpha,), width=1.3)
    c.txt(x + w/2, y + 21, text, 14.5, "SemiBold", INK + (alpha,), rtl=False)
    c.d.rectangle([(x + 6)*S, (y + 5)*S, (x + 9)*S, (y + 11)*S], fill=col + (alpha,))
    return w

def tab_key(hint):
    return {"פועל": "V", "שם עצם": "N", "תואר": "ADJ", "חיבור": "C",
            "כינוי": "P", "פתיחה": "P"}.get(hint, "C")

def keyboard(c, top, rows, hint, count, tap=None, press=0.0, back=True, alpha=255):
    """Block set is a function of what was already chosen — never a fixed grid."""
    c.rr(0, top, LW, LH - top + 20, 22, fill=(22, 30, 48, alpha))
    c.line(0, top, LW, top, BORDER_SUB + (alpha,), 1)
    c.rr(LW/2 - 20, top + 9, 40, 4, 2, fill=BORDER_STRONG + (140,))
    c.txt(18, top + 12, f"{count} המשכים אפשריים", 10.5, "Medium",
          INK_MUTED + (175,), anchor="lm")
    lbl = "מה יכול לבוא עכשיו"
    c.txt(LW - 18, top + 36, lbl, 11.5, "SemiBold", (155, 172, 200), anchor="rm")
    hw = c.tw(hint, 11, "Bold") + 22
    hx = LW - 18 - c.tw(lbl, 11.5, "SemiBold") - hw - 8
    col = POS[tab_key(hint)][0]
    c.rr(hx, top + 26, hw, 21, 10, fill=col + (55,))
    c.txt(hx + hw/2, top + 37, hint, 11, "Bold", col)
    ry = top + 58
    for row in rows:
        bx = LW - 18
        for ci, (txt, pos) in enumerate(row):
            w = c.tw(txt, 14.5, "SemiBold") + 30
            if bx - w < 62: break
            block(c, bx - w, ry, txt, pos, alpha=alpha)
            bx -= w + 8
        ry += 48
    if back:
        c.rr(18, ry - 48, 42, 40, 11, fill=(36, 46, 68))
        c.rr(18, ry - 48, 42, 40, 11, outline=BORDER_STRONG + (170,), width=1.2)
        c.d.polygon([(28*S), (ry - 28)*S, (40*S), (ry - 36)*S, (40*S), (ry - 20)*S],
                    fill=(190, 203, 224))
    c.txt(LW/2, LH - 24, "כל בחירה מחליפה את הסט הבא", 10.5, "Regular",
          (120, 134, 158))

def block_xy(c, top, rows, idx):
    """screen position of a block, for the touch indicator"""
    bx = LW - 18
    for ci, (txt, pos) in enumerate(rows[idx[0]]):
        w = c.tw(txt, 14.5, "SemiBold") + 30
        if ci == idx[1]:
            return bx - w/2, top + 58 + idx[0] * 48 + 20
        bx -= w + 8
    return LW/2, top + 78

def compose_bar(c, y, words, send_press=0.0):
    c.rr(14, y, LW - 28, 56, 16, fill=(28, 38, 58))
    c.rr(14, y, LW - 28, 56, 16, outline=(48, 64, 94), width=1.2)
    bw = 52; p = 2 * send_press
    c.rr(LW - 72 + p/2, y + 6 + p/2, bw - p, 44 - p, 12, fill=BRAND_SURFACE)
    c.d.polygon([(LW - 54)*S, (y + 20)*S, (LW - 54)*S, (y + 36)*S,
                 (LW - 38)*S, (y + 28)*S], fill=BRAND_ON)
    x = 26
    for txt, pos in words:
        col = POS[pos][0]
        w = c.tw(txt, 13.5, "SemiBold") + 15
        c.rr(x, y + 13, w, 30, 8, fill=col + (60,))
        c.rr(x, y + 13, w, 30, 8, outline=col + (200,), width=1.1)
        c.txt(x + w/2, y + 29, txt, 13.5, "SemiBold", INK, rtl=False)
        x += w + 5
    if words: c.rr(x + 1, y + 16, 2, 24, 1, fill=BRAND_SURFACE)
    else: c.txt(LW - 90, y + 28, "הרכב משפט מהבלוקים", 12.5, "Regular",
                INK_MUTED + (150,), anchor="rm")

# ---------------------------------------------------------------- feed
def mini_comment(c, y, who, ltr, col, text, likes, liked=False):
    c.rr(34, y, LW - 68, 44, 12, fill=(25, 34, 52))
    c.rr(34, y, LW - 68, 44, 12, outline=(38, 51, 74, 255), width=1)
    avatar(c, LW - 50, y + 22, 11, col, ltr)
    c.txt(LW - 68, y + 15, who, 10.5, "Bold", (176, 190, 214), anchor="rm")
    c.txt(LW - 68, y + 33, text, 12.5, "Regular", (231, 238, 251), anchor="rm", rtl=False)
    hc = DANGER if liked else (128, 142, 168)
    heart(c, 48, y + 22, 5, hc)
    c.txt(60, y + 23, str(likes), 10.5, "Bold", hc, anchor="lm", rtl=False)
    return 44

def photo(c, x, y, w, h):
    gh = int(h*S)
    g = Image.new("RGB", (1, gh)); gd = ImageDraw.Draw(g)
    for i in range(gh):
        gd.point((0, i), fill=lerpc((94, 148, 214), (238, 186, 130), i/max(1, gh-1)))
    mask = Image.new("L", (int(w*S), gh), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, int(w*S)-1, gh-1],
                                           radius=int(12*S), fill=255)
    c.img.paste(g.resize((int(w*S), gh)), (int(x*S), int(y*S)), mask)
    c.d = ImageDraw.Draw(c.img, "RGBA")
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0)); lc = C(lay)
    lc.d = ImageDraw.Draw(lay, "RGBA")
    lc.circ(x + w*.74, y + h*.3, 15, fill=(255, 236, 178, 235))
    lc.d.polygon([(x*S, (y+h)*S), ((x+w*.34)*S, (y+h*.46)*S), ((x+w*.62)*S, (y+h)*S)],
                 fill=(72, 116, 96))
    lc.d.polygon([((x+w*.3)*S, (y+h)*S), ((x+w*.62)*S, (y+h*.34)*S), ((x+w)*S, (y+h)*S)],
                 fill=(58, 96, 82))
    lc.rr(x, y + h*.78, w, h*.22, 0, fill=(46, 74, 70, 235))
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).rounded_rectangle([x*S, y*S, (x+w)*S, (y+h)*S],
                                        radius=int(12*S), fill=255)
    c.img.paste(lay.convert("RGB"), (0, 0),
                Image.composite(lay.split()[3], Image.new("L", (W, H), 0), m))
    c.d = ImageDraw.Draw(c.img, "RGBA")
    c.rr(x, y, w, h, 12, outline=(70, 92, 128, 200), width=1.2)

def post(c, y, when, q, sub=None, img=False, likes=31, ncom=24,
         comments=(), more=None):
    ih = 116 if img else 0
    qh = 26 + (20 if sub else 0)
    ch = sum(52 for _ in comments) + (20 if more else 0)
    h = 76 + qh + ih + 30 + ch
    grad_rr(c, 20, y, LW - 40, h, 18, (31, 43, 66), (23, 32, 50),
            outline=(46, 62, 90, 255), width=1.2)
    avatar(c, LW - 44, y + 30, 16, (245, 200, 110), "R")
    c.txt(LW - 68, y + 24, "רוני · המורה", 13, "Bold", INK, anchor="rm")
    c.txt(LW - 68, y + 41, when, 10.5, "Regular", (139, 154, 180), anchor="rm")
    yy = y + 62
    c.txt(LW - 26, yy + 14, q, 16, "Bold", INK, anchor="rm", rtl=False)
    yy += 26
    if sub:
        c.txt(LW - 26, yy + 12, sub, 12.5, "Regular", (170, 185, 210),
              anchor="rm", rtl=False); yy += 20
    if img:
        photo(c, 30, yy + 4, LW - 60, 104); yy += 116
    c.line(32, yy + 12, LW - 32, yy + 12, (42, 56, 82), 1)
    heart(c, 40, yy + 28, 6, (139, 154, 180))
    c.txt(54, yy + 29, str(likes), 11.5, "Bold", (139, 154, 180), anchor="lm", rtl=False)
    c.txt(LW - 32, yy + 29, f"{ncom} תגובות", 11.5, "SemiBold",
          (155, 172, 200), anchor="rm")
    yy += 44
    for who, ltr, col, txt, lk, liked in comments:
        yy += mini_comment(c, yy, who, ltr, col, txt, lk, liked) + 8
    if more:
        c.txt(LW - 40, yy + 6, more, 11.5, "Bold", BRAND_SURFACE, anchor="rm")
    return h
