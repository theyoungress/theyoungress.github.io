// Every page: live versions from the store catalogue; the home page also gets the newest Hub installers
// and the catalogue's search. Each plug-in has its own page (<id>.html).
const IDS = ["trinity", "ironglass", "air", "vantavox", "eq5", "photic", "split", "santa", "zion", "sope", "spool", "hadal", "tapeorbit", "abyss", "undertow", "lure", "tube50", "trench", "jermy", "mband", "channel88", "sounding", "wavy", "vent"];
// Old links to a plug-in's section on the home page (./#split) open its page.
if (IDS.includes(location.hash.slice(1)) && document.getElementById("plugins")) location.replace(location.hash.slice(1) + ".html");
// Refresh versions without letting a pending catalog change the approved prices.
YoungRessStore.catalog().then((rows) => {
  for (const id of [...IDS, "monday"]) {
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
if (document.getElementById("hub-meta")) {
setDownloads(document.querySelector('[data-dl="win"]').href, document.querySelector('[data-dl="mac"]').href);
fetch("https://api.github.com/repos/theyoungress/youngress-hub-releases/releases/latest")
  .then((r) => (r.ok ? r.json() : null))
  .then((rel) => {
    const win = rel?.assets?.find((a) => /Setup.*\.exe$/.test(a.name)), mac = rel?.assets?.find((a) => /Mac\.dmg$/.test(a.name));
    if (win && mac) setDownloads(win.browser_download_url, mac.browser_download_url, rel.tag_name.replace(/^v/, ""));
  })
  .catch(() => {});
}

// The catalogue's bar: the tabs and the two switches work in CSS; this adds the search, and hides a
// shelf (or shows "no match") when nothing in it is left.
const bar = document.getElementById("bar");
if (bar) {
  const q = document.getElementById("q"), shelves = [...document.querySelectorAll(".shelf")];
  const shown = (el) => getComputedStyle(el).display !== "none";
  const apply = () => {
    const words = q.value.toLowerCase().split(/\s+/).filter(Boolean);
    for (const shelf of shelves) {
      shelf.hidden = false;
      for (const li of shelf.querySelectorAll(".card")) li.hidden = !words.every((w) => li.textContent.toLowerCase().includes(w));
      shelf.hidden = ![...shelf.querySelectorAll(".card")].some(shown);
    }
    document.getElementById("nomatch").hidden = shelves.some(shown);
  };
  bar.addEventListener("input", apply);
  bar.addEventListener("change", apply);
  document.getElementById("clear").addEventListener("click", () => {
    q.value = "";
    bar.querySelectorAll("input[type=checkbox]").forEach((c) => (c.checked = false));
    bar.querySelector('.tabs [value="all"]').checked = true;
    apply();
  });
  // A link to a shelf (./#vocal, from a plug-in's page) opens on that tab.
  const tab = bar.querySelector(`.tabs [value="${location.hash.slice(1)}"]`);
  if (tab) tab.checked = true;
  q.closest(".search").hidden = false;
  apply();
}

// The small-screen menu closes when a link in it is used.
document.querySelectorAll(".mnav nav a").forEach((a) => a.addEventListener("click", () => a.closest("details").removeAttribute("open")));
