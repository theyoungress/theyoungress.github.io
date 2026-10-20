// Home page: live versions from the store catalogue and the newest Hub installers.
// Refresh versions without letting a pending catalog change the approved prices.
YoungRessStore.catalog().then((rows) => {
  for (const id of ["trinity", "ironglass", "air"]) {
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
