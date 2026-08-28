#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Video D — סימולציות אמירנט. Dashboard · practice · full simulation."""
import math, os
from PIL import Image, ImageDraw
from render_kol import (S, LW, LH, W, H, FPS, C, clamp, lerp, lerpc, ease_out,
                        ease_in_out, ease_back, seg, glow, status_bar, touch,
                        scene_label, bottom_nav, screen_world, node_pos,
                        BORDER_SUB, BORDER_STRONG, INK, INK_MUTED, BRAND,
                        BRAND_SURFACE, BRAND_ON, SUCCESS, DANGER,
                        icon_check, icon_x, icon_lock)
from msgs_ui import bg, grad_rr, shadow, nav, avatar

OUT = "/home/claude/frames_d"
AM_NODE = 2                      # index of אמירנט in the ring
AMBER = (242, 181, 68)
TEAL  = (46, 197, 197)

TABS = ["דשבורד", "תרגול", "סימולציה"]

def head(c, title, tab, press=None, sub="העולם · אמירנט"):
    c.txt(LW - 24, 100, sub, 12.5, "Regular", INK_MUTED + (190,), anchor="rm")
    c.txt(LW - 24, 122, title, 22, "Bold", INK, anchor="rm")
    x0, w = 20, LW - 40
    sw = w / 3
    c.rr(x0, 140, w, 36, 12, fill=(20, 28, 46))
    c.rr(x0, 140, w, 36, 12, outline=BORDER_SUB, width=1)
    px = x0 + w - (tab + 1) * sw
    c.rr(px + 3, 143, sw - 6, 30, 10, fill=BRAND + (58,))
    c.rr(px + 3, 143, sw - 6, 30, 10, outline=BRAND + (200,), width=1.3)
    for i, t in enumerate(TABS):
        cx = x0 + w - (i + .5) * sw
        near = abs(tab - i) < .5
        c.txt(cx, 158 + (1.5 if press == i else 0), t, 13,
              "Bold" if near else "Regular",
              BRAND_SURFACE if near else INK_MUTED + (200,))
    return [x0 + w - (i + .5) * sw for i in range(3)]

# ---------------------------------------------------------------- dashboard
TYPES = [("השלמת משפטים", "Sentence Completion", 78, 124, BRAND_SURFACE),
         ("ניסוח מחדש",   "Restatement",         54, 61,  DANGER),
         ("הבנת הנקרא",   "Reading",             66, 45,  AMBER)]

def score_dial(c, cx, cy, r, score, p=1.0):
    lo, hi = 50, 150
    frac = (score - lo) / (hi - lo) * p
    c.d.arc([(cx-r)*S, (cy-r)*S, (cx+r)*S, (cy+r)*S], 150, 390,
            fill=(38, 51, 74), width=int(11*S))
    c.d.arc([(cx-r)*S, (cy-r)*S, (cx+r)*S, (cy+r)*S], 150, 150 + 240*frac,
            fill=BRAND_SURFACE, width=int(11*S))
    a = math.radians(150 + 240 * ((134 - lo) / (hi - lo)))
    c.line(cx + (r-9)*math.cos(a), cy + (r-9)*math.sin(a),
           cx + (r+9)*math.cos(a), cy + (r+9)*math.sin(a), SUCCESS, 2.4)
    c.txt(cx, cy - 6, f"{int(score*p)}", 44, "Black", INK, rtl=False)
    c.txt(cx, cy + 26, "אומדן ציון", 11.5, "Medium", INK_MUTED + (215,))
    c.txt(cx - r + 6, cy + r - 6, "50", 10, "Medium", INK_MUTED + (150,), rtl=False)
    c.txt(cx + r - 6, cy + r - 6, "150", 10, "Medium", INK_MUTED + (150,), rtl=False)

