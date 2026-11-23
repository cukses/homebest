#!/usr/bin/env python3
"""Extrae el catalogo de https://catalogodtech.com (WooCommerce Store API).

Salida:
  data/products.json     productos ya limpios (sin motos ni bicicletas)
  data/categories.json   categorias con productos tras excluir
  data/excluded.json     productos excluidos y motivo
  assets/products/       hasta 4 imagenes por producto

Uso:  python scripts/scrape.py
Requiere solo la libreria estandar. Pillow es opcional (solo para reducir imagenes > 600 KB).
"""
import html
import json
import os
import re
import sys
import time
import unicodedata
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.parse import quote, urlparse

BASE = "https://catalogodtech.com/wp-json/wc/store/v1"
UA = "Mozilla/5.0"
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
DATA_DIR = os.path.join(ROOT, "data")
ASSETS_DIR = os.path.join(ROOT, "assets", "products")

MAX_IMAGES = 4
WORKERS = 8
RETRIES = 2            # reintentos tras el primer intento fallido
BIG_BYTES = 600 * 1024
MAX_SIDE = 1000
JPEG_QUALITY = 82
SHORT_DESC_MAX = 400   # caracteres

# Motos / bicicletas por nombre de producto (sin acentos, minusculas)
EXCL_NAME_RE = re.compile(r"\b(moto|motos|motocicleta|bicicleta|bicicletas|bici|cicla)\b")
# Motos / bicicletas por categoria. "moto(?!r)" evita "motor" (y "motorola")
EXCL_CAT_RE = re.compile(r"bicicleta|moto(?!r)")

EMOJI_RE = re.compile("[\U0001F000-\U0001FAFF☀-➿⬀-⯿️‍⃣]")


def log(msg):
    print(msg, flush=True)


def norm(s):
    s = unicodedata.normalize("NFKD", s or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return s.lower()


def clean_text(s):
    s = html.unescape(s or "")
    return re.sub(r"\s+", " ", s).strip()


def strip_tags(s):
    return clean_text(re.sub(r"<[^>]+>", " ", s or ""))


def clean_category_name(s):
    """Nombre de categoria sin emojis ni simbolos decorativos."""
    s = html.unescape(s or "")
    s = EMOJI_RE.sub("", s)
    s = "".join(c for c in s if unicodedata.category(c) not in ("So", "Sk"))
    return re.sub(r"\s+", " ", s).strip()


def is_offer_category(cat):
    return "oferta" in norm(cat.get("name")) or "oferta" in norm(cat.get("slug"))


def http_get(url):
    # Las rutas de imagen pueden traer caracteres no ASCII (chino, etc.): se codifican en %XX
    url = quote(url, safe=":/?=&%+@,;~#[]!$'()*")
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=90) as r:
        return r.read(), r.headers


def get_json(url):
    last = None
    for attempt in range(RETRIES + 1):
        try:
            body, headers = http_get(url)
            return json.loads(body.decode("utf-8")), headers
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"No se pudo obtener {url}: {last}")


def money(value, minor):
    if value in (None, ""):
        return None
    return round(int(value) / (10 ** int(minor or 0)))


def image_ext(url):
    ext = os.path.splitext(urlparse(url).path)[1].lower()
    if ext == ".jpeg":
        return ".jpg"
    if ext in (".jpg", ".png", ".webp", ".gif"):
        return ext
    return ".jpg"


def maybe_shrink(full_path):
    """Si la imagen pesa mas de 600 KB y hay Pillow, la reduce a 1000 px y calidad 82."""
    if os.path.getsize(full_path) <= BIG_BYTES:
        return
    try:
        from PIL import Image
    except ImportError:
        return
    ext = os.path.splitext(full_path)[1].lower()
    if ext not in (".jpg", ".png", ".webp"):
        return
    try:
        with Image.open(full_path) as src:
            im = src.copy()
        im.thumbnail((MAX_SIDE, MAX_SIDE), Image.LANCZOS)
        tmp = full_path + ".tmp"
        if ext == ".jpg":
            if im.mode not in ("RGB", "L"):
                im = im.convert("RGB")
            im.save(tmp, "JPEG", quality=JPEG_QUALITY, optimize=True)
        elif ext == ".webp":
            im.save(tmp, "WEBP", quality=JPEG_QUALITY, method=6)
        else:
            im.save(tmp, "PNG", optimize=True)
        os.replace(tmp, full_path)
    except Exception:  # noqa: BLE001
        # Si falla la reduccion, se deja la imagen original
        if os.path.exists(full_path + ".tmp"):
            os.remove(full_path + ".tmp")


