# -*- coding: utf-8 -*-
"""
Подготовка фото с объектов для сайта.

Что делает:
  - при необходимости подрезает лишнее по краям (pre) — мусор в кадре, бутылки, стремянки
  - кропает под нужное соотношение; anchor задаёт, какую часть кадра оставить
    по вертикали (0 = верх, 1 = низ), xanchor — по горизонтали (0 = левый край)
  - уменьшает (никогда не увеличивает) и сохраняет в WebP с высоким качеством

Цвет, яркость и контраст НЕ трогаем. Раньше фото прогонялись через автоконтраст,
подъём яркости и резкость — на светлых потолках это загоняло полутени в чёрный,
выбивало белое в пересвет и вытаскивало артефакты сжатия Телеграма. Фото выглядели
жёстче и «теряли качество». Камера телефона уже отдаёт нормально обработанный кадр.

Портфолио: на каждую работу три файла —
  portfolio/имя.webp       карточка 3:4, 600×800
  portfolio/lg/имя.webp    та же карточка крупнее (до 960 px) — для чётких экранов
                           телефонов, браузер берёт её сам через srcset
  portfolio/full/имя.webp  крупная версия для просмотра: под 3:4 не режется,
                           применяется только pre — кадр виден целиком

Сертификаты: превью листа A4 для карточки (480 px) и крупная версия для просмотра
в docs/full/. Исходники — в img/_source/docs/; страницы из PDF отрисованы в JPG заранее.

Исходники фото — сжатые Телеграмом (1280 px по длинной стороне). Для заметно лучшего
качества нужны оригиналы с телефона, отправленные файлом, без сжатия.

Запуск из корня проекта:  python _tools/prepare_images.py
"""
import os
from PIL import Image, ImageOps, ImageEnhance

SRC = 'img/_source'
PORTFOLIO = 'img/portfolio'
DOCS = 'img/docs'
ROOT = 'img'
P = 'photo_2026-09-18_19-03-'      # первая партия фото: в work() передаётся только код, '07'
N = 'photo_2026-10-02_'            # вторая партия: в work() — имя файла целиком
T = 'photo_2026-10-10_'            # третья партия

PHOTO_Q = 90                       # качество WebP для фото: ниже 88 гладкий потолок «плывёт»

# src       — имя исходника
# out       — куда сохранить (путь от корня проекта)
# ratio     — итоговое соотношение сторон; не задано — кадр не режется
# anchor    — доля обрезки сверху при вертикальном кропе
# xanchor   — доля обрезки слева при горизонтальном кропе
# width     — ширина результата (только уменьшение); не задана — остаётся исходная
# pre       — предварительный кроп в долях (left, top, right, bottom)
# rotate    — поворот против часовой, градусы (кадр потолка снизу можно повернуть)
# sharp     — резкость (только превью документов, чтобы мелкий текст не плыл)
# quality   — качество сжатия
JOBS = [
    # ---------------- первый экран ----------------
    # вертикальный кадр — для телефонов, фон под текст; в исходном размере
    dict(src=P + '21.jpg', out=ROOT + '/hero.webp', ratio=(4, 5), anchor=0.30, quality=92),

    # широкий кадр — для десктопа; исходник 1280 px, растягивать его в файле нет смысла
    dict(src=P + '07.jpg', out=ROOT + '/hero-wide.webp', ratio=(16, 9), anchor=0.30, quality=92),

    # ---------------- превью для соцсетей ----------------
    dict(src=P + '07.jpg', out=ROOT + '/og-cover.jpg', ratio=(1200, 630), anchor=0.45, width=1200, quality=88),
]


def work(src, name, anchor=0.5, xanchor=0.5, pre=None, rotate=0):
    """Работа в портфолио: карточка, крупная карточка и версия для просмотра.
    src — код снимка первой партии ('07') или имя файла целиком."""
    common = dict(src=src if src.endswith('.jpg') else P + src + '.jpg', pre=pre, rotate=rotate, quality=PHOTO_Q)
    card = dict(common, ratio=(3, 4), anchor=anchor, xanchor=xanchor)
    return [
        dict(card, out=PORTFOLIO + '/' + name + '.webp', width=600),
        dict(card, out=PORTFOLIO + '/lg/' + name + '.webp', width=960),
        dict(common, out=PORTFOLIO + '/full/' + name + '.webp'),
    ]


# ---------------- портфолио, 3:4 ----------------
# почти все фото сняты вертикально — в карточке 3:4 кадр виден целиком
JOBS += work('07', 'trek-glyanec', xanchor=0.30)               # горизонтальный кадр: держим угол рамки трека
JOBS += work('02', 'trek-karniz-vstavka', pre=(0, 0.08, 1, 1))  # сверху проём в потолке
JOBS += work('16', 'tenevoy-profil-sanuzel')
JOBS += work('09', 'svetovaya-liniya-glyanec', pre=(0, 0, 1, 0.80))                  # внизу доски на полу
JOBS += work('20', 'paryashchiy-kuhnya', xanchor=0.35, pre=(0, 0, 1, 0.80))          # внизу плёнка
JOBS += work('23', 'paryashchiy-podsvetka', pre=(0, 0.07, 1, 1))                     # сверху наклейка на стене
JOBS += work('19', 'led-soty-barbershop', pre=(0, 0, 1, 0.97))  # снизу в кадр попал человек
JOBS += work('10', 'tochechnye-sanuzel')
JOBS += work('18', 'montazh-svetovoy-linii', pre=(0, 0.04, 1, 1))
JOBS += work('12', 'montazh-paryashchey', pre=(0, 0, 1, 0.69))  # внизу стремянка и инструмент
JOBS += work('28', 'trek-lyustra-detskaya')

