#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Video B — the arcade. Arena home + the drag-combat loop."""
import math, os
from PIL import Image, ImageDraw, ImageFilter
from render_kol import (
    S, LW, LH, W, H, FPS, C, F, T, clamp, lerp, lerpc, ease_out, ease_in_out,
    ease_back, seg, glow, rglow, status_bar, touch, scene_label,
    SURFACE, RAISED, INK, INK_MUTED, BORDER_SUB, BORDER_STRONG,
    BRAND, BRAND_SURFACE, BRAND_ON, SUCCESS, DANGER,
    GOLD, GOLD_LIGHT, GEM, PANEL_DARK, AR_TOP, AR_H,
    arena_bg, vignette, embers, torch, ornate_frame, banner, wizard_sprite,
    icon_sword, icon_check, icon_x, icon_lock, icon_gear, icon_person,
    screen_world, node_pos, bottom_nav,
)

OUT = "/home/claude/frames_b"
ICE   = (126, 205, 240)
FIRE  = (255, 138, 74)
BOLT  = (196, 154, 255)
RAGE  = (255, 96, 96)

# ------------------------------------------------------------------ hero
def hero_sprite(c, cx, cy, sc=1.0, swing=0.0, lag=0.0, roll=0.0, aura=0.0):
    """Knight seen from behind. lag = follow-through offset, roll = dodge 0..1"""
    tilt = roll * 26
    cx += roll * 46 * (1 if roll > 0 else 0)
    cy += math.sin(roll * math.pi) * -10
    if aura > 0:
        for k in range(5, 0, -1):
            f = k / 5
            c.circ(cx, cy, (30 + 16 * f) * sc,
                   fill=(255, 190, 90, int(46 * aura * (1 - f))))
    c.d.ellipse([(cx-22*sc)*S, (cy+26*sc)*S, (cx+22*sc)*S, (cy+35*sc)*S],
                fill=(20, 17, 28, 120))
    for sgn in (-1, 1):
        c.rr(cx + sgn*7*sc - 4*sc, cy + 12*sc, 8*sc, 18*sc, 3*sc, fill=(52, 58, 80))
    # cape lags behind the body
    c.d.polygon([((cx-12*sc+lag)*S, (cy-8*sc)*S), ((cx+12*sc+lag)*S, (cy-8*sc)*S),
                 ((cx+8*sc+lag*2.2)*S, (cy+22*sc)*S), ((cx-8*sc+lag*2.2)*S, (cy+22*sc)*S)],
                fill=(122, 40, 58))
    c.rr(cx - 13*sc, cy - 10*sc, 26*sc, 26*sc, 7*sc, fill=(112, 126, 156))
    c.line(cx, cy - 8*sc, cx, cy + 14*sc, (86, 98, 126), 1.8*sc)
    for sgn in (-1, 1):
        c.circ(cx + sgn*14*sc, cy - 6*sc, 7*sc, fill=(142, 156, 186))
    c.circ(cx, cy - 20*sc, 8.5*sc, fill=(226, 182, 150))
    for k in range(-2, 3):
        c.line(cx + k*3.2*sc + lag*.5, cy - 26*sc,
               cx + k*3.6*sc + lag*1.4, cy - 33*sc, (72, 142, 220), 2.6*sc)
    c.rr(cx - 30*sc, cy - 10*sc, 17*sc, 22*sc, 5*sc, fill=(96, 116, 158),
         outline=GOLD, width=1.6*sc)
    c.circ(cx - 21.5*sc, cy + 1*sc, 3.6*sc, fill=GOLD_LIGHT)
    a = math.radians(lerp(28, -40, ease_out(swing)) + tilt)
    hx, hy = cx + 17*sc + lag, cy - 2*sc
    tx = hx + 36*sc*math.cos(a)
    ty = hy - 36*sc*math.sin(a) - 14*sc
    if swing > 0:
        for i in range(6):
            f = i / 6
            c.d.arc([(cx-2*sc)*S, (cy-36*sc)*S, (cx+54*sc)*S, (cy+18*sc)*S],
                    -62 + f*40, 18 + f*40,
                    fill=(140, 226, 255, int(100 * (1-f) * swing)), width=int(3*sc*S))
    c.line(hx, hy, tx, ty, (206, 220, 244), 3.4*sc)
    c.line(hx, hy, tx, ty, (240, 250, 255), 1.4*sc)
    if aura > 0:
        c.line(hx, hy, tx, ty, (255, 200, 110, int(210 * aura)), 5.2*sc)
        c.line(hx, hy, tx, ty, (255, 250, 220, int(230 * aura)), 1.8*sc)
    c.line(hx - 5*sc, hy - 3*sc, hx + 6*sc, hy + 2*sc, GOLD, 3*sc)

# ------------------------------------------------------------------ home
BOSS_STATES = ["done", "done", "done", "current", "boss"]
GEAR = [("חרב הניצוץ", "sword", True), ("מגן אבן", "shield", True),
        ("לחש אש", "fire", True), ("שריון קל", "armor", False)]
DRAWER_ITEMS = [
    ("חרב הניצוץ",  "sword",  "open"),
    ("להב הסער",    "sword",  "open"),
    ("מגן אבן",     "shield", "open"),
    ("לחש אש",      "fire",   "open"),
    ("לחש קרח",     "ice",    "lock"),
    ("שריון כבד",   "armor",  "lock"),
    ("כתר הבוס",    "crown",  "lock"),
    ("להב הליבה",   "sword",  "lock"),
]

