// Report a bug: the form writes an email to support; the visitor sends it from their own email app
// (or copies the text). Nothing is sent from this page.
const SUPPORT = "aphoticsupport@gmail.com";
const form = document.getElementById("bug");
const $ = (id) => document.getElementById(id);
const val = (id) => $(id).value.trim();
const picked = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || "";
const status = (text) => ($("status").textContent = text);
const check = () => { form.classList.add("was-checked"); return form.reportValidity(); };

// The computer this page is open on is the likely one.
const mac = /Mac/i.test(navigator.userAgentData?.platform || navigator.platform || navigator.userAgent);
form.querySelector(`input[name="os"][value="${mac ? "macOS" : "Windows"}"]`).checked = true;
const showChip = () => ($("chip-field").hidden = picked("os") !== "macOS");
showChip();

// The newest version of the chosen plug-in, from the store's catalogue.
let catalog = [];
YoungRessStore.catalog().then((rows) => (catalog = rows)).catch(() => {});
$("f-product").addEventListener("change", () => {
  const row = catalog.find((r) => r.id === $("f-product").value && r.published === true);
  $("version-hint").textContent = row && typeof row.version === "string"
    ? `The newest is ${row.version}. On an older one? Update in Aphotic Hub first.`
    : "Aphotic Hub shows it in your Library.";
});

function report() {
  const product = $("f-product").selectedOptions[0];
  const name = product && product.value ? product.textContent : "";
  const line = (label, text) => `${label}: ${text || "-"}`;
  const block = (title, text) => (text ? `\n${title}\n${text}\n` : "");
  const subject = `Bug report: ${name}${val("f-version") ? " " + val("f-version") : ""}: ${val("f-summary")}`;
  const body = [
    line("Plug-in", name), line("Version", val("f-version")), line("Problem", picked("kind")), line("How often", picked("often")), "",
    line("Computer", picked("os") === "macOS" ? "Mac" : picked("os")), line("System version", val("f-system")),
    ...(picked("os") === "macOS" ? [line("Mac processor", val("f-chip"))] : []),
    line("DAW", val("f-daw")), line("Format", val("f-format")), line("Sample rate / buffer", val("f-audio")),
    block("WHAT HAPPENED", val("f-what")) + block("HOW TO MAKE IT HAPPEN", val("f-steps")) + block("WHAT I EXPECTED", val("f-expected")),
    "(Screenshots, a recording or a crash report: attach them to this email.)",
  ].join("\n");
  return { subject, body };
}
const preview = () => { const r = report(); $("preview").textContent = `To: ${SUPPORT}\nSubject: ${r.subject}\n\n${r.body}`; };
form.addEventListener("input", () => { preview(); status(""); });
form.addEventListener("change", () => { showChip(); preview(); });
preview();

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!check()) return status("Fill in the highlighted fields first.");
  const r = report();
  // RFC 6068: line breaks in a mailto body are CRLF.
  location.href = `mailto:${SUPPORT}?subject=${encodeURIComponent(r.subject)}&body=${encodeURIComponent(r.body.replace(/\n/g, "\r\n"))}`;
  status(`Your email app should open with the report written. Attach your screenshots and send it. Nothing opened? Click Copy the report and email it to ${SUPPORT}.`);
});
$("copy").addEventListener("click", async () => {
  if (!check()) return status("Fill in the highlighted fields first.");
  const r = report();
  try {
    await navigator.clipboard.writeText(`Subject: ${r.subject}\n\n${r.body}`);
    status(`Copied. Paste it into an email to ${SUPPORT}.`);
  } catch {
    $("bug").querySelector(".r-preview").open = true;
    status(`Couldn't copy here. Select the report below and email it to ${SUPPORT}.`);
  }
});
