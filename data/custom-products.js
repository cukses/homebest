// Productos propios de Home Best (iPhones) que NO vienen del proveedor.
// Este archivo no lo toca scripts/scrape.py, así que lo que pongas aquí se conserva.
// Las fotos van en assets/custom/.
//
// Campos:
//   price: precio en pesos sin puntos (0 = "Precio a consultar" por WhatsApp)
//   options: opciones que el cliente elige (ej. capacidad). Déjalo [] si no aplica.
//   cover: true = la foto llena toda la tarjeta (ideal para fotos reales)
//   badge: etiqueta corta que aparece arriba del nombre
//   panelImage: foto recortada al teléfono para el panel negro "iPhone" de la portada
window.CUSTOM_PRODUCTS = [
  {
    id: "iphone-14-pro-dorado",
    name: "iPhone 14 Pro Dorado",
    category: "iPhone",
    price: 0,
    cover: true,
    shortDescription: "Equipo disponible en tienda, color dorado, batería al 100%. Escríbenos para conocer capacidad, estado y precio.",
    specs: ["Pantalla Super Retina XDR de 6.1\" con Dynamic Island", "Chip A16 Bionic", "Cámara principal de 48 MP", "Salud de batería: 100%"],
    options: [],
    images: ["assets/custom/iphone-14-pro-dorado.webp"],
    panelImage: "assets/custom/iphone-14-pro-dorado-recorte.webp", // foto recortada para el panel negro de la portada
    inStock: true,
  },
  {
    id: "iphone-16-blanco",
    name: "iPhone 16 Blanco",
    category: "iPhone",
    price: 0,
    cover: true,
    shortDescription: "Equipo disponible en tienda, color blanco. Escríbenos para conocer capacidad, estado y precio.",
    specs: ["Pantalla Super Retina XDR de 6.1\"", "Chip A18", "Cámara Fusion de 48 MP", "Botón de Acción y Control de Cámara"],
    options: [],
    images: ["assets/custom/iphone-16-blanco.webp"],
    panelImage: "assets/custom/iphone-16-blanco-recorte.webp", // foto recortada para el panel negro de la portada
    inStock: true,
  },
  {
    id: "iphone-13-pro-azul-sierra",
    name: "iPhone 13 Pro Azul Sierra",
    category: "iPhone",
    price: 0,
    cover: true,
    shortDescription: "Equipo disponible en tienda, color azul sierra. Escríbenos para conocer capacidad, estado y precio.",
    specs: ["Pantalla Super Retina XDR de 6.1\" con ProMotion 120 Hz", "Chip A15 Bionic", "Triple cámara de 12 MP"],
    options: [],
    images: ["assets/custom/iphone-13-pro-azul-sierra.webp"],
    panelImage: "assets/custom/iphone-13-pro-azul-sierra-recorte.webp", // foto recortada para el panel negro de la portada
    inStock: true,
  },
  {
    id: "iphone-14-morado",
    name: "iPhone 14 Morado",
    category: "iPhone",
    price: 0,
    cover: true,
    shortDescription: "Equipo disponible en tienda, color morado. Escríbenos para conocer capacidad, estado y precio.",
    specs: ["Pantalla Super Retina XDR de 6.1\"", "Chip A15 Bionic", "Doble cámara de 12 MP"],
    options: [],
    images: ["assets/custom/iphone-14-morado.webp"],
    panelImage: "assets/custom/iphone-14-morado-recorte.webp", // foto recortada para el panel negro de la portada
    inStock: true,
  },
];

