# -*- coding: utf-8 -*-
"""
Подготовка фото с объектов для сайта.

Что делает:
  - при необходимости подрезает лишнее по краям (pre) — мусор в кадре, бутылки, стремянки
  - кропает под нужное соотношение; anchor задаёт, какую часть кадра оставить
    по вертикали (0 = верх, 1 = низ), xanchor — по горизонтали (0 = левый край)
  - мягко вытягивает тени, правит яркость покадрово, добавляет резкость
  - ресайзит и сохраняет в WebP

Портфолио: на каждую работу два файла — карточка 3:4 (600×800) и крупная версия
для просмотра в portfolio/full/. Крупная под 3:4 не режется, к ней применяется
только pre — в просмотре кадр виден целиком.

Сертификаты: превью листа A4 для карточки (480 px) и крупная версия для просмотра
в docs/full/. Цвета и контраст не трогаем — это документ, а не фото.
Исходники — в img/_source/docs/; страницы из PDF отрисованы в JPG заранее.

Запуск из корня проекта:  python _tools/prepare_images.py
"""
import os
from PIL import Image, ImageOps, ImageEnhance

SRC = 'img/_source'
PORTFOLIO = 'img/portfolio'
FULL = PORTFOLIO + '/full'
DOCS = 'img/docs'
ROOT = 'img'
P = 'photo_2026-09-18_19-03-'      # первая партия фото: в work() передаётся только код, '07'
N = 'photo_2026-10-02_'            # вторая партия: в work() — имя файла целиком

# src      — имя исходника
# out      — куда сохранить (путь от корня проекта)
# ratio    — итоговое соотношение сторон; не задано — кадр не режется
# anchor   — доля обрезки сверху при вертикальном кропе
# xanchor  — доля обрезки слева при горизонтальном кропе
# width    — ширина результата; не задана — остаётся исходная
# bright   — множитель яркости (1.0 — без изменений)
# pre      — предварительный кроп в долях (left, top, right, bottom)
# sharp    — резкость (1.0 — без изменений)
# quality  — качество сжатия
# max_width — уменьшить до этой ширины, если исходник шире (не увеличивает)
# plain    — без обработки цвета и контраста (документы)
JOBS = [
    # ---------------- первый экран ----------------
    # вертикальный кадр — для телефонов, фон под текст
    dict(src=P + '21.jpg', out=ROOT + '/hero.webp',
         ratio=(4, 5), anchor=0.30, width=900, bright=1.05),

    # широкий кадр — для десктопа, тот же приём
    dict(src=P + '07.jpg', out=ROOT + '/hero-wide.webp',
         ratio=(16, 9), anchor=0.30, width=1800, bright=1.03),

    # ---------------- превью для соцсетей ----------------
    dict(src=P + '07.jpg', out=ROOT + '/og-cover.jpg',
         ratio=(1200, 630), anchor=0.45, width=1200),
]


def work(src, name, anchor=0.5, xanchor=0.5, pre=None, bright=1.0):
    """Работа в портфолио: карточка 3:4 и крупная версия для просмотра.
    src — код снимка первой партии ('07') или имя файла целиком."""
    common = dict(src=src if src.endswith('.jpg') else P + src + '.jpg',
                  pre=pre, bright=bright, sharp=1.15)
    return [
        dict(common, out=PORTFOLIO + '/' + name + '.webp',
             ratio=(3, 4), anchor=anchor, xanchor=xanchor, width=600, quality=84),
        dict(common, out=FULL + '/' + name + '.webp', quality=82),
    ]


# ---------------- портфолио, 3:4 ----------------
# почти все фото сняты вертикально — в карточке 3:4 кадр виден целиком
JOBS += work('07', 'trek-glyanec', xanchor=0.30)               # горизонтальный кадр: держим угол рамки трека
JOBS += work('02', 'trek-karniz-vstavka', pre=(0, 0.08, 1, 1))  # сверху проём в потолке
JOBS += work('16', 'tenevoy-profil-sanuzel')
JOBS += work('09', 'svetovaya-liniya-glyanec', pre=(0, 0, 1, 0.80), bright=1.06)      # внизу доски на полу
JOBS += work('20', 'paryashchiy-kuhnya', xanchor=0.35, pre=(0, 0, 1, 0.80), bright=1.16)  # внизу плёнка
JOBS += work('23', 'paryashchiy-podsvetka', pre=(0, 0.07, 1, 1), bright=1.12)        # сверху наклейка на стене
JOBS += work('19', 'led-soty-barbershop', pre=(0, 0, 1, 0.97))  # снизу в кадр попал человек
JOBS += work('10', 'tochechnye-sanuzel', bright=1.18)
JOBS += work('18', 'montazh-svetovoy-linii', pre=(0, 0.04, 1, 1), bright=1.06)
JOBS += work('12', 'montazh-paryashchey', pre=(0, 0, 1, 0.69))  # внизу стремянка и инструмент
JOBS += work('28', 'trek-lyustra-detskaya', bright=1.06)