def gear_glyph(c, cx, cy, kind, col, sc=1.0):
    if kind == "sword":  icon_sword(c, cx, cy, col, sc=sc)
    elif kind == "shield":
        c.rr(cx-6*sc, cy-7*sc, 12*sc, 10*sc, 2.5*sc, outline=col, width=1.8*sc)
        c.d.polygon([((cx-6*sc)*S, (cy+3*sc)*S), ((cx+6*sc)*S, (cy+3*sc)*S),
                     (cx*S, (cy+9*sc)*S)], fill=col)
    elif kind == "fire":
        c.d.polygon([(cx*S, (cy-9*sc)*S), ((cx+6*sc)*S, (cy+2*sc)*S),
                     (cx*S, (cy+8*sc)*S), ((cx-6*sc)*S, (cy+2*sc)*S)], fill=col)
    elif kind == "ice":
        for k in range(3):
            a_ = k * math.pi / 3
            c.line(cx - 7*sc*math.cos(a_), cy - 7*sc*math.sin(a_),
                   cx + 7*sc*math.cos(a_), cy + 7*sc*math.sin(a_), col, 1.7*sc)
    elif kind == "armor":
        c.rr(cx-6*sc, cy-7*sc, 12*sc, 14*sc, 4*sc, outline=col, width=1.8*sc)
        c.line(cx, cy-4*sc, cx, cy+5*sc, col, 1.4*sc)
    else:
        c.d.polygon([((cx-8*sc)*S, (cy+5*sc)*S), ((cx+8*sc)*S, (cy+5*sc)*S),
                     ((cx+6*sc)*S, (cy-6*sc)*S), (cx*S, (cy+1*sc)*S),
                     ((cx-6*sc)*S, (cy-6*sc)*S)], fill=col)

