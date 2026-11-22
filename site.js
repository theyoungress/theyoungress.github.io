// Home page: live versions from the store catalogue and the newest Hub installers.
// Refresh versions without letting a pending catalog change the approved prices.
YoungRessStore.catalog().then((rows) => {
  for (const id of ["trinity", "ironglass", "air", "vantavox", "eq5", "photic", "split", "santa", "zion", "sope", "hadal", "tapeorbit", "abyss", "undertow", "lure", "tube50", "trench", "jermy", "sounding", "wavy", "monday"]) {
    const product = rows.find((row) => row.id === id && row.published === true);
    if (product && typeof product.version === "string") {
      document.querySelectorAll(`[data-version="${id}"]`).forEach((el) => (el.textContent = product.version));
    }
  }
}).catch(() => {});

// Hub installers: the newest release, the right one for this computer first.
const isMac = /Mac/i.test(navigator.platform || navigator.userAgent);
const setDownloads = (win, mac, version) => {
  document.querySelectorAll('[data-dl="win"]').forEach((a) => (a.href = win));
  document.querySelectorAll('[data-dl="mac"]').forEach((a) => (a.href = mac));
  document.querySelectorAll('[data-dl="auto"]').forEach((a) => (a.href = isMac ? mac : win));
  if (version) document.getElementById("hub-meta").textContent = `Version ${version}. Windows 10 or 11 (64-bit), or macOS on Apple silicon or Intel.`;
};
setDownloads(document.querySelector('[data-dl="win"]').href, document.querySelector('[data-dl="mac"]').href);
fetch("https://api.github.com/repos/theyoungress/youngress-hub-releases/releases/latest")
  .then((r) => (r.ok ? r.json() : null))
  .then((rel) => {
    const win = rel?.assets?.find((a) => /Setup.*\.exe$/.test(a.name)), mac = rel?.assets?.find((a) => /Mac\.dmg$/.test(a.name));
    if (win && mac) setDownloads(win.browser_download_url, mac.browser_download_url, rel.tag_name.replace(/^v/, ""));
  })
  .catch(() => {});

// The catalogue's toolbar: search, filters, two quick switches and sorting.
const toolbar = document.getElementById("toolbar");
const grid = document.querySelector(".cards");
const cards = [...grid.children].map((li, i) => {
  const price = li.querySelector(".card-price").textContent.trim();
  return {
    li, i,
    text: li.textContent.toLowerCase().replace(/\s+/g, " "),
    name: li.querySelector(".card-name").textContent.trim(),
    cats: li.dataset.cat.split(" "),
    price: /^\$\d/.test(price) ? parseFloat(price.slice(1)) : 0,
    mac: /Mac/.test(li.querySelector(".os").textContent),
    isNew: !!li.querySelector(".badge.new"),
  };
});
const checked = (name) => [...toolbar.querySelectorAll(`input[name="${name}"]:checked`)].map((c) => c.value);
const sorts = {
  featured: (a, b) => a.i - b.i,
  new: (a, b) => b.isNew - a.isNew || a.i - b.i,
  "price-asc": (a, b) => a.price - b.price || a.i - b.i,
  "price-desc": (a, b) => b.price - a.price || a.i - b.i,
  name: (a, b) => a.name.localeCompare(b.name),
};
function applyToolbar() {
  const words = document.getElementById("q").value.toLowerCase().split(/\s+/).filter(Boolean);
  const cats = checked("cat"), prices = checked("price"), onlyNew = checked("new").length > 0;
  const free = document.getElementById("t-free").checked, mac = document.getElementById("t-mac").checked;
  const band = (c) => (c.price === 0 ? "free" : c.price <= 30 ? "low" : "high");
  let shown = 0;
  for (const c of cards) {
    const ok = words.every((w) => c.text.includes(w)) && (!cats.length || cats.some((k) => c.cats.includes(k)))
      && (!prices.length || prices.includes(band(c))) && (!onlyNew || c.isNew) && (!free || c.price === 0) && (!mac || c.mac);
    c.li.hidden = !ok;
    shown += ok;
  }
  [...cards].sort(sorts[document.getElementById("sort").value]).forEach((c) => grid.appendChild(c.li));
  const panel = cats.length + prices.length + (onlyNew ? 1 : 0);
  const any = panel || words.length || free || mac;
  document.getElementById("fdot").hidden = !panel;
  document.getElementById("clear").hidden = !any;
  document.getElementById("count").textContent = shown === 1 ? "1 plug-in" : `${shown} plug-ins`;
  document.getElementById("nomatch").hidden = shown > 0;
}
function clearToolbar() {
  toolbar.querySelectorAll("input[type=checkbox]").forEach((c) => (c.checked = false));
  document.getElementById("q").value = "";
  document.getElementById("sort").value = "featured";
  applyToolbar();
}
toolbar.addEventListener("input", applyToolbar);
toolbar.addEventListener("change", applyToolbar);
document.getElementById("clear").addEventListener("click", clearToolbar);
document.getElementById("clear2").addEventListener("click", clearToolbar);
// The filter panel closes on a click elsewhere or Escape.
const filters = toolbar.querySelector(".filters");
document.addEventListener("click", (e) => { if (filters.open && !filters.contains(e.target)) filters.open = false; });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && filters.open) { filters.open = false; filters.querySelector("summary").focus(); } });
toolbar.hidden = false;
applyToolbar();

// The small-screen menu closes when a link in it is used.
document.querySelectorAll(".mnav nav a").forEach((a) => a.addEventListener("click", () => a.closest("details").removeAttribute("open")));
