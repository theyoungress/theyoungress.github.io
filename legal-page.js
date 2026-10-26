// The same documents Aphotic Hub shows and customers agree to (legal.js is copied from the hub).
const SUPPORT = "aphoticsupport@gmail.com";
const L = window.YR_LEGAL;
document.getElementById("updated").textContent = "Last updated " + L.updated + ".";
document.getElementById("docs").innerHTML = ["terms", "privacy", "eula"]
  .map((id) => `<section id="${id}"><h2>${L.docs[id].title}</h2>${L.docs[id].html}</section>`).join("");
document.querySelectorAll("a[data-doc]").forEach((a) => {
  if (L.docs[a.dataset.doc]) a.href = "#" + a.dataset.doc;
  else a.replaceWith(a.textContent);   // documents that only live inside the hub
});
document.querySelectorAll(".contact").forEach((s) => (s.innerHTML = `<a href="mailto:${SUPPORT}">${SUPPORT}</a>`));
if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