def screen_home(c, t, drawer=0.0, equipped=0, tap=None, xp=.62):
    c.d.rectangle([0, 0, W, H], fill=SURFACE)
    for i in range(9, 0, -1):
        f = i / 9
        c.circ(LW/2, 300, 210 * f, fill=(46, 74, 130, int(9 * (1 - f) * 9)))
    # header
    c.txt(LW/2, 118, "זירת קרב", 24, "Bold", INK)
    c.txt(LW/2, 143, "ארקייד · מבודד מהתקדמות הלמידה", 11.5, "Regular",
          INK_MUTED + (175,))
    cw = c.tw("340", 13, "Bold") + 44
    c.rr(20, 104, cw, 30, 15, fill=RAISED)
    c.rr(20, 104, cw, 30, 15, outline=GOLD + (150,), width=1)
    c.d.polygon([(34*S, 112*S), (41*S, 119*S), (34*S, 126*S), (27*S, 119*S)], fill=GOLD_LIGHT)
    c.txt(20 + cw/2 + 8, 119, "340", 13, "Bold", GOLD_LIGHT, rtl=False)
    c.d.polygon([((LW-22)*S, 119*S), ((LW-33)*S, 112*S), ((LW-33)*S, 126*S)],
                fill=INK_MUTED + (200,))
    # pedestal + hero
    bob = math.sin(t * 1.5) * 2.2
    for i in range(7, 0, -1):
        f = i / 7
        c.d.ellipse([(LW/2-90*f)*S, (372-22*f)*S, (LW/2+90*f)*S, (372+22*f)*S],
                    fill=(90, 130, 200, int(12 * (1 - f) * 7)))
    c.d.ellipse([(LW/2-64)*S, 358*S, (LW/2+64)*S, 392*S], fill=(30, 41, 59))
    c.d.ellipse([(LW/2-64)*S, 352*S, (LW/2+64)*S, 386*S], fill=(44, 58, 82))
    hero_sprite(c, LW/2, 296 + bob, sc=2.1, lag=math.sin(t * 1.5 - .6) * 1.4)
    # level + xp
    c.rr(24, 404, LW - 48, 66, 18, fill=RAISED)
    c.rr(24, 404, LW - 48, 66, 18, outline=BORDER_SUB, width=1.1)
    c.txt(LW - 40, 426, "רמת זירה 7", 15, "Bold", INK, anchor="rm")
    c.txt(40, 426, "1,240 / 2,000", 11.5, "Medium", INK_MUTED + (200,),
          anchor="lm", rtl=False)
    c.rr(40, 440, LW - 80, 10, 5, fill=BORDER_SUB)
    c.rr(LW - 40 - (LW - 80) * xp, 440, (LW - 80) * xp, 10, 5, fill=BRAND)
    c.txt(LW - 40, 460, "נפרדת מרמת האנגלית שלך", 10.5, "Regular",
          INK_MUTED + (150,), anchor="rm")
    # boss track
    c.txt(LW - 24, 490, "נותרו 2 ניצחונות עד קרב הבוס", 12.5, "SemiBold",
          GOLD_LIGHT, anchor="rm")
    y = 522
    for i, st in enumerate(BOSS_STATES):
        x = LW - 44 - i * ((LW - 88) / 4)
        if i < 4:
            nx = LW - 44 - (i + 1) * ((LW - 88) / 4)
            c.line(nx, y, x, y, BORDER_SUB, 2)
        if st == "done":
            c.circ(x, y, 13, fill=(16, 60, 40)); c.circ(x, y, 13, outline=SUCCESS, width=1.8)
            icon_check(c, x, y, SUCCESS, sc=1.0)
        elif st == "current":
            glow(c, x, y, 13, BRAND, spread=12, a0=110)
            c.circ(x, y, 13, fill=RAISED); c.circ(x, y, 13, outline=BRAND, width=2)
            c.circ(x, y, 5, fill=BRAND_SURFACE)
        else:
            glow(c, x, y, 16, GOLD, spread=14, a0=90)
            c.circ(x, y, 16, fill=(60, 30, 40)); c.circ(x, y, 16, outline=GOLD, width=2)
            c.circ(x - 4, y - 3, 2, fill=DANGER); c.circ(x + 4, y - 3, 2, fill=DANGER)
            c.d.arc([(x-6)*S, (y+1)*S, (x+6)*S, (y+9)*S], 0, 180,
                    fill=GOLD_LIGHT, width=int(1.6*S))
    # equipment slots
    c.txt(LW - 24, 566, "ציוד", 13.5, "SemiBold", INK, anchor="rm")
    sw = 66
    for i, (name, kind, on) in enumerate(GEAR):
        x = LW - 24 - sw - i * (sw + 8)
        filled = on or (i == 3 and equipped)
        c.rr(x, 582, sw, sw, 14, fill=RAISED if filled else (24, 33, 52, 255))
        c.rr(x, 582, sw, sw, 14,
             outline=(GOLD if filled else BORDER_SUB) + (255,), width=1.6 if filled else 1.1)
        if filled:
            gear_glyph(c, x + sw/2, 582 + sw/2 - 4, kind, GOLD_LIGHT, sc=1.2)
            # T-241ⓓ · constitution א9 — 9px in a 375x812 space is under the text floor,
            # and the floor is a GATE (`check:text-floor`), ⛔ not taste. ⇒ 12.
            c.txt(x + sw/2, 582 + sw - 13, name, 12, "Medium", INK_MUTED + (210,))
        else:
            icon_lock(c, x + sw/2, 582 + sw/2, BORDER_STRONG + (150,), sc=1.0)
    # CTA + chips
    pr = 2.5 if tap == "start" else 0
    rglow(c, 24, 664, LW - 48, 58, 18, GOLD, spread=10, a0=54)
    c.rr(24 + pr/2, 664 + pr/2, LW - 48 - pr, 58 - pr, 18, fill=(146, 100, 30))
    c.rr(24 + pr/2, 664 + pr/2, LW - 48 - pr, 58 - pr, 18, outline=GOLD_LIGHT, width=2)
    c.txt(LW/2, 693, "התחל קרב", 17, "Black", (255, 250, 240))
    for i, lbl in enumerate(("ארון ציוד", "עיצוב דמות")):
        bw = (LW - 48 - 10) / 2
        x = 24 + i * (bw + 10)
        p2 = 2 if (tap == "gear" and lbl == "ארון ציוד") else 0
        c.rr(x + p2/2, 734 + p2/2, bw - p2, 42 - p2, 14, fill=RAISED)
        c.rr(x + p2/2, 734 + p2/2, bw - p2, 42 - p2, 14, outline=BORDER_SUB, width=1.1)
        c.txt(x + bw/2, 755, lbl, 12.5, "SemiBold", INK_MUTED + (230,))
    # drawer
    if drawer > 0:
        e = ease_out(drawer)
        top = lerp(LH, 366, e)
        c.d.rectangle([0, 0, W, H], fill=(6, 10, 20, int(150 * e)))
        c.rr(0, top, LW, LH - top + 20, 26, fill=(22, 30, 50))
        c.rr(0, top, LW, LH - top + 20, 26, outline=GOLD + (120,), width=1.2)
        c.rr(LW/2 - 22, top + 12, 44, 5, 2.5, fill=BORDER_STRONG + (150,))
        c.txt(LW - 24, top + 44, "ארון ציוד", 17, "Bold", INK, anchor="rm")
        c.txt(24, top + 44, "פריטים מקרבות בלבד", 11, "Regular",
              GOLD_LIGHT + (190,), anchor="lm")
        iw = (LW - 48 - 3 * 10) / 4
        for i, (name, kind, st) in enumerate(DRAWER_ITEMS):
            col_i, row = i % 4, i // 4
            x = LW - 24 - iw - col_i * (iw + 10)
            y2 = top + 68 + row * (iw + 30)
            open_ = st == "open"
            sel = (i == 1 and equipped)
            if sel: rglow(c, x, y2, iw, iw, 12, GOLD, spread=9, a0=80)
            c.rr(x, y2, iw, iw, 12, fill=RAISED if open_ else (18, 25, 42, 255))
            c.rr(x, y2, iw, iw, 12,
                 outline=(GOLD_LIGHT if sel else (GOLD if open_ else BORDER_SUB)) + (255,),
                 width=2 if sel else (1.4 if open_ else 1))
            if open_:
                gear_glyph(c, x + iw/2, y2 + iw/2, kind, GOLD_LIGHT, sc=1.15)
            else:
                icon_lock(c, x + iw/2, y2 + iw/2 - 3, BORDER_STRONG + (160,), sc=1.0)
            c.txt(x + iw/2, y2 + iw + 12, name, 9.5, "Medium",
                  INK_MUTED + (220 if open_ else 120,))
            if not open_:
                c.txt(x + iw/2, y2 + iw + 24, "ניצחון בקרב 12", 8, "Regular",
                      GOLD + (150,))

def scene_home(t):
    c = C(); status_bar(c)
    t_gear, t_equip, t_close, t_start = 1.5, 2.9, 4.1, 5.3
    drawer = 0.0
    if t_gear <= t < t_close: drawer = seg(t, t_gear, t_gear + .5)
    elif t_close <= t < t_close + .45: drawer = 1 - seg(t, t_close, t_close + .45)
    equipped = 1 if t >= t_equip else 0
    tap = None
    if abs(t - t_gear) < .18: tap = "gear"
    if abs(t - t_start) < .18: tap = "start"
    screen_home(c, t, drawer=drawer, equipped=equipped, tap=tap)
    for tt, pos in ((t_gear, (24 + (LW - 58) / 4, 755)),
                    (t_equip, (LW - 24 - (LW - 78) / 4 * 1.5, 366 + 68 + 33)),
                    (t_start, (LW/2, 693))):
        if abs(t - tt) < .45:
            touch(c, pos[0], pos[1], press=clamp(1 - abs(t - tt) / .28),
                  ripple=seg(t, tt, tt + .5))
    scene_label(c, t, "זירת קרב · מסך בית")
    return c.img

