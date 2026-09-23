# -*- coding: utf-8 -*-
"""
Подготовка фото с объектов для сайта.

Что делает:
  - при необходимости подрезает лишнее по краям (pre) — мусор в кадре, бутылки, стремянки
  - кропает под нужное соотношение; anchor задаёт, какую часть кадра оставить
    по вертикали (0 = верх, 1 = низ) — у фото потолка сюжет обычно не по центру
  - мягко вытягивает тени, правит яркость покадрово, добавляет резкость
  - ресайзит и сохраняет в WebP

Запуск из корня проекта:  python _tools/prepare_images.py
"""
import os
from PIL import Image, ImageOps, ImageEnhance

SRC = 'img/_source'
PORTFOLIO = 'img/portfolio'
SERVICES = 'img/services'
ROOT = 'img'

# src      — имя исходника
# out      — куда сохранить (путь от корня проекта)
# ratio    — итоговое соотношение сторон
# anchor   — доля обрезки сверху при вертикальном кропе
# width    — ширина результата
# bright   — множитель яркости (1.0 — без изменений)
# pre      — предварительный кроп в долях (left, top, right, bottom)
JOBS = [
    # ---------------- первый экран ----------------
    # вертикальный кадр — для телефонов, фон под текст
    dict(src='photo_2026-09-18_19-03-21.jpg', out=ROOT + '/hero.webp',
         ratio=(4, 5), anchor=0.30, width=900, bright=1.05),

    # широкий кадр — для десктопа, тот же приём
    dict(src='photo_2026-09-18_19-03-07.jpg', out=ROOT + '/hero-wide.webp',
         ratio=(16, 9), anchor=0.30, width=1800, bright=1.03),

    # ---------------- портфолио, 4:3 ----------------
    dict(src='photo_2026-09-18_19-03-07.jpg', out=PORTFOLIO + '/trek-glyanec.webp',
         ratio=(4, 3), anchor=0.45, width=800),

    dict(src='photo_2026-09-18_19-03-02.jpg', out=PORTFOLIO + '/trek-karniz-vstavka.webp',
         ratio=(4, 3), anchor=0.44, width=800),

    dict(src='photo_2026-09-18_19-03-16.jpg', out=PORTFOLIO + '/tenevoy-profil-sanuzel.webp',
         ratio=(4, 3), anchor=0.30, width=800),

    # справа в кадре бутылка — отрезаем край
    dict(src='photo_2026-09-18_19-03-29.jpg', out=PORTFOLIO + '/svetovaya-liniya-prihozhaya.webp',
         ratio=(4, 3), anchor=0.45, width=800, pre=(0.0, 0.0, 0.84, 1.0)),

    dict(src='photo_2026-09-18_19-03-20.jpg', out=PORTFOLIO + '/paryashchiy-kuhnya.webp',
         ratio=(4, 3), anchor=0.36, width=800, bright=1.16),

    dict(src='photo_2026-09-18_19-03-19.jpg', out=PORTFOLIO + '/led-soty-barbershop.webp',
         ratio=(4, 3), anchor=0.22, width=800),

    dict(src='photo_2026-09-18_19-03-23.jpg', out=PORTFOLIO + '/paryashchiy-podsvetka.webp',
         ratio=(4, 3), anchor=0.30, width=800, bright=1.12),

    dict(src='photo_2026-09-18_19-03-10.jpg', out=PORTFOLIO + '/tochechnye-sanuzel.webp',
         ratio=(4, 3), anchor=0.52, width=800, bright=1.18),

    dict(src='photo_2026-09-18_19-03-18.jpg', out=PORTFOLIO + '/montazh-svetovoy-linii.webp',
         ratio=(4, 3), anchor=0.30, width=800, bright=1.06),

    dict(src='photo_2026-09-18_19-03-12.jpg', out=PORTFOLIO + '/montazh-paryashchey.webp',
         ratio=(4, 3), anchor=0.22, width=800),

    dict(src='photo_2026-09-18_19-03-28.jpg', out=PORTFOLIO + '/trek-lyustra-detskaya.webp',
         ratio=(4, 3), anchor=0.30, width=800, bright=1.06),

    dict(src='photo_2026-09-18_19-03-32.jpg', out=PORTFOLIO + '/trek-podsvetka-stellazha.webp',
         ratio=(4, 3), anchor=0.45, width=800),

    # ---------------- запас под будущие посадочные ----------------
    dict(src='photo_2026-09-18_19-03-09.jpg', out=PORTFOLIO + '/svetovaya-liniya-glyanec.webp',
         ratio=(4, 3), anchor=0.34, width=800, bright=1.06),

    dict(src='photo_2026-09-18_19-03-24.jpg', out=PORTFOLIO + '/trek-rgb-detskaya.webp',
         ratio=(4, 3), anchor=0.30, width=800),

    dict(src='photo_2026-09-18_19-03-33.jpg', out=PORTFOLIO + '/trek-kabinet.webp',
         ratio=(4, 3), anchor=0.30, width=800, bright=1.06),

    # ---------------- карточки услуг: крупные планы деталей, 4:3 ----------------
    # берём тот же исходник, что и в портфолио, но режем ближе — чтобы
    # в услугах была деталь конструкции, а в портфолио — комната целиком
    dict(src='photo_2026-09-18_19-03-09.jpg', out=SERVICES + '/svetovye-linii.webp',
         ratio=(4, 3), anchor=0.5, width=600, pre=(0.2, 0.26, 0.85, 0.625), bright=1.05),

    dict(src='photo_2026-09-18_19-03-16.jpg', out=SERVICES + '/tenevoy-profil.webp',
         ratio=(4, 3), anchor=0.3, width=600, pre=(0.05, 0.1, 0.72, 0.6)),

    dict(src='photo_2026-09-18_19-03-02.jpg', out=SERVICES + '/skrytyy-karniz.webp',
         ratio=(4, 3), anchor=0.5, width=600, pre=(0.0, 0.1, 0.75, 0.52)),

    dict(src='photo_2026-09-18_19-03-23.jpg', out=SERVICES + '/paryashchiy.webp',
         ratio=(4, 3), anchor=0.5, width=600, pre=(0.1, 0.18, 0.8, 0.58), bright=1.1),

    dict(src='photo_2026-09-18_19-03-32.jpg', out=SERVICES + '/trek.webp',
         ratio=(4, 3), anchor=0.5, width=600, pre=(0.0, 0.08, 0.72, 0.62)),

    dict(src='photo_2026-09-18_19-03-21.jpg', out=SERVICES + '/polotna.webp',
         ratio=(4, 3), anchor=0.5, width=600, pre=(0.0, 0.0, 1.0, 0.5625), bright=1.04),

    dict(src='photo_2026-09-18_19-03-19.jpg', out=SERVICES + '/led-soty.webp',
         ratio=(4, 3), anchor=0.5, width=600, pre=(0.1, 0.05, 0.9, 0.5)),

    # ---------------- превью для соцсетей ----------------
    dict(src='photo_2026-09-18_19-03-07.jpg', out=ROOT + '/og-cover.jpg',
         ratio=(1200, 630), anchor=0.45, width=1200),
]


