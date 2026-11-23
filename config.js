// Configuración de la tienda Home Best — edita estos valores sin tocar el resto del código.
window.STORE_CONFIG = {
  name: "Home Best",
  // Número de WhatsApp con indicativo de país (57 = Colombia), sin + ni espacios.
  whatsapp: "573232808083",
  // Margen de ganancia sobre el precio del proveedor, en porcentaje (0 = mismo precio).
  markupPercent: 100,
  // Redondeo del precio final hacia arriba (1000 = al millar más cercano).
  roundTo: 1000,
  // Categorías que aparecen primero (por nombre, sin importar mayúsculas).
  featuredCategories: ["iPhone", "Smart Watch", "Audífonos/Diademas", "Accesorios Celular", "Parlanteria", "Hogar"],

  // Mensajes que rotan en la barra superior.
  announcements: [
    "Haz tu pedido en minutos y te atendemos por WhatsApp.",
    "Tenemos iPhone desde el 12 hasta el 18 Pro Max, nuevos y seminuevos.",
    "Nuevo episodio de la serie: vendiendo iPhones día a día.",
    "Envíos a toda Colombia.",
  ],

  // Tarjetas de "Aún más razones para comprar con nosotros".
  // Ajusta el texto a lo que la tienda realmente ofrece.
  reasons: [
    { tag: "Atención personal", color: "#0071e3", title: "Te asesoramos por WhatsApp.", text: "Resolvemos tus dudas antes de comprar, sin bots." },
    { tag: "Envíos", color: "#bf4800", title: "Llegamos a toda Colombia.", text: "Coordinamos la entrega a tu ciudad o barrio." },
    { tag: "Garantía", color: "#1d8a3e", title: "Productos con respaldo.", text: "Originales y con garantía en iPhones y tecnología." },
    { tag: "Sin complicaciones", color: "#8e44ad", title: "Pides fácil, pagas fácil.", text: "Arma tu carrito y confirmas el pago directo con nosotros." },
  ],
};