# ------------------------------------------------------------------ combat
HAND = [("שְׁקִיעָה", "ice"), ("לִקּוּי", "fire"), ("גֶּשֶׁם", "bolt"), ("?", "unknown")]
CORRECT_I = 1
CARD_W, CARD_H2, CARD_Y2 = 76, 100, 578
ELEM_COL = {"ice": ICE, "fire": FIRE, "bolt": BOLT, "unknown": (168, 176, 196)}

def card_pos(i):
    gap = (LW - 32 - 4 * CARD_W) / 3
    x = LW - 16 - CARD_W - i * (CARD_W + gap)
    return x, CARD_Y2

def spell_card(c, x, y, label, elem, lift=0.0, rot=0.0, alpha=255,
               sx=1.0, sy=1.0, dim=0.0):
    pad = 40
    lay = Image.new("RGBA", (int((CARD_W + pad*2) * S), int((CARD_H2 + pad*2) * S)),
                    (0, 0, 0, 0))
    lc = C(lay); lc.d = ImageDraw.Draw(lay, "RGBA")
    col = ELEM_COL[elem]
    a = int(alpha * (1 - .55 * dim))
    if lift > 0:
        rglow(lc, pad, pad, CARD_W, CARD_H2, 12, col, spread=12, a0=int(90 * lift))
    lc.rr(pad, pad, CARD_W, CARD_H2, 12, fill=(24, 33, 56, a))
    lc.rr(pad, pad, CARD_W, CARD_H2, 12, outline=col + (a,), width=1.8 + lift)
    lc.rr(pad + 3, pad + 3, CARD_W - 6, CARD_H2 - 6, 9, outline=(255, 255, 255, int(28*(1-dim))), width=1)
    lc.d.polygon([((pad + CARD_W/2)*S, (pad + 5)*S), ((pad + CARD_W/2 + 5)*S, (pad + 10)*S),
                  ((pad + CARD_W/2)*S, (pad + 15)*S), ((pad + CARD_W/2 - 5)*S, (pad + 10)*S)],
                 fill=col + (a,))
    if elem == "unknown":
        lc.txt(pad + CARD_W/2, pad + 44, "?", 30, "Black", col + (a,), rtl=False)
        lc.txt(pad + CARD_W/2, pad + 76, "לחש לא מזוהה", 8.5, "Medium", col + (int(a*.85),))
    else:
        gear_glyph(lc, pad + CARD_W/2, pad + 38, {"ice": "ice", "fire": "fire",
                                                   "bolt": "sword"}[elem], col + (a,), sc=1.15)
        lc.txt(pad + CARD_W/2, pad + 74, label, 14, "Bold", (255, 252, 246, a))
    if sx != 1.0 or sy != 1.0:
        lay = lay.resize((max(1, int(lay.width * sx)), max(1, int(lay.height * sy))),
                         Image.BILINEAR)
    if rot: lay = lay.rotate(rot, resample=Image.BICUBIC, expand=False)
    px = int((x - pad) * S - (lay.width - (CARD_W + pad*2) * S) / 2)
    py = int((y - pad - lift * 14) * S - (lay.height - (CARD_H2 + pad*2) * S) / 2)
    c.img.paste(lay, (px, py), lay)

def mana_bar(c, y, val, cap=10, rage=False):
    x, w = 20, LW - 40
    c.txt(LW - 20, y - 10, f"{int(val)} / {cap}", 11, "Bold",
          (RAGE if rage else BRAND_SURFACE), anchor="rm", rtl=False)
    c.txt(20, y - 10, "זמן זעם · מאנה כפולה" if rage else "מאנה", 11,
          "SemiBold", (RAGE if rage else INK_MUTED + (200,)), anchor="lm")
    c.rr(x, y, w, 14, 7, fill=(14, 20, 36))
    c.rr(x, y, w, 14, 7, outline=BORDER_SUB, width=1)
    seg_w = w / cap
    for k in range(cap):
        if k < int(val):
            sx = x + w - (k + 1) * seg_w + 1.5
            c.rr(sx, y + 2, seg_w - 3, 10, 5,
                 fill=RAGE if rage else (86, 132, 226))
    frac = val - int(val)
    if frac > 0 and int(val) < cap:
        sx = x + w - (int(val) + 1) * seg_w + 1.5
        c.rr(sx + (seg_w - 3) * (1 - frac), y + 2, (seg_w - 3) * frac, 10, 5,
             fill=(50, 78, 140))

ABILITIES = [("כפול", 4, "double"), ("מגן", 3, "shield"), ("הקפאה", 5, "freeze")]

def ability_row(c, y, mana, used=None, press=None):
    for i, (name, cost, key) in enumerate(ABILITIES):
        x = LW - 62 - i * 106
        ok = mana >= cost
        on = (used == key)
        p = 2 if press == key else 0
        c.rr(x - 46 + p/2, y + p/2, 92 - p, 44 - p, 14,
             fill=(GOLD + (60,)) if on else RAISED)
        c.rr(x - 46 + p/2, y + p/2, 92 - p, 44 - p, 14,
             outline=(GOLD_LIGHT if on else (BRAND if ok else BORDER_SUB)) + (255,),
             width=1.8 if (on or ok) else 1)
        c.txt(x + 6, y + 22, name, 12.5, "Bold",
              INK if ok else INK_MUTED + (110,))
        c.circ(x - 32, y + 22, 10, fill=(20, 34, 70))
        c.txt(x - 32, y + 22, str(cost), 11, "Bold",
              BRAND_SURFACE if ok else INK_MUTED + (110,), rtl=False)

