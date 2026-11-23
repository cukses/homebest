// La serie de videos "Vendiendo iPhones día a día".
// Para agregar un día nuevo: comprime el video a assets/videos/dia-N.mp4,
// saca una portada assets/videos/dia-N.webp y agrega una línea al final de la lista.
// El ÚLTIMO de la lista es el que sale en la página principal.
window.SERIES = {
  title: "Vendiendo iPhones, día a día.",
  intro: "Cada día un video nuevo: así vendemos iPhones de verdad. Sigue la serie y aparta el tuyo por WhatsApp.",
  episodes: [
    { day: 1, title: "Día 1", src: "assets/videos/dia-1.mp4", poster: "assets/videos/dia-1.webp", duration: "1:14" },
    { day: 2, title: "Día 2", src: "assets/videos/dia-2.mp4", poster: "assets/videos/dia-2.webp", duration: "1:09" },
    { day: 3, title: "Día 3", src: "assets/videos/dia-3.mp4", poster: "assets/videos/dia-3.webp", duration: "0:41" },
    { day: 4, title: "Día 4", src: "assets/videos/dia-4.mp4", poster: "assets/videos/dia-4.webp", duration: "0:45" },
  ],
};
