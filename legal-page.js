// The same documents Aphotic Hub shows and customers agree to (legal.js is copied from the hub).
const SUPPORT = "aphoticsupport@gmail.com";
const L = window.YR_LEGAL;
document.getElementById("updated").textContent = "Last updated " + L.updated + ".";
// The only HTML this page builds is the fixed text from legal.js. With Trusted Types on (the page's
// security policy), this named policy is the one way any script here can turn text into HTML.
const html = window.trustedTypes ? trustedTypes.createPolicy("aphotic-legal", { createHTML: (text) => text }) : { createHTML: (text) => text };
document.getElementById("docs").innerHTML = html.createHTML(["terms", "privacy", "eula"]
  .map((id) => `<section id="${id}"><h2>${L.docs[id].title}</h2>${L.docs[id].html}</section>`).join(""));
document.querySelectorAll("a[data-doc]").forEach((a) => {
  if (L.docs[a.dataset.doc]) a.href = "#" + a.dataset.doc;
  else a.replaceWith(a.textContent);   // documents that only live inside the hub
});
document.querySelectorAll(".contact").forEach((s) => {
  const a = document.createElement("a");
  a.href = "mailto:" + SUPPORT;
  a.textContent = SUPPORT;
  s.replaceChildren(a);
});
if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