def cast_meter(c, cx, cy, frac, announce=0.0):
    w = 70
    c.rr(cx - w/2, cy, w, 9, 4.5, fill=(20, 16, 30))
    c.rr(cx - w/2, cy, w, 9, 4.5, outline=(180, 120, 240, 200), width=1)
    col = (255, 120, 120) if announce > 0 else (196, 130, 255)
    if frac > 0:
        c.rr(cx - w/2 + 1.5, cy + 1.5, (w - 3) * frac, 6, 3, fill=col)
    if announce > 0:
        c.txt(cx, cy - 12, "מטיל!", 11.5, "Black",
              (255, 180, 180, int(255 * announce)))

def dmg_number(c, x0, y0, p, text, col, big=False):
    """arc + rotation + scale"""
    e = ease_out(p)
    x = x0 + 46 * e
    y = y0 - 56 * math.sin(p * math.pi * .82)
    a = max(0, int(255 * (1 - seg(p, .55, 1.0))))
    sc = (1.55 if big else 1.2) * (1 - .35 * p) + .5
    size = int((20 if big else 16) * sc)
    rot = lerp(-14, 16, p)
    pad = 70
    lay = Image.new("RGBA", (pad*2*S, pad*2*S), (0, 0, 0, 0))
    lc = C(lay); lc.d = ImageDraw.Draw(lay, "RGBA")
    lc.txt(pad + 1.5, pad + 1.5, text, size, "Black", (50, 8, 8, int(a*.6)), rtl=False)
    lc.txt(pad, pad, text, size, "Black", col + (a,), rtl=False)
    lay = lay.rotate(rot, resample=Image.BICUBIC)
    c.img.paste(lay, (int((x - pad)*S), int((y - pad)*S)), lay)

def chromatic(img, box, off=2):
    """cheap channel split inside a box"""
    x0, y0, x1, y1 = box
    reg = img.crop((x0, y0, x1, y1))
    r, g, b = reg.split()
    r = r.transform(r.size, Image.AFFINE, (1, 0, -off*S, 0, 1, 0))
    b = b.transform(b.size, Image.AFFINE, (1, 0, off*S, 0, 1, 0))
    img.paste(Image.merge("RGB", (r, g, b)), (x0, y0))

def clock_hud(c, tleft, streak, rage):
    ornate_frame(c, 18, 52, 38, 32, 9, PANEL_DARK, gems=False)
    for dx in (-4, 4):
        c.rr(37 + dx - 2.5, 59, 5, 18, 1.5, fill=GOLD_LIGHT)
    m, s = int(tleft) // 60, int(tleft) % 60
    col = RAGE if rage else (255, 255, 255)
    c.txt(LW/2, 60, "זמן קרב", 9, "Bold", GOLD, anchor="mm")
    c.txt(LW/2, 79, f"{m}:{s:02d}", 21, "Black", col, rtl=False)
    if streak > 0:
        cw = c.tw(f"רצף {streak}", 11.5, "Bold") + 30
        c.rr(LW - 20 - cw, 54, cw, 30, 15, fill=(120, 70, 20) if streak >= 3 else RAISED)
        c.rr(LW - 20 - cw, 54, cw, 30, 15,
             outline=(GOLD_LIGHT if streak >= 3 else BORDER_SUB) + (255,), width=1.4)
        c.txt(LW - 20 - cw/2, 69, f"רצף {streak}", 11.5, "Bold",
              GOLD_LIGHT if streak >= 3 else INK_MUTED + (230,))

# ---- battle beats -------------------------------------------------------
B = {"w1": 1.30, "lift": 2.05, "drag": 2.30, "fly": 2.58, "hit": 2.86,
     "w2": 3.70, "abil": 4.25, "lift2": 4.85, "fly2": 5.20, "hit2": 5.46,
     "shield": 6.10, "lift3": 6.95, "fly3": 7.25, "hit3": 7.52,
     "cast": 8.10, "ann": 8.85, "dodge": 9.10,
     "rage": 10.00, "lift4": 10.60, "fly4": 10.92, "hit4": 11.20, "win": 11.95}
HITS = (B["hit"], B["hit2"], B["hit3"], B["hit4"])
HOLD = .11          # א1 hit-stop

def freeze(t):
    for h in HITS:
        if h <= t < h + HOLD: return h
    return t

def battle_state(t):
    st = {}
    st["tleft"] = max(0, 90 - t * 5.6)
    st["rage"] = t >= B["rage"]
    st["streak"] = sum(1 for h in HITS if t >= h)
    mana = min(10, 2 + t * (1.0 if not st["rage"] else 2.0))
    if t >= B["abil"]: mana -= 4
    st["mana"] = max(0, mana)
    st["hp"] = 1.0
    for i, h in enumerate(HITS):
        if t >= h:
            st["hp"] = [.72, .46, .26, .0][i] if t >= h + .5 else \
                       lerp([1., .72, .46, .26][i], [.72, .46, .26, .0][i],
                            ease_out(seg(t, h, h + .5)))
    st["word"] = "ECLIPSE"
    if t >= B["w2"]: st["word"] = "ABANDON"
    if t >= B["shield"]: st["word"] = "CRUCIAL"
    if t >= B["cast"]: st["word"] = "THREAT"
    st["shield"] = B["shield"] <= t < B["hit3"] + .2
    st["double"] = B["abil"] <= t < B["hit2"] + .3
    cf = clamp((t - B["cast"]) / 1.0) if t >= B["cast"] else 0.0
    st["cast"] = cf if t < B["dodge"] + .5 else 0.0
    st["announce"] = seg(t, B["ann"], B["ann"] + .12) * (1 - seg(t, B["dodge"] + .3, B["dodge"] + .5)) if t >= B["ann"] else 0.0
    st["dodge"] = math.sin(clamp((t - B["dodge"]) / .55) * math.pi) if B["dodge"] <= t < B["dodge"] + .55 else 0.0
    return st