def screen_dash(c, t, p=1.0):
    head(c, "סימולציות אמירנט", 0)
    grad_rr(c, 20, 190, LW - 40, 194, 20, (32, 46, 74), (23, 33, 53),
            outline=(48, 66, 98, 255))
    score_dial(c, LW/2, 268, 62, 112, p=p)
    c.txt(LW/2, 352, "מתקדמים ב׳ · 22 נקודות מפטור", 12.5, "SemiBold", BRAND_SURFACE)
    c.txt(LW - 24, 404, "ביצועים לפי סוג שאלה", 13.5, "SemiBold", INK, anchor="rm")
    y = 420
    for name, en, pct, n, col in TYPES:
        pp = clamp(p * 1.3 - .1)
        grad_rr(c, 20, y, LW - 40, 76, 16, (28, 38, 58), (22, 30, 47),
                outline=(40, 54, 80, 255), sh=False)
        c.txt(LW - 34, y + 24, name, 13.5, "Bold", INK, anchor="rm")
        c.txt(LW - 34, y + 42, en, 10.5, "Regular", INK_MUTED + (160,),
              anchor="rm", rtl=False)
        c.txt(36, y + 24, f"{int(pct*pp)}%", 17, "Black", col, anchor="lm", rtl=False)
        c.txt(36, y + 42, f"{n} שאלות", 10.5, "Regular", INK_MUTED + (170,), anchor="lm")
        c.rr(36, y + 54, LW - 74, 8, 4, fill=(38, 51, 74))
        c.rr(LW - 38 - (LW - 74) * pct/100 * pp, y + 54,
             (LW - 74) * pct/100 * pp, 8, 4, fill=col)
        y += 82
    c.rr(20, y + 2, LW - 40, 54, 14, fill=DANGER + (34,))
    c.rr(20, y + 2, LW - 40, 54, 14, outline=DANGER + (190,), width=1.3)
    icon_x(c, LW - 44, y + 29, DANGER, sc=1.1)
    c.txt(LW - 68, y + 22, "החולשה שלך: ניסוח מחדש", 13.5, "Bold", DANGER, anchor="rm")
    c.txt(LW - 68, y + 41, "54% הצלחה · מומלץ להתחיל שם", 11, "Regular",
          DANGER + (200,), anchor="rm")
    nav(c)

def scene_dash(t):
    c = C(); bg(c); status_bar(c)
    screen_dash(c, t, p=ease_out(seg(t, .25, 1.6)))
    scene_label(c, t, "דשבורד · חוזק וחולשה")
    return c.img

# ---------------------------------------------------------------- practice
PQ = ("The scientist's findings were so ______ that they",
      "overturned decades of accepted theory.",
      ["controversial", "ordinary", "delayed", "affordable"], 0)


PRACTICE_LEVELS = ["רמה 1", "רמה 2", "רמה 3", "רמה 4"]

def screen_practice_menu(c, t, press=None, lvl=2):
    head(c, "תרגול ממוקד", 1)
    c.txt(LW - 24, 200, "בחר סוג שאלות לתרגול", 13.5, "SemiBold", INK, anchor="rm")
    c.txt(LW - 24, 222, "הרמה נבחרת ידנית · אין כאן אדפטיביות", 11.5, "Regular",
          INK_MUTED + (180,), anchor="rm")
    y = 244
    for i, (name, en, pct, n, col) in enumerate(TYPES):
        pr = 2 if press == i else 0
        grad_rr(c, 20 + pr/2, y + pr/2, LW - 40 - pr, 104 - pr, 17,
                (31, 43, 66), (23, 32, 50), outline=col + (150,), width=1.4)
        c.txt(LW - 36, y + 26, name, 15, "Bold", INK, anchor="rm")
        c.txt(LW - 36, y + 46, en, 11, "Regular", INK_MUTED + (165,),
              anchor="rm", rtl=False)
        c.txt(36, y + 26, f"{pct}%", 18, "Black", col, anchor="lm", rtl=False)
        c.txt(36, y + 46, f"{n} שאלות שנענו", 10.5, "Regular",
              INK_MUTED + (170,), anchor="lm")
        c.rr(36, y + 60, LW - 74, 7, 3.5, fill=(38, 51, 74))
        c.rr(LW - 38 - (LW - 74) * pct/100, y + 60, (LW - 74) * pct/100, 7, 3.5, fill=col)
        cw = c.tw("תרגל", 12, "Bold") + 30
        c.rr(LW - 36 - cw, y + 74, cw, 24, 12, fill=col + (52,))
        c.rr(LW - 36 - cw, y + 74, cw, 24, 12, outline=col + (210,), width=1.1)
        c.txt(LW - 36 - cw/2, y + 86, "תרגל", 12, "Bold", col)
        y += 114
    c.txt(LW - 24, y + 14, "רמת קושי", 12.5, "SemiBold", INK, anchor="rm")
    x = LW - 24
    for i, name in enumerate(PRACTICE_LEVELS):
        w = c.tw(name, 12, "Bold" if i == lvl else "Regular") + 26
        on = (i == lvl)
        c.rr(x - w, y + 28, w, 32, 16, fill=BRAND + (52,) if on else (0, 0, 0, 0))
        c.rr(x - w, y + 28, w, 32, 16,
             outline=(BRAND if on else BORDER_STRONG) + (255,), width=1.5 if on else 1.1)
        c.txt(x - w/2, y + 44, name, 12, "Bold" if on else "Regular",
              BRAND_SURFACE if on else INK_MUTED + (200,))
        x -= w + 8
    nav(c)

