(() => {
  "use strict";

  const CFG = window.STORE_CONFIG;
  const PRODUCTS = [...(window.CUSTOM_PRODUCTS || []), ...(window.PRODUCTS || [])].filter((p) => p && p.name);
  const CART_KEY = "homebest-cart-v1";
  const ALL = "__all", SALE = "__sale";
  const PAGE = 24;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const money = (n) => "$" + Math.round(n).toLocaleString("es-CO");
  const norm = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const esc = (s) => (s || "").toString().replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const waLink = (text) => `https://wa.me/${CFG.whatsapp}${text ? "?text=" + encodeURIComponent(text) : ""}`;

  function sell(n) {
    if (!n) return 0;
    const m = Number(CFG.markupPercent) || 0;
    if (!m) return n;
    const r = Number(CFG.roundTo) || 1;
    return Math.ceil((n * (1 + m / 100)) / r) * r;
  }
  const priceOf = (p) => sell(p.price);
  const imgOf = (p) => (p.images && p.images[0]) || "";
  const inStock = (p) => p.inStock !== false;

  // ---------- Estado ----------
  const state = { cat: ALL, q: "", sort: "rel", shown: PAGE };
  let cart = load();

  function load() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
  }
  function save() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* modo privado */ }
  }

  // ---------- Categorías ordenadas ----------
  const featured = (CFG.featuredCategories || []).map(norm);
  const catMap = new Map();
  PRODUCTS.forEach((p) => {
    if (!p.category) return;
    if (!catMap.has(p.category)) catMap.set(p.category, []);
    catMap.get(p.category).push(p);
  });
  const CATS = [...catMap.entries()]
    .map(([name, items]) => ({ name, items, min: Math.min(...items.map(priceOf).filter(Boolean)) }))
    .sort((a, b) => {
      const fa = featured.indexOf(norm(a.name)), fb = featured.indexOf(norm(b.name));
      if (fa !== -1 || fb !== -1) return (fa === -1 ? 99 : fa) - (fb === -1 ? 99 : fb);
      return b.items.length - a.items.length;
    });
  const coverOf = (c) => (c.items.find((p) => inStock(p) && imgOf(p)) || c.items[0]);

  // ---------- Secciones de portada ----------
  function renderAnnouncements() {
    const list = CFG.announcements || [];
    const el = $("#announceText");
    if (!list.length) { $("#announce").hidden = true; return; }
    let i = 0;
    el.textContent = list[0];
    if (list.length < 2) return;
    setInterval(() => {
      el.classList.add("out");
      setTimeout(() => { i = (i + 1) % list.length; el.textContent = list[i]; el.classList.remove("out"); }, 350);
    }, 4500);
  }

  function renderHeroShelf() {
    // Primero las fotos reales (iPhones), luego se completa con portadas de categorías
    const real = PRODUCTS.filter((p) => p.cover && imgOf(p)).slice(0, 4);
    const fill = CATS.map(coverOf).filter((p) => p && !real.includes(p));
    const picks = [...real, ...fill].slice(0, 5);
    // el producto central más llamativo va en medio
    if (picks.length >= 3) picks.splice(2, 0, picks.shift());
    $("#heroShelf").innerHTML = picks.map((p) => `<figure><img src="${esc(imgOf(p))}" alt=""></figure>`).join("");
  }

  function renderCatRow() {
    $("#catRow").innerHTML = CATS.map((c) => `
      <button class="cat" data-cat-set="${esc(c.name)}">
        <span class="cat-img"><img loading="lazy" src="${esc(imgOf(coverOf(c)))}" alt=""></span>
        <span class="cat-name">${esc(c.name)}</span>
        ${isFinite(c.min) ? `<span class="cat-from">Desde ${money(c.min)}</span>` : ""}
      </button>`).join("");
  }

  function renderPromoIphone() {
    const phones = PRODUCTS.filter((p) => norm(p.category) === "iphone" && p.panelImage).slice(0, 3);
    if (phones.length < 2) return; // se queda la ilustración
    if (phones.length === 3) phones.splice(1, 0, phones.shift()); // el primero va al centro
    $("#promoPhone").innerHTML = phones.map((p) => `<img src="${esc(p.panelImage)}" alt="${esc(p.name)}">`).join("");
    $("#promoPhone").classList.add("has-photos");
  }

  function renderPromoSale() {
    const sale = PRODUCTS.filter((p) => p.onSale && inStock(p) && imgOf(p)).slice(0, 3);
    if (!sale.length) { $("#promoSale").hidden = true; return; }
    $("#promoSaleImgs").innerHTML = sale.map((p) => `<img loading="lazy" src="${esc(imgOf(p))}" alt="">`).join("");
  }

  function renderReasons() {
    $("#reasons").innerHTML = (CFG.reasons || []).map((r) => `
      <article class="reason">
        <span class="tag" style="color:${esc(r.color || "#0071e3")}">${esc(r.tag)}</span>
        <h3>${esc(r.title)}</h3>
        <p>${esc(r.text)}</p>
      </article>`).join("");
  }

  function renderChips() {
    const saleCount = PRODUCTS.filter((p) => p.onSale).length;
    const chips = [`<button class="chip" role="tab" data-cat="${ALL}">Todo <small>${PRODUCTS.length}</small></button>`];
    if (saleCount) chips.push(`<button class="chip sale-chip" role="tab" data-cat="${SALE}">Ofertas <small>${saleCount}</small></button>`);
    CATS.forEach((c) => chips.push(`<button class="chip" role="tab" data-cat="${esc(c.name)}">${esc(c.name)} <small>${c.items.length}</small></button>`));
    $("#chips").innerHTML = chips.join("");
  }

  // ---------- Listado ----------
  function filtered() {
    const q = norm(state.q).trim();
    let list = PRODUCTS.filter((p) => {
      if (state.cat === SALE && !p.onSale) return false;
      if (state.cat !== ALL && state.cat !== SALE && p.category !== state.cat) return false;
      if (q) {
        const hay = norm([p.name, p.category, ...(p.categories || []), p.shortDescription].join(" "));
        return q.split(/\s+/).every((w) => hay.includes(w));
      }
      return true;
    });
    const by = {
      asc: (a, b) => (priceOf(a) || Infinity) - (priceOf(b) || Infinity),
      desc: (a, b) => priceOf(b) - priceOf(a),
      az: (a, b) => a.name.localeCompare(b.name, "es"),
    }[state.sort];
    return [...list].sort(by || ((a, b) => inStock(b) - inStock(a)));
  }

  function priceHTML(p) {
    const now = priceOf(p);
    if (!now) return `<div class="price"><strong>Precio a consultar</strong></div>`;
    const from = p.priceMax && p.priceMax > p.price ? "Desde " : "";
    const old = p.onSale && p.regularPrice > p.price ? `<s>${money(sell(p.regularPrice))}</s>` : "";
    return `<div class="price"><strong>${from}${money(now)}</strong><span class="cop">COP</span>${old}</div>`;
  }

  function tagsHTML(p) {
    const t = [];
    if (!inStock(p)) t.push(`<span class="t-out">Agotado</span>`);
    else if (p.onSale) t.push(`<span class="t-hot">Oferta</span>`);
    if (p.badge) t.push(`<span class="t-new">${esc(p.badge)}</span>`);
    t.push(`<span class="t-cat">${esc(p.category || "")}</span>`);
    return `<div class="card-tags">${t.join("")}</div>`;
  }

  function cardHTML(p) {
    const out = !inStock(p);
    const needsOpts = p.options && p.options.length;
    return `<article class="card">
      <button class="card-img${p.cover ? " is-photo" : ""}" data-open="${esc(p.id)}" aria-label="Ver ${esc(p.name)}">
        <img loading="lazy" src="${esc(imgOf(p))}" alt="${esc(p.name)}" onerror="this.style.opacity=0">
      </button>
      ${tagsHTML(p)}
      <button class="card-title" data-open="${esc(p.id)}">${esc(p.name)}</button>
      ${priceHTML(p)}
      <button class="add-btn" data-${needsOpts ? "open" : "add"}="${esc(p.id)}" ${out ? "disabled" : ""}>
        ${out ? "Agotado" : needsOpts ? "Elegir" : "Agregar"}
      </button>
    </article>`;
  }

  function render() {
    const list = filtered();
    $("#grid").innerHTML = list.slice(0, state.shown).map(cardHTML).join("");
    $("#empty").hidden = list.length > 0;
    $("#moreWrap").hidden = list.length <= state.shown;
    $("#resultCount").textContent = `${list.length} producto${list.length === 1 ? "" : "s"}`;
    $$(".chip").forEach((c) => c.setAttribute("aria-selected", String(c.dataset.cat === state.cat)));
    const active = $(`.chip[aria-selected="true"]`);
    const row = $("#chips");
    if (active) row.scrollTo({ left: active.offsetLeft - row.clientWidth / 2 + active.offsetWidth / 2, behavior: "smooth" });
  }

  function setCategory(cat, scroll = true) {
    state.cat = cat; state.q = ""; state.shown = PAGE;
    $("#search").value = "";
    render();
    if (scroll) $("#catalogo").scrollIntoView({ behavior: "smooth" });
  }

  // ---------- Detalle ----------
  const modal = $("#productModal");
  let current = null;
  const PERKS = `
    <div class="perks-mini">
      <div><svg viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17" cy="17.5" r="1.6"/></svg>Coordinamos el envío a tu ciudad.</div>
      <div><svg viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/></svg>Confirmas disponibilidad y pago por WhatsApp.</div>
    </div>`;

  function openProduct(id) {
    const p = PRODUCTS.find((x) => String(x.id) === String(id));
    if (!p) return;
    current = { p, qty: 1, sel: {} };
    const imgs = (p.images || []).length ? p.images : [""];
    const opts = (p.options || []).map((o, i) => `
      <div class="opt" data-opt="${i}">
        <label>${esc(o.name)}</label>
        <div class="opt-values">${o.values.map((v) => `<button type="button" data-val="${esc(v)}" aria-pressed="false">${esc(v)}</button>`).join("")}</div>
      </div>`).join("");
    const specs = (p.specs || []).length
      ? `<div class="specs-box"><h4>Especificaciones</h4><ul class="specs">${p.specs.slice(0, 12).map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>` : "";
    const out = !inStock(p);
    $("#modalBody").innerHTML = `
      <div class="gallery">
        <div class="gallery-main"><img id="mainImg" src="${esc(imgs[0])}" alt="${esc(p.name)}"></div>
        ${imgs.length > 1 ? `<div class="thumbs">${imgs.map((src, i) => `<button type="button" data-thumb="${esc(src)}" aria-current="${i === 0}"><img src="${esc(src)}" alt=""></button>`).join("")}</div>` : ""}
      </div>
      <div class="detail">
        ${tagsHTML(p)}
        <h2>${esc(p.name)}</h2>
        ${priceHTML(p)}
        ${p.shortDescription ? `<p>${esc(p.shortDescription)}</p>` : ""}
        ${opts}
        <p class="warn" id="optWarn" hidden>Elige ${esc((p.options || []).map((o) => o.name.toLowerCase()).join(" y "))} antes de agregar.</p>
        <div class="buy-row">
          <div class="qty"><button type="button" data-q="-1" aria-label="Menos">−</button><span id="mQty">1</span><button type="button" data-q="1" aria-label="Más">+</button></div>
          <button class="btn btn-primary" id="mAdd" ${out ? "disabled" : ""}>${out ? "Agotado" : "Agregar a la bolsa"}</button>
        </div>
        <a class="ask-link" target="_blank" rel="noopener" href="${waLink(`Hola ${CFG.name}, me interesa: ${p.name}. ¿Está disponible?`)}">¿Tienes preguntas? Escríbenos por WhatsApp ›</a>
        ${PERKS}
        ${specs}
      </div>`;
    if (!modal.open) modal.showModal();
    $(".detail").scrollTop = 0;
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-close]")) return modal.close();
    const t = e.target.closest("[data-thumb]");
    if (t) {
      $("#mainImg").src = t.dataset.thumb;
      $$("[data-thumb]", modal).forEach((b) => b.setAttribute("aria-current", String(b === t)));
      return;
    }
    const v = e.target.closest("[data-val]");
    if (v) {
      const box = v.closest("[data-opt]");
      const o = current.p.options[box.dataset.opt];
      current.sel[o.name] = v.dataset.val;
      $$("[data-val]", box).forEach((b) => b.setAttribute("aria-pressed", String(b === v)));
      $("#optWarn").hidden = true;
      return;
    }
    const q = e.target.closest("[data-q]");
    if (q) {
      current.qty = Math.max(1, Math.min(99, current.qty + Number(q.dataset.q)));
      $("#mQty").textContent = current.qty;
      return;
    }
    if (e.target.closest("#mAdd")) {
      const missing = (current.p.options || []).some((o) => !current.sel[o.name]);
      if (missing) { $("#optWarn").hidden = false; return; }
      addToCart(current.p, current.qty, current.sel);
      modal.close();
    }
  });

  // ---------- Carrito ----------
  const lineKey = (id, sel) => id + "|" + Object.entries(sel || {}).map(([k, v]) => `${k}:${v}`).join(",");

  function addToCart(p, qty = 1, sel = {}) {
    const key = lineKey(p.id, sel);
    const line = cart.find((l) => l.key === key);
    if (line) line.qty += qty;
    else cart.push({ key, id: p.id, qty, sel });
    save();
    renderCart();
    toast(`Agregado a tu bolsa: ${p.name}`);
    const b = $("#cartCount");
    b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop");
  }

  function cartLines() {
    return cart.map((l) => ({ ...l, p: PRODUCTS.find((x) => x.id === l.id) })).filter((l) => l.p);
  }

  function renderCart() {
    const lines = cartLines();
    const count = lines.reduce((s, l) => s + l.qty, 0);
    const total = lines.reduce((s, l) => s + l.qty * priceOf(l.p), 0);
    const badge = $("#cartCount");
    badge.textContent = count;
    badge.hidden = !count;
    const toQuote = lines.filter((l) => !priceOf(l.p)).length;
    $("#cartTotal").textContent = money(total) + (toQuote ? " +" : "");
    $("#quoteNote").hidden = !toQuote;
    $("#quoteNote").textContent = `+ ${toQuote} producto${toQuote === 1 ? "" : "s"} con precio a consultar: te lo confirmamos por WhatsApp.`;
    $("#sendWa").disabled = !count;
    $("#cartItems").innerHTML = lines.length ? lines.map((l) => `
      <div class="line">
        <img src="${esc(imgOf(l.p))}" alt="">
        <div>
          <div class="line-name">${esc(l.p.name)}</div>
          ${Object.keys(l.sel).length ? `<div class="line-opts">${esc(Object.entries(l.sel).map(([k, v]) => `${k}: ${v}`).join(" · "))}</div>` : ""}
          <div class="line-price">${priceOf(l.p) ? money(priceOf(l.p) * l.qty) : "Precio a consultar"}</div>
        </div>
        <div class="line-side">
          <div class="qty"><button type="button" data-lq="-1" data-key="${esc(l.key)}" aria-label="Menos">−</button><span>${l.qty}</span><button type="button" data-lq="1" data-key="${esc(l.key)}" aria-label="Más">+</button></div>
          <button class="remove" data-rm="${esc(l.key)}">Eliminar</button>
        </div>
      </div>`).join("") : `<div class="cart-empty"><strong>Tu bolsa está vacía.</strong>Agrega productos del catálogo para armar tu pedido.</div>`;
  }

  $("#cartItems").addEventListener("click", (e) => {
    const q = e.target.closest("[data-lq]");
    const rm = e.target.closest("[data-rm]");
    if (q) {
      const l = cart.find((x) => x.key === q.dataset.key);
      if (l) { l.qty += Number(q.dataset.lq); if (l.qty < 1) cart = cart.filter((x) => x !== l); }
    } else if (rm) {
      cart = cart.filter((x) => x.key !== rm.dataset.rm);
    } else return;
    save(); renderCart();
  });

  const drawer = $("#drawer"), scrim = $("#scrim");
  function setCart(open) {
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    scrim.hidden = !open;
    document.body.style.overflow = open ? "hidden" : "";
  }
  $("#openCart").addEventListener("click", () => setCart(true));
  $("#closeCart").addEventListener("click", () => setCart(false));
  scrim.addEventListener("click", () => setCart(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setCart(false); });

  $("#checkout").addEventListener("submit", (e) => {
    e.preventDefault();
    const lines = cartLines();
    if (!lines.length) return;
    const f = new FormData(e.target);
    const total = lines.reduce((s, l) => s + l.qty * priceOf(l.p), 0);
    const rows = lines.map((l, i) => {
      const opts = Object.entries(l.sel).map(([k, v]) => `${k}: ${v}`).join(", ");
      const unit = priceOf(l.p);
      return `${i + 1}. ${l.qty} x ${l.p.name}${opts ? ` (${opts})` : ""}\n    ${unit ? `${money(unit)} c/u = ${money(unit * l.qty)}` : "Precio a consultar"}`;
    });
    const info = [
      ["Nombre", f.get("nombre")], ["Ciudad", f.get("ciudad")],
      ["Dirección", f.get("direccion")], ["Nota", f.get("nota")],
    ].filter(([, v]) => v && v.trim()).map(([k, v]) => `${k}: ${v.trim()}`);
    const msg = [
      `Hola ${CFG.name} 👋, quiero hacer este pedido:`, "",
      ...rows, "",
      `*Total estimado: ${money(total)}*`,
      ...(lines.some((l) => !priceOf(l.p)) ? ["(+ productos con precio a consultar)"] : []), "",
      ...info,
    ].join("\n");
    window.open(waLink(msg), "_blank", "noopener");
  });

  // ---------- Toast ----------
  let tt;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(tt); tt = setTimeout(() => (t.hidden = true), 2000);
  }

  // ---------- Eventos globales ----------
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) { setCategory(chip.dataset.cat, false); return; }
    const set = e.target.closest("[data-cat-set]");
    if (set) { setCategory(set.dataset.catSet); return; }
    const sc = e.target.closest("[data-scroll]");
    if (sc) { const row = $("#catRow"); row.scrollBy({ left: Number(sc.dataset.scroll) * row.clientWidth * .8, behavior: "smooth" }); return; }
    const op = e.target.closest("[data-open]");
    if (op && !modal.contains(op)) { openProduct(op.dataset.open); return; }
    const add = e.target.closest("[data-add]");
    if (add) {
      const p = PRODUCTS.find((x) => String(x.id) === add.dataset.add);
      if (p) {
        addToCart(p);
        add.classList.add("added"); add.textContent = "✓ Agregado";
        setTimeout(() => { add.classList.remove("added"); add.textContent = "Agregar"; }, 1200);
      }
      return;
    }
    const jump = e.target.closest("[data-cat-jump]");
    if (jump) {
      const want = norm(jump.dataset.catJump);
      const cat = CATS.find((c) => norm(c.name).includes(want));
      if (cat) setCategory(cat.name);
      else window.open(waLink(`Hola ${CFG.name} 👋, quiero cotizar un iPhone. ¿Qué modelos tienen disponibles?`), "_blank", "noopener");
    }
  });

  $("#moreBtn").addEventListener("click", () => { state.shown += PAGE; render(); });

  let st;
  $("#search").addEventListener("input", (e) => {
    clearTimeout(st);
    st = setTimeout(() => {
      state.q = e.target.value;
      state.shown = PAGE;
      if (state.q) {
        state.cat = ALL;
        const top = $("#catalogo").getBoundingClientRect().top;
        if (top > 200) $("#catalogo").scrollIntoView({ behavior: "smooth" });
      }
      render();
    }, 150);
  });
  $("#sort").addEventListener("change", (e) => { state.sort = e.target.value; state.shown = PAGE; render(); });

  // ---------- Inicio ----------
  const hello = `Hola ${CFG.name} 👋, quiero información sobre sus productos.`;
  $("#waFloat").href = waLink(hello);
  $("#footerWa").href = waLink(hello);
  $("#year").textContent = new Date().getFullYear();
  renderAnnouncements();
  renderHeroShelf();
  renderCatRow();
  renderPromoIphone();
  renderPromoSale();
  renderReasons();
  renderChips();
  render();
  renderCart();
  // index.html#iphones (desde la página de la serie) abre el catálogo filtrado en iPhone
  if (location.hash === "#iphones") {
    const cat = CATS.find((c) => norm(c.name) === "iphone");
    if (cat) setTimeout(() => setCategory(cat.name), 60);
  }
})();