def screen_battle2(c, t):
    ft = freeze(t)
    st = battle_state(ft)
    hit_i = next((i for i, h in enumerate(HITS) if h <= t < h + .9), None)
    impact = any(h <= t < h + .07 for h in HITS)
    shake = 0.0
    for h in HITS:
        if h <= t < h + .5:
            shake = math.sin((t - h) * 78) * 5.2 * (1 - seg(t, h, h + .5))
    zoom = 1.0
    for h in HITS:
        if h - .45 <= t < h: zoom = 1 + .05 * seg(t, h - .45, h)
        elif h <= t < h + .8: zoom = 1 + .05 * (1 - seg(t, h, h + .8))
    # ---- arena backdrop
    bg = arena_bg()
    if zoom > 1.001:
        nw, nh = int(LW * S * zoom), int(AR_H * S * zoom)
        bg = bg.resize((nw, nh), Image.BILINEAR)
        ox, oy = -(nw - LW * S) // 2, -(nh - AR_H * S) // 2
    else: ox, oy = 0, 0
    c.img.paste(bg, (int(ox + shake * S), int(AR_TOP * S + oy + shake * S * .6)))
    c.d = ImageDraw.Draw(c.img, "RGBA")
    def A(v): return AR_TOP + v + shake * .6
    ph = ft * 9
    for tx_ in (34, 118, LW - 118, LW - 34):
        torch(c, tx_, A(96), ph + tx_ + (2.5 if hit_i is not None else 0))
    embers(c, ft)
    # ---- characters on their own layer (א2 impact frame)
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    lc = C(lay); lc.d = ImageDraw.Draw(lay, "RGBA")
    wx, wy = LW/2 - 20, A(168) + math.sin(ft * 2.1) * 3
    if hit_i is not None:
        k = 1 - seg(t, HITS[hit_i], HITS[hit_i] + .4)
        wy -= 12 * k
        if st["shield"] and hit_i == 2: pass
    wizard_sprite(lc, wx, wy, sc=1.3)
    if st["shield"]:
        for r_ in (30, 36):
            lc.circ(wx, wy + 4, r_, outline=ICE + (170,), width=1.6)
        lc.circ(wx, wy + 4, 33, fill=ICE + (34,))
    hero_sprite(lc, LW/2 - 6, A(292), sc=1.25,
                swing=ease_out(seg(t, HITS[hit_i], HITS[hit_i] + .3)) * (1 - seg(t, HITS[hit_i] + .5, HITS[hit_i] + 1.0)) if hit_i is not None else 0.0,
                lag=math.sin(ft * 3) * 1.2 + (4 if hit_i is not None else 0),
                roll=st["dodge"], aura=1.0 if st["streak"] >= 3 else 0.0)
    if impact:
        alpha = lay.split()[3]
        wht = Image.new("RGBA", (W, H), (255, 255, 255, 0)); wht.putalpha(alpha)
        lay = wht
    c.img.paste(lay, (0, 0), lay)
    c.d = ImageDraw.Draw(c.img, "RGBA")
    # cast meter + enemy hp
    if st["cast"] > 0:
        cast_meter(c, wx, A(120), st["cast"], st["announce"])
    c.rr(LW - 150, A(146), 126, 14, 7, fill=(20, 14, 24))
    c.rr(LW - 150, A(146), 126, 14, 7, outline=GOLD, width=1.4)
    if st["hp"] > 0:
        c.rr(LW - 148, A(148), 122 * st["hp"], 10, 5, fill=(226, 62, 62))
    c.txt(LW - 87, A(153), f"{int(st['hp']*100)}/100", 10.5, "Bold",
          (255, 255, 255), rtl=False)
    c.txt(LW - 24, A(134), "הקוסם", 12, "Bold", GOLD_LIGHT, anchor="rm")
    if st["shield"]:
        c.rr(24, A(146), 116, 26, 8, fill=(18, 44, 62, 220))
        c.rr(24, A(146), 116, 26, 8, outline=ICE + (200,), width=1.2)
        c.txt(82, A(159), "מגן קרח · רק אש", 10, "Bold", ICE)
    if st["double"]:
        c.rr(24, A(180), 96, 24, 8, fill=(80, 56, 16, 230))
        c.rr(24, A(180), 96, 24, 8, outline=GOLD_LIGHT, width=1.2)
        c.txt(72, A(192), "נזק כפול", 10, "Bold", GOLD_LIGHT)
    c.img.paste(vignette(), (0, int(AR_TOP * S)), vignette())
    c.d = ImageDraw.Draw(c.img, "RGBA")
    # ---- HUD + banner
    clock_hud(c, st["tleft"], st["streak"], st["rage"])
    banner(c, LW/2, 96, 250, 60, st["word"], ph)
    # ---- flying card (א5 ghost trail, א3 squash)
    fly = None
    for (lf, fl, hh, idx) in ((B["lift"], B["fly"], B["hit"], CORRECT_I),
                              (B["lift2"], B["fly2"], B["hit2"], CORRECT_I),
                              (B["lift3"], B["fly3"], B["hit3"], 1),
                              (B["lift4"], B["fly4"], B["hit4"], 3)):
        if lf <= t < hh: fly = (lf, fl, hh, idx)
    hidden = fly[3] if fly else None
    if fly:
        lf, fl, hh, idx = fly
        x0, y0 = card_pos(idx)
        if t < fl:      # lift + drag
            p = seg(t, lf, fl)
            spell_card(c, x0, y0 - 60 * ease_out(p), HAND[idx][0], HAND[idx][1],
                       lift=1.0, rot=lerp(0, 6, p), sx=lerp(1, 1.06, p),
                       sy=lerp(1, 1.08, p))
            touch(c, x0 + CARD_W/2, y0 + CARD_H2/2 - 60 * ease_out(p), press=.8)
        else:           # in flight
            p = ease_out(seg(t, fl, hh))
            cx_ = lerp(x0 + CARD_W/2, wx, p)
            cy_ = lerp(y0 - 60, wy + 6, p)
            for k in range(5, 0, -1):
                pk = clamp(p - k * .055)
                gx = lerp(x0 + CARD_W/2, wx, pk); gy = lerp(y0 - 60, wy + 6, pk)
                spell_card(c, gx - CARD_W/2, gy, HAND[idx][0], HAND[idx][1],
                           alpha=int(150 * (1 - k / 5)), sx=.7, sy=.7, rot=-18 * pk)
            spell_card(c, cx_ - CARD_W/2, cy_, HAND[idx][0], HAND[idx][1],
                       lift=1.0, rot=-24 * p, sx=lerp(1, 1.25, p), sy=lerp(1, .8, p))
    # ---- mana, hand, abilities
    mana_bar(c, 546, st["mana"], rage=st["rage"])
    for i, (lbl, el) in enumerate(HAND):
        if i == hidden: continue
        x, y = card_pos(i)
        idle = math.sin(ft * 1.6 + i * 1.1) * 1.6
        dim = .0
        if fly and t >= fly[1]: dim = .5
        spell_card(c, x, y + idle, lbl, el, rot=lerp(-4, 4, i / 3), dim=dim)
    ability_row(c, 694, st["mana"],
                used="double" if st["double"] else None,
                press="double" if abs(t - B["abil"]) < .18 else None)
    if abs(t - B["abil"]) < .42:
        touch(c, LW - 62 + 6, 716, press=clamp(1 - abs(t - B["abil"]) / .25),
              ripple=seg(t, B["abil"], B["abil"] + .5))
    c.rr(20, 754, LW - 40, 32, 10, fill=(20, 26, 44, 190))
    c.txt(LW/2, 770, "זירת הקרב מבודדת · אין השפעה על SM-2", 10.5, "Medium",
          GOLD_LIGHT + (210,))
    # ---- impact fx
    for i, h in enumerate(HITS):
        if h <= t < h + .9:
            p = seg(t, h, h + .75)
            if p < 1:
                for k in range(3):
                    pk = clamp(p - k * .17)
                    if pk <= 0: continue
                    c.circ(wx, wy + 4, 12 + 108 * ease_out(pk),
                           outline=(255, 236, 190, int(190 * (1 - pk) ** 1.5)),
                           width=3 - k * .7)
            sp = seg(t, h, h + .55)
            if sp < 1:
                import random as _r
                rr2 = _r.Random(11 + i)
                for k in range(20):
                    a_ = k * math.tau / 20 + .2
                    dist = 100 * ease_out(sp) * (.5 + .5 * rr2.random())
                    c.circ(wx + dist * math.cos(a_), wy + 6 + dist * math.sin(a_) * .8,
                           3.4 * (1 - sp) + .8,
                           fill=(255, int(lerp(238, 150, sp)), 130,
                                 int(255 * (1 - sp) ** 1.4)))
            big = st["double"] and i == 1 or i == 3
            txt = ["-32", "-58", "-24", "-46"][i]
            lbl = ["קריטי!", "כפול!", "המגן נשבר!", "מכת סיום!"][i]
            dmg_number(c, wx + 18, wy - 6, seg(t, h, h + 1.15), txt,
                       (255, 130, 130), big=big)
            ap = seg(t, h + .12, h + .3) * (1 - seg(t, h + .8, h + 1.05))
            if ap > 0:
                bw = c.tw(lbl, 13, "Black") + 34
                c.rr(LW/2 - bw/2, A(214), bw, 32, 16, fill=(30, 22, 10, int(230*ap)))
                c.rr(LW/2 - bw/2, A(214), bw, 32, 16, outline=GOLD_LIGHT + (int(255*ap),), width=1.5)
                c.txt(LW/2, A(230), lbl, 13, "Black", (255, 246, 226, int(255*ap)))
            if t < h + .10:
                c.d.rectangle([0, AR_TOP*S, W, (AR_TOP+AR_H)*S],
                              fill=(255, 250, 236, int(120 * (1 - seg(t, h, h + .10)))))
    if st["rage"] and not any(h <= t < h + .9 for h in HITS):
        c.d.rectangle([0, AR_TOP*S, W, (AR_TOP+AR_H)*S], fill=(255, 60, 60, 16))
    if st["dodge"] > 0:
        c.txt(LW/2, A(250), "התחמקות!", 14, "Black",
              (150, 230, 255, int(255 * st["dodge"])))
    return hit_i

