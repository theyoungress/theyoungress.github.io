// Aphotic Audio pages are never shown inside another site's frame (a trick to make visitors click
// things they can't see). GitHub Pages can't send the header that forbids it, so the page does it:
// hidden at once, then the real page takes over the whole tab.
if (window.top !== window.self) {
  document.documentElement.style.display = "none";
  try { window.top.location = window.self.location.href; } catch { /* stays hidden */ }
}