def screen_practice(c, t, sel=None, revealed=False, secs=42):
    head(c, "תרגול ממוקד", 1)
    c.rr(20, 190, LW - 40, 44, 12, fill=(28, 38, 58))
    c.rr(20, 190, LW - 40, 44, 12, outline=(40, 54, 80), width=1.1)
    c.txt(LW - 34, 212, "ניסוח מחדש · רמה 3", 13, "Bold", INK, anchor="rm")
    c.txt(34, 212, f"0:{secs:02d}", 13, "Bold",
          DANGER if secs < 15 else INK_MUTED + (220,), anchor="lm", rtl=False)
    c.txt(LW/2, 258, "שאלה 4 מתוך 10", 11.5, "Medium", INK_MUTED + (185,))
    grad_rr(c, 20, 276, LW - 40, 110, 18, (32, 44, 68), (24, 33, 51),
            outline=(48, 66, 98, 255))
    c.txt(LW - 34, 312, PQ[0], 15, "Regular", INK, anchor="rm", rtl=False)
    c.txt(LW - 34, 340, PQ[1], 15, "Regular", INK, anchor="rm", rtl=False)
    y = 386
    for i, opt in enumerate(PQ[2]):
        cor = (i == PQ[3])
        if revealed and cor:      fill, bd, col = SUCCESS + (44,), SUCCESS, SUCCESS
        elif revealed and i == sel: fill, bd, col = DANGER + (44,), DANGER, DANGER
        elif sel == i:            fill, bd, col = BRAND + (44,), BRAND, INK
        else:                     fill, bd, col = (26, 35, 54, 255), (42, 56, 82), INK
        c.rr(20, y, LW - 40, 54, 14, fill=fill)
        c.rr(20, y, LW - 40, 54, 14, outline=bd + (255,),
             width=1.7 if (sel == i or (revealed and cor)) else 1.1)
        c.circ(LW - 44, y + 27, 11, outline=bd + (255,), width=1.4)
        if revealed and cor: icon_check(c, LW - 44, y + 27, SUCCESS, sc=1.0)
        c.txt(LW - 66, y + 28, opt, 14.5, "SemiBold" if sel == i else "Regular",
              col, anchor="rm", rtl=False)
        y += 58
    if revealed:
        grad_rr(c, 20, y + 6, LW - 40, 96, 16, (26, 46, 44), (20, 34, 40),
                outline=SUCCESS + (170,), width=1.3)
        icon_check(c, LW - 44, y + 32, SUCCESS, sc=1.1)
        c.txt(LW - 68, y + 32, "נכון · 8 שניות", 13.5, "Bold", SUCCESS, anchor="rm")
        c.txt(LW - 34, y + 58, "controversial = שנוי במחלוקת. מילות ההמשך", 12,
              "Regular", INK_MUTED + (230,), anchor="rm")
        c.txt(LW - 34, y + 78, "overturned decades מחייבות ניגוד חזק.", 12,
              "Regular", INK_MUTED + (230,), anchor="rm")
    nav(c)