# вторая партия, 02.10.2026. Прихожая с треком (N + '28') заменила старый кадр
# той же прихожей (код '29') — на нём трек было не разглядеть
JOBS += work(N + '22.jpg', 'kuhnya-trek-ramka', anchor=0.45, pre=(0.18, 0, 1, 1))          # слева проём в картоне
JOBS += work(N + '31.jpg', 'kuhnya-lyustra-podsvetka')
# та же комната, что на T + '39' (монтаж), — готовый вид; повёрнут, чтобы совпадал ракурс
JOBS += work(T + '40.jpg', 'svetovye-linii-bukvoy-g', rotate=90)
JOBS += work(N + '18.jpg', 'lodzhiya-skrytyy-karniz', xanchor=1.0, pre=(0, 0, 1, 0.80))    # внизу пакеты на подоконнике
JOBS += work(N + '16.jpg', 'mansarda-svetovye-linii', xanchor=1.0, pre=(0, 0, 0.885, 0.72))  # справа стремянка, внизу коробки
JOBS += work(N + '28.jpg', 'prihozhaya-trek-tenevoy')
JOBS += work(N + '21.jpg', 'komnata-trek-tenevoy', pre=(0, 0, 1, 0.94))                  # в углу плёнка

# третья партия, 10.10.2026 — заказчик сам выбрал работы и порядок на сайте
JOBS += work(T + '37.jpg', 'prihozhaya-tenevoy-spoty')
JOBS += work(T + '39.jpg', 'montazh-svetovyh-liniy')
JOBS += work(T + '42.jpg', 'komnata-trek-polki')
JOBS += work(T + '43.jpg', 'liniya-bukvoy-g-svetilnik')
JOBS += work(T + '44.jpg', 'glyanec-lineynye-svetilniki')
JOBS += work(T + '45.jpg', 'trek-bukvoy-g')
JOBS += work(T + '46.jpg', 'dva-treka-glyanec')
JOBS += work(T + '47.jpg', 'sanuzel-spoty-liniya', xanchor=0.45)  # горизонтальный кадр
JOBS += work(T + '48.jpg', 'mansardnoe-okno-karniz')
JOBS += work(T + '49.jpg', 'dve-linii-tenevoy')
JOBS += work(T + '50.jpg', 'vannaya-lyustra-kolco')
JOBS += work(T + '52.jpg', 'komnata-skrytye-karnizy')

# ---------------- запас под будущие посадочные ----------------
JOBS += work('32', 'trek-podsvetka-stellazha')                  # горизонтальный кадр
JOBS += work('24', 'trek-rgb-detskaya')
JOBS += work('33', 'trek-kabinet')


def doc(src, name, pre=None, thumb=True):
    """Документ: превью листа A4 для карточки и крупная версия для просмотра.
    Превью нужно только первой странице — остальные открываются листанием."""
    common = dict(src='docs/' + src, pre=pre)
    jobs = [dict(common, out=DOCS + '/full/' + name + '.webp', width=1000, quality=72)]
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


def main():
    for job in JOBS:
        src = os.path.join(SRC, job['src'])
        if not os.path.exists(src):
            print('нет файла:', src)
            continue

        im = ImageOps.exif_transpose(Image.open(src)).convert('RGB')
        if job.get('rotate'):
            im = im.rotate(job['rotate'], expand=True)
        if job.get('pre'):
            im = pre_crop(im, job['pre'])
        if job.get('ratio'):
            im = crop_ratio(im, job['ratio'], job.get('anchor', 0.5), job.get('xanchor', 0.5))
        if job.get('width') and im.size[0] > job['width']:   # только уменьшаем
            w = job['width']
            r = job.get('ratio') or im.size
            im = im.resize((w, int(round(w * r[1] / r[0]))), Image.LANCZOS)
        if job.get('sharp'):
            im = ImageEnhance.Sharpness(im).enhance(job['sharp'])

        out = job['out']
        os.makedirs(os.path.dirname(out), exist_ok=True)
        if out.endswith('.jpg'):
            im.save(out, 'JPEG', quality=job.get('quality', 88), subsampling=0, optimize=True, progressive=True)
        else:
            im.save(out, 'WEBP', quality=job.get('quality', PHOTO_Q), method=6)

        print('%-52s %sx%s  %d КБ' % (out, im.size[0], im.size[1], os.path.getsize(out) // 1024))


if __name__ == '__main__':
    main()