def pre_crop(im, box):
    w, h = im.size
    l, t, r, b = box
    return im.crop((int(w * l), int(h * t), int(w * r), int(h * b)))


def crop_ratio(im, ratio, anchor):
    """Обрезает до нужного соотношения; anchor — доля отступа сверху."""
    target = ratio[0] / ratio[1]
    w, h = im.size

    if w / h > target:                         # слишком широкое — режем по бокам
        new_w = int(round(h * target))
        left = (w - new_w) // 2
        return im.crop((left, 0, left + new_w, h))

    new_h = int(round(w / target))             # слишком высокое — режем сверху/снизу
    top = max(0, min(int(round((h - new_h) * anchor)), h - new_h))
    return im.crop((0, top, w, top + new_h))


def enhance(im, bright):
    """Мягко вытягиваем тени, не трогая пересветы на белом полотне."""
    try:
        im = ImageOps.autocontrast(im, cutoff=(0.8, 0.0), preserve_tone=True)
    except TypeError:                          # Pillow < 9.0
        im = ImageOps.autocontrast(im, cutoff=1)
    if bright != 1.0:
        im = ImageEnhance.Brightness(im).enhance(bright)
    im = ImageEnhance.Color(im).enhance(1.04)
    im = ImageEnhance.Sharpness(im).enhance(1.35)
    return im


def main():
    os.makedirs(PORTFOLIO, exist_ok=True)
    os.makedirs(SERVICES, exist_ok=True)

    for job in JOBS:
        src = os.path.join(SRC, job['src'])
        if not os.path.exists(src):
            print('нет файла:', src)
            continue

        im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
        if job.get('pre'):
            im = pre_crop(im, job['pre'])
        im = crop_ratio(im, job['ratio'], job['anchor'])

        width = job['width']
        height = int(round(width * job['ratio'][1] / job['ratio'][0]))
        im = im.resize((width, height), Image.LANCZOS)
        im = enhance(im, job.get('bright', 1.0))

        out = job['out']
        if out.endswith('.jpg'):
            im.save(out, 'JPEG', quality=86, optimize=True, progressive=True)
        else:
            im.save(out, 'WEBP', quality=82, method=6)

        print('%-46s %sx%s  %d КБ' % (out, width, height, os.path.getsize(out) // 1024))


if __name__ == '__main__':
    main()