def scene_practice(t):
    c = C(); bg(c); status_bar(c)
    pick, tap = 1.5, 4.3
    if t < 1.95:
        screen_practice_menu(c, t, press=1 if abs(t - pick) < .2 else None)
        if abs(t - pick) < .45:
            touch(c, LW/2, 244 + 114 + 52, press=clamp(1 - abs(t - pick) / .25),
                  ripple=seg(t, pick, pick + .45))
        scene_label(c, t, "תרגול · בחירת סוג שאלות")
    else:
        sel = 0 if t >= tap else None
        screen_practice(c, t, sel=sel, revealed=(t >= tap + .12),
                        secs=max(0, 42 - int((t - 1.95) * 3)))
        if abs(t - tap) < .45:
            touch(c, LW/2, 413, press=clamp(1 - abs(t - tap) / .25),
                  ripple=seg(t, tap, tap + .45))
        scene_label(c, t, "תרגול · ניסוח מחדש רמה 3", t0=2.1)
    return c.img

# ---------------------------------------------------------------- levels
LEVELS = [
    ("רמה 1 · בסיסי",       "50–84",   "אוצר מילים בסיסי · משפטים קצרים", SUCCESS, "הושלם · 71"),
    ("רמה 2 · מתקדמים א׳",  "85–110",  "מילות קישור · משפטים מורכבים",    SUCCESS, "הושלם · 104"),
    ("רמה 3 · מתקדמים ב׳",  "111–133", "אוצר מילים אקדמי · הסקה",         BRAND,   "הכי גבוה · 112"),
    ("רמה 4 · פטור",        "134–150", "טקסטים ארוכים · ניואנס וטון",     BORDER_STRONG, "נעול"),
]

def screen_levels(c, t, press=None):
    head(c, "סימולציה מלאה", 2)
    c.rr(20, 190, LW - 40, 54, 14, fill=(28, 38, 58))
    c.rr(20, 190, LW - 40, 54, 14, outline=(42, 56, 82), width=1.1)
    c.txt(LW - 34, 210, "6 פרקים · 23 שאלות · 39 דקות", 13, "Bold", INK, anchor="rm")
    c.txt(LW - 34, 230, "אדפטיבי בין פרקים, כמו במבחן האמיתי", 10.5, "Regular",
          INK_MUTED + (185,), anchor="rm")
    y = 262
    for i, (name, band, desc, col, state) in enumerate(LEVELS):
        locked = (state == "נעול")
        pr = 2 if press == i else 0
        grad_rr(c, 20 + pr/2, y + pr/2, LW - 40 - pr, 104 - pr, 17,
                (24, 32, 50) if locked else (30, 42, 64),
                (20, 27, 42) if locked else (23, 32, 50),
                outline=(col if not locked else (46, 60, 86)) + (255,),
                width=1.5 if not locked else 1.1)
        c.txt(LW - 36, y + 26, name, 14.5, "Bold",
              INK if not locked else INK_MUTED + (160,), anchor="rm")
        c.txt(LW - 36, y + 48, desc, 11.5, "Regular",
              INK_MUTED + (200 if not locked else 120,), anchor="rm")
        bw = c.tw(band, 11.5, "Bold") + 22
        c.rr(36, y + 16, bw, 24, 12, fill=col + (46,))
        c.txt(36 + bw/2, y + 28, band, 11.5, "Bold", col, rtl=False)
        if locked:
            icon_lock(c, 48, y + 62, BORDER_STRONG + (190,), sc=1.0)
            c.txt(68, y + 62, "עבור רמה 3 כדי לפתוח", 11, "Regular",
                  INK_MUTED + (150,), anchor="lm")
        else:
            c.txt(36, y + 62, state, 11.5, "SemiBold", col, anchor="lm")
            c.rr(36, y + 78, LW - 74, 7, 3.5, fill=(38, 51, 74))
            c.rr(LW - 38 - (LW - 74) * [.55, .78, .62, 0][i], y + 78,
                 (LW - 74) * [.55, .78, .62, 0][i], 7, 3.5, fill=col)
        y += 114
    nav(c)

def scene_levels(t):
    c = C(); bg(c); status_bar(c)
    tap = 2.6
    screen_levels(c, t, press=2 if abs(t - tap) < .2 else None)
    if abs(t - tap) < .45:
        touch(c, LW/2, 262 + 2 * 114 + 52, press=clamp(1 - abs(t - tap) / .25),
              ripple=seg(t, tap, tap + .45))
    scene_label(c, t, "ארבע רמות · לפי רצועת ציון")
    return c.img

