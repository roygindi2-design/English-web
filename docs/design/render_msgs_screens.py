#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Static reference screens for הודעות. Same UI module as the video."""
from PIL import Image, ImageDraw
from render_kol import (S, LW, LH, W, H, C, lerpc, status_bar, BORDER_STRONG,
                        INK, INK_MUTED, BRAND, BRAND_SURFACE, SUCCESS,
                        icon_check, icon_lock, F)
from msgs_ui import (POS, bg, avatar, nav, app_header, msg_tabs, keyboard,
                     compose_bar, post, grad_rr)
from render_msgs import WALL_STEPS, RP_STEPS, MAILS, wall_feed

OUT = "/mnt/user-data/outputs/"

def screen_wall(keyboard_open=False):
    c = C(); bg(c); status_bar(c)
    wall_feed(c)
    app_header(c, "הודעות · כיתה ז׳3", "הקיר של הכיתה"); msg_tabs(c, 0)
    if keyboard_open:
        rows, _, hint, cnt = WALL_STEPS[3]
        top = 470
        c.rr(0, top - 92, LW, 96, 0, fill=(11, 16, 29, 205))
        compose_bar(c, top - 66, [("I", "P"), ("went", "V"), ("to", "C")])
        keyboard(c, top, rows, hint, cnt)
    else:
        c.rr(0, LH - 152, LW, 152, 0, fill=(11, 16, 29, 210))
        c.rr(24, LH - 142, LW - 48, 52, 16, fill=(28, 40, 62))
        c.rr(24, LH - 142, LW - 48, 52, 16, outline=BRAND + (150,), width=1.3)
        c.txt(LW/2, LH - 116, "הוסף תגובה מהבלוקים", 14, "Bold", BRAND_SURFACE)
        nav(c)
    return c.img

def screen_kb(step):
    c = C(); bg(c); status_bar(c)
    app_header(c, "הודעות · כיתה ז׳3", "הקיר של הכיתה"); msg_tabs(c, 0)
    grad_rr(c, 20, 188, LW - 40, 118, 18, (34, 52, 84), (24, 37, 62),
            outline=BRAND + (120,), width=1.4)
    avatar(c, LW - 44, 216, 16, (245, 200, 110), "R")
    c.txt(LW - 68, 210, "רוני · המורה", 13, "Bold", INK, anchor="rm")
    c.txt(LW - 68, 227, "היום 08:15", 10.5, "Regular", (139, 154, 180), anchor="rm")
    c.txt(LW - 26, 272, "How was your weekend?", 17, "Bold", INK, anchor="rm", rtl=False)
    c.txt(LW - 24, 336, "אתה עונה", 12.5, "SemiBold", INK, anchor="rm")
    top = 470
    rows, _, hint, cnt = WALL_STEPS[step]
    words = [WALL_STEPS[i][0][WALL_STEPS[i][1][0]][WALL_STEPS[i][1][1]]
             for i in range(step)]
    compose_bar(c, top - 66, words)
    keyboard(c, top, rows, hint, cnt, back=(step > 0))
    return c.img

def screen_inbox():
    c = C(); bg(c); status_bar(c)
    app_header(c, "הודעות · סימולציות", "תיבת הסימולציות"); msg_tabs(c, 2)
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
    return c.img

def screen_mail():
    c = C(); bg(c); status_bar(c)
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
    c.txt(LW - 24, 336, "מילות חובה", 12.5, "SemiBold", INK, anchor="rm")
    x = LW - 24
    for word, done in (("summer", False), ("visit", False), ("recommend", True)):
        w = c.tw(word, 13, "SemiBold") + (44 if done else 26)
        c.rr(x - w, 354, w, 32, 16, fill=SUCCESS + (46,) if done else (0, 0, 0, 0))
        c.rr(x - w, 354, w, 32, 16,
             outline=(SUCCESS if done else BORDER_STRONG) + (255,),
             width=1.5 if done else 1.1)
        if done: icon_check(c, x - w + 16, 370, SUCCESS, sc=.95)
        c.txt(x - w/2 + (9 if done else 0), 371, word, 13, "SemiBold",
              SUCCESS if done else (176, 190, 214), rtl=False)
        x -= w + 8
    rows, _, hint, cnt = RP_STEPS[2]
    top = 552
    compose_bar(c, top - 66, [("I", "P"), ("recommend", "V")])
    keyboard(c, top, rows, hint, cnt)
    return c.img