// ---------------------------------------------------------------------------
// Modelos que manejamos: del iPhone 12 al iPhone 18 Pro Max.
// Fotos de referencia en assets/custom/modelos/. Precio 0 = se cotiza por WhatsApp.
// Para quitar un modelo, borra su línea; para ponerle precio, cambia el 0.
// ---------------------------------------------------------------------------
(() => {
  const m = (id, name, n, specs, caps, price = 0) => ({
    id, name, category: "iPhone", price, badge: "Nuevo y seminuevo",
    shortDescription: `${name} original. Escríbenos para conocer colores, estado (nuevo o seminuevo), salud de batería y precio del día.`,
    specs,
    options: [{ name: "Capacidad", values: caps }],
    images: Array.from({ length: n }, (_, i) => `assets/custom/modelos/${id}-${i + 1}.webp`),
    inStock: true,
  });
  const C = {
    a: ["64 GB", "128 GB", "256 GB"],
    b: ["128 GB", "256 GB", "512 GB"],
    c: ["128 GB", "256 GB", "512 GB", "1 TB"],
    d: ["256 GB", "512 GB", "1 TB"],
    e: ["256 GB", "512 GB"],
    f: ["256 GB", "512 GB", "1 TB", "2 TB"],
  };
  window.CUSTOM_PRODUCTS.push(
    m("iphone-18-pro-max", "iPhone 18 Pro Max", 4, ["Pantalla Super Retina XDR de 6.9\" con ProMotion", "Chip A20 Pro", "Cámara principal de 48 MP con apertura variable", "Colores: negro, plata, azul glaciar y burgundy"], C.f),
    m("iphone-18-pro", "iPhone 18 Pro", 3, ["Pantalla Super Retina XDR de 6.3\" con ProMotion", "Chip A20 Pro", "Cámara principal de 48 MP con apertura variable", "Colores: negro, plata, azul glaciar y burgundy"], C.d),
    m("iphone-17-pro-max", "iPhone 17 Pro Max", 3, ["Pantalla Super Retina XDR de 6.9\" con ProMotion", "Chip A19 Pro", "Triple cámara de 48 MP", "Cuerpo de aluminio con cámara de vapor"], C.f),
    m("iphone-17", "iPhone 17", 3, ["Pantalla Super Retina XDR de 6.3\" con ProMotion 120 Hz", "Chip A19", "Cámara Fusion de 48 MP", "Cámara frontal Center Stage de 18 MP"], C.e),
    m("iphone-16-pro-max", "iPhone 16 Pro Max", 3, ["Pantalla Super Retina XDR de 6.9\" con ProMotion", "Chip A18 Pro", "Triple cámara con Fusion de 48 MP y zoom 5x", "Titanio y Control de Cámara"], C.d),
    m("iphone-16", "iPhone 16", 3, ["Pantalla Super Retina XDR de 6.1\"", "Chip A18", "Cámara Fusion de 48 MP", "Botón de Acción y Control de Cámara"], C.b),
    m("iphone-15-pro-max", "iPhone 15 Pro Max", 3, ["Pantalla Super Retina XDR de 6.7\" con ProMotion", "Chip A17 Pro", "Triple cámara de 48 MP con zoom 5x", "Diseño en titanio, puerto USB-C"], C.d),
    m("iphone-15", "iPhone 15", 3, ["Pantalla Super Retina XDR de 6.1\" con Dynamic Island", "Chip A16 Bionic", "Cámara principal de 48 MP", "Puerto USB-C"], C.b),
    m("iphone-14-pro-max", "iPhone 14 Pro Max", 2, ["Pantalla Super Retina XDR de 6.7\" con Dynamic Island", "Chip A16 Bionic", "Cámara principal de 48 MP", "Pantalla siempre activa"], C.c),
    m("iphone-14", "iPhone 14", 2, ["Pantalla Super Retina XDR de 6.1\"", "Chip A15 Bionic", "Doble cámara de 12 MP", "Detección de choques"], C.b),
    m("iphone-13-pro-max", "iPhone 13 Pro Max", 3, ["Pantalla Super Retina XDR de 6.7\" con ProMotion 120 Hz", "Chip A15 Bionic", "Triple cámara de 12 MP", "Gran batería de todo el día"], C.c),
    m("iphone-13", "iPhone 13", 3, ["Pantalla Super Retina XDR de 6.1\"", "Chip A15 Bionic", "Doble cámara de 12 MP", "Modo Cine"], C.b),
    m("iphone-12-pro-max", "iPhone 12 Pro Max", 3, ["Pantalla Super Retina XDR de 6.7\"", "Chip A14 Bionic", "Triple cámara de 12 MP con LiDAR", "5G y MagSafe"], C.b),
    m("iphone-12", "iPhone 12", 3, ["Pantalla Super Retina XDR de 6.1\"", "Chip A14 Bionic", "Doble cámara de 12 MP", "5G y MagSafe"], C.a),
  );
})();
