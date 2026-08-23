#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Video C — הודעות. Feed wall, story chain, roleplay inbox.
Every keyboard in this video is a continuation engine: the block set is a
function of what was already chosen, and always offers more than is needed."""
import math, os
from PIL import Image, ImageDraw
from render_kol import (S, LW, LH, W, H, FPS, C, clamp, lerp, ease_out, ease_in_out,
                        ease_back, seg, glow, status_bar, touch, scene_label,
                        bottom_nav, screen_world, node_pos,
                        BORDER_SUB, BORDER_STRONG, INK, INK_MUTED, BRAND,
                        BRAND_SURFACE, BRAND_ON, SUCCESS, DANGER,
                        icon_check, icon_lock)
from msgs_ui import (POS, MSG_NODE, bg, avatar, nav, app_header, msg_tabs, block,
                     keyboard, block_xy, compose_bar, post, grad_rr)

OUT = "/home/claude/frames_c"

def head(c, title, tab, press=None):
    app_header(c, "הודעות · כיתה ז׳3", title)
    return msg_tabs(c, tab, press=press)

def run_steps(c, t, top, steps, t0, dt, send_t):
    """drive an adaptive keyboard: returns (words, current step index)"""
    words, tap, press, step = [], None, 0.0, 0
    for i, (rows, idx, hint, cnt) in enumerate(steps):
        bt = t0 + i * dt
        if t >= bt:
            words.append(rows[idx[0]][idx[1]]); step = min(i + 1, len(steps) - 1)
        if abs(t - bt) < .2:
            tap, press = idx, clamp(1 - abs(t - bt) / .2)
    rows_now, _, hint_now, cnt_now = steps[step]
    c.rr(0, top - 92, LW, 96, 0, fill=(11, 16, 29, 205))
    compose_bar(c, top - 66, words,
                send_press=clamp(1 - abs(t - send_t) / .2) if abs(t - send_t) < .2 else 0)
    keyboard(c, top, rows_now, hint_now, cnt_now, tap=tap, press=press,
             back=(step > 0))
    for i, (rows, idx, hint, cnt) in enumerate(steps):
        bt = t0 + i * dt
        if abs(t - bt) < .38:
            bxy = block_xy(c, top, rows, idx)
            touch(c, bxy[0], bxy[1], press=clamp(1 - abs(t - bt) / .2),
                  ripple=seg(t, bt, bt + .38))
    if abs(t - send_t) < .38:
        touch(c, LW - 46, top - 66 + 28, press=clamp(1 - abs(t - send_t) / .2),
              ripple=seg(t, send_t, send_t + .38))
    return words

# =========================================================== 1 · world
def scene_world_c(t):
    c = C(); status_bar(c)
    tap = .9
    screen_world(c, t, appear=1.0, tap_idx=MSG_NODE,
                 tap_p=clamp(1 - abs(t - tap) / .3) if abs(t - tap) < .3 else
                       (1.0 if t > tap else 0.0))
    bottom_nav(c, active="העולם", world_pulse=t * .5)
    if abs(t - tap) < .5:
        nx, ny = node_pos(MSG_NODE)
        touch(c, nx, ny, press=clamp(1 - abs(t - tap) / .3), ripple=seg(t, tap, tap + .55))
    scene_label(c, t, "העולם · הודעות")
    return c.img

# =========================================================== 2 · class
CODE = "K7M2Q4"
def scene_class(t):
    c = C(); bg(c); status_bar(c)
    app_header(c, "העולם · הודעות", "הכיתה שלי")
    c.txt(LW - 24, 152, "כיתה סגורה · הצטרפות בקוד בלבד", 12, "Regular",
          INK_MUTED + (175,), anchor="rm")
    t_join, t_done = 1.5, 3.6
    grad_rr(c, 24, 178, LW - 48, 92, 18, (32, 44, 68), (24, 33, 51),
            outline=(46, 62, 90, 255))
    c.txt(LW - 42, 208, "פתיחת כיתה", 16, "Bold", INK, anchor="rm")
    c.txt(LW - 42, 232, "אתה מקבל קוד ומוסר אותו לתלמידים", 11.5, "Regular",
          INK_MUTED + (195,), anchor="rm")
    c.rr(42, 224, 96, 32, 16, fill=BRAND_SURFACE)
    c.txt(90, 241, "צור כיתה", 12.5, "Bold", BRAND_ON)
    pr = 2 * clamp(1 - abs(t - t_join) / .25) if abs(t - t_join) < .25 else 0
    grad_rr(c, 24 + pr/2, 286 + pr/2, LW - 48 - pr, 118 - pr, 18,
            (32, 44, 68), (24, 33, 51),
            outline=(BRAND if t >= t_join else (46, 62, 90)) + (255,),
            width=1.6 if t >= t_join else 1.2)
    c.txt(LW - 42, 316, "הצטרפות בקוד", 16, "Bold", INK, anchor="rm")
    n = 0 if t < t_join else min(6, int((t - t_join - .1) / .22) + 1)
    cw, gap = 40, 8
    x0 = LW/2 - (6 * cw + 5 * gap) / 2
    for i in range(6):
        x = x0 + i * (cw + gap)
        f = i < n
        c.rr(x, 340, cw, 46, 10, fill=(BRAND + (46,)) if f else (14, 20, 34, 255))
        c.rr(x, 340, cw, 46, 10, outline=(BRAND if f else BORDER_SUB) + (255,),
             width=1.5 if f else 1.1)
        if f: c.txt(x + cw/2, 364, CODE[i], 20, "Bold", INK, rtl=False)
    if t >= t_done:
        p = ease_back(clamp(seg(t, t_done, t_done + .5)))
        grad_rr(c, 24, 428, LW - 48, 96 * p, 18, (28, 46, 44), (22, 34, 40),
                outline=SUCCESS + (200,), width=1.5)
        if p > .7:
            a = int(255 * clamp((p - .7) / .3))
            icon_check(c, LW - 48, 458, SUCCESS + (a,), sc=1.3)
            c.txt(LW - 72, 458, "הצטרפת לכיתה ז׳3", 16, "Bold", INK + (a,), anchor="rm")
            c.txt(LW - 42, 486, "24 חברים · המורה: רוני", 12, "Regular",
                  INK_MUTED + (a,), anchor="rm")
    c.rr(24, 552, LW - 48, 54, 14, fill=(24, 32, 50, 190))
    icon_lock(c, LW - 48, 579, INK_MUTED + (210,), sc=1.0)
    c.txt(LW - 72, 572, "כיתות אינן ניתנות לחיפוש", 12.5, "SemiBold", INK, anchor="rm")
    c.txt(LW - 72, 592, "אפשר להיכנס רק עם קוד שקיבלת", 11, "Regular",
          INK_MUTED + (185,), anchor="rm")
    nav(c)
    if abs(t - t_join) < .45:
        touch(c, LW/2, 364, press=clamp(1 - abs(t - t_join) / .28),
              ripple=seg(t, t_join, t_join + .5))
    scene_label(c, t, "כיתה סגורה · קוד בלבד")
    return c.img

# =========================================================== 3 · wall feed
WALL_STEPS = [
    ([[("My family", "N"), ("We", "P"), ("I", "P")],
      [("It", "P"), ("On Saturday", "C"), ("Last weekend", "C")],
      [("Yesterday", "C"), ("My weekend", "N")]], (0, 2), "פתיחה", 14),
    ([[("stayed", "V"), ("visited", "V"), ("played", "V"), ("went", "V")],
      [("helped", "V"), ("watched", "V"), ("had", "V"), ("was", "V")],
      [("did not", "C"), ("really", "ADJ"), ("also", "C")]], (0, 3), "פועל", 11),
    ([[("home", "C"), ("out", "C"), ("with", "C"), ("to", "C")],
      [("back", "C"), ("there", "C"), ("away", "C")]], (0, 3), "חיבור", 7),
    ([[("my", "P"), ("a", "C"), ("the", "C")],
      [("school", "N"), ("sea", "N"), ("park", "N")]], (0, 2), "כינוי", 6),
    ([[("park", "N"), ("beach", "N"), ("city", "N")],
      [("north", "N"), ("mall", "N"), ("museum", "N")]], (0, 1), "שם עצם", 9),
]

def wall_feed(c, mine=None):
    y = 190
    y += post(c, y, "היום 08:15 · שאלת היום", "How was your weekend?",
              sub="Answer in one sentence.", likes=31, ncom=24,
              comments=[("מאיה", "M", (91, 155, 245),
                         "I went to the beach with my family.", 12, True),
                        ("דניאל", "D", (209, 120, 232),
                         "We played football in the park.", 9, False)]
                       + ([mine] if mine else []),
              more="הצג את כל 24 התגובות") + 14
    y += post(c, y, "אתמול 17:40", "What can you see in this picture?",
              img=True, likes=18, ncom=11,
              comments=[("נועה", "N", (242, 181, 68),
                         "I can see a green hill and the sea.", 7, False)],
              more="הצג את כל 11 התגובות") + 14
    post(c, y, "יום ראשון 09:00", "Write one thing you like about school.",
         likes=22, ncom=19,
         comments=[("איתי", "I", (46, 197, 197), "I like the art lessons.", 5, False)],
         more="הצג את כל 19 התגובות")

def scene_wall(t):
    c = C(); bg(c); status_bar(c)
    kb_t, send_t = 1.5, 6.1
    mine = ("אתה", "A", (46, 197, 197), "I went to the beach.", 1, True) \
        if t >= send_t + .3 else None
    wall_feed(c, mine=mine)
    head(c, "הקיר של הכיתה", 0)
    if t < kb_t:
        c.rr(0, LH - 152, LW, 152, 0, fill=(11, 16, 29, 210))
        c.rr(24, LH - 142, LW - 48, 52, 16, fill=(28, 40, 62))
        c.rr(24, LH - 142, LW - 48, 52, 16, outline=BRAND + (150,), width=1.3)
        c.txt(LW/2, LH - 116, "הוסף תגובה מהבלוקים", 14, "Bold", BRAND_SURFACE)
        nav(c)
        if abs(t - kb_t) < .45:
            touch(c, LW/2, LH - 116, press=clamp(1 - abs(t - kb_t) / .28),
                  ripple=seg(t, kb_t, kb_t + .5))
    else:
        e = ease_out(seg(t, kb_t, kb_t + .4))
        if t >= send_t + .25:
            e = 1 - ease_in_out(seg(t, send_t + .25, send_t + .8))
        if e > .02:
            run_steps(c, t, lerp(LH, 470, e), WALL_STEPS, kb_t + .8, .78, send_t)
        else:
            nav(c)
    scene_label(c, t, "הקיר · פיד פוסטים")
    return c.img

# =========================================================== 4 · story
STORY_LINES = [
    ("מאיה", "M", (91, 155, 245), "One morning a small cat woke up."),
    ("דניאל", "D", (209, 120, 232), "It was very hungry and cold."),
    ("נועה", "N", (242, 181, 68), "The cat walked to a big house."),
]
STORY_STEPS = [
    ([[("Then", "C"), ("Suddenly", "C"), ("A girl", "N")],
      [("The door", "N"), ("Someone", "P"), ("Inside", "C")]], (0, 2), "פתיחה", 12),
    ([[("saw", "V"), ("heard", "V"), ("opened", "V")],
      [("came", "V"), ("smiled", "V"), ("gave", "V")]], (0, 2), "פועל", 9),
    ([[("her", "P"), ("a", "C"), ("the", "C")],
      [("this", "P"), ("that", "P")]], (0, 2), "כינוי", 5),
    ([[("window", "N"), ("box", "N"), ("door", "N")],
      [("gate", "N"), ("bowl", "N")]], (0, 2), "שם עצם", 8),
]

def scene_story(t):
    c = C(); bg(c); status_bar(c)
    sw, kb_t, add_t = .55, 1.3, 4.9
    pos = 0 if t < sw else lerp(0, 1, ease_out(seg(t, sw, sw + .4)))
    app_header(c, "הודעות · כיתה ז׳3", "סיפור בהמשכים")
    cxs = msg_tabs(c, pos, press=1 if abs(t - sw) < .18 else None)
    lx = LW - 24
    for k in ("V", "N", "ADJ", "C", "P"):
        col, name = POS[k]
        w = c.tw(name, 10, "Medium") + 22
        c.rr(lx - w, 190, w, 20, 6, fill=col + (40,))
        c.d.rectangle([(lx - w + 7)*S, 196*S, (lx - w + 10)*S, 204*S], fill=col)
        c.txt(lx - w/2 + 5, 200, name, 10, "Medium", INK_MUTED + (225,))
        lx -= w + 5
    y = 222
    for who, ltr, col, line in STORY_LINES:
        c.line(LW - 34, y, LW - 34, y + 62, BORDER_SUB, 2)
        avatar(c, LW - 34, y + 16, 12, col, ltr)
        grad_rr(c, 20, y, LW - 66, 62, 14, (29, 40, 60), (23, 32, 49),
                outline=(42, 56, 82, 255), sh=False)
        c.txt(LW - 60, y + 20, who, 11.5, "SemiBold", INK_MUTED + (215,), anchor="rm")
        c.txt(LW - 60, y + 44, line, 13.5, "Regular", INK, anchor="rm", rtl=False)
        y += 72
    glow(c, LW - 34, y + 16, 12, BRAND, spread=10, a0=110)
    avatar(c, LW - 34, y + 16, 12, (46, 197, 197), "A")
    c.txt(LW - 60, y + 16, "התור שלך", 12.5, "Bold", BRAND_SURFACE, anchor="rm")
    if t >= add_t:
        p = ease_back(clamp(seg(t, add_t, add_t + .45)))
        grad_rr(c, 20, y + 32, (LW - 66) * p, 58, 14, (26, 46, 44), (21, 34, 38),
                outline=SUCCESS + (200,), width=1.4, sh=False)
        if p > .8:
            c.txt(LW - 60, y + 62, "A girl opened the door.", 13.5, "Regular",
                  INK, anchor="rm", rtl=False)
    if t >= kb_t:
        e = ease_out(seg(t, kb_t, kb_t + .4))
        run_steps(c, t, lerp(LH, 536, e), STORY_STEPS, kb_t + .7, .78, add_t)
    if abs(t - sw) < .45:
        touch(c, cxs[1], 158, press=clamp(1 - abs(t - sw) / .22), ripple=seg(t, sw, sw + .45))
    scene_label(c, t, "סיפור בהמשכים · תור אחד למשפט")
    return c.img

# =========================================================== 5 · roleplay
MAILS = [
    ("Tom", "T", (242, 181, 68), "Trip to Israel", "Hi! I am coming this summer...",
     "09:20", True, "תייר"),
    ("Sarah", "S", (91, 155, 245), "Table for four", "We would like to book a table...",
     "אתמול", True, "מסעדה"),
    ("Mr. Levi", "L", (209, 120, 232), "Your homework", "Please send me the essay...",
     "יום ג׳", False, "מורה"),
]
RP_STEPS = [
    ([[("You should", "P"), ("My tip", "N"), ("I", "P")],
      [("In summer", "C"), ("If you come", "C")]], (0, 2), "פתיחה", 10),
    ([[("suggest", "V"), ("think", "V"), ("recommend", "V")],
      [("would say", "V"), ("love", "V")]], (0, 2), "פועל", 8),
    ([[("one", "C"), ("a", "C"), ("the", "C")],
      [("your", "P"), ("this", "P")]], (0, 1), "חיבור", 6),
    ([[("quiet", "ADJ"), ("warm", "ADJ"), ("summer", "ADJ")],
      [("short", "ADJ"), ("nice", "ADJ")]], (0, 2), "תואר", 7),
    ([[("beach", "N"), ("trip", "N"), ("visit", "N")],
      [("north", "N"), ("city", "N")]], (0, 2), "שם עצם", 9),
]

def scene_roleplay(t):
    c = C(); bg(c); status_bar(c)
    sw, open_t, kb_t, send_t = .55, 2.0, 2.6, 7.4
    pos = 1 if t < sw else lerp(1, 2, ease_out(seg(t, sw, sw + .4)))
    if t < open_t:
        app_header(c, "הודעות · סימולציות", "תיבת הסימולציות")
        cxs = msg_tabs(c, pos, press=2 if abs(t - sw) < .18 else None)
        c.txt(LW - 24, 196, "3 הודעות · 2 שלא נענו", 12, "Regular",
              INK_MUTED + (180,), anchor="rm")
        y = 216
        for name, ltr, col, subj, prev, when, unread, tag in MAILS:
            grad_rr(c, 20, y, LW - 40, 96, 17,
                    (32, 44, 68) if unread else (26, 35, 53),
                    (25, 34, 52) if unread else (21, 28, 44),
                    outline=(BRAND + (120,)) if unread else (40, 54, 78, 255),
                    width=1.4 if unread else 1.1)
            avatar(c, LW - 46, y + 30, 19, col, ltr)
            nw = c.tw(name, 14.5, "Bold")
            c.txt(LW - 76, y + 22, name, 14.5, "Bold" if unread else "SemiBold",
                  INK, anchor="rm", rtl=False)
            tw = c.tw(tag, 9.5, "Medium") + 16
            c.rr(LW - 84 - nw - tw, y + 14, tw, 17, 8, fill=col + (55,))
            c.txt(LW - 84 - nw - tw/2, y + 23, tag, 9.5, "Medium", col)
            c.txt(LW - 76, y + 46, subj, 13.5, "Bold" if unread else "Regular",
                  INK if unread else (196, 208, 228), anchor="rm", rtl=False)
            c.txt(LW - 76, y + 68, prev, 12, "Regular", (139, 154, 180),
                  anchor="rm", rtl=False)
            c.txt(34, y + 22, when, 10.5, "Medium", (139, 154, 180), anchor="lm")
            if unread: c.circ(34, y + 52, 5, fill=BRAND_SURFACE)
            y += 107
        c.rr(20, y + 4, LW - 40, 54, 14, fill=(22, 30, 48, 190))
        icon_lock(c, LW - 44, y + 31, (150, 165, 190), sc=1.0)
        c.txt(LW - 68, y + 24, "כל התכתובת מול דמויות", 12.5, "SemiBold", INK, anchor="rm")
        c.txt(LW - 68, y + 43, "אין כאן משתמשים אחרים", 11, "Regular",
              (139, 154, 180), anchor="rm")
        nav(c)
        if abs(t - sw) < .45:
            touch(c, cxs[2], 158, press=clamp(1 - abs(t - sw) / .22),
                  ripple=seg(t, sw, sw + .45))
        if abs(t - open_t) < .45:
            touch(c, LW/2, 264, press=clamp(1 - abs(t - open_t) / .25),
                  ripple=seg(t, open_t, open_t + .45))
    else:
        app_header(c, "תיבת הסימולציות", "Trip to Israel")
        c.txt(LW - 24, 148, "Tom · תייר · היום 09:20", 12, "Regular",
              (150, 165, 190), anchor="rm", rtl=False)
        grad_rr(c, 20, 172, LW - 40, 138, 18, (30, 41, 62), (23, 32, 50),
                outline=(44, 60, 88, 255))
        avatar(c, LW - 46, 200, 18, (242, 181, 68), "T")
        c.txt(LW - 76, 200, "Tom", 14.5, "Bold", INK, anchor="rm", rtl=False)
        for i, line in enumerate(["Hi! I am coming to Israel this",
                                  "summer with my family.",
                                  "Where should we go? Any tips?"]):
            c.txt(LW - 32, 240 + i * 24, line, 14, "Regular",
                  (225, 234, 250), anchor="rm", rtl=False)
        built = [s[0][s[1][0]][s[1][1]][0] for i, s in enumerate(RP_STEPS)
                 if t >= kb_t + .7 + i * .78]
        c.txt(LW - 24, 336, "מילות חובה", 12.5, "SemiBold", INK, anchor="rm")
        x = LW - 24
        for word in ("summer", "visit", "recommend"):
            done = word in built
            w = c.tw(word, 13, "SemiBold") + (44 if done else 26)
            c.rr(x - w, 354, w, 32, 16, fill=SUCCESS + (46,) if done else (0, 0, 0, 0))
            c.rr(x - w, 354, w, 32, 16,
                 outline=(SUCCESS if done else BORDER_STRONG) + (255,),
                 width=1.5 if done else 1.1)
            if done: icon_check(c, x - w + 16, 370, SUCCESS, sc=.95)
            c.txt(x - w/2 + (9 if done else 0), 371, word, 13, "SemiBold",
                  SUCCESS if done else (176, 190, 214), rtl=False)
            x -= w + 8
        if t >= send_t:
            p = ease_back(clamp(seg(t, send_t, send_t + .45)))
            grad_rr(c, 20, 402, (LW - 40) * p, 62, 16, (26, 50, 72), (20, 38, 56),
                    outline=BRAND + (170,), width=1.3)
            if p > .8:
                c.txt(LW - 40, 438, "I recommend a summer visit.", 14, "Regular",
                      INK, anchor="rm", rtl=False)
            if t >= send_t + .55:
                a = int(255 * clamp(seg(t, send_t + .55, send_t + .9)))
                c.rr(24, 480, LW - 48, 48, 14, fill=SUCCESS + (int(40*a/255),))
                c.rr(24, 480, LW - 48, 48, 14, outline=SUCCESS + (a,), width=1.4)
                icon_check(c, LW - 48, 504, SUCCESS + (a,), sc=1.2)
                c.txt(LW - 74, 504, "3 מתוך 3 מילות חובה", 14, "Bold",
                      SUCCESS + (a,), anchor="rm")
        if t >= kb_t:
            e = ease_out(seg(t, kb_t, kb_t + .4))
            run_steps(c, t, lerp(LH, 552, e), RP_STEPS, kb_t + .7, .78, send_t)
    scene_label(c, t, "סימולציה · מילות חובה")
    return c.img

# =========================================================== outro
def scene_outro_c(t):
    c = C(); bg(c)
    p = ease_out(seg(t, 0, .8))
    glow(c, LW/2, LH/2 - 40, 50, BRAND, spread=30, a0=int(80 * p))
    c.circ(LW/2, LH/2 - 40, 50 * p, fill=(30, 41, 59))
    c.circ(LW/2, LH/2 - 40, 50 * p, outline=BRAND + (int(190*p),), width=1.6)
    if p > .3:
        c.rr(LW/2 - 20, LH/2 - 52, 40, 26, 8, fill=BRAND_SURFACE + (int(255*p),))
        c.d.polygon([((LW/2 - 12))*S, (LH/2 - 26)*S, ((LW/2 - 2))*S, (LH/2 - 26)*S,
                     ((LW/2 - 12))*S, (LH/2 - 16)*S], fill=BRAND_SURFACE + (int(255*p),))
    a = int(255 * seg(t, .7, 1.4))
    c.txt(LW/2, LH/2 + 50, "הודעות", 30, "Bold", INK + (a,))
    c.txt(LW/2, LH/2 + 86, "כיתה סגורה · מקלדת המשכים", 12.5, "Regular",
          INK_MUTED + (int(a * .85),))
    return c.img

SCENES = [(scene_world_c, 3.2), (scene_class, 5.6), (scene_wall, 9.4),
          (scene_story, 7.2), (scene_roleplay, 10.2), (scene_outro_c, 2.2)]
XF = .35

def main():
    os.makedirs(OUT, exist_ok=True)
    for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
    total = sum(d for _, d in SCENES) - XF * (len(SCENES) - 1)
    n = int(total * FPS)
    starts, acc = [], 0.0
    for fn, d in SCENES:
        starts.append(acc); acc += d - XF
    print(f"video C: {total:.2f}s  {n} frames", flush=True)
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
