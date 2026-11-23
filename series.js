// Serie de videos: el último día en la portada (#serieHome) y la página serie.html (#seriePlayer).
(() => {
  "use strict";
  const S = window.SERIES;
  if (!S || !S.episodes || !S.episodes.length) return;
  const eps = S.episodes;
  const latest = eps[eps.length - 1];
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const videoTag = (ep, id) =>
    `<video ${id ? `id="${id}" ` : ""}src="${esc(ep.src)}" poster="${esc(ep.poster)}" controls playsinline preload="none"></video>`;

  // ---------- Portada ----------
  const home = $("#serieHome");
  if (home) {
    $("#serieHomeVideo").innerHTML = videoTag(latest) + `<span class="ep-live">Nuevo · ${esc(latest.title)}</span>`;
    $("#serieHomeTitle").textContent = S.title;
    $("#serieHomeIntro").textContent = S.intro;
    $("#serieHomeDays").innerHTML = eps.map((e) =>
      `<a class="day-chip${e === latest ? " is-new" : ""}" href="serie.html#dia-${e.day}">${esc(e.title)}</a>`).join("");
  }

  // ---------- Página de la serie ----------
  const player = $("#seriePlayer");
  if (!player) return;
  $("#serieTitle").textContent = S.title;
  $("#serieIntro").textContent = S.intro;

  const list = $("#serieList");
  list.innerHTML = eps.map((e) => `
    <button class="ep" data-day="${e.day}" aria-pressed="false">
      <span class="ep-thumb"><img loading="lazy" src="${esc(e.poster)}" alt=""><span class="ep-time">${esc(e.duration || "")}</span></span>
      <span class="ep-info">
        <span class="ep-day">${esc(e.title)}${e === latest ? ` <em>Nuevo</em>` : ""}</span>
        <span class="ep-sub">Episodio ${e.day} de ${eps.length}</span>
      </span>
    </button>`).join("");

  function show(day, play) {
    const ep = eps.find((e) => e.day === Number(day)) || latest;
    player.innerHTML = videoTag(ep, "serieVideo");
    $("#serieNow").textContent = `${ep.title} · Episodio ${ep.day} de ${eps.length}`;
    list.querySelectorAll(".ep").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.day) === ep.day)));
    const v = $("#serieVideo");
    // al terminar un día pasa al siguiente
    v.addEventListener("ended", () => {
      const next = eps[eps.indexOf(ep) + 1];
      if (next) { history.replaceState(null, "", `#dia-${next.day}`); show(next.day, true); }
    });
    if (play) v.play().catch(() => {});
  }

  list.addEventListener("click", (e) => {
    const b = e.target.closest(".ep");
    if (!b) return;
    history.replaceState(null, "", `#dia-${b.dataset.day}`);
    show(b.dataset.day, true);
    if (window.innerWidth < 860) player.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const fromHash = (location.hash.match(/^#dia-(\d+)$/) || [])[1];
  show(fromHash || latest.day, false);

  const wa = window.STORE_CONFIG && window.STORE_CONFIG.whatsapp;
  if (wa) $("#serieWa").href = `https://wa.me/${wa}?text=${encodeURIComponent(`Hola ${window.STORE_CONFIG.name} 👋, vi la serie de videos y quiero cotizar un iPhone.`)}`;
})();
