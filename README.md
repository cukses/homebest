# Home Best — Catálogo web

Catálogo estático (HTML/CSS/JS, sin dependencias). Los clientes arman el carrito y el pedido llega por WhatsApp al **323 280 8083**.

## Archivos clave
- `config.js` — número de WhatsApp, **margen de ganancia (%)** sobre el precio del proveedor y redondeo.
- `data/custom-products.js` — productos propios (iPhones). El proveedor no tiene iPhones; agrégalos aquí siguiendo el ejemplo. Las fotos van en `assets/custom/`.
- `data/videos.js` — la serie de videos "Vendiendo iPhones día a día" (`serie.html`). El último de la lista sale en la página principal. Para un día nuevo:
  ```
  ffmpeg -i "dia 5.mp4" -c:v libx264 -crf 25 -vf "scale='min(720,iw)':-2" -c:a aac -b:a 96k -movflags +faststart assets/videos/dia-5.mp4
  ffmpeg -ss 1.5 -i "dia 5.mp4" -frames:v 1 assets/videos/dia-5.webp
  ```
  y agrega `{ day: 5, ... }` al final de la lista.
- Modelos iPhone 12 → 18 Pro Max: al final de `data/custom-products.js` (fotos en `assets/custom/modelos/`).
- `data/products.js` — generado automáticamente desde el proveedor; no editar a mano.

> Después de cambiar `config.js` u otro archivo ya publicado, sube el número `?v=2` → `?v=3` en `index.html` para que los navegadores no muestren la versión vieja guardada.

## Actualizar el catálogo del proveedor
```
python scripts/scrape.py
```
Descarga productos e imágenes nuevas de catalogodtech.com (excluye motos y bicicletas), optimiza las imágenes a WebP y regenera `data/products.js`. Requiere Python 3 y Pillow (`pip install pillow`).

## Ver en local
```
python -m http.server 5173
```
y abrir http://localhost:5173

## Publicar
Sube la carpeta completa (puedes excluir `assets/products/`, que son los originales; la web usa `assets/web/`) a Netlify, Vercel, GitHub Pages o cualquier hosting estático.
