#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Video E — ניהול העולם.
Install adds · the user places · long-press opens edit mode · centre tap exits."""
import math, os
from PIL import Image, ImageDraw
from render_kol import (S, LW, LH, W, H, FPS, C, clamp, lerp, ease_out, ease_in_out,
                        ease_back, seg, glow, status_bar, touch, scene_label,
                        bottom_nav, BORDER_SUB, BORDER_STRONG, INK, INK_MUTED,
                        BRAND, BRAND_SURFACE, BRAND_ON, SUCCESS, DANGER,
                        icon_sword, icon_story, icon_pen, icon_sentence, icon_books,
                        icon_trophy, icon_people, icon_bubble, icon_target,
                        icon_globe, icon_check, icon_lock, icon_x)
from msgs_ui import bg, grad_rr, nav

OUT = "/home/claude/frames_e"
MAX_APPS = 10
RING_CX, RING_CY, RING_R = LW / 2, 402, 120

APPS = {
    "זירת קרב":     (icon_sword,    "ארקייד", "קרב אוצר מילים על זמן"),
    "סיפורים":      (icon_story,    "למידה",  "קריאה עם תרגום בהקשה"),
    "אוצר מילים":   (icon_books,    "למידה",  "המילים שאספת"),
    "אמירנט":       (icon_target,   "תרגול",  "סימולציות ותרגול לבחינה"),
    "הודעות":       (icon_bubble,   "חברתי",  "כיתה סגורה ומקלדת בלוקים"),
    "משפטים":       (icon_sentence, "תרגול",  "בניית משפטים"),
    "כתיבה חופשית": (icon_pen,      "למידה",  "כתיבה עם משוב"),
    "מובילים":      (icon_trophy,   "חברתי",  "טבלת דירוג"),
    "חברים":        (icon_people,   "חברתי",  "השוואה מול חברים"),
}
LOCKED = {"מובילים", "חברים"}

def node_r(n):
    return 33 if n <= 6 else (31 if n <= 8 else 28)

def pos_of(i, n, r=RING_R):
    a = -math.pi/2 + i * math.tau / n
    return RING_CX + r*math.cos(a), RING_CY + r*math.sin(a)

def slot_from_angle(px, py, n):
    a = math.atan2(py - RING_CY, px - RING_CX)
    return int(round(((a + math.pi/2) % math.tau) / (math.tau / n))) % n

# ---------------------------------------------------------------- pieces
def hub(c, press=0.0, dim=0.0, exit_mode=False):
    r = 52 - 3 * press
    a = int(255 * (1 - dim))
    for k in range(5, 0, -1):
        f = k/5
        c.circ(RING_CX, RING_CY, r + 14*f, fill=BRAND + (int(26*(1-f)*(1-dim)),))
    c.circ(RING_CX, RING_CY, r, fill=(24, 34, 54))
    c.circ(RING_CX, RING_CY, r, outline=BRAND + (int(200*(1-dim)),), width=1.8)
    if exit_mode:
        icon_check(c, RING_CX, RING_CY - 8, SUCCESS + (a,), sc=1.9, w=2.6)
        c.txt(RING_CX, RING_CY + 22, "סיום", 13, "Bold", INK + (a,))
    else:
        icon_globe(c, RING_CX, RING_CY - 8, BRAND_SURFACE + (a,), sc=1.35, width=2.2)
        c.txt(RING_CX, RING_CY + 22, "קול", 14, "Bold", INK + (a,))

def app_node(c, x, y, name, r, dim=0.0, show_x=False, x_press=0.0, highlight=False):
    icon, cat, desc = APPS[name]
    a = int(255 * (1 - .45 * dim))
    if highlight:
        glow(c, x, y, r, BRAND, spread=18, a0=120)
    c.circ(x, y, r, fill=(30, 41, 59, a))
    c.circ(x, y, r, outline=(BRAND if highlight else BORDER_SUB) + (a,),
           width=1.6 if highlight else 1.2)
    icon(c, x, y, INK + (a,), sc=r/31)
    c.txt(x, y + r + 14, name, 10.5, "SemiBold", INK_MUTED + (int(a*.9),))
    if show_x:
        bx, by = x + r*.72, y - r*.72
        br = 10 - 1.5 * x_press
        c.circ(bx, by, br + 1.6, fill=(13, 19, 33))
        c.circ(bx, by, br, fill=DANGER + (235,))
        icon_x(c, bx, by, (255, 255, 255), sc=.6, w=2.0)

def draw_ring(c, nodes, hub_press=0.0, edit=False, x_press=None,
              floating=None, hub_hidden=False, exit_mode=False):
    """floating = (name, px, py, slot) — a node under the finger"""
    c.txt(LW - 24, 112, "העולם", 25, "Bold", INK, anchor="rm")
    c.txt(LW - 24, 140, "מרחב פתוח · לא נספר להתקדמות הלמידה", 12.5, "Regular",
          INK_MUTED + (185,), anchor="rm")
    n = len(nodes) + (1 if floating else 0)
    r = node_r(n)
    c.circ(RING_CX, RING_CY, RING_R, outline=BORDER_SUB + (140,), width=1)
    slot = 0
    for i, name in enumerate(nodes):
        if floating and slot == floating[3]: slot += 1
        x, y = pos_of(slot, n)
        app_node(c, x, y, name, r, dim=.55 if edit else 0.0, show_x=edit,
                 x_press=x_press if x_press == i else 0.0)
        slot += 1
    hub(c, press=hub_press, dim=1.0 if hub_hidden else 0.0, exit_mode=exit_mode)
    if floating:
        nm, px, py, _ = floating
        app_node(c, px, py, nm, r + 7, highlight=True)

def banner(c, y, title, sub, col, icon=None):
    c.rr(20, y, LW - 40, 58, 15, fill=col + (30,))
    c.rr(20, y, LW - 40, 58, 15, outline=col + (185,), width=1.3)
    if icon:
        icon(c, LW - 44, y + 29, col, sc=1.2)
        c.txt(LW - 68, y + 21, title, 13, "Bold", col, anchor="rm")
        c.txt(LW - 68, y + 43, sub, 11, "Regular", col + (205,), anchor="rm")
    else:
        c.txt(LW - 34, y + 21, title, 13, "Bold", col, anchor="rm")
        c.txt(LW - 34, y + 43, sub, 11, "Regular", col + (205,), anchor="rm")

# ---------------------------------------------------------------- app centre
def app_card(c, y, name, state, press=False, h=88, disabled=False):
    icon, cat, desc = APPS[name]
    locked = state == "locked"
    grad_rr(c, 20, y, LW - 40, h, 17,
            (24, 32, 50) if locked else (31, 43, 66),
            (20, 27, 42) if locked else (23, 32, 50),
            outline=((46, 60, 86) if locked else (48, 66, 98)) + (255,), width=1.2)
    c.circ(LW - 50, y + 32, 21, fill=(20, 28, 46))
    c.circ(LW - 50, y + 32, 21, outline=(BORDER_SUB if locked else BRAND + (150,)),
           width=1.3)
    icon(c, LW - 50, y + 32, (BORDER_STRONG if locked else INK), sc=1.0)
    nw = c.tw(name, 14.5, "Bold")
    c.txt(LW - 80, y + 24, name, 14.5, "Bold",
          INK if not locked else INK_MUTED + (165,), anchor="rm")
    cw = c.tw(cat, 9.5, "Medium") + 16
    c.rr(LW - 84 - nw - cw, y + 15, cw, 17, 8, fill=BRAND + (46,))
    c.txt(LW - 84 - nw - cw/2, y + 24, cat, 9.5, "Medium", BRAND_SURFACE)
    c.txt(LW - 80, y + 46, desc, 11.5, "Regular",
          INK_MUTED + (200 if not locked else 130,), anchor="rm")
    bw, bh, bx = 76, 32, 30
    by = y + h/2 - bh/2
    pr = 2 if press else 0
    if locked:
        icon_lock(c, 44, y + 32, BORDER_STRONG + (190,), sc=.95)
        c.txt(62, y + 32, "דורש חשבון", 11, "Regular", INK_MUTED + (150,), anchor="lm")
        c.txt(62, y + 50, "בקרוב", 10, "Regular", INK_MUTED + (120,), anchor="lm")
    elif state == "installed":
        c.rr(bx, by, bw, bh, 16, outline=BORDER_STRONG + (200,), width=1.2)
        c.txt(bx + bw/2, by + bh/2, "הסר", 12.5, "SemiBold", INK_MUTED + (225,))
    else:
        c.rr(bx + pr/2, by + pr/2, bw - pr, bh - pr, 16,
             fill=(52, 64, 92) if disabled else BRAND_SURFACE)
        c.txt(bx + bw/2, by + bh/2, "התקן", 12.5, "Bold",
              INK_MUTED + (160,) if disabled else BRAND_ON)
    return h

def screen_centre(c, installed, avail, scroll=0.0, press=None):
    y = 182 - scroll
    c.txt(LW - 24, y, "מותקנות", 12.5, "SemiBold", INK, anchor="rm"); y += 16
    for nm in installed:
        y += app_card(c, y, nm, "installed", press=(press == nm)) + 9
    y += 6
    c.txt(LW - 24, y, "זמינות להתקנה", 12.5, "SemiBold", INK, anchor="rm"); y += 16
    full = len(installed) >= MAX_APPS
    for nm in avail:
        y += app_card(c, y, nm, "locked" if nm in LOCKED else "available",
                      press=(press == nm), disabled=full) + 9
    c.rr(0, 0, LW, 176, 0, fill=(13, 19, 33))
    c.txt(LW - 24, 100, "קול · מרכז האפליקציות", 12.5, "Regular",
          INK_MUTED + (190,), anchor="rm")
    c.txt(LW - 24, 124, "בנה את הטבעת שלך", 22, "Bold", INK, anchor="rm")
    used = len(installed)
    c.txt(LW - 24, 158, f"{used} מתוך {MAX_APPS} אפליקציות בטבעת", 12.5, "Bold",
          DANGER if used >= MAX_APPS else BRAND_SURFACE, anchor="rm")
    x = 24
    for i in range(MAX_APPS):
        c.rr(x, 152, 18, 12, 6, fill=BRAND_SURFACE if i < used else (34, 46, 68))
        x += 22

# =========================================================== scenes
RING0 = ["זירת קרב", "הודעות", "סיפורים", "כתיבה חופשית", "משפטים",
         "אוצר מילים", "מובילים", "חברים"]
INST = ["זירת קרב", "הודעות", "סיפורים", "כתיבה חופשית", "משפטים", "אוצר מילים"]
AVAIL = ["אמירנט", "מובילים", "חברים"]
NEW = "אמירנט"
INSERT_AT = 3

def scene_ring(t):
    c = C(); bg(c); status_bar(c)
    tap = 1.9
    draw_ring(c, RING0,
              hub_press=clamp(1 - abs(t - tap) / .3) if abs(t - tap) < .3 else 0)
    banner(c, 604, "8 מתוך 10 אפליקציות בטבעת",
           "הקש על קול לניהול · לחיצה ארוכה על אפליקציה לעריכה", BRAND_SURFACE)
    bottom_nav(c, active="העולם", world_pulse=t * .5)
    if abs(t - tap) < .5:
        touch(c, RING_CX, RING_CY, press=clamp(1 - abs(t - tap) / .3),
              ripple=seg(t, tap, tap + .5))
    scene_label(c, t, "העולם · המוקד הוא מרכז האפליקציות")
    return c.img

def scene_centre(t):
    c = C(); bg(c); status_bar(c)
    inst_t = 4.2
    scroll = ease_in_out(seg(t, 1.0, 2.8)) * 236
    screen_centre(c, INST, AVAIL, scroll=scroll,
                  press=NEW if abs(t - inst_t) < .2 else None)
    nav(c)
    if .7 <= t < 2.8:
        touch(c, LW/2, 560 - ease_in_out(seg(t, 1.0, 2.8)) * 236, press=.7)
    if abs(t - inst_t) < .45:
        touch(c, 68, 182 - 236 + 16 + 6*97 + 22 + 44,
              press=clamp(1 - abs(t - inst_t) / .25), ripple=seg(t, inst_t, inst_t + .45))
    scene_label(c, t, "מרכז האפליקציות · התקנה מוסיפה")
    return c.img

def scene_place(t):
    c = C(); bg(c); status_bar(c)
    d0, d1 = 1.5, 4.2
    n = len(INST) + 1
    tx, ty = pos_of(INSERT_AT, n)
    if t < d0:
        px, py, idx = RING_CX, RING_CY, 0
    else:
        p = ease_in_out(clamp(seg(t, d0, d1)))
        px, py = lerp(RING_CX, tx, p), lerp(RING_CY, ty, p)
        idx = 0 if p < .25 else slot_from_angle(px, py, n)
    draw_ring(c, INST, edit=True, floating=(NEW, px, py, idx), hub_hidden=True)
    banner(c, 604, "גרור את «אמירנט» למקום בטבעת",
           "הטבעת מתיישרת מחדש · ✕ מסיר אפליקציה", BRAND_SURFACE)
    if d0 - .4 <= t < d1 + .2:
        touch(c, px, py, press=.75)
    scene_label(c, t, "מצב מיקום · המשתמש ממקם")
    return c.img

RING1 = INST[:INSERT_AT] + [NEW] + INST[INSERT_AT:]

def scene_after(t):
    c = C(); bg(c); status_bar(c)
    draw_ring(c, RING1)
    if t < 1.2:
        x, y = pos_of(RING1.index(NEW), len(RING1))
        glow(c, x, y, node_r(len(RING1)), BRAND, spread=20,
             a0=int(140 * (1 - seg(t, .4, 1.2))))
    banner(c, 604, "«אמירנט» נוספה לטבעת",
           "7 מתוך 10 · הצמתים התיישרו מחדש", SUCCESS, icon=icon_check)
    bottom_nav(c, active="העולם", world_pulse=t * .5)
    scene_label(c, t, "הטבעת אחרי · מרווחים שווים")
    return c.img

def scene_edit(t):
    """long-press → edit · reorder by drag · ✕ removes · centre tap exits"""
    c = C(); bg(c); status_bar(c)
    hold, ENTER = .5, 1.25
    m0, m1 = 1.9, 3.9          # reorder drag
    xtap, gone = 4.7, 5.0      # remove משפטים
    exit_t = 6.9
    src = RING1.index("סיפורים")
    n = len(RING1)
    edit = ENTER <= t < exit_t + .25

    if t < ENTER:
        draw_ring(c, RING1)
        x, y = pos_of(src, n)
        p = clamp(seg(t, hold, ENTER))
        c.circ(x, y, node_r(n) + 6 + 10 * p,
               outline=BRAND + (int(220 * (1 - p * .3)),), width=2.4)
        touch(c, x, y, press=.85)
        banner(c, 604, "לחיצה ארוכה על אפליקציה",
               "פותחת את מצב העריכה בלי להיכנס לחנות", BRAND_SURFACE)
    elif t < m1 + .3:
        others = [a for a in RING1 if a != "סיפורים"]
        sx, sy = pos_of(src, n)
        tslot = 5
        tx, ty = pos_of(tslot, n)
        p = ease_in_out(clamp(seg(t, m0, m1)))
        px, py = lerp(sx, tx, p), lerp(sy, ty, p)
        idx = slot_from_angle(px, py, n) if p > .15 else src
        draw_ring(c, others, edit=True, floating=("סיפורים", px, py, idx),
                  exit_mode=True)
        touch(c, px, py, press=.75)
        banner(c, 604, "מצב עריכה · גרירה מחליפה מיקום",
               "✕ מסיר · הקשה במרכז מסיימת", BRAND_SURFACE)
    else:
        reordered = [a for a in RING1 if a != "סיפורים"]
        reordered.insert(5, "סיפורים")
        ri = reordered.index("משפטים")
        nodes = [a for i, a in enumerate(reordered) if not (i == ri and t >= gone)]
        draw_ring(c, nodes, edit=edit,
                  x_press=ri if abs(t - xtap) < .25 else None,
                  exit_mode=edit,
                  hub_press=clamp(1 - abs(t - exit_t) / .3) if abs(t - exit_t) < .3 else 0)
        if t >= gone:
            banner(c, 604, "ההתקדמות נשמרה במלואה",
                   "התקנה מחדש תחזיר הכול · שום נתון לא נמחק", SUCCESS,
                   icon=icon_check)
        else:
            banner(c, 604, "מצב עריכה · הקש ✕ להסרה",
                   "הקשה במרכז מסיימת עריכה", DANGER)
        if abs(t - xtap) < .45:
            x, y = pos_of(ri, len(reordered))
            r = node_r(len(reordered))
            touch(c, x + r*.72, y - r*.72, press=clamp(1 - abs(t - xtap) / .25),
                  ripple=seg(t, xtap, xtap + .45))
        if abs(t - exit_t) < .5:
            touch(c, RING_CX, RING_CY, press=clamp(1 - abs(t - exit_t) / .3),
                  ripple=seg(t, exit_t, exit_t + .5))
        if not edit:
            bottom_nav(c, active="העולם", world_pulse=t * .5)
    scene_label(c, t, "לחיצה ארוכה · מצב עריכה")
    return c.img

SCENES = [(scene_ring, 3.6), (scene_centre, 6.2), (scene_place, 5.4),
          (scene_after, 3.2), (scene_edit, 8.0)]
XF = .35

def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
    total = sum(d for _, d in SCENES) - XF * (len(SCENES) - 1)
    n = int(total * FPS)
    starts, acc = [], 0.0
    for fn, d in SCENES:
        starts.append(acc); acc += d - XF
    print(f"video E: {total:.2f}s  {n} frames", flush=True)
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