# ---------------------------------------------------------------- branch board
BW, BH = 1125, 1044
def board_branches():
    img = Image.new("RGB", (BW, BH))
    g = Image.new("RGB", (1, BH)); gd = ImageDraw.Draw(g)
    for i in range(BH):
        gd.point((0, i), fill=lerpc((20, 28, 48), (12, 17, 30), i/BH))
    img.paste(g.resize((BW, BH)), (0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    def chip(x, y, text, pos):
        col = POS[pos][0]
        w = d.textlength(text, font=F(14, "SemiBold")) + 34
        d.rounded_rectangle([x - w, y, x, y + 50], radius=13,
                            fill=col + (48,), outline=col + (230,), width=3)
        d.rectangle([x - 16, y + 9, x - 11, y + 22], fill=col)
        d.text((x - w/2, y + 26), text, font=F(14, "SemiBold"),
               fill=(245, 250, 255), anchor="mm")
        return w
    d.text((BW - 54, 56), "מקלדת הבלוקים · מנוע המשכים", font=F(21, "Bold"),
           fill=(245, 214, 132), anchor="ra")
    d.text((BW - 54, 106), "אותה שאלה · שלוש תשובות · כל בחירה מחליפה את הסט הבא",
           font=F(13, "Regular"), fill=(160, 176, 202), anchor="ra")
    d.rounded_rectangle([54, 156, BW - 54, 244], radius=18,
                        fill=(34, 52, 84), outline=(57, 135, 229, 200), width=3)
    d.text((BW - 82, 200), "How was your weekend?", font=F(19, "Bold"),
           fill=(248, 250, 252), anchor="rm")
    paths = [[("I", "P"), ("went", "V"), ("to", "C"), ("the beach", "N")],
             [("We", "P"), ("played", "V"), ("football", "N"), ("outside", "C")],
             [("My weekend", "N"), ("was", "V"), ("quiet", "ADJ"), ("and nice", "C")]]
    y = 300
    for path in paths:
        d.line([BW - 82, y - 56, BW - 82, y + 25], fill=(70, 92, 128), width=3)
        d.line([BW - 82, y + 25, BW - 100, y + 25], fill=(70, 92, 128), width=3)
        x = BW - 108
        for si, (txt, pos) in enumerate(path):
            x -= chip(x, y, txt, pos)
            if si < len(path) - 1:
                d.text((x - 20, y + 25), "‹", font=F(19, "Bold"),
                       fill=(110, 128, 158), anchor="mm"); x -= 40
        y += 116
    cy = y + 10
    d.rounded_rectangle([54, cy, BW - 54, cy + 268], radius=18,
                        fill=(26, 35, 54), outline=(46, 62, 90), width=2)
    for i, ln in enumerate([
            "הסט אינו קבוע — הוא נגזר ממה שכבר נבחר",
            "אחרי I מוצעים 11 פעלים · אחרי My weekend מוצעים תארים",
            "תמיד יש יותר אפשרויות מהנדרש — זו בחירה, לא פתרון",
            "שלושת המסלולים תקינים ומתקבלים · אין תשובה יחידה",
            "מקש מחיקה מחזיר צעד אחד ומשחזר את הסט הקודם"]):
        d.text((BW - 88, cy + 52 + i * 44), ln, font=F(13.5, "Regular"),
               fill=(205, 217, 236), anchor="rm")
        d.ellipse([BW - 78, cy + 47 + i * 44, BW - 70, cy + 55 + i * 44],
                  fill=(125, 171, 248))
    return img

if __name__ == "__main__":
    screen_wall().save(OUT + "kol-C-10-wall-feed.png")
    screen_wall(True).save(OUT + "kol-C-12-wall-reply.png")
    screen_inbox().save(OUT + "kol-C-13-inbox.png")
    screen_mail().save(OUT + "kol-C-14-mail-open.png")
    screen_kb(0).save(OUT + "kol-C-15-keyboard-start.png")
    screen_kb(1).save(OUT + "kol-C-16-keyboard-next.png")
    board_branches().save(OUT + "kol-C-17-keyboard-branches.png")
    print("screens ok")
