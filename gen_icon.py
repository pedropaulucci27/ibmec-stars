from PIL import Image, ImageDraw
import math

def star_pts(cx, cy, r_out, r_in, n, offset_deg=0):
    pts = []
    for i in range(n * 2):
        ang = math.radians(offset_deg + i * 180 / n)
        r = r_out if i % 2 == 0 else r_in
        pts.append((cx + r * math.sin(ang), cy - r * math.cos(ang)))
    return pts

def diamond4(cx, cy, r_long, r_short, ang_deg=0):
    pts = []
    for i in range(8):
        a = math.radians(ang_deg + i * 45)
        r = r_long if i % 2 == 0 else r_short
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts

def create_icon(size=512):
    s = size / 512
    def f(v):   return int(v * s + 0.5)
    def fp(pts): return [(int(x*s+.5), int(y*s+.5)) for x,y in pts]

    img  = Image.new('RGBA', (size, size), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    # ── PALETTE ──────────────────────────────────────────────────────────────
    bg       = (6,  14,  31)      # app dark
    ink      = (18, 38,  80)      # dark navy outline / strokes
    gold     = (255, 188,  42)    # star gold
    gold_hl  = (255, 225, 120)    # star highlight
    gold_sh  = (205, 148,  15)    # star shadow
    ped_b    = (65,  125, 210)    # pedestal blue
    ped_bl   = (95,  160, 240)    # pedestal highlight
    ped_bd   = (38,   85, 165)    # pedestal dark side
    ped_foot = (50,  105, 185)    # foot blue
    spark    = (255, 228,  60)    # sparkle yellow

    # ── BACKGROUND ────────────────────────────────────────────────────────────
    draw.rounded_rectangle([0, 0, size-1, size-1], radius=f(96), fill=bg)

    # ── PEDESTAL COLUMN (trapezoid) ───────────────────────────────────────────
    col = [(220,296),(292,296),(308,388),(204,388)]
    col_ink = [(213,290),(299,290),(316,394),(196,394)]
    draw.polygon(fp(col_ink), fill=ink)
    draw.polygon(fp(col),     fill=ped_b)
    # right shadow strip
    draw.polygon(fp([(289,296),(292,296),(308,388),(304,388)]), fill=ped_bd)
    # left highlight strip
    draw.polygon(fp([(220,296),(228,296),(214,388),(208,388)]), fill=ped_bl)

    # ── BASE FOOT ─────────────────────────────────────────────────────────────
    draw.rounded_rectangle([f(183),f(385),f(329),f(424)], radius=f(13), fill=ink)
    draw.rounded_rectangle([f(190),f(390),f(322),f(420)], radius=f(11), fill=ped_foot)
    # bottom shadow
    draw.rounded_rectangle([f(190),f(408),f(322),f(420)], radius=f(11), fill=ped_bd)
    # top sheen line
    draw.rounded_rectangle([f(190),f(390),f(322),f(398)], radius=f(11), fill=ped_bl)

    # ── 8-POINTED STAR ────────────────────────────────────────────────────────
    scx, scy = 256, 200
    r_out, r_in = 140, 54

    star_outer = fp(star_pts(scx, scy, r_out+10, r_in+5,  8))
    star_main  = fp(star_pts(scx, scy, r_out,    r_in,    8))
    star_hl    = fp(star_pts(scx-12, scy-12, r_out-20, r_in+12, 8))

    # ink outline
    draw.polygon(star_outer, fill=ink)
    # gold fill
    draw.polygon(star_main, fill=gold)
    # top-left highlight (semi-transparent lighter gold)
    hl = Image.new('RGBA', (size,size), (0,0,0,0))
    hd = ImageDraw.Draw(hl)
    hd.polygon(star_hl, fill=(*gold_hl, 70))
    img = Image.alpha_composite(img, hl)
    draw = ImageDraw.Draw(img)

    # bottom shadow tint
    sh = Image.new('RGBA', (size,size), (0,0,0,0))
    sd = ImageDraw.Draw(sh)
    sd.polygon(fp(star_pts(scx+10, scy+15, r_out-15, r_in+10, 8)), fill=(*gold_sh, 55))
    img = Image.alpha_composite(img, sh)
    draw = ImageDraw.Draw(img)

    # ── FACE ─────────────────────────────────────────────────────────────────
    fcx, fcy = f(scx), f(scy + 10)

    # eyes
    for ex in [fcx - f(28), fcx + f(28)]:
        ey = fcy - f(12)
        er = f(11)
        draw.ellipse([ex-er, ey-er, ex+er, ey+er], fill=ink)
        # eye shine
        draw.ellipse([ex+f(2), ey-f(6), ex+f(2)+f(5), ey-f(6)+f(5)], fill=(255,255,255,210))

    # smile arc
    sm_r = f(28)
    draw.arc([fcx-sm_r, fcy-f(4), fcx+sm_r, fcy+f(28)],
             start=18, end=162, fill=ink, width=f(8))

    # blush ovals
    bl = Image.new('RGBA', (size,size), (0,0,0,0))
    bd = ImageDraw.Draw(bl)
    for bx in [fcx - f(44), fcx + f(44)]:
        bd.ellipse([bx-f(19), fcy+f(8)-f(10), bx+f(19), fcy+f(8)+f(10)],
                   fill=(255, 130, 70, 115))
    img = Image.alpha_composite(img, bl)
    draw = ImageDraw.Draw(img)

    # ── SPARKLES ─────────────────────────────────────────────────────────────
    spk_defs = [
        (366, 100, 28, 7,  -8),   # large top-right
        (132, 128, 21, 5,  12),   # medium top-left
        (403, 202, 13, 3,   4),   # small right
        (104, 212, 12, 3,  -6),   # small left
        (390, 302,  9, 2,   8),   # tiny bottom-right
    ]
    for (cx,cy,rl,rs,ang) in spk_defs:
        pts = fp(diamond4(cx,cy,rl,rs,ang))
        draw.polygon(pts, fill=spark, outline=ink if rl>14 else None)

    # ── MOTION LINES ─────────────────────────────────────────────────────────
    lw = f(5)
    lines = [
        # top-right
        ((326,70),(352,76)),
        ((337,86),(360,97)),
        # top-left
        ((78,164),(108,165)),
        ((72,180),(103,184)),
        # bottom-right
        ((338,276),(362,288)),
    ]
    for (x1,y1),(x2,y2) in lines:
        draw.line([f(x1),f(y1), f(x2),f(y2)], fill=ink, width=lw)

    # ── OUTER BORDER ─────────────────────────────────────────────────────────
    draw.rounded_rectangle([1, 1, size-2, size-2], radius=f(95),
                            outline=(245,166,35,50), width=f(2))

    return img


out = r"c:\Users\peero\OneDrive\Área de Trabalho\PROGRAMAÇÃO\PROJETO MEU SITE 1\appIBMEC"
for sz, name in [(512,'icon-512.png'),(192,'icon-192.png'),(180,'apple-touch-icon.png')]:
    create_icon(sz).save(f"{out}\\{name}", 'PNG')
    print(f"OK  {name}  ({sz}×{sz})")
