"""Genera los archivos que usa la web a partir de data/products.json.

- Optimiza cada imagen a WebP (máx. 900 px, calidad 80) en assets/web/.
- Escribe data/products.js (window.PRODUCTS = [...]) para que la página
  funcione incluso abriendo index.html directamente, sin servidor.

Uso:  python scripts/build.py
(scrape.py lo ejecuta automáticamente al terminar.)
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_JSON = os.path.join(ROOT, "data", "products.json")
OUT_JS = os.path.join(ROOT, "data", "products.js")
WEB_DIR = os.path.join(ROOT, "assets", "web")
MAX_SIDE, QUALITY = 900, 80


def optimize(rel):
    try:
        from PIL import Image
    except ImportError:
        return rel  # sin Pillow se usa la imagen original
    src = os.path.join(ROOT, rel)
    name = os.path.splitext(os.path.basename(rel))[0] + ".webp"
    dst = os.path.join(WEB_DIR, name)
    out_rel = "assets/web/" + name
    if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
        return out_rel
    try:
        with Image.open(src) as im:
            im = im.convert("RGBA") if im.mode in ("P", "LA", "RGBA") else im.convert("RGB")
            im.thumbnail((MAX_SIDE, MAX_SIDE))
            im.save(dst, "WEBP", quality=QUALITY, method=5)
        return out_rel
    except Exception as e:  # imagen corrupta: se deja la original
        print(f"  ! no se pudo optimizar {rel}: {e}")
        return rel


def main():
    os.makedirs(WEB_DIR, exist_ok=True)
    products = json.load(open(SRC_JSON, encoding="utf-8"))
    for p in products:
        p["images"] = [optimize(r) for r in p.get("images", [])]
    payload = json.dumps(products, ensure_ascii=False, separators=(",", ":"))
    with open(OUT_JS, "w", encoding="utf-8", newline="\n") as f:
        f.write("// Archivo generado por scripts/build.py — no editar a mano.\n")
        f.write("window.PRODUCTS = " + payload + ";\n")
    size = sum(os.path.getsize(os.path.join(WEB_DIR, x)) for x in os.listdir(WEB_DIR))
    print(f"products.js: {len(products)} productos · assets/web: {len(os.listdir(WEB_DIR))} imágenes, {size/1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