# ---------------------------------------------------------------- sim run
SQ = ("Although the treaty was signed in 1919,",
      "its economic effects ______ for two decades.",
      ["reverberated", "concluded", "assembled", "diminished"], 0)
CHAPTERS = [("השלמת משפטים", 4, 4), ("השלמת משפטים", 4, 4), ("הבנת הנקרא", 5, 15),
            ("ניסוח מחדש", 3, 6), ("ניסוח מחדש", 3, 6), ("השלמת משפטים", 4, 4)]

def screen_sim(c, t, ch=0, q=2, secs=147, sel=None):
    c.rr(0, 84, LW, 96, 0, fill=(20, 28, 46))
    c.line(0, 180, LW, 180, BORDER_SUB, 1)
    c.txt(LW - 24, 108, f"פרק {ch+1} מתוך 6", 13.5, "Bold", INK, anchor="rm")
    c.txt(LW - 24, 130, CHAPTERS[ch][0], 11.5, "Regular", BRAND_SURFACE, anchor="rm")
    m, s_ = secs // 60, secs % 60
    tc = DANGER if secs < 45 else INK
    c.rr(24, 100, 86, 40, 12, fill=(14, 20, 34))
    c.rr(24, 100, 86, 40, 12, outline=(tc if secs < 45 else BORDER_SUB) + (255,), width=1.3)
    c.txt(67, 121, f"{m}:{s_:02d}", 18, "Black", tc, rtl=False)
    for i in range(6):
        x = LW - 24 - i * 26
        done = i < ch
        c.circ(x - 8, 158, 5, fill=BRAND_SURFACE if done else
               (BRAND if i == ch else (44, 58, 84)))
    c.txt(24, 158, f"שאלה {q} מתוך {CHAPTERS[ch][1]}", 11, "Medium",
          INK_MUTED + (190,), anchor="lm")
    grad_rr(c, 20, 204, LW - 40, 118, 18, (32, 44, 68), (24, 33, 51),
            outline=(48, 66, 98, 255))
    c.txt(LW - 34, 244, SQ[0], 15, "Regular", INK, anchor="rm", rtl=False)
    c.txt(LW - 34, 274, SQ[1], 15, "Regular", INK, anchor="rm", rtl=False)
    y = 344
    for i, opt in enumerate(SQ[2]):
        on = (sel == i)
        c.rr(20, y, LW - 40, 56, 14, fill=BRAND + (44,) if on else (26, 35, 54, 255))
        c.rr(20, y, LW - 40, 56, 14, outline=(BRAND if on else (42, 56, 82)) + (255,),
             width=1.7 if on else 1.1)
        c.circ(LW - 44, y + 28, 11, outline=(BRAND if on else (60, 78, 110)) + (255,),
               width=1.5)
        if on: c.circ(LW - 44, y + 28, 5.5, fill=BRAND_SURFACE)
        c.txt(LW - 66, y + 29, opt, 15, "SemiBold" if on else "Regular",
              INK, anchor="rm", rtl=False)
        y += 64
    c.rr(20, LH - 116, LW - 40, 54, 15, fill=BRAND_SURFACE if sel is not None
         else (34, 44, 66))
    c.txt(LW/2, LH - 89, "לשאלה הבאה", 15, "Bold",
          BRAND_ON if sel is not None else INK_MUTED + (150,))
    c.txt(LW/2, LH - 40, "אי אפשר להעביר זמן שנותר לפרק הבא", 10.5, "Regular",
          INK_MUTED + (150,))

def scene_sim(t):
    c = C(); bg(c); status_bar(c)
    tap, nxt = 2.5, 4.4
    screen_sim(c, t, ch=0 if t < nxt else 1, q=2 if t < nxt else 1,
               secs=max(0, 147 - int(t * 4)) if t < nxt else 236,
               sel=0 if tap <= t < nxt else None)
    if abs(t - tap) < .45:
        touch(c, LW/2, 372, press=clamp(1 - abs(t - tap) / .25),
              ripple=seg(t, tap, tap + .45))
    if abs(t - nxt) < .45:
        touch(c, LW/2, LH - 89, press=clamp(1 - abs(t - nxt) / .25),
              ripple=seg(t, nxt, nxt + .45))
    scene_label(c, t, "סימולציה · שעון לכל פרק")
    return c.img