def scene_battle2(t):
    c = C(); status_bar(c)
    hit_i = screen_battle2(c, t)
    # א7 chromatic split on crit
    for h in HITS:
        if h + .07 <= t < h + .20:
            chromatic(c.img, (0, AR_TOP*S, W, (AR_TOP+AR_H)*S), off=2)
            c.d = ImageDraw.Draw(c.img, "RGBA")
    if t >= B["win"]:
        p = seg(t, B["win"], B["win"] + .5)
        c.d.rectangle([0, 0, W, H], fill=(255, 250, 240, int(120 * (1 - p))))
        c.txt(LW/2, LH/2, "ניצחון", 44, "Black", (255, 250, 230, int(255 * p)))
    return c.img

# ------------------------------------------------------------------ results
def scene_results(t):
    c = C(); status_bar(c)
    c.d.rectangle([0, 0, W, H], fill=SURFACE)
    for i in range(8, 0, -1):
        f = i / 8
        c.circ(LW/2, 210, 190 * f, fill=(120, 90, 20, int(9 * (1 - f) * 8)))
    e = ease_back(clamp(seg(t, .1, .8)))
    c.txt(LW/2, 128, "ניצחון", 34, "Black", GOLD_LIGHT)
    c.txt(LW/2, 160, "רמת זירה 7 · +48 XP", 12.5, "Medium", INK_MUTED + (215,))
    for i in range(6, 0, -1):
        f = i / 6
        c.circ(LW/2, 238, 46 * f * e, fill=(212, 169, 74, int(16 * (1 - f) * 6)))
    c.rr(LW/2 - 42 * e, 238 - 30 * e, 84 * e, 60 * e, 12, fill=(146, 100, 30))
    c.rr(LW/2 - 42 * e, 238 - 30 * e, 84 * e, 60 * e, 12, outline=GOLD_LIGHT, width=2)
    if e > .8:
        c.rr(LW/2 - 42, 232, 84, 12, 4, fill=GOLD)
        c.txt(LW/2, 282, "תיבת ניצחון", 11.5, "SemiBold", GOLD_LIGHT)
    rows = [("נכונות", "14 / 16", SUCCESS),
            ("זמן תגובה ממוצע", "1.8 ש׳", BRAND_SURFACE),
            ("רצף מרבי", "4", GOLD_LIGHT)]
    for i, (k, v, col) in enumerate(rows):
        y = 318 + i * 52
        p = clamp(seg(t, .5 + i * .12, .9 + i * .12))
        c.rr(24, y, LW - 48, 44, 13, fill=RAISED + (int(255 * p),))
        c.rr(24, y, LW - 48, 44, 13, outline=BORDER_SUB + (int(255 * p),), width=1.1)
        c.txt(LW - 40, y + 22, k, 13, "Medium", INK + (int(235 * p),), anchor="rm")
        c.txt(40, y + 22, v, 15, "Bold", col + (int(255 * p),), anchor="lm", rtl=False)
    p2 = clamp(seg(t, 1.2, 1.7))
    c.rr(24, 486, LW - 48, 66, 16, fill=DANGER + (int(40 * p2),))
    c.rr(24, 486, LW - 48, 66, 16, outline=DANGER + (int(255 * p2),), width=1.6)
    icon_x(c, 54, 519, DANGER + (int(255*p2),), sc=1.1)
    c.txt(LW - 40, 508, "3 מילים היו איטיות", 14, "Bold",
          DANGER + (int(255*p2),), anchor="rm")
    c.txt(LW - 40, 532, "הוסף אותן לחזרה בכרטיסיות", 11.5, "Regular",
          DANGER + (int(200*p2),), anchor="rm")
    p3 = clamp(seg(t, 1.5, 2.0))
    c.rr(24, 562, LW - 48, 66, 16, fill=BRAND + (int(38 * p3),))
    c.rr(24, 562, LW - 48, 66, 16, outline=BRAND + (int(230 * p3),), width=1.5)
    c.circ(54, 595, 11, outline=BRAND_SURFACE + (int(255*p3),), width=1.8)
    c.txt(LW - 40, 584, "פגשת 4 מילים חדשות", 14, "Bold",
          INK + (int(255*p3),), anchor="rm")
    c.txt(LW - 40, 608, "הוסף לכרטיסיות", 11.5, "Regular",
          BRAND_SURFACE + (int(220*p3),), anchor="rm")
    tap = 2.9
    pr = 2.5 if abs(t - tap) < .18 else 0
    c.rr(24 + pr/2, 654 + pr/2, LW - 48 - pr, 56 - pr, 16, fill=BRAND_SURFACE)
    c.txt(LW/2, 682, "הוסף הכול וחזור לזירה", 15.5, "Bold", BRAND_ON)
    c.txt(LW/2, 730, "הזירה לא שינתה דבר בהתקדמות הלמידה", 11, "Regular",
          INK_MUTED + (160,))
    if abs(t - tap) < .45:
        touch(c, LW/2, 682, press=clamp(1 - abs(t - tap) / .28),
              ripple=seg(t, tap, tap + .5))
    scene_label(c, t, "סיכום קרב · המשתמש מחליט")
    return c.img

