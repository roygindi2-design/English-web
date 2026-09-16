#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
קול (Kol) — UX walkthrough renderer.
Deterministic frame-by-frame render of the target mobile UI, using the real
design tokens from lib/core/palette.ts (dark-mode column) and real Hebrew copy.
Output: 1125x2436 (iPhone X @3x, i.e. 375x812 logical), 30fps.
"""
import math, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from bidi.algorithm import get_display

S = 3                      # logical -> device scale
LW, LH = 375, 812          # logical size
W, H = LW * S, LH * S
FPS = 30
OUT = "/home/claude/frames_a"

# ---------------------------------------------------------------- tokens
SURFACE       = (15, 23, 42)      # #0f172a
RAISED        = (30, 41, 59)      # #1e293b
INK           = (248, 250, 252)   # #f8fafc
INK_MUTED     = (203, 213, 225)   # #cbd5e1
BORDER_SUB    = (51, 65, 85)      # #334155
BORDER_STRONG = (148, 163, 184)   # #94a3b8
BRAND         = (57, 135, 229)    # #3987e5
BRAND_SURFACE = (125, 171, 248)   # #7dabf8
BRAND_ON      = (15, 23, 42)      # #0f172a
SUCCESS       = (74, 222, 128)    # #4ade80
DANGER        = (248, 113, 113)   # #f87171

FONT_PATH = "/root/.fonts/Heebo.ttf"
_fc = {}
def F(size, weight="Regular"):
    k = (size, weight)
    if k not in _fc:
        f = ImageFont.truetype(FONT_PATH, int(size * S))
        try: f.set_variation_by_name(weight)
        except Exception: pass
        _fc[k] = f
    return _fc[k]

def T(s):
    """Pillow is built with Raqm (FriBiDi + HarfBuzz), so it reorders RTL runs
    itself. Pre-reordering with python-bidi here would reverse them twice."""
    return s

# ---------------------------------------------------------------- easing
def clamp(v, a=0.0, b=1.0): return max(a, min(b, v))
def lerp(a, b, t): return a + (b - a) * t
def lerpc(c1, c2, t):
    return tuple(int(round(lerp(c1[i], c2[i], t))) for i in range(3))
def ease_out(t):  t = clamp(t); return 1 - (1 - t) ** 3
def ease_in_out(t):
    t = clamp(t)
    return 4 * t ** 3 if t < .5 else 1 - (-2 * t + 2) ** 3 / 2
def ease_back(t):
    t = clamp(t); c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
def seg(t, a, b):
    """normalized progress of t inside [a,b]"""
    return clamp((t - a) / (b - a)) if b > a else 1.0

# ---------------------------------------------------------------- canvas
class C:
    """Draws in logical units; scales to device pixels."""
    def __init__(self, img=None):
        self.img = img or Image.new("RGB", (W, H), SURFACE)
        self.d = ImageDraw.Draw(self.img, "RGBA")
    def s(self, v): return v * S
    def rr(self, x, y, w, h, r, fill=None, outline=None, width=1):
        self.d.rounded_rectangle(
            [x*S, y*S, (x+w)*S, (y+h)*S], radius=r*S,
            fill=fill, outline=outline, width=max(1, int(width*S)))
    def circ(self, cx, cy, r, fill=None, outline=None, width=1):
        self.d.ellipse([(cx-r)*S, (cy-r)*S, (cx+r)*S, (cy+r)*S],
                       fill=fill, outline=outline, width=max(1, int(width*S)))
    def line(self, x1, y1, x2, y2, fill, width=1):
        self.d.line([x1*S, y1*S, x2*S, y2*S], fill=fill, width=max(1, int(width*S)))
    def txt(self, x, y, s, size, weight="Regular", fill=INK, anchor="mm", rtl=True):
        self.d.text((x*S, y*S), T(s) if rtl else s, font=F(size, weight),
                    fill=fill, anchor=anchor)
    def tw(self, s, size, weight="Regular"):
        f = F(size, weight)
        return self.d.textlength(T(s), font=f) / S

def glow(c, cx, cy, r, color, layers=7, spread=16, a0=64):
    """cheap radial glow: stacked translucent circles"""
    for i in range(layers, 0, -1):
        t = i / layers
        c.circ(cx, cy, r + spread * t, fill=color + (int(a0 * (1 - t) ** 1.6),))

def rglow(c, x, y, w, h, rad, color, layers=6, spread=14, a0=60):
    for i in range(layers, 0, -1):
        t = i / layers
        s_ = spread * t
        c.rr(x - s_, y - s_, w + 2*s_, h + 2*s_, rad + s_,
             fill=color + (int(a0 * (1 - t) ** 1.6),))

# ---------------------------------------------------------------- chrome
def status_bar(c, alpha=255):
    c.txt(LW - 22, 26, "9:41", 13, "SemiBold", INK + (alpha,), anchor="rm")
    # battery + wifi (simplified, left side for RTL layout)
    c.rr(22, 20, 24, 12, 3, outline=INK + (alpha,), width=1.2)
    c.rr(24.5, 22.5, 17, 7, 1.5, fill=INK + (alpha,))
    for i, r in enumerate((4, 7, 10)):
        c.d.arc([ (56-r)*S, (30-r)*S, (56+r)*S, (30+r)*S ],
                200, 340, fill=INK + (int(alpha*(.4+.3*i)),), width=int(1.6*S))

def icon_books(c, cx, cy, col, sc=1.0):
    w, h = 9*sc, 11*sc
    c.rr(cx-w, cy-h/2, w*0.8, h, 1.5*sc, outline=col, width=1.6*sc)
    c.rr(cx+w*0.2, cy-h/2, w*0.8, h, 1.5*sc, outline=col, width=1.6*sc)

def icon_cards(c, cx, cy, col, sc=1.0):
    c.rr(cx-7*sc, cy-9*sc, 12*sc, 15*sc, 2.4*sc, outline=col, width=1.6*sc)
    c.rr(cx-2*sc, cy-6*sc, 12*sc, 15*sc, 2.4*sc, fill=SURFACE, outline=col, width=1.6*sc)

def icon_globe(c, cx, cy, col, sc=1.0, width=1.8):
    r = 10 * sc
    c.circ(cx, cy, r, outline=col, width=width*sc)
    c.d.ellipse([(cx-r*0.45)*S, (cy-r)*S, (cx+r*0.45)*S, (cy+r)*S],
                outline=col, width=int(width*sc*S))
    c.line(cx-r, cy, cx+r, cy, col, width*sc)

def icon_person(c, cx, cy, col, sc=1.0):
    c.circ(cx, cy-4*sc, 4.4*sc, outline=col, width=1.7*sc)
    c.d.arc([(cx-8*sc)*S, (cy+0*sc)*S, (cx+8*sc)*S, (cy+15*sc)*S],
            190, 350, fill=col, width=int(1.7*sc*S))

def icon_gear(c, cx, cy, col, sc=1.0):
    r = 7.2 * sc
    for k in range(8):
        a = k * math.tau / 8
        x1, y1 = cx + r * math.cos(a), cy + r * math.sin(a)
        x2, y2 = cx + (r + 3.2*sc) * math.cos(a), cy + (r + 3.2*sc) * math.sin(a)
        c.line(x1, y1, x2, y2, col, 2.0*sc)
    c.circ(cx, cy, r, outline=col, width=1.7*sc)
    c.circ(cx, cy, 2.6*sc, outline=col, width=1.5*sc)

def icon_sword(c, cx, cy, col, sc=1.0):
    c.line(cx-6*sc, cy+7*sc, cx+7*sc, cy-7*sc, col, 2.2*sc)
    c.line(cx+1*sc, cy-1*sc, cx+7*sc, cy+5*sc, col, 2.2*sc)
    c.line(cx-8*sc, cy+4*sc, cx-3*sc, cy+9*sc, col, 2.2*sc)

def icon_pen(c, cx, cy, col, sc=1.0):
    c.line(cx-6*sc, cy+7*sc, cx+6*sc, cy-6*sc, col, 2.2*sc)
    c.line(cx-7*sc, cy+8*sc, cx-4*sc, cy+7*sc, col, 2.0*sc)

def icon_quote(c, cx, cy, col, sc=1.0):
    c.rr(cx-9*sc, cy-7*sc, 18*sc, 12*sc, 3*sc, outline=col, width=1.7*sc)
    c.line(cx-4*sc, cy+5*sc, cx-1*sc, cy+9*sc, col, 1.7*sc)

def icon_story(c, cx, cy, col, sc=1.0):
    c.d.polygon([((cx-10*sc)*S, (cy-6*sc)*S), (cx*S, (cy-3*sc)*S),
                 (cx*S, (cy+8*sc)*S), ((cx-10*sc)*S, (cy+5*sc)*S)],
                outline=col, fill=None, width=int(1.6*sc*S))
    c.d.polygon([((cx+10*sc)*S, (cy-6*sc)*S), (cx*S, (cy-3*sc)*S),
                 (cx*S, (cy+8*sc)*S), ((cx+10*sc)*S, (cy+5*sc)*S)],
                outline=col, fill=None, width=int(1.6*sc*S))
    c.line(cx, cy-3*sc, cx, cy+8*sc, col, 1.4*sc)

def icon_trophy(c, cx, cy, col, sc=1.0):
    c.rr(cx-6*sc, cy-8*sc, 12*sc, 10*sc, 2*sc, outline=col, width=1.7*sc)
    c.line(cx, cy+2*sc, cx, cy+6*sc, col, 1.7*sc)
    c.line(cx-5*sc, cy+7*sc, cx+5*sc, cy+7*sc, col, 1.9*sc)

def icon_people(c, cx, cy, col, sc=1.0):
    c.circ(cx-4*sc, cy-3*sc, 3.4*sc, outline=col, width=1.6*sc)
    c.circ(cx+5*sc, cy-4*sc, 2.8*sc, outline=col, width=1.6*sc)
    c.d.arc([(cx-11*sc)*S, (cy+1*sc)*S, (cx+3*sc)*S, (cy+13*sc)*S],
            195, 345, fill=col, width=int(1.6*sc*S))

def icon_check(c, cx, cy, col, sc=1.0, w=2.0):
    c.line(cx-4*sc, cy+0.5*sc, cx-1*sc, cy+3.6*sc, col, w*sc)
    c.line(cx-1*sc, cy+3.6*sc, cx+4.5*sc, cy-3.4*sc, col, w*sc)

def icon_x(c, cx, cy, col, sc=1.0, w=2.0):
    c.line(cx-3.6*sc, cy-3.6*sc, cx+3.6*sc, cy+3.6*sc, col, w*sc)
    c.line(cx+3.6*sc, cy-3.6*sc, cx-3.6*sc, cy+3.6*sc, col, w*sc)

def icon_lock(c, cx, cy, col, sc=1.0):
    c.rr(cx-5*sc, cy-1*sc, 10*sc, 9*sc, 2*sc, outline=col, width=1.6*sc)
    c.d.arc([(cx-3.4*sc)*S, (cy-7.5*sc)*S, (cx+3.4*sc)*S, (cy+1*sc)*S],
            180, 360, fill=col, width=int(1.6*sc*S))

# ⟦added 03/09 · D-182 · T-252 · ring goes 8→9⟧ — matches the WorldRing.tsx SVG
# paths for the same two node ids (`components/WorldRing.tsx` ICON_PATHS).
def icon_mail(c, cx, cy, col, sc=1.0):
    c.rr(cx-9*sc, cy-6*sc, 18*sc, 12*sc, 2.4*sc, outline=col, width=1.6*sc)
    c.line(cx-7.5*sc, cy-4*sc, cx, cy+1.5*sc, col, 1.6*sc)
    c.line(cx, cy+1.5*sc, cx+7.5*sc, cy-4*sc, col, 1.6*sc)

def icon_target(c, cx, cy, col, sc=1.0):
    c.circ(cx, cy, 9*sc, outline=col, width=1.6*sc)
    c.circ(cx, cy, 4.8*sc, outline=col, width=1.6*sc)
    c.circ(cx, cy, 1.4*sc, fill=col)

NAV_Y = LH - 78          # top of nav bar
TABS = [                 # left -> right; RTL reading: לימודים, כרטיסיות, העולם, אני, הגדרות
    ("הגדרות",   icon_gear,   0.10),
    ("אני",      icon_person, 0.30),
    ("העולם",    icon_globe,  0.50),
    ("כרטיסיות", icon_cards,  0.70),
    ("לימודים",  icon_books,  0.90),
]
WORLD_FX = 0.50

def bottom_nav(c, active="כרטיסיות", world_pulse=0.0, world_press=0.0):
    c.rr(0, NAV_Y, LW, 78 + 4, 0, fill=(17, 26, 47, 255))
    c.line(0, NAV_Y, LW, NAV_Y, BORDER_SUB + (200,), 0.7)
    for label, icon, fx in TABS:
        cx = LW * fx
        if label == "העולם":
            r = 27 + 1.6 * math.sin(world_pulse * math.tau) - 2.2 * world_press
            cy = NAV_Y + 6
            glow(c, cx, cy, r, BRAND, spread=20,
                 a0=int(70 + 45 * (0.5 + 0.5 * math.sin(world_pulse * math.tau))))
            c.circ(cx, cy, r, fill=BRAND_SURFACE)
            c.circ(cx, cy, r, outline=(255, 255, 255, 70), width=1.2)
            icon_globe(c, cx, cy, BRAND_ON, sc=1.15, width=2.2)
            c.txt(cx, NAV_Y + 46, label, 9.8, "SemiBold", BRAND_SURFACE)
        else:
            col = INK if label == active else (INK_MUTED[0], INK_MUTED[1], INK_MUTED[2], 155)
            icon(c, cx, NAV_Y + 24, col, sc=0.95)
            c.txt(cx, NAV_Y + 46, label, 9.8,
                  "SemiBold" if label == active else "Regular", col)
    c.rr(LW/2 - 45, LH - 10, 90, 4, 2, fill=(255, 255, 255, 60))

def touch(c, x, y, press=0.0, ripple=None):
    """press: 0..1 squeeze; ripple: 0..1 expanding ring or None"""
    if ripple is not None and ripple < 1.0:
        rr = lerp(20, 56, ease_out(ripple))
        c.circ(x, y, rr, outline=(255, 255, 255, int(150 * (1 - ripple))), width=2)
    r = 20 - 3 * press
    c.circ(x, y, r + 4, fill=(255, 255, 255, 26))
    c.circ(x, y, r, fill=(255, 255, 255, int(30 + 26 * press)))
    c.circ(x, y, r, outline=(255, 255, 255, 190), width=1.6)

def scene_label(c, t, text, t0=0.15, dur=2.0):
    """translucent pill at top that fades away"""
    if t < t0 or t > t0 + dur: return
    p = seg(t, t0, t0 + .35) * (1 - seg(t, t0 + dur - .5, t0 + dur))
    if p <= 0: return
    a = int(255 * p)
    w = c.tw(text, 13, "SemiBold") + 34
    x = LW/2 - w/2
    c.rr(x, 52, w, 30, 15, fill=(30, 41, 59, int(230 * p)))
    c.rr(x, 52, w, 30, 15, outline=BRAND + (int(150 * p),), width=1)
    c.txt(LW/2, 67, text, 13, "SemiBold", INK + (a,))

# =========================================================== SCREEN: deck hub
LV_TOTAL, LV_KNOWN, LV_UNKNOWN = 400, 61, 25
LV_FILTERED = LV_KNOWN + LV_UNKNOWN
LV_REMAIN = LV_TOTAL - LV_FILTERED

def stat_tile(c, x, y, w, h, kind, value, label, col):
    c.rr(x, y, w, h, 16, fill=RAISED)
    c.rr(x, y, w, h, 16, outline=BORDER_SUB, width=1.1)
    if kind == "v":   icon_check(c, x + w/2, y + 24, col, sc=1.25)
    elif kind == "x": icon_x(c, x + w/2, y + 24, col, sc=1.1)
    else:             c.circ(x + w/2, y + 24, 7, outline=col, width=1.8)
    c.txt(x + w/2, y + 58, f"{value}", 26, "Bold", col, rtl=False)
    c.txt(x + w/2, y + 84, label, 11.5, "Medium", INK_MUTED + (200,))

def screen_deck(c, t, grow=1.0, cta=None, cta_press=0.0):
    c.txt(LW - 24, 106, "אנגלית · מסלול אמיר״ם", 12.5, "Regular",
          INK_MUTED + (190,), anchor="rm")
    c.txt(LW - 24, 132, "כרטיסיות", 25, "Bold", INK, anchor="rm")
    # ---- level card (read-only; level is changed in Settings)
    c.rr(24, 164, LW - 48, 104, 20, fill=RAISED)
    c.rr(24, 164, LW - 48, 104, 20, outline=BRAND + (110,), width=1.4)
    c.txt(LW - 44, 194, "הרמה שלך", 13, "Medium", INK_MUTED + (210,), anchor="rm")
    c.txt(LW - 44, 224, "A1", 38, "Black", BRAND_SURFACE, anchor="rm", rtl=False)
    c.txt(LW - 44, 254, "נקבעה במבחן הרמה", 11.5, "Regular",
          INK_MUTED + (165,), anchor="rm")
    cw_ = c.tw("שינוי רמה · הגדרות", 11.5, "Medium") + 46
    c.rr(44, 200, cw_, 34, 17, fill=(0, 0, 0, 0), outline=BORDER_STRONG + (140,), width=1.1)
    icon_gear(c, 44 + 19, 217, INK_MUTED + (190,), sc=.72)
    c.txt(44 + cw_/2 + 10, 217, "שינוי רמה · הגדרות", 11.5, "Medium", INK_MUTED + (205,))
    # ---- progress across the level
    c.txt(LW - 24, 292, "התקדמות ברמה", 13.5, "SemiBold", INK, anchor="rm")
    c.txt(24, 292, f"{int(LV_FILTERED*grow)} / {LV_TOTAL} סוננו", 12, "Regular",
          INK_MUTED + (190,), anchor="lm")
    bx, bw_, bh_ = 24, LW - 48, 14
    c.rr(bx, 308, bw_, bh_, 7, fill=BORDER_SUB)
    kw = bw_ * (LV_KNOWN / LV_TOTAL) * grow
    uw = bw_ * (LV_UNKNOWN / LV_TOTAL) * grow
    if kw > 1: c.rr(bx + bw_ - kw, 308, kw, bh_, 7, fill=SUCCESS)          # RTL: fills right→left
    if uw > 1: c.rr(bx + bw_ - kw - uw, 308, uw, bh_, 7, fill=DANGER)
    # ---- three counters
    tw_ = (LW - 48 - 2 * 10) / 3
    stat_tile(c, LW - 24 - tw_, 348, tw_, 104, "v", int(LV_KNOWN*grow), "ידעתי", SUCCESS)
    stat_tile(c, LW - 24 - 2*tw_ - 10, 348, tw_, 104, "x", int(LV_UNKNOWN*grow),
              "לא ידעתי", DANGER)
    stat_tile(c, 24, 348, tw_, 104, "o", int(LV_REMAIN*grow), "לא סוננו",
              BRAND_SURFACE)
    # ---- the two decks
    pr = 2.5 * (cta_press if cta == 1 else 0)
    c.rr(24 + pr/2, 486 + pr/2, LW - 48 - pr, 62 - pr, 16, fill=BRAND_SURFACE)
    c.txt(LW/2, 508, "סינון מילים", 16.5, "Bold", BRAND_ON)
    c.txt(LW/2, 531, f"{LV_REMAIN} מילים שעוד לא סוננו", 12, "Medium", (15, 23, 42, 190))
    pr = 2.5 * (cta_press if cta == 2 else 0)
    c.rr(24 + pr/2, 558 + pr/2, LW - 48 - pr, 62 - pr, 16, fill=DANGER + (42,))
    c.rr(24 + pr/2, 558 + pr/2, LW - 48 - pr, 62 - pr, 16, outline=DANGER + (255,), width=1.7)
    icon_x(c, 58, 589, DANGER, sc=1.2)
    c.txt(LW/2 + 12, 580, "חזרה", 16.5, "Bold", DANGER)
    c.txt(LW/2 + 12, 603, f"{LV_UNKNOWN} מילים שסימנת לא ידעתי", 12, "Medium",
          DANGER + (200,))
    c.txt(LW/2, 650, "הסימון של מילים מתבצע בכרטיסיות בלבד", 12, "Regular",
          INK_MUTED + (150,))

def scene_deck(t):
    c = C(); status_bar(c)
    cta_t = 4.3
    screen_deck(c, t, grow=ease_out(seg(t, .25, 1.5)), cta=1,
                cta_press=clamp(1 - abs(t - cta_t) / .3) if abs(t - cta_t) < .3 else 0)
    bottom_nav(c, active="כרטיסיות", world_pulse=t * .5)
    if abs(t - cta_t) < .5:
        touch(c, LW/2, 517, press=clamp(1 - abs(t - cta_t) / .3),
              ripple=seg(t, cta_t, cta_t + .55))
    scene_label(c, t, "כרטיסיות · מצב הרמה")
    return c.img

# =========================================================== SCREEN: cards
CARD_X, CARD_Y, CARD_W, CARD_H = 30, 168, LW - 60, 372

def cards_header(c):
    c.txt(LW - 24, 106, "אנגלית · מסלול אמיר״ם", 12.5, "Regular", INK_MUTED + (190,), anchor="rm")
    c.txt(LW - 24, 132, "כרטיסיות", 25, "Bold", INK, anchor="rm")
    # level chip
    w = c.tw("A1", 12, "Bold") + 26
    c.rr(24, 118, w, 26, 13, fill=BRAND + (46,))
    c.rr(24, 118, w, 26, 13, outline=BRAND + (150,), width=1)
    c.txt(24 + w/2, 131, "A1", 12, "Bold", BRAND_SURFACE)
    # progress
    c.rr(24, 152, LW - 48, 6, 3, fill=BORDER_SUB)
    c.rr(LW - 24 - (LW - 48) * .28, 152, (LW - 48) * .28, 6, 3, fill=BRAND)

def draw_card(c, x, y, w, h, rot, face, alpha=255, scale=1.0, badge=None):
    """face: 'front' or 'back'. Rendered to a layer so it can rotate."""
    pad = 90
    lay = Image.new("RGBA", (int((w + pad*2) * S), int((h + pad*2) * S)), (0, 0, 0, 0))
    lc = C(lay); lc.d = ImageDraw.Draw(lay, "RGBA")
    ox, oy = pad, pad
    rglow(lc, ox, oy, w, h, 26, BRAND, spread=16, a0=int(46 * alpha / 255))
    lc.rr(ox, oy, w, h, 26, fill=RAISED + (alpha,))
    lc.rr(ox, oy, w, h, 26, outline=BORDER_SUB + (alpha,), width=1.2)
    if face == "front":
        lc.txt(ox + w/2, oy + 128, "achieve", 46, "Bold", INK + (alpha,), rtl=False)
        lc.txt(ox + w/2, oy + 176, "הגייה: אֶ־צִ׳יב", 15, "Regular",
               INK_MUTED + (int(alpha*.75),))
        lc.txt(ox + w/2, oy + 226, "פועל", 13, "Medium", BRAND_SURFACE + (alpha,))
        lc.txt(ox + w/2, oy + h - 40, "הקש כדי לחשוף", 13, "Regular",
               INK_MUTED + (int(alpha*.6),))
    else:
        lc.txt(ox + w/2, oy + 74, "achieve", 24, "SemiBold",
               INK_MUTED + (int(alpha*.8),), rtl=False)
        lc.txt(ox + w/2, oy + 136, "לְהַשִּׂיג", 44, "Bold", INK + (alpha,))
        lc.line(ox + w/2 - 44, oy + 178, ox + w/2 + 44, oy + 178, BORDER_SUB + (alpha,), 1)
        lc.txt(ox + w/2, oy + 214, "She worked hard to achieve her goal.", 14,
               "Regular", INK_MUTED + (int(alpha*.9),), rtl=False)
        lc.txt(ox + w/2, oy + 246, "היא עבדה קשה כדי להשיג את המטרה שלה.", 14,
               "Regular", INK_MUTED + (int(alpha*.7),))
    if badge:
        label, col, kind = badge
        bw = lc.tw(label, 15, "Bold") + 62
        bx, by = ox + w/2 - bw/2, oy + h/2 - 26
        lc.rr(bx, by, bw, 52, 26, fill=col + (int(alpha*.20),))
        lc.rr(bx, by, bw, 52, 26, outline=col + (alpha,), width=2)
        (icon_check if kind == "v" else icon_x)(lc, bx + 30, by + 26, col + (alpha,), sc=1.5, w=2.4)
        lc.txt(bx + bw/2 + 16, by + 26, label, 15, "Bold", col + (alpha,))
    if scale != 1.0:
        nw, nh = int(lay.width * scale), int(lay.height * scale)
        lay = lay.resize((max(1, nw), max(1, nh)), Image.LANCZOS)
    if rot:
        lay = lay.rotate(rot, resample=Image.BICUBIC, expand=False)
    px = int((x - pad) * S - (lay.width - (w + pad*2) * S) / 2)
    py = int((y - pad) * S - (lay.height - (h + pad*2) * S) / 2)
    c.img.paste(lay, (px, py), lay)

def answer_buttons(c, hi=None, alpha=255):
    y, h = CARD_Y + CARD_H + 30, 56
    bw = (LW - 60 - 14) / 2
    # RTL: "ידעתי" on the right, "לא ידעתי" on the left
    for label, col, kind, bx in (("ידעתי", SUCCESS, "v", 30 + bw + 14),
                                 ("לא ידעתי", DANGER, "x", 30)):
        on = (hi == label)
        c.rr(bx, y, bw, h, 16, fill=(col + (60,)) if on else RAISED + (alpha,))
        c.rr(bx, y, bw, h, 16, outline=col + (255 if on else 160,), width=2 if on else 1.4)
        (icon_check if kind == "v" else icon_x)(c, bx + 30, y + h/2, col + (alpha,), sc=1.2)
        c.txt(bx + bw/2 + 14, y + h/2, label, 15, "SemiBold", col + (alpha,))
    c.txt(LW/2, y + h + 34, "5 מתוך 20 · נשארו 314 מילים ברמה", 12.5, "Regular",
          INK_MUTED + (int(alpha*.65),))

def screen_cards(c, t, card_state="front", card_dx=0.0, card_rot=0.0,
                 flip=None, badge=None, hi=None, next_scale=0.94, next_alpha=0):
    cards_header(c)
    if next_alpha > 0:
        draw_card(c, CARD_X, CARD_Y, CARD_W, CARD_H, 0, "front",
                  alpha=next_alpha, scale=next_scale)
    if flip is None:
        draw_card(c, CARD_X + card_dx, CARD_Y + abs(card_dx) * .06, CARD_W, CARD_H,
                  card_rot, card_state, badge=badge)
    else:
        # horizontal squeeze flip
        sq = abs(math.cos(flip * math.pi))
        face = "front" if flip < .5 else "back"
        w2 = max(2.0, CARD_W * sq)
        draw_card(c, CARD_X + (CARD_W - w2) / 2, CARD_Y, w2, CARD_H, 0, face)
    answer_buttons(c, hi=hi)

# =========================================================== SCENE 1
def scene_cards(t):
    c = C(); status_bar(c)
    tap_t, flip_a, flip_b = 1.55, 1.75, 2.35
    sw_a, sw_b = 3.5, 4.5
    flip = None; state = "front"; dx = 0.0; rot = 0.0; badge = None
    hi = None; nxt_a = 0; nxt_s = 0.94
    if t >= flip_b: state = "back"
    if flip_a <= t < flip_b: flip = seg(t, flip_a, flip_b)
    if t >= sw_a:
        p = ease_in_out(seg(t, sw_a, sw_b))
        dx = p * (LW + 120)
        rot = -p * 15
        badge = ("ידעתי", SUCCESS, "v") if p > .12 else None
        hi = "ידעתי" if p > .25 else None
        nxt_a = int(255 * clamp(p * 1.8)); nxt_s = lerp(.94, 1.0, ease_out(p))
    screen_cards(c, t, card_state=state, card_dx=dx, card_rot=rot, flip=flip,
                 badge=badge, hi=hi, next_scale=nxt_s, next_alpha=nxt_a)
    bottom_nav(c, active="כרטיסיות", world_pulse=t * .5)
    # touch: tap to reveal
    if tap_t - .35 <= t < flip_a + .25:
        touch(c, LW/2, CARD_Y + CARD_H/2,
              press=1 - abs(t - tap_t) / .35 if abs(t - tap_t) < .35 else 0,
              ripple=seg(t, tap_t, tap_t + .5))
    # touch: drag right
    if sw_a - .3 <= t < sw_b:
        p = ease_in_out(seg(t, sw_a, sw_b))
        touch(c, LW/2 + p * (LW + 120) * .55, CARD_Y + CARD_H/2 + p * 14, press=.7)
    scene_label(c, t, "כרטיסיות · חזרה מרווחת (SM-2)")
    return c.img

# =========================================================== SCENE 2
# ⟦עודכן 03/09 · D-182 · T-252 — 7⇢9: המחולל היה חסר `הודעות` ו`אמירנט`⟧
# הסדר מיושר ל-`36 § 6` / `lib/core/worldRing.ts` `RING_ORDER`, ⛔ ולא הפוך.
WORLD_NODES = [
    ("זירת קרב",     icon_sword),
    ("הודעות",       icon_mail),
    ("אמירנט",       icon_target),
    ("סיפורים",      icon_story),
    ("כתיבה חופשית", icon_pen),
    ("משפטים",       icon_quote),
    ("אוצר מילים",   icon_books),
    ("מובילים",      icon_trophy),
    ("חברים",        icon_people),
]
RING_CX, RING_CY, RING_R = LW / 2, 402, 108

# ⟦עודכן 03/09 · D-182 · T-252⟧ אינדקס `סיפורים` ב-`WORLD_NODES` — היה קבוע `1`
# ב-`scene_story` כשהרשימה מנתה שבעה פריטים (`סיפורים` היה שם ב-index 1);
# אחרי הוספת `הודעות`/`אמירנט` `סיפורים` זז ל-index 3. ⛔ שם אחד ⛔ ולא ארבעה
# מספרי-קסם — `scene_story` קורא אותו במקום לחזור על ה-`1`.
STORY_NODE = 3

def node_pos(i):
    ang = -math.pi / 2 + i * math.tau / len(WORLD_NODES)
    return RING_CX + RING_R * math.cos(ang), RING_CY + RING_R * math.sin(ang)

def screen_world(c, t, appear=1.0, tap_idx=None, tap_p=0.0):
    c.txt(LW - 24, 112, "העולם", 25, "Bold", INK, anchor="rm")
    c.txt(LW - 24, 140, "מרחב פתוח · לא נספר להתקדמות הלמידה", 12.5, "Regular",
          INK_MUTED + (185,), anchor="rm")
    c.circ(RING_CX, RING_CY, RING_R, outline=BORDER_SUB + (150,), width=1)
    c.circ(RING_CX, RING_CY, RING_R + 26, outline=BORDER_SUB + (60,), width=1)
    glow(c, RING_CX, RING_CY, 40, BRAND, spread=26, a0=54)
    c.circ(RING_CX, RING_CY, 40, fill=RAISED)
    c.circ(RING_CX, RING_CY, 40, outline=BRAND + (170,), width=1.4)
    icon_globe(c, RING_CX, RING_CY - 6, BRAND_SURFACE, sc=1.25, width=2)
    c.txt(RING_CX, RING_CY + 20, "קול", 13, "Bold", INK)
    for i, (label, icon) in enumerate(WORLD_NODES):
        p = clamp((appear - i * .07) / .5)
        if p <= 0: continue
        e = ease_back(p)
        x, y = node_pos(i)
        r = 33 * e
        press = tap_p if tap_idx == i else 0.0
        r -= 2.5 * press
        if tap_idx == i and tap_p > 0:
            glow(c, x, y, r, BRAND, spread=22, a0=int(120 * tap_p))
        c.circ(x, y, r, fill=RAISED)
        c.circ(x, y, r, outline=(BRAND if tap_idx == i and tap_p > .2 else BORDER_SUB)
               + (int(255 * p),), width=1.6 if tap_idx == i else 1.2)
        icon(c, x, y, (BRAND_SURFACE if i == 0 else INK) + (int(255 * p),), sc=1.05)
        c.txt(x, y + r + 15, label, 11.5, "SemiBold", INK_MUTED + (int(220 * p),))
    c.rr(30, 620, LW - 60, 58, 16, fill=RAISED + (170,))
    c.rr(30, 620, LW - 60, 58, 16, outline=BORDER_SUB, width=1)
    icon_check(c, LW - 52, 649, SUCCESS, sc=1.3)
    c.txt(LW - 74, 641, "בידוד מלא מהלמידה", 13.5, "SemiBold", INK, anchor="rm")
    c.txt(LW - 74, 662, "ניצחון או הפסד לא נוגעים ב-word_progress", 11.5, "Regular",
          INK_MUTED + (190,), anchor="rm")

def scene_world(t):
    c = C(); status_bar(c)
    tap_nav = 0.9
    reveal_a, reveal_b = tap_nav, tap_nav + .75
    node_tap = 3.9
    if t < reveal_a:
        screen_cards(c, t, card_state="front")
        bottom_nav(c, active="כרטיסיות", world_pulse=t * .5)
    else:
        base = C(); status_bar(base)
        screen_cards(base, t, card_state="front")
        bottom_nav(base, active="כרטיסיות", world_pulse=t * .5)
        top = C(); status_bar(top)
        screen_world(top, t, appear=seg(t, reveal_b - .1, reveal_b + 1.1),
                     tap_idx=0 if t >= node_tap - .1 else None,
                     tap_p=clamp(1 - abs(t - node_tap) / .3) if abs(t - node_tap) < .3 else
                           (1.0 if t > node_tap else 0.0))
        bottom_nav(top, active="העולם", world_pulse=t * .5)
        p = ease_out(seg(t, reveal_a, reveal_b))
        mask = Image.new("L", (W, H), 0)
        md = ImageDraw.Draw(mask)
        cx, cy = LW * WORLD_FX * S, (NAV_Y + 6) * S
        R = p * math.hypot(W, H) * 1.05
        md.ellipse([cx - R, cy - R, cx + R, cy + R], fill=255)
        base.img.paste(top.img, (0, 0), mask)
        c.img = base.img
        c.d = ImageDraw.Draw(c.img, "RGBA")
    if tap_nav - .45 <= t < tap_nav + .5:
        touch(c, LW * WORLD_FX, NAV_Y + 6,
              press=clamp(1 - abs(t - tap_nav) / .3),
              ripple=seg(t, tap_nav, tap_nav + .55))
    if node_tap - .5 <= t < node_tap + .5:
        x, y = node_pos(0)
        touch(c, x, y, press=clamp(1 - abs(t - node_tap) / .3),
              ripple=seg(t, node_tap, node_tap + .55))
    scene_label(c, t, "העולם · טאב מרכזי מוגדל")
    return c.img

# =========================================================== SCENE 3 (arena)
GOLD       = (212, 169, 74)
GOLD_LIGHT = (245, 214, 132)
GEM        = (86, 190, 214)
PANEL_DARK = (28, 38, 66)
STONE      = (74, 72, 88)
STONE_DARK = (52, 50, 64)

AR_TOP, AR_H = 166, 390          # arena band (logical)
BANNER_Y = 92

_bg_cache = {}
def arena_bg():
    """Static night-arena backdrop, built once."""
    if "bg" in _bg_cache: return _bg_cache["bg"]
    import random
    rnd = random.Random(7)
    im = Image.new("RGB", (LW * S, AR_H * S))
    d = ImageDraw.Draw(im, "RGBA")
    WALL_TOP, WALL_BOT = 62, 152
    # sky gradient
    for y in range(int(WALL_BOT * S)):
        f = y / (WALL_BOT * S)
        d.line([(0, y), (LW * S, y)], fill=lerpc((16, 22, 54), (46, 40, 82), f))
    # stars
    for _ in range(110):
        sx, sy = rnd.uniform(0, LW), rnd.uniform(2, WALL_TOP - 4)
        r, a = rnd.uniform(.5, 1.5), rnd.randint(70, 225)
        d.ellipse([(sx-r)*S, (sy-r)*S, (sx+r)*S, (sy+r)*S], fill=(255, 255, 255, a))
    # crowd silhouettes behind the wall
    for _ in range(26):
        cx, cy = rnd.uniform(6, LW - 6), rnd.uniform(WALL_TOP - 20, WALL_TOP - 6)
        sc = rnd.uniform(.8, 1.25)
        col = lerpc((34, 32, 58), (66, 60, 92), rnd.random())
        d.ellipse([(cx-4*sc)*S, (cy-4*sc)*S, (cx+4*sc)*S, (cy+4*sc)*S], fill=col)
        d.pieslice([(cx-8*sc)*S, (cy+1*sc)*S, (cx+8*sc)*S, (cy+18*sc)*S], 180, 360, fill=col)
        if rnd.random() < .45:
            for sgn in (-1, 1):
                d.line([(cx+sgn*5*sc)*S, (cy+2*sc)*S, (cx+sgn*9*sc)*S, (cy-8*sc)*S],
                       fill=col, width=int(2*sc*S))
    # crenellations
    x = 4
    while x < LW:
        d.rounded_rectangle([x*S, (WALL_TOP-13)*S, (x+21)*S, (WALL_TOP+4)*S],
                            radius=2*S, fill=STONE, outline=STONE_DARK, width=int(1*S))
        x += 34
    # wall blocks
    row, y = 0, WALL_TOP + 2
    while y < WALL_BOT:
        off = -18 if row % 2 else 0
        x = off - 10
        while x < LW + 20:
            v = rnd.randint(-9, 9)
            d.rounded_rectangle([x*S, y*S, (x+36)*S, (y+21)*S], radius=2.5*S,
                                fill=tuple(max(0, min(255, ch+v)) for ch in STONE),
                                outline=STONE_DARK, width=int(1*S))
            x += 38
        y += 23; row += 1
    # ground
    for y in range(int(WALL_BOT * S), AR_H * S):
        f = (y - WALL_BOT * S) / (AR_H * S - WALL_BOT * S)
        d.line([(0, y), (LW * S, y)], fill=lerpc((62, 54, 66), (34, 30, 44), f))
    # light pool + stones + cracks
    for i in range(9, 0, -1):
        rw, rh = 150 * i / 9, 60 * i / 9
        d.ellipse([(LW/2-rw)*S, (WALL_BOT+52-rh)*S, (LW/2+rw)*S, (WALL_BOT+52+rh)*S],
                  fill=(255, 226, 170, int(7 * (1 - i/9) * 9)))
    for _ in range(34):
        sx, sy = rnd.uniform(0, LW), rnd.uniform(WALL_BOT + 6, AR_H - 4)
        rw = rnd.uniform(3, 9)
        d.ellipse([(sx-rw)*S, (sy-rw*.45)*S, (sx+rw)*S, (sy+rw*.45)*S],
                  fill=(28, 25, 38, rnd.randint(60, 130)))
    for _ in range(12):
        sx, sy = rnd.uniform(0, LW), rnd.uniform(WALL_BOT + 10, AR_H - 8)
        d.line([sx*S, sy*S, (sx+rnd.uniform(-26, 26))*S, (sy+rnd.uniform(4, 16))*S],
               fill=(26, 22, 34, 120), width=int(1.2*S))
    _bg_cache["bg"] = im
    return im

def torch(c, x, y, ph):
    """bracket + flickering flame, in arena-local coords"""
    c.rr(x - 3, y, 6, 20, 2, fill=(58, 44, 34))
    f = .82 + .18 * math.sin(ph) + .06 * math.sin(ph * 2.7)
    for i, (rr_, col, a) in enumerate(((13*f, (255, 170, 60), 60),
                                       (9*f, (255, 205, 110), 120),
                                       (5.4*f, (255, 245, 205), 220))):
        c.d.ellipse([(x-rr_*.62)*S, (y-4-rr_*1.25)*S, (x+rr_*.62)*S, (y-4+rr_*.45)*S],
                    fill=col + (a,))
    glow(c, x, y - 8, 12 * f, (255, 178, 70), spread=16, a0=52)

def wizard_sprite(c, cx, cy, sc=1.0):
    glow(c, cx, cy + 26*sc, 20*sc, (168, 85, 247), spread=18, a0=70)
    c.d.ellipse([(cx-20*sc)*S, (cy+22*sc)*S, (cx+20*sc)*S, (cy+32*sc)*S],
                fill=(140, 70, 220, 70))
    # robe
    c.d.polygon([((cx-19*sc)*S, (cy+26*sc)*S), ((cx+19*sc)*S, (cy+26*sc)*S),
                 ((cx+11*sc)*S, (cy-6*sc)*S), ((cx-11*sc)*S, (cy-6*sc)*S)],
                fill=(104, 62, 178))
    c.d.polygon([((cx-19*sc)*S, (cy+26*sc)*S), ((cx-4*sc)*S, (cy+26*sc)*S),
                 ((cx-6*sc)*S, (cy-6*sc)*S), ((cx-11*sc)*S, (cy-6*sc)*S)],
                fill=(126, 80, 202))
    # hood
    c.d.polygon([((cx-13*sc)*S, (cy-2*sc)*S), ((cx+13*sc)*S, (cy-2*sc)*S),
                 (cx*S, (cy-26*sc)*S)], fill=(132, 84, 210))
    c.d.ellipse([(cx-9*sc)*S, (cy-13*sc)*S, (cx+9*sc)*S, (cy+4*sc)*S], fill=(30, 16, 48))
    for sgn in (-1, 1):
        c.circ(cx + sgn*4*sc, cy - 4*sc, 1.9*sc, fill=(255, 120, 235))
    # arms
    for sgn in (-1, 1):
        c.line(cx + sgn*10*sc, cy + 2*sc, cx + sgn*19*sc, cy - 11*sc, (126, 80, 202), 5*sc)
    # staff + orb
    c.line(cx + 17*sc, cy - 8*sc, cx + 21*sc, cy - 30*sc, (92, 64, 40), 2.6*sc)
    glow(c, cx + 21*sc, cy - 32*sc, 5.5*sc, (232, 100, 255), spread=13, a0=110)
    c.circ(cx + 21*sc, cy - 32*sc, 5.5*sc, fill=(246, 190, 255))

def knight_sprite(c, cx, cy, swing, sc=1.0):
    """seen from behind; swing 0..1 drives the sword arc"""
    c.d.ellipse([(cx-22*sc)*S, (cy+26*sc)*S, (cx+22*sc)*S, (cy+35*sc)*S],
                fill=(20, 17, 28, 120))
    for sgn in (-1, 1):
        c.rr(cx + sgn*7*sc - 4*sc, cy + 12*sc, 8*sc, 18*sc, 3*sc, fill=(52, 58, 80))
    c.rr(cx - 13*sc, cy - 10*sc, 26*sc, 26*sc, 7*sc, fill=(112, 126, 156))
    c.line(cx, cy - 8*sc, cx, cy + 14*sc, (86, 98, 126), 1.8*sc)
    for sgn in (-1, 1):
        c.circ(cx + sgn*14*sc, cy - 6*sc, 7*sc, fill=(142, 156, 186))
    c.circ(cx, cy - 20*sc, 8.5*sc, fill=(226, 182, 150))
    for k in range(-2, 3):
        c.line(cx + k*3.2*sc, cy - 26*sc, cx + k*3.6*sc, cy - 33*sc, (72, 142, 220), 2.6*sc)
    # shield (left)
    c.rr(cx - 30*sc, cy - 10*sc, 17*sc, 22*sc, 5*sc, fill=(96, 116, 158),
         outline=GOLD, width=1.6*sc)
    c.circ(cx - 21.5*sc, cy + 1*sc, 3.6*sc, fill=GOLD_LIGHT)
    # sword (right), swings up
    a = math.radians(lerp(30, -34, ease_out(swing)))
    hx, hy = cx + 17*sc, cy - 2*sc
    tx, ty = hx + 34*sc*math.cos(a), hy - 34*sc*math.sin(-a) - 20*sc
    if swing > 0:
        for i in range(6):
            f = i / 6
            c.d.arc([(cx-2*sc)*S, (cy-34*sc)*S, (cx+52*sc)*S, (cy+18*sc)*S],
                    -60 + f*40, 20 + f*40,
                    fill=(120, 220, 255, int(90 * (1-f) * swing)), width=int(3*sc*S))
    c.line(hx, hy, tx, ty, (206, 220, 244), 3.4*sc)
    c.line(hx, hy, tx, ty, (240, 250, 255), 1.4*sc)
    c.line(hx - 5*sc, hy - 3*sc, hx + 6*sc, hy + 2*sc, GOLD, 3*sc)

def game_hp(c, x, y, w, frac, col, label, value, ghost=None):
    c.txt(x + w/2, y - 9, label, 11, "SemiBold", GOLD_LIGHT)
    c.rr(x, y, w, 15, 7.5, fill=(24, 20, 32))
    c.rr(x, y, w, 15, 7.5, outline=GOLD, width=1.5)
    if ghost is not None and ghost > frac:
        c.rr(x + 2, y + 2, max(3, (w - 4) * ghost), 11, 5.5, fill=(255, 236, 210))
    if frac > 0:
        c.rr(x + 2, y + 2, max(3, (w - 4) * frac), 11, 5.5, fill=col)
    c.txt(x + w/2 + 1, y + 8.5, value, 11, "Bold", (0, 0, 0, 160), rtl=False)
    c.txt(x + w/2, y + 7.5, value, 11, "Bold", (255, 255, 255), rtl=False)

def ornate_frame(c, x, y, w, h, r, fill, border=GOLD, width=2.0, gems=True):
    c.rr(x, y, w, h, r, fill=fill)
    c.rr(x, y, w, h, r, outline=border + (255,), width=width)
    c.rr(x + 3, y + 3, w - 6, h - 6, max(1, r - 3),
         outline=(255, 255, 255, 34), width=1)
    if gems:
        for gx in (x + 11, x + w - 11):
            cy = y + h/2
            c.d.polygon([(gx*S, (cy-4.4)*S), ((gx+4)*S, cy*S),
                         (gx*S, (cy+4.4)*S), ((gx-4)*S, cy*S)], fill=GEM)

def banner(c, cx, y, w, h, word, ph):
    rglow(c, cx - w/2, y, w, h, 14, GOLD, spread=13, a0=52)
    ornate_frame(c, cx - w/2, y, w, h, 14, (92, 58, 26), gems=False)
    c.rr(cx - w/2 + 6, y + 6, w - 12, h - 12, 10, fill=(126, 82, 34))
    for sgn in (-1, 1):
        gx = cx + sgn * (w/2 - 13)
        c.d.polygon([(gx*S, (y+h/2-6)*S), ((gx+5)*S, (y+h/2)*S),
                     (gx*S, (y+h/2+6)*S), ((gx-5)*S, (y+h/2)*S)], fill=GEM)
    c.d.polygon([(cx*S, (y-7)*S), ((cx+7)*S, y*S), (cx*S, (y+7)*S), ((cx-7)*S, y*S)],
                fill=(226, 74, 106))
    c.txt(cx + 1.5, y + h/2 + 2.5, word, 38, "Black", (60, 34, 12), rtl=False)
    c.txt(cx, y + h/2, word, 38, "Black", (255, 252, 244), rtl=False)

BATTLE_OPTS = [("לִקּוּי", "sword"), ("שְׁקִיעָה", "shield"),
               ("גֶּשֶׁם", "boot"),  ("זְרִיחָה", "scroll")]
CORRECT = 0

def opt_icon(c, cx, cy, kind, col):
    if kind == "sword":    icon_sword(c, cx, cy, col, sc=.8)
    elif kind == "shield":
        c.rr(cx-5, cy-6, 10, 9, 2, outline=col, width=1.6)
        c.d.polygon([((cx-5)*S, (cy+3)*S), ((cx+5)*S, (cy+3)*S), (cx*S, (cy+8)*S)], fill=col)
    elif kind == "boot":
        c.rr(cx-4, cy-7, 6, 10, 2, fill=col)
        c.rr(cx-4, cy+1, 11, 5, 2, fill=col)
    else:
        c.rr(cx-6, cy-6, 12, 12, 2, outline=col, width=1.6)
        c.line(cx-3, cy-2, cx+3, cy-2, col, 1.3)
        c.line(cx-3, cy+2, cx+3, cy+2, col, 1.3)

def vignette():
    if "vig" in _bg_cache: return _bg_cache["vig"]
    im = Image.new("RGBA", (LW * S, AR_H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im, "RGBA")
    steps = 26
    for i in range(steps):
        f = i / steps
        m = f * 0.5
        d.ellipse([-LW*0.30*S + LW*m*S, -AR_H*0.30*S + AR_H*m*S,
                   LW*1.30*S - LW*m*S, AR_H*1.30*S - AR_H*m*S],
                  outline=(0, 0, 0, 11), width=int(9 * S))
    _bg_cache["vig"] = im
    return im

def embers(c, t):
    for i in range(22):
        ph = (t * 15 + i * 41) % (AR_H + 40)
        y = AR_H + 10 - ph
        if y < -10: continue
        x = (i * 61 % LW) + math.sin(t * 1.4 + i) * 9
        life = clamp(ph / (AR_H + 40))
        a = int(150 * math.sin(life * math.pi) ** .8)
        r = .9 + 1.4 * (1 - life)
        c.circ(x, AR_TOP + y, r, fill=(255, 186, 96, a))

def screen_battle(c, t, sel=None, revealed=False, hp=1.0, hp_ghost=1.0, swing=0.0,
                  shake=0.0, score=1250, toast=0.0, zoom=1.0, flash=0.0,
                  shock=0.0, sparks=0.0, hit=0.0, combo=0.0, proj=None,
                  win_pop=0.0):
    bg = arena_bg()
    if zoom > 1.001:
        nw, nh = int(LW * S * zoom), int(AR_H * S * zoom)
        bg = bg.resize((nw, nh), Image.BILINEAR)
        ox, oy = -(nw - LW * S) // 2, -(nh - AR_H * S) // 2
    else:
        ox, oy = 0, 0
    c.img.paste(bg, (int(ox + shake * S), int(AR_TOP * S + oy + shake * S * .6)))
    c.d = ImageDraw.Draw(c.img, "RGBA")
    def A(v): return AR_TOP + v + shake * .6
    ph = t * 9
    for tx_ in (34, 118, LW - 118, LW - 34):
        torch(c, tx_, A(96), ph + tx_)
    embers(c, t)
    wx, wy = LW/2 - 26, A(178) + math.sin(t * 2.1) * 3
    wy -= 13 * hit                                  # recoil
    if hit > 0:
        glow(c, wx, wy, 30, (255, 90, 90), spread=22, a0=int(150 * hit))
    wizard_sprite(c, wx, wy, sc=1.35)
    kx, ky = LW/2 - 6, A(296)
    knight_sprite(c, kx, ky + 5 * (1 - swing) * (1 if swing > 0 else 0), swing, sc=1.3)
    # travelling crescent
    if proj is not None:
        pp, pa = proj
        px = lerp(kx + 30, wx + 8, pp)
        py = lerp(ky - 18, wy + 10, pp)
        for k in range(4):
            f = k / 4
            glow(c, px + f * 16, py + f * 12, 15 - f * 5, (140, 226, 255),
                 spread=13, a0=int(110 * pa * (1 - f)))
        c.d.arc([(px-26)*S, (py-26)*S, (px+26)*S, (py+26)*S], 200, 340,
                fill=(190, 245, 255, int(255 * pa)), width=int(5 * S))
        c.d.arc([(px-19)*S, (py-19)*S, (px+19)*S, (py+19)*S], 210, 330,
                fill=(255, 255, 255, int(220 * pa)), width=int(2.4 * S))
    # impact shockwave + sparks
    if shock > 0:
        for k in range(3):
            pk = clamp(shock - k * .18)
            if pk <= 0: continue
            rr_ = 12 + 104 * ease_out(pk)
            c.circ(wx, wy + 6, rr_, outline=(255, 236, 190, int(190 * (1 - pk) ** 1.5)),
                   width=3 - k * .7)
    if sparks > 0:
        import random as _r
        rr2 = _r.Random(11)
        for k in range(18):
            a_ = k * math.tau / 18 + .3
            dist = 96 * ease_out(sparks) * (.55 + .45 * rr2.random())
            sx = wx + dist * math.cos(a_)
            sy = wy + 6 + dist * math.sin(a_) * .8
            al = int(255 * (1 - sparks) ** 1.4)
            c.circ(sx, sy, 3.2 * (1 - sparks) + .8,
                   fill=(255, int(lerp(238, 150, sparks)), 130, al))
    c.img.paste(vignette(), (0, int(AR_TOP * S)), vignette())
    c.d = ImageDraw.Draw(c.img, "RGBA")
    # HUD
    ornate_frame(c, 20, 58, 40, 34, 9, PANEL_DARK, gems=False)
    for dx in (-4, 4):
        c.rr(40 + dx - 2.5, 66, 5, 18, 1.5, fill=GOLD_LIGHT)
    c.txt(LW - 24, 62, "SCORE", 9.5, "Bold", GOLD, anchor="rm", rtl=False)
    c.txt(LW - 24, 80, f"{score}", 19, "Black", (255, 255, 255), anchor="rm", rtl=False)
    c.txt(LW - 108, 62, "LEVEL", 9.5, "Bold", GOLD, anchor="rm", rtl=False)
    c.txt(LW - 108, 80, "3", 19, "Black", (255, 255, 255), anchor="rm", rtl=False)
    banner(c, LW/2, BANNER_Y + 8, 268, 66, "ECLIPSE", ph)
    game_hp(c, LW - 146, A(150), 122, hp, (226, 62, 62), "חיי היריב",
            f"{int(hp*100)}/100", ghost=hp_ghost)
    game_hp(c, LW/2 - 62, A(336), 124, .82, (74, 200, 90), "חיי השחקן", "82/100")
    if toast > 0:
        a = int(255 * toast)
        tw_ = c.tw("מתקפה!", 15, "Bold") + 58
        ty_ = A(232)
        c.rr(LW/2 - tw_/2, ty_, tw_, 36, 10, fill=(24, 18, 34, int(225 * toast)))
        c.rr(LW/2 - tw_/2, ty_, tw_, 36, 10, outline=GOLD + (a,), width=1.6)
        icon_sword(c, LW/2 - tw_/2 + 20, ty_ + 18, GOLD_LIGHT + (a,), sc=.85)
        c.txt(LW/2 + 12, ty_ + 18, "מתקפה!", 15, "Bold", (255, 250, 240, a))
    if combo > 0:
        a = int(255 * combo)
        x_ = lerp(-90, 26, ease_back(clamp(combo * 2)))
        c.rr(x_, A(268), 96, 32, 16, fill=(120, 60, 180, int(220 * combo)))
        c.rr(x_, A(268), 96, 32, 16, outline=(214, 160, 255, a), width=1.4)
        c.txt(x_ + 48, A(284), "קומבו ×2", 12.5, "Bold", (255, 240, 255, a))
    # answers
    bw, bh, gap = (LW - 44 - 12) / 2, 58, 12
    by0 = 578
    for i, (opt, kind) in enumerate(BATTLE_OPTS):
        row, col_i = i // 2, i % 2
        bx = 22 + (1 - col_i) * (bw + gap)
        by = by0 + row * (bh + gap)
        is_sel, is_cor = (sel == i), (i == CORRECT)
        gx_, gy_, gw_, gh_ = bx, by, bw, bh
        if revealed and is_cor:
            k = 1 + .05 * win_pop
            gw_, gh_ = bw * k, bh * k
            gx_, gy_ = bx - (gw_ - bw) / 2, by - (gh_ - bh) / 2
            fill, bord = (128, 88, 28), GOLD_LIGHT
            rglow(c, gx_, gy_, gw_, gh_, 12, GOLD, spread=11, a0=64)
        elif revealed and is_sel:
            fill, bord = (110, 34, 40), DANGER
        else:
            fill, bord = PANEL_DARK, GOLD
        ornate_frame(c, gx_, gy_, gw_, gh_, 12, fill, border=bord,
                     width=2.2 if (revealed and is_cor) else 1.8)
        opt_icon(c, gx_ + 26, gy_ + gh_/2, kind, GOLD_LIGHT)
        c.txt(gx_ + gw_/2 + 10, gy_ + gh_/2, opt, 17, "Bold", (255, 252, 246))
    c.rr(22, 706, LW - 44, 38, 11, fill=(20, 26, 44, 190))
    c.rr(22, 706, LW - 44, 38, 11, outline=GOLD + (110,), width=1)
    c.txt(LW/2, 725, "זירת הקרב מבודדת · אין השפעה על SM-2", 11.5, "Medium",
          GOLD_LIGHT + (225,))
    if flash > 0:
        c.d.rectangle([0, AR_TOP*S, W, (AR_TOP+AR_H)*S],
                      fill=(255, 250, 236, int(132 * flash)))

def scene_battle(t):
    c = C(); status_bar(c)
    TAP   = 2.55
    ANT   = TAP + .05          # anticipation
    SLASH = TAP + .30
    HIT   = TAP + .52
    sel = CORRECT if t >= TAP else None
    revealed = t >= TAP + .08
    swing = 0.0
    if t >= ANT:
        swing = ease_out(seg(t, ANT, SLASH + .12)) * (1 - seg(t, HIT + .9, HIT + 1.5))
    proj = None
    if SLASH <= t < HIT + .05:
        pp = ease_out(seg(t, SLASH, HIT))
        proj = (pp, 1 - seg(t, HIT - .06, HIT + .05))
    hp = 1.0 if t < HIT else lerp(1.0, .48, ease_out(seg(t, HIT, HIT + .55)))
    ghost = 1.0 if t < HIT else lerp(1.0, .48, ease_in_out(seg(t, HIT + .35, HIT + 1.25)))
    flash = (1 - seg(t, HIT, HIT + .12)) if HIT <= t < HIT + .12 else 0.0
    shock = seg(t, HIT, HIT + .75) if t >= HIT else 0.0
    shock = shock if shock < 1 else 0.0
    sparks = seg(t, HIT, HIT + .6) if t >= HIT else 0.0
    sparks = sparks if sparks < 1 else 0.0
    hit = (1 - seg(t, HIT, HIT + .45)) if HIT <= t < HIT + .45 else 0.0
    shake = math.sin((t - HIT) * 74) * 5.0 * (1 - seg(t, HIT, HIT + .55)) if HIT <= t < HIT + .55 else 0.0
    zoom = 1.0 + .045 * (seg(t, ANT, HIT) if t < HIT else (1 - seg(t, HIT, HIT + .9)))
    toast = seg(t, HIT + .1, HIT + .3) * (1 - seg(t, HIT + 1.5, HIT + 1.9))
    combo = seg(t, HIT + .25, HIT + .5) * (1 - seg(t, HIT + 1.7, HIT + 2.1))
    win_pop = (1 - seg(t, TAP + .08, TAP + .5)) if t < TAP + .5 else 0.0
    score = 1250 + int(120 * ease_out(seg(t, HIT, HIT + .8)))
    screen_battle(c, t, sel=sel, revealed=revealed, hp=hp, hp_ghost=ghost,
                  swing=swing, shake=shake, score=score, toast=toast, zoom=zoom,
                  flash=flash, shock=shock, sparks=sparks, hit=hit, combo=combo,
                  proj=proj, win_pop=win_pop)
    if t >= HIT:
        p = seg(t, HIT, HIT + 1.3)
        a = max(0, int(255 * (1 - seg(t, HIT + .8, HIT + 1.4))))
        dxp, dyp = LW/2 - 26, AR_TOP + 118 - 46 * ease_out(p)
        c.txt(dxp + 1.6, dyp + 1.6, "-27", 27, "Black", (60, 10, 10, int(a*.6)), rtl=False)
        c.txt(dxp, dyp, "-27", 27, "Black", (255, 120, 120, a), rtl=False)
    if abs(t - TAP) < .5:
        bw, bh, gap = (LW - 44 - 12) / 2, 58, 12
        touch(c, 22 + (1 - CORRECT % 2) * (bw + gap) + bw/2,
              578 + (CORRECT // 2) * (bh + gap) + bh/2,
              press=clamp(1 - abs(t - TAP) / .3), ripple=seg(t, TAP, TAP + .55))
    return c.img

# =========================================================== SCENE: stories
STORY = [
    ("Every", None), ("morning", None), ("Maya", None), ("walks", None), ("to", None),
    ("the", None), ("old", None), ("library", "library"), ("near", None), ("the", None),
    ("river.", "river"), ("She", None), ("likes", None), ("the", None), ("quiet", "quiet"),
    ("rooms", None), ("and", None), ("the", None), ("smell", "smell"), ("of", None),
    ("old", None), ("paper.", None), ("One", None), ("day", None), ("she", None),
    ("found", "found"), ("a", None), ("small", None), ("book", "book"), ("with", None),
    ("no", None), ("title", None), ("on", None), ("it.", None), ("Inside,", None),
    ("someone", None), ("had", None), ("written", None), ("one", None),
    ("sentence", "sentence"), ("in", None), ("pencil.", None),
]
KNOWN = {"river", "book"}          # already marked ידעתי
GLOSS = {
    "river":    ("נָהָר", "שם עצם"),
    "book":     ("סֵפֶר", "שם עצם"),
    "library":  ("סִפְרִיָּה", "שם עצם"),
    "quiet":    ("שָׁקֵט", "שם תואר"),
    "smell":    ("רֵיחַ", "שם עצם"),
    "found":    ("מָצְאָה", "פועל · עבר"),
    "sentence": ("מִשְׁפָּט", "שם עצם"),
}
ST_X, ST_Y, ST_W, ST_H = 24, 246, LW - 48, 306
ST_PAD, ST_LINE = 22, 32

def layout_story(c, size=15.5):
    """left-to-right wrap; returns [(word, key, x, y, w)]"""
    out, x, y = [], ST_X + ST_PAD, ST_Y + ST_PAD + 10
    maxw = ST_W - ST_PAD * 2
    sp = c.tw(" ", size)
    for word, key in STORY:
        wpx = c.tw(word, size, "SemiBold" if key else "Regular")
        if x - (ST_X + ST_PAD) + wpx > maxw:
            x = ST_X + ST_PAD; y += ST_LINE
        out.append((word, key, x, y, wpx))
        x += wpx + sp
    return out

QUESTION = ("What did Maya find inside the book?",
            ["מִשְׁפָּט אֶחָד בְּעִפָּרוֹן", "מַפָּה יְשָׁנָה", "תְּמוּנָה שֶׁל נָהָר"], 0)

def story_question(c, t, sel=None, revealed=False):
    c.rr(ST_X, ST_Y, ST_W, ST_H, 22, fill=RAISED)
    c.rr(ST_X, ST_Y, ST_W, ST_H, 22, outline=BORDER_SUB, width=1.2)
    c.txt(LW/2, ST_Y + 34, "שאלת הבנה", 12.5, "SemiBold", BRAND_SURFACE)
    c.txt(LW/2, ST_Y + 68, QUESTION[0], 15, "SemiBold", INK, rtl=False)
    for i, opt in enumerate(QUESTION[1]):
        y = ST_Y + 100 + i * 62
        cor = (i == QUESTION[2])
        if revealed and cor:      fill, bord, col = SUCCESS + (46,), SUCCESS, SUCCESS
        elif revealed and i == sel: fill, bord, col = DANGER + (46,), DANGER, DANGER
        else:                     fill, bord, col = (0,0,0,0), BORDER_SUB, INK
        c.rr(ST_X + 16, y, ST_W - 32, 50, 14, fill=fill)
        c.rr(ST_X + 16, y, ST_W - 32, 50, 14, outline=bord + (255,),
             width=1.8 if (revealed and (cor or i == sel)) else 1.1)
        lx = ST_X + ST_W - 34
        if revealed and cor:
            icon_check(c, ST_X + 44, y + 25, SUCCESS, sc=1.1)
        c.txt(lx, y + 25, opt, 14, "Medium", col, anchor="rm")

def screen_story(c, t, active=None, pop=0.0, added=False, question=False,
                 q_sel=None, q_rev=False):
    c.txt(LW - 24, 106, "העולם · סיפורים", 12.5, "Regular", INK_MUTED + (190,), anchor="rm")
    c.txt(LW - 24, 132, "הספרייה של מאיה", 25, "Bold", INK, anchor="rm")
    # T-241ⓑ · `36 § 7` names this subtitle word for word, and `36 § 1` gives 36 the
    # win in any conflict. The retired wording promised a visual marker the screen
    # ⛔ never draws — the only marking is «ידועה» (§ 4.2יג-ב ⓑ) — which is F-123.
    c.txt(LW - 24, 160, "סיפור ברמה שלך · הקש על מילה לתרגום", 12.5,
          "Regular", INK_MUTED + (185,), anchor="rm")
    cw_ = c.tw("A1", 12, "Bold") + 26
    c.rr(24, 182, cw_, 26, 13, fill=BRAND + (46,))
    c.rr(24, 182, cw_, 26, 13, outline=BRAND + (150,), width=1)
    c.txt(24 + cw_/2, 195, "A1", 12, "Bold", BRAND_SURFACE)
    c.txt(LW - 24, 195, "סיפור 3 מתוך 12", 12, "Medium", INK_MUTED + (200,), anchor="rm")
    c.rr(24 + cw_ + 12, 192, LW - 48 - cw_ - 12 - 96, 8, 4, fill=BORDER_SUB)
    c.rr(LW - 24 - 96 - (LW - 48 - cw_ - 12 - 96) * .34, 192,
         (LW - 48 - cw_ - 12 - 96) * .34, 8, 4, fill=BRAND)
    c.rr(ST_X, ST_Y, ST_W, ST_H, 22, fill=RAISED)
    c.rr(ST_X, ST_Y, ST_W, ST_H, 22, outline=BORDER_SUB, width=1.2)
    box = None
    if question:
        story_question(c, t, sel=q_sel, revealed=q_rev)
    else:
      for word, key, x, y, wpx in layout_story(c):
        if key and key in KNOWN:
            c.line(x, y + 12, x + wpx, y + 12, SUCCESS + (200,), 1.6)
            c.txt(x, y, word, 15.5, "SemiBold", INK, anchor="lm", rtl=False)
        elif key:
            # T-241ⓐ · `36 § 7`: «⛔ מילים חדשות אינן מסומנות מראש» — retrieval only helps
            # when it is effort. ⇒ a tappable-but-new word is drawn EXACTLY like any other
            # untouched word, and `components/StoryScreen.tsx` already paints it that way
            # (§ 4.2יג-ב ⓑ · D-108 «New words carry NOTHING»). The chip and the brand
            # underline that used to sit here were the pre-marking F-123 measured.
            # ⚠️ **The ACTIVE chip stays, and it is ⛔ not pre-marking:** it is the tap
            # itself — the frame where the finger lands, one word at a time, which is the
            # only thing a video can show a press with. The screen's equivalent is the
            # popover, and it opens on exactly the same event.
            on = (key == active)
            if on:
                c.rr(x - 5, y - 13, wpx + 10, 27, 7, fill=BRAND + (150,))
                c.txt(x, y, word, 15.5, "SemiBold", BRAND_ON, anchor="lm", rtl=False)
                box = (x, y, wpx)
            else:
                c.txt(x, y, word, 15.5, "Regular", INK_MUTED + (238,),
                      anchor="lm", rtl=False)
        else:
            c.txt(x, y, word, 15.5, "Regular", INK_MUTED + (238,), anchor="lm", rtl=False)
    c.txt(LW - 24, ST_Y + ST_H + 30, "5 מילים חדשות · 2 שכבר ידעת", 12,
          "Regular", INK_MUTED + (175,), anchor="rm")
    c.line(48, ST_Y + ST_H + 30 - 6, 76, ST_Y + ST_H + 30 - 6, SUCCESS + (200,), 1.6)
    c.txt(84, ST_Y + ST_H + 30, "ידועה", 11, "Regular", INK_MUTED + (160,), anchor="lm")
    c.rr(24, ST_Y + ST_H + 50, LW - 48, 54, 16, fill=BRAND_SURFACE)
    # T-241ⓑ · T-151ⓓ — there is ⛔ no next item in a sequence: `lib/core/storyPick.ts`
    # picks on a DAY index in `LEARNER_TIME_ZONE`, so a press returns the SAME story and
    # the next one is tomorrow's. The label now names what the button does, exactly as
    # `components/StoryScreen.tsx` (`DONE_READING_HE`) already labels it.
    c.txt(LW/2, ST_Y + ST_H + 77, "סיימתי לקרוא", 15.5, "Bold", BRAND_ON)
    # translation popover
    if box and pop > 0:
        x, y, wpx = box
        e = ease_back(clamp(pop))
        pw, phh = 200, 134
        px = clamp(x + wpx/2 - pw/2, 30, LW - 30 - pw)
        py = y + 20
        he, pos = GLOSS[active]
        c.d.polygon([((x+wpx/2)*S, (py-9)*S), ((x+wpx/2+9)*S, (py+1)*S),
                     ((x+wpx/2-9)*S, (py+1)*S)], fill=(20, 30, 54))
        hgt = phh * e
        c.rr(px, py, pw, hgt, 16, fill=(20, 30, 54))
        c.rr(px, py, pw, hgt, 16, outline=BRAND + (190,), width=1.4)
        if e > .55:
            a = int(255 * clamp((e - .55) / .35))
            c.txt(px + pw/2, py + 24, active, 13.5, "SemiBold",
                  INK_MUTED + (int(a*.85),), rtl=False)
            c.txt(px + pw/2, py + 52, he, 20, "Bold", INK + (a,))
            c.txt(px + pw/2, py + 73, pos, 11, "Regular", BRAND_SURFACE + (a,))
            by = py + 88
            if added:
                c.rr(px + 14, by, pw - 28, 32, 10, fill=SUCCESS + (46,))
                c.rr(px + 14, by, pw - 28, 32, 10, outline=SUCCESS + (a,), width=1.3)
                icon_check(c, px + 36, by + 16, SUCCESS + (a,), sc=1.0)
                c.txt(px + pw/2 + 10, by + 16, "נוספה לחזרה", 12, "Bold", SUCCESS + (a,))
            else:
                c.rr(px + 14, by, pw - 28, 32, 10, fill=BRAND_SURFACE + (a,))
                c.txt(px + pw/2, by + 16, "הוסף לכרטיסיות", 12, "Bold", BRAND_ON + (a,))

def scene_story(t):
    c = C(); status_bar(c)
    tap_node, rev_a, rev_b = .85, .85, 1.62
    w1, add_t, w2, q_t, q_ans = 2.45, 3.65, 5.05, 6.45, 7.45
    if t < rev_a:
        screen_world(c, t, appear=1.0, tap_idx=STORY_NODE,
                     tap_p=clamp(1 - abs(t - tap_node) / .3) if abs(t - tap_node) < .3 else 0)
        bottom_nav(c, active="העולם", world_pulse=t * .5)
    else:
        base = C(); status_bar(base)
        screen_world(base, t, appear=1.0, tap_idx=STORY_NODE, tap_p=1.0)
        bottom_nav(base, active="העולם", world_pulse=t * .5)
        top = C(); status_bar(top)
        active, pop = None, 0.0
        if w1 <= t < w2:
            active, pop = "library", seg(t, w1, w1 + .3) * (1 - seg(t, w2 - .18, w2))
        elif w2 <= t < q_t:
            active, pop = "sentence", seg(t, w2 + .05, w2 + .35) * (1 - seg(t, q_t - .2, q_t))
        screen_story(top, t, active=active, pop=pop, added=(t >= add_t and active == "library"),
                     question=(t >= q_t), q_sel=0 if t >= q_ans else None,
                     q_rev=(t >= q_ans + .08))
        bottom_nav(top, active="העולם", world_pulse=t * .5)
        pr = ease_out(seg(t, rev_a, rev_b))
        nx, ny = node_pos(STORY_NODE)
        R_ = math.hypot(W, H)
        mask = Image.new("L", (W, H), 0)
        ImageDraw.Draw(mask).ellipse([nx*S - pr*R_, ny*S - pr*R_, nx*S + pr*R_, ny*S + pr*R_],
                                     fill=255)
        base.img.paste(top.img, (0, 0), mask)
        c.img = base.img; c.d = ImageDraw.Draw(c.img, "RGBA")
    if abs(t - tap_node) < .5:
        nx, ny = node_pos(STORY_NODE)
        touch(c, nx, ny, press=clamp(1 - abs(t - tap_node) / .3),
              ripple=seg(t, tap_node, tap_node + .55))
    for wt, key in ((w1, "library"), (w2, "sentence")):
        if abs(t - wt) < .5:
            for word, k, x, y, wpx in layout_story(c):
                if k == key:
                    touch(c, x + wpx/2, y, press=clamp(1 - abs(t - wt) / .3),
                          ripple=seg(t, wt, wt + .55))
                    break
    if abs(t - add_t) < .45:
        for word, k, x, y, wpx in layout_story(c):
            if k == "library":
                px = clamp(x + wpx/2 - 100, 30, LW - 230)
                touch(c, px + 100, y + 20 + 104,
                      press=clamp(1 - abs(t - add_t) / .28),
                      ripple=seg(t, add_t, add_t + .5))
                break
    if abs(t - q_ans) < .45:
        touch(c, LW/2, ST_Y + 125, press=clamp(1 - abs(t - q_ans) / .28),
              ripple=seg(t, q_ans, q_ans + .5))
    scene_label(c, t, "סיפורים · הקשה על מילה")
    return c.img

# =========================================================== SCENE: placement
def scene_placement(t):
    c = C(); status_bar(c)
    e = ease_back(clamp(seg(t, .15, .9)))
    c.txt(LW/2, 132, "מבחן הרמה הסתיים", 13, "Medium", INK_MUTED + (210,))
    for i in range(7, 0, -1):
        f = i / 7
        c.circ(LW/2, 250, 86 * f * e, fill=(57, 135, 229, int(15 * (1 - f) * 7)))
    c.circ(LW/2, 250, 78 * e, fill=RAISED)
    c.circ(LW/2, 250, 78 * e, outline=BRAND + (200,), width=2)
    if e > .5:
        a = int(255 * clamp((e - .5) / .4))
        c.txt(LW/2, 232, "A1", 52, "Black", BRAND_SURFACE + (a,), rtl=False)
        c.txt(LW/2, 286, "הרמה שלך", 12.5, "Medium", INK_MUTED + (a,))
    p = clamp(seg(t, .9, 1.5))
    c.txt(LW/2, 372, "24 מתוך 30 תשובות נכונות", 15, "SemiBold", INK + (int(255*p),))
    c.rr(48, 396, LW - 96, 10, 5, fill=BORDER_SUB + (int(255*p),))
    c.rr(LW - 48 - (LW - 96) * .8 * ease_out(p), 396, (LW - 96) * .8 * ease_out(p),
         10, 5, fill=BRAND)
    rows = [("מילים במסלול שלך", "400"), ("מילים לתרגול ראשוני", "314"),
            ("רמה הבאה", "A2 · אחרי 100 מילים")]
    for i, (k, v) in enumerate(rows):
        y = 440 + i * 58
        p2 = clamp(seg(t, 1.2 + i * .14, 1.6 + i * .14))
        c.rr(24, y, LW - 48, 48, 14, fill=RAISED + (int(255*p2),))
        c.rr(24, y, LW - 48, 48, 14, outline=BORDER_SUB + (int(255*p2),), width=1.1)
        c.txt(LW - 40, y + 24, k, 13, "Medium", INK + (int(230*p2),), anchor="rm")
        c.txt(40, y + 24, v, 13.5, "Bold", BRAND_SURFACE + (int(255*p2),), anchor="lm")
    p3 = clamp(seg(t, 1.9, 2.4))
    c.rr(24, 628, LW - 48, 56, 16, fill=BRAND_SURFACE)
    c.txt(LW/2, 656, "התחל ללמוד", 15.5, "Bold", BRAND_ON)
    c.txt(LW/2, 706, "שינוי רמה אפשרי בכל רגע בהגדרות", 11.5, "Regular",
          INK_MUTED + (int(170*p3),))
    scene_label(c, t, "תוצאת מבחן הרמה")
    return c.img

# =========================================================== SCENE: me
def scene_me(t):
    c = C(); status_bar(c)
    c.txt(LW - 24, 112, "אני", 25, "Bold", INK, anchor="rm")
    c.txt(LW - 24, 140, "הפרופיל שלך · רמה A1", 12.5, "Regular", INK_MUTED + (185,), anchor="rm")
    p = ease_out(seg(t, .3, 1.9))
    days = 12
    cx_, cy_, r_ = LW/2, 268, 76
    c.circ(cx_, cy_, r_, outline=BORDER_SUB, width=9)
    glow(c, cx_, cy_, r_, (255, 150, 60), spread=18, a0=int(70 * p))
    c.d.arc([(cx_-r_)*S, (cy_-r_)*S, (cx_+r_)*S, (cy_+r_)*S],
            -90, -90 + 360 * p, fill=(255, 168, 72), width=int(9*S))
    c.txt(cx_, cy_ - 12, f"{int(days*p)}", 46, "Black", INK, rtl=False)
    c.txt(cx_, cy_ + 26, "ימים ברצף", 12.5, "Medium", INK_MUTED + (215,))
    labels = ["א", "ב", "ג", "ד", "ה", "ו", "ש"]
    for i in range(7):
        x = LW - 40 - i * ((LW - 80) / 6)
        on = i < 6
        c.circ(x, 392, 15, fill=(255, 168, 72, 46) if on else RAISED)
        c.circ(x, 392, 15, outline=((255, 168, 72) if on else BORDER_SUB) + (255,),
               width=1.6 if on else 1.1)
        if on: icon_check(c, x, 392, (255, 196, 120), sc=.95)
        c.txt(x, 420, labels[i], 11, "Medium", INK_MUTED + (190,))
    tiles = [("מילים שסוננו", "86", BRAND_SURFACE), ("זמן למידה", "4:12", INK),
             ("מסלולים", "2", SUCCESS)]
    tw_ = (LW - 48 - 20) / 3
    for i, (k, v, col) in enumerate(tiles):
        x = LW - 24 - tw_ - i * (tw_ + 10)
        p2 = clamp(seg(t, .8 + i * .12, 1.2 + i * .12))
        c.rr(x, 452, tw_, 88, 16, fill=RAISED + (int(255*p2),))
        c.rr(x, 452, tw_, 88, 16, outline=BORDER_SUB + (int(255*p2),), width=1.1)
        c.txt(x + tw_/2, 494, v, 22, "Bold", col + (int(255*p2),), rtl=False)
        c.txt(x + tw_/2, 522, k, 11, "Medium", INK_MUTED + (int(200*p2),))
    c.rr(24, 560, LW - 48, 56, 16, fill=RAISED)
    c.rr(24, 560, LW - 48, 56, 16, outline=BORDER_SUB, width=1.1)
    icon_gear(c, 52, 588, INK_MUTED + (215,), sc=.95)
    c.txt(LW - 42, 588, "הגדרות · שינוי רמה ומסלולים", 13.5, "Medium", INK, anchor="rm")
    c.txt(LW/2, 646, "רצף נשמר גם ביום שבו למדת 5 מילים בלבד", 11.5, "Regular",
          INK_MUTED + (160,))
    bottom_nav(c, active="אני", world_pulse=t * .5)
    scene_label(c, t, "אני · רצף יומי")
    return c.img

# =========================================================== SCENE 4
TRACKS = ["אוצר מילים", "דקדוק", "כתיבה", "הבנת הנקרא"]
TRACK_DATA = {
    "אוצר מילים": ("בקצב הזה תסיים A1 בעוד 12 יום", [
        ("A1 · 100 מילות בסיס",   "הושלם · 100/100", "done"),
        ("A1 · פעלים נפוצים",     "הושלם · 60/60",   "done"),
        ("A1 · משפחה ובית",       "בתהליך · 18/40",  "current"),
        ("A2 · זמנים – עבר",      "ייפתח אחרי A1",   "locked"),
        ("A2 · תארים והשוואה",    "נעול",            "locked"),
        ("B1 · אוצר מילים אקדמי", "נעול",            "locked"),
    ]),
    "דקדוק": ("בקצב הזה תסיים את A1 בעוד 9 ימים", [
        ("A1 · זמן הווה פשוט",    "הושלם · 9/9 נושאים",  "done"),
        ("A1 · יידוע ורבים",       "בתהליך · 4/9 נושאים", "current"),
        ("A2 · זמן עבר",           "נעול",                "locked"),
        ("A2 · מילות יחס",         "נעול",                "locked"),
        ("B1 · משפטי תנאי",        "נעול",                "locked"),
    ]),
    "כתיבה": (None, [
        ("פסקה מתארת",   "3 חיבורים שנבדקו", "done"),
        ("מכתב רשמי",    "בתהליך · טיוטה 1", "current"),
        ("חיבור טיעון",   "נעול",             "locked"),
    ]),
    "הבנת הנקרא": ("בקצב הזה תסיים את A2 בעוד 21 יום", [
        ("טקסטים קצרים",  "הושלם · 12/12", "done"),
        ("מודעות וטפסים", "בתהליך · 3/10", "current"),
        ("מאמרי דעה",     "נעול",          "locked"),
    ]),
}

def screen_hub(c, t, track="אוצר מילים", scroll=0.0, press=None):
    forecast, mods = TRACK_DATA[track]
    top = 258
    spine_x = LW - 46
    y0 = top - scroll
    c.line(spine_x, max(top, y0 + 10), spine_x, min(NAV_Y - 12, y0 + len(mods) * 96),
           BORDER_SUB, 2)
    for i, (title, sub, st) in enumerate(mods):
        y = y0 + i * 96
        if y < top - 90 or y > NAV_Y: continue
        if st == "done":      ring, txtc, subc = SUCCESS, INK, SUCCESS
        elif st == "current": ring, txtc, subc = BRAND, INK, BRAND_SURFACE
        else:                 ring, txtc, subc = BORDER_STRONG, INK_MUTED + (170,), INK_MUTED + (130,)
        if st == "current": glow(c, spine_x, y + 34, 15, BRAND, spread=14, a0=90)
        c.circ(spine_x, y + 34, 15, fill=SURFACE)
        c.circ(spine_x, y + 34, 15, outline=ring + (255,), width=2)
        if st == "done":      icon_check(c, spine_x, y + 34, SUCCESS, sc=1.15)
        elif st == "current": c.circ(spine_x, y + 34, 6, fill=BRAND_SURFACE)
        else:                 icon_lock(c, spine_x, y + 32, BORDER_STRONG, sc=.85)
        cw = LW - 100
        c.rr(28, y, cw, 72, 16, fill=RAISED + (255 if st != "locked" else 150,))
        c.rr(28, y, cw, 72, 16,
             outline=(BRAND + (170,)) if st == "current" else BORDER_SUB + (255,),
             width=1.6 if st == "current" else 1.1)
        c.txt(28 + cw - 18, y + 26, title, 15, "SemiBold", txtc, anchor="rm")
        c.txt(28 + cw - 18, y + 50, sub, 12, "Regular", subc, anchor="rm")
        if st == "current":
            c.rr(46, y + 44, 90, 6, 3, fill=BORDER_SUB)
            c.rr(46 + 90*.55, y + 44, 90*.45, 6, 3, fill=BRAND)
    # header sits above the list
    c.rr(0, 0, LW, top - 16, 0, fill=SURFACE)
    c.txt(LW - 24, 112, "לימודים", 25, "Bold", INK, anchor="rm")
    c.txt(LW - 24, 140, "בחר מסלול · לכל מסלול מדד התקדמות משלו", 12.5,
          "Regular", INK_MUTED + (185,), anchor="rm")
    # track chips (RTL: first on the right)
    x = LW - 24
    for tr in TRACKS:
        w = c.tw(tr, 12.5, "Bold" if tr == track else "Regular") + 26
        if x - w < 20:
            break
        on = (tr == track)
        pr = 2 if press == tr else 0
        c.rr(x - w + pr/2, 166 + pr/2, w - pr, 32 - pr, 16,
             fill=BRAND + (52,) if on else RAISED)
        c.rr(x - w + pr/2, 166 + pr/2, w - pr, 32 - pr, 16,
             outline=(BRAND if on else BORDER_SUB) + (255,), width=1.6 if on else 1.1)
        c.txt(x - w/2, 182, tr, 12.5, "Bold" if on else "Regular",
              BRAND_SURFACE if on else INK_MUTED + (205,))
        x -= w + 8
    if forecast:
        c.rr(24, 210, LW - 48, 32, 10, fill=(30, 41, 59, 190))
        c.txt(LW - 38, 226, forecast, 11.5, "Medium", INK_MUTED + (225,), anchor="rm")
        c.circ(46, 226, 7, outline=BRAND_SURFACE, width=1.5)
        c.line(46, 222, 46, 226, BRAND_SURFACE, 1.4)

def scene_hub(t):
    c = C(); status_bar(c)
    sw_t = 2.3
    track = "כתיבה" if t >= sw_t else "אוצר מילים"
    sa, sb = .9, 2.0
    scroll = ease_in_out(seg(t, sa, sb)) * 170 if t < sw_t else 0.0
    screen_hub(c, t, track=track, scroll=scroll,
               press="כתיבה" if abs(t - sw_t) < .2 else None)
    bottom_nav(c, active="לימודים", world_pulse=t * .5)
    if sa - .3 <= t < sb:
        p = ease_in_out(seg(t, sa, sb))
        touch(c, LW/2, 520 - p * 170, press=.7)
    if abs(t - sw_t) < .5:
        x = LW - 24
        for tr in TRACKS:
            w = c.tw(tr, 12.5, "Regular") + 26
            if tr == "כתיבה":
                touch(c, x - w/2, 182, press=clamp(1 - abs(t - sw_t) / .28),
                      ripple=seg(t, sw_t, sw_t + .5))
                break
            x -= w + 8
    scene_label(c, t, "לימודים · מכולה של מסלולים")
    return c.img

# =========================================================== OUTRO
def scene_outro(t):
    c = C()
    p = ease_out(seg(t, 0, .8))
    glow(c, LW/2, LH/2 - 40, 54, BRAND, spread=34, a0=int(80 * p))
    c.circ(LW/2, LH/2 - 40, 54 * p, fill=RAISED)
    c.circ(LW/2, LH/2 - 40, 54 * p, outline=BRAND + (int(190*p),), width=1.6)
    if p > .3:
        c.txt(LW/2, LH/2 - 40, "קול", 42, "Bold", INK + (int(255*p),))
    a = int(255 * seg(t, .7, 1.4))
    c.txt(LW/2, LH/2 + 60, "אנגלית · מסלול אמיר״ם", 16, "SemiBold", INK + (a,))
    c.txt(LW/2, LH/2 + 92, "מפרט UX · לא צילום מסך של הבנוי", 12.5, "Regular",
          INK_MUTED + (int(a*.8),))
    return c.img

# =========================================================== timeline
SCENES = [
    (scene_placement, 3.4),
    (scene_deck,      5.9),
    (scene_cards,     7.2),
    (scene_hub,       5.4),
    (scene_story,     9.0),
    (scene_me,        5.0),
    (scene_outro,     2.4),
]
XF = 0.35  # crossfade

# T-241ⓒ — THE TWO STILLS `docs/design/` SHIPS, AND THE FRAME EACH ONE IS.
# ⛔ Measured, ⛔ not remembered: both were reproduced PIXEL-IDENTICAL (mean abs diff
# 0.00000 over all 1125x2436 px) from the pre-T-241 source at exactly these times, which
# is how the mapping below stopped being a guess. ⇒ after ANY edit to `screen_story`,
# `python3 render_video_A.py stills` re-cuts them; hand-editing the PNG is forbidden
# (HARD INVARIANTS — a derived file).
# ⚠️ The font is `FONT_PATH` above, and the same measurement proves it: a different
# Heebo build would ⛔ not land on 0.00000.
STILLS = {
    "kol-A-05-story.png":    4.00,
    "kol-A-06-question.png": 7.90,
}

def stills():
    here = os.path.dirname(os.path.abspath(__file__))
    for name, t in STILLS.items():
        scene_story(t).convert("RGB").save(os.path.join(here, name))
        print(f"  {name}  <- scene_story({t})", flush=True)

def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
    total = sum(d for _, d in SCENES) - XF * (len(SCENES) - 1)
    n = int(total * FPS)
    starts, acc = [], 0.0
    for fn, d in SCENES:
        starts.append(acc); acc += d - XF
    print(f"total {total:.2f}s  frames {n}", flush=True)
    for i in range(n):
        gt = i / FPS
        # find active scene(s)
        img = None
        for si, (fn, d) in enumerate(SCENES):
            lt = gt - starts[si]
            if 0 <= lt < d:
                cur = fn(lt)
                if img is None:
                    img = cur
                else:
                    a = clamp((gt - starts[si]) / XF)
                    img = Image.blend(img, cur, a)
        if img is None: img = SCENES[-1][0](SCENES[-1][1] - .01)
        img.save(f"{OUT}/f_{i:05d}.png")
        if i % 60 == 0: print(f"  {i}/{n}", flush=True)
    print("frames done", flush=True)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "stills":
        stills()
    else:
        main()