def download_image(job):
    """job = (product_index, n, url, relative_path). Devuelve (job, ok, error)."""
    _, _, url, rel = job
    full = os.path.join(ROOT, rel.replace("/", os.sep))
    if os.path.exists(full) and os.path.getsize(full) > 0:
        return job, True, "ya existia"
    last = None
    for attempt in range(RETRIES + 1):
        try:
            data, _ = http_get(url)
            if not data:
                raise ValueError("respuesta vacia")
            tmp = full + ".part"
            with open(tmp, "wb") as f:
                f.write(data)
            os.replace(tmp, full)
            maybe_shrink(full)
            return job, True, None
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(1.5 * (attempt + 1))
    return job, False, str(last)


def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(ASSETS_DIR, exist_ok=True)

    # 1. Productos (paginado)
    first, headers = get_json(f"{BASE}/products?per_page=100&page=1")
    total_pages = int(headers.get("X-WP-TotalPages", "1"))
    total_items = int(headers.get("X-WP-Total", str(len(first))))
    raw = list(first)
    for page in range(2, total_pages + 1):
        chunk, _ = get_json(f"{BASE}/products?per_page=100&page={page}")
        raw.extend(chunk)
    log(f"Productos descargados: {len(raw)} (X-WP-Total={total_items}, paginas={total_pages})")
    if len(raw) != total_items:
        log("AVISO: el numero de productos no coincide con X-WP-Total")

    # Categorias (solo como referencia; el conteo se recalcula)
    cats_api, _ = get_json(f"{BASE}/products/categories?per_page=100")
    log(f"Categorias en API: {len(cats_api)}")

    products, excluded = [], []
    cat_info = {}  # slug -> {name, slug, count}

    for p in raw:
        name = clean_text(p.get("name"))
        cats_all = p.get("categories") or []
        real_cats = [c for c in cats_all if not is_offer_category(c)]
        on_sale_by_cat = len(real_cats) != len(cats_all)

        # Exclusion de motos / bicicletas
        reason = None
        for c in cats_all:
            if EXCL_CAT_RE.search(norm(c.get("name")) + " " + norm(c.get("slug"))):
                reason = f"categoria: {clean_category_name(c.get('name'))}"
                break
        if reason is None and EXCL_NAME_RE.search(norm(name)):
            reason = "nombre del producto"
        if reason:
            excluded.append({"id": p.get("id"), "name": name, "slug": p.get("slug"), "motivo": reason})
            continue

        prices = p.get("prices") or {}
        minor = prices.get("currency_minor_unit", 0)
        price = money(prices.get("price"), minor)
        regular = money(prices.get("regular_price") or prices.get("price"), minor)
        price_range = prices.get("price_range") or None
        price_max = money(price_range.get("max_amount"), minor) if price_range else None

        cat_names = []
        for c in real_cats:
            cn = clean_category_name(c.get("name"))
            if cn and cn not in cat_names:
                cat_names.append(cn)
            info = cat_info.setdefault(c.get("slug"), {"name": cn, "slug": c.get("slug"), "count": 0})
            info["count"] += 1
        cat_names = [c for c in cat_names if norm(c) not in ("sin categoria", "uncategorized")] or ["Otros"]
        category = cat_names[0]

        description = p.get("description") or ""
        specs = [strip_tags(li) for li in re.findall(r"<li[^>]*>(.*?)</li>", description, re.S | re.I)]
        specs = [s for s in specs if s]

        short = strip_tags(p.get("short_description"))
        if len(short) > SHORT_DESC_MAX:
            short = short[:SHORT_DESC_MAX].rsplit(" ", 1)[0].rstrip(" ,;:") + "..."

        options = []
        for a in p.get("attributes") or []:
            values = [clean_text(t.get("name")) for t in (a.get("terms") or []) if clean_text(t.get("name"))]
            options.append({"name": clean_text(a.get("name")), "values": values})

        srcs = [img.get("src") for img in (p.get("images") or []) if img.get("src")][:MAX_IMAGES]

        products.append({
            "id": p.get("id"),
            "name": name,
            "slug": p.get("slug"),
            "category": category,
            "categories": cat_names,
            "price": price,
            "regularPrice": regular,
            "onSale": on_sale_by_cat,  # solo la categoria ¡OFERTA! del proveedor (su on_sale viene activo en casi todo)
            "priceMax": price_max,
            "shortDescription": short,
            "specs": specs,
            "options": options,
            "images": [],
            "inStock": bool(p.get("is_in_stock")),
            "_type": p.get("type"),
            "_srcs": srcs,
        })

    log(f"Excluidos (motos/bicicletas): {len(excluded)}")
    log(f"Incluidos: {len(products)}")

    # 2. Imagenes
    jobs = []
    for idx, prod in enumerate(products):
        for n, url in enumerate(prod["_srcs"], start=1):
            rel = f"assets/products/{prod['slug']}-{n}{image_ext(url)}"
            jobs.append((idx, n, url, rel))
    log(f"Imagenes a descargar: {len(jobs)} (hasta {MAX_IMAGES} por producto, {WORKERS} en paralelo)")

    results = {}
    failed = []
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        futures = [ex.submit(download_image, j) for j in jobs]
        done = 0
        for fut in as_completed(futures):
            job, ok, err = fut.result()
            results[(job[0], job[1])] = (job, ok)
            if not ok:
                failed.append({"producto": products[job[0]]["slug"], "url": job[2], "error": err})
            done += 1
            if done % 100 == 0:
                log(f"  ... {done}/{len(jobs)}")

    ok_count = 0
    for idx, prod in enumerate(products):
        imgs = []
        for n in range(1, len(prod["_srcs"]) + 1):
            entry = results.get((idx, n))
            if entry and entry[1]:
                imgs.append(entry[0][3])
                ok_count += 1
        prod["images"] = imgs
        del prod["_srcs"]
        del prod["_type"]

    # 3. Categorias para salida (solo las que quedan con productos)
    categories = sorted(
        ({"name": v["name"], "slug": v["slug"], "count": v["count"]} for v in cat_info.values() if v["count"] > 0),
        key=lambda c: c["name"].lower(),
    )

    # 4. Escritura
    def write_json(path, obj):
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)
            f.write("\n")

    write_json(os.path.join(DATA_DIR, "products.json"), products)
    write_json(os.path.join(DATA_DIR, "categories.json"), categories)
    write_json(os.path.join(DATA_DIR, "excluded.json"), excluded)

    # 5. Resumen
    size = 0
    n_files = 0
    for dp, _, files in os.walk(ASSETS_DIR):
        for fn in files:
            n_files += 1
            size += os.path.getsize(os.path.join(dp, fn))
    no_img = sum(1 for p in products if not p["images"])

    log("")
    log("=== RESUMEN ===")
    log(f"Productos extraidos: {len(products)}  | excluidos: {len(excluded)}  | total API: {len(raw)}")
    log(f"Imagenes OK: {ok_count}  | fallidas: {len(failed)}  | archivos en assets/products: {n_files}")
    log(f"Tamano assets/products: {size / 1024 / 1024:.2f} MB")
    log(f"Productos sin imagen: {no_img}")
    log("Por categoria:")
    for c in categories:
        log(f"  {c['count']:4d}  {c['name']}")
    log("Excluidos:")
    for e in excluded:
        log(f"  - {e['name']}  ({e['motivo']})")
    if failed:
        log("Fallidas:")
        for f_ in failed:
            log(f"  - {f_['producto']}: {f_['url']} -> {f_['error']}")
    return 0


if __name__ == "__main__":
    code = main()
    if code == 0:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import build
        code = build.main()
    sys.exit(code)