# ------------------------------------------------------------------ world
def scene_world_b(t):
    c = C(); status_bar(c)
    tap = .9
    screen_world(c, t, appear=1.0, tap_idx=0,
                 tap_p=clamp(1 - abs(t - tap) / .3) if abs(t - tap) < .3 else
                       (1.0 if t > tap else 0.0))
    bottom_nav(c, active="העולם", world_pulse=t * .5)
    if abs(t - tap) < .5:
        nx, ny = node_pos(0)
        touch(c, nx, ny, press=clamp(1 - abs(t - tap) / .3),
              ripple=seg(t, tap, tap + .55))
    scene_label(c, t, "העולם · זירת קרב")
    return c.img

SCENES = [(scene_world_b, 3.2), (scene_home, 6.2), (scene_battle2, 12.7),
          (scene_results, 4.2)]
XF = .35

def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
    total = sum(d for _, d in SCENES) - XF * (len(SCENES) - 1)
    n = int(total * FPS)
    starts, acc = [], 0.0
    for fn, d in SCENES:
        starts.append(acc); acc += d - XF
    print(f"video B: {total:.2f}s  {n} frames", flush=True)
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
        if i % 60 == 0: print(f"  {i}/{n}", flush=True)
    print("done", flush=True)

if __name__ == "__main__":
    main()