# вторая партия, 02.10.2026. Прихожая с треком (N + '28') заменила старый кадр
# той же прихожей (код '29') — на нём трек было не разглядеть
JOBS += work(N + '22.jpg', 'kuhnya-trek-ramka', anchor=0.45, pre=(0.18, 0, 1, 1))          # слева проём в картоне
JOBS += work(N + '31.jpg', 'kuhnya-lyustra-podsvetka')
JOBS += work(N + '33.jpg', 'svetovye-linii-bukvoy-g')
JOBS += work(N + '18.jpg', 'lodzhiya-skrytyy-karniz', xanchor=1.0, pre=(0, 0, 1, 0.80))    # внизу пакеты на подоконнике
JOBS += work(N + '16.jpg', 'mansarda-svetovye-linii', xanchor=1.0, pre=(0, 0, 0.885, 0.72))  # справа стремянка, внизу коробки
JOBS += work(N + '28.jpg', 'prihozhaya-trek-tenevoy')
JOBS += work(N + '21.jpg', 'komnata-trek-tenevoy', pre=(0, 0, 1, 0.94))                  # в углу плёнка

# ---------------- запас под будущие посадочные ----------------
JOBS += work('32', 'trek-podsvetka-stellazha')                  # горизонтальный кадр
JOBS += work('24', 'trek-rgb-detskaya')
JOBS += work('33', 'trek-kabinet', bright=1.06)


def doc(src, name, pre=None, thumb=True):
    """Документ: превью листа A4 для карточки и крупная версия для просмотра.
    Превью нужно только первой странице — остальные открываются листанием."""
    common = dict(src='docs/' + src, pre=pre, plain=True)
    jobs = [dict(common, out=DOCS + '/full/' + name + '.webp', max_width=1000, quality=72)]
    if thumb:
        jobs.append(dict(common, out=DOCS + '/' + name + '.webp',
                         ratio=(1000, 1414), anchor=0.0, width=480, sharp=1.2, quality=80))
    return jobs


# ---------------- сертификаты на полотна ----------------
JOBS += doc('msd-sertifikat.jpg', 'msd-sertifikat')
JOBS += doc('teqtum-km1-sertifikat.jpg', 'teqtum-km1-sertifikat',
            pre=(0, 132 / 1280, 1, 1148 / 1280))                # скриншот: сверху и снизу чёрные поля
JOBS += doc('deken-sertifikat.jpg', 'deken-sertifikat')
JOBS += doc('deken-sanpin-1.jpg', 'deken-sanpin-1')             # экспертное заключение, 3 страницы
JOBS += doc('deken-sanpin-2.jpg', 'deken-sanpin-2', thumb=False)
JOBS += doc('deken-sanpin-3.jpg', 'deken-sanpin-3', thumb=False)


def pre_crop(im, box):
    w, h = im.size
    l, t, r, b = box
    return im.crop((int(w * l), int(h * t), int(w * r), int(h * b)))


def crop_ratio(im, ratio, anchor, xanchor=0.5):
    """Обрезает до нужного соотношения; anchor — доля отступа сверху, xanchor — слева."""
    target = ratio[0] / ratio[1]
    w, h = im.size

    if w / h > target:                         # слишком широкое — режем по бокам
        new_w = int(round(h * target))
        left = max(0, min(int(round((w - new_w) * xanchor)), w - new_w))
        return im.crop((left, 0, left + new_w, h))

    new_h = int(round(w / target))             # слишком высокое — режем сверху/снизу
    top = max(0, min(int(round((h - new_h) * anchor)), h - new_h))
    return im.crop((0, top, w, top + new_h))


def enhance(im, bright, sharp):
    """Мягко вытягиваем тени, не трогая пересветы на белом полотне."""
    try:
        im = ImageOps.autocontrast(im, cutoff=(0.8, 0.0), preserve_tone=True)
    except TypeError:                          # Pillow < 9.0
        im = ImageOps.autocontrast(im, cutoff=1)
    if bright != 1.0:
        im = ImageEnhance.Brightness(im).enhance(bright)
    im = ImageEnhance.Color(im).enhance(1.04)
    im = ImageEnhance.Sharpness(im).enhance(sharp)
    return im


def main():
    os.makedirs(FULL, exist_ok=True)
    os.makedirs(DOCS + '/full', exist_ok=True)

    for job in JOBS:
        src = os.path.join(SRC, job['src'])
        if not os.path.exists(src):
            print('нет файла:', src)
            continue

        im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
        if job.get('pre'):
            im = pre_crop(im, job['pre'])
        if job.get('ratio'):
            im = crop_ratio(im, job['ratio'], job.get('anchor', 0.5), job.get('xanchor', 0.5))
        if job.get('width'):
            w = job['width']
            r = job.get('ratio') or im.size
            im = im.resize((w, int(round(w * r[1] / r[0]))), Image.LANCZOS)
        if job.get('max_width') and im.size[0] > job['max_width']:
            w = job['max_width']
            im = im.resize((w, int(round(w * im.size[1] / im.size[0]))), Image.LANCZOS)
        if not job.get('plain'):
            im = enhance(im, job.get('bright', 1.0), job.get('sharp', 1.35))
        elif job.get('sharp'):                 # превью документа: только чуть резкости, чтобы текст не плыл
            im = ImageEnhance.Sharpness(im).enhance(job['sharp'])

        out = job['out']
        if out.endswith('.jpg'):
            im.save(out, 'JPEG', quality=job.get('quality', 86), optimize=True, progressive=True)
        else:
            im.save(out, 'WEBP', quality=job.get('quality', 82), method=6)

        print('%-52s %sx%s  %d КБ' % (out, im.size[0], im.size[1], os.path.getsize(out) // 1024))


if __name__ == '__main__':
    main()