# ---------------------------------------------------------------- result
def scene_result(t):
    c = C(); bg(c); status_bar(c)
    p = ease_out(seg(t, .2, 1.5))
    c.txt(LW/2, 116, "הסימולציה הסתיימה", 13, "Medium", INK_MUTED + (215,))
    grad_rr(c, 20, 140, LW - 40, 200, 20, (32, 46, 74), (23, 33, 53),
            outline=(48, 66, 98, 255))
    score_dial(c, LW/2, 224, 62, 118, p=p)
    c.txt(LW/2, 310, "מתקדמים ב׳ · עלית 6 נקודות", 12.5, "SemiBold", SUCCESS)
    c.txt(LW - 24, 366, "פירוט לפי פרק", 13.5, "SemiBold", INK, anchor="rm")
    y = 384
    res = [(0, 4, 4, 3.1), (1, 4, 3, 3.6), (2, 5, 3, 14.2), (3, 3, 2, 5.4),
           (4, 3, 2, 5.8), (5, 4, 4, 3.0)]
    for i, (ci, tot, ok, mins) in enumerate(res):
        pp = clamp(seg(t, .6 + i * .1, 1.0 + i * .1))
        col = SUCCESS if ok == tot else (AMBER if ok >= tot - 1 else DANGER)
        c.rr(20, y, LW - 40, 44, 12, fill=(26, 35, 54, int(255 * pp)))
        c.rr(20, y, LW - 40, 44, 12, outline=(40, 54, 80, int(255 * pp)), width=1)
        c.txt(LW - 34, y + 23, f"{ci+1}. {CHAPTERS[ci][0]}", 12.5, "Medium",
              INK + (int(240 * pp),), anchor="rm")
        c.txt(120, y + 23, f"{mins} דק׳", 11, "Regular",
              INK_MUTED + (int(180 * pp),), anchor="lm")
        c.txt(36, y + 23, f"{ok}/{tot}", 13, "Bold", col + (int(255 * pp),),
              anchor="lm", rtl=False)
        y += 52
    pf = clamp(seg(t, 1.6, 2.1))
    c.rr(20, y + 6, LW - 40, 58, 14, fill=DANGER + (int(34 * pf / 255 * 255),))
    c.rr(20, y + 6, LW - 40, 58, 14, outline=DANGER + (int(190 * pf),), width=1.3)
    c.txt(LW - 34, y + 28, "החולשה: ניסוח מחדש · 4 מתוך 6", 13, "Bold",
          DANGER + (int(255 * pf),), anchor="rm")
    c.txt(LW - 34, y + 48, "לתרגול ממוקד בסוג הזה", 11, "Regular",
          DANGER + (int(200 * pf),), anchor="rm")
    scene_label(c, t, "תוצאה · אומדן פנימי בלבד")
    return c.img

# ---------------------------------------------------------------- world
def scene_world_d(t):
    c = C(); status_bar(c)
    tap = .9
    screen_world(c, t, appear=1.0, tap_idx=AM_NODE,
                 tap_p=clamp(1 - abs(t - tap) / .3) if abs(t - tap) < .3 else
                       (1.0 if t > tap else 0.0))
    bottom_nav(c, active="העולם", world_pulse=t * .5)
    if abs(t - tap) < .5:
        nx, ny = node_pos(AM_NODE)
        touch(c, nx, ny, press=clamp(1 - abs(t - tap) / .3), ripple=seg(t, tap, tap + .55))
    scene_label(c, t, "העולם · אמירנט")
    return c.img

SCENES = [(scene_world_d, 3.2), (scene_dash, 6.0), (scene_practice, 8.4),
          (scene_levels, 5.6), (scene_sim, 6.6), (scene_result, 5.4)]
XF = .35

def main():
    os.makedirs(OUT, exist_ok=True)
    done = set(os.listdir(OUT))
    total = sum(d for _, d in SCENES) - XF * (len(SCENES) - 1)
    n = int(total * FPS)
    starts, acc = [], 0.0
    for fn, d in SCENES:
        starts.append(acc); acc += d - XF
    print(f"video D: {total:.2f}s  {n} frames", flush=True)
    for i in range(n):
        if f"f_{i:05d}.png" in done: continue
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
