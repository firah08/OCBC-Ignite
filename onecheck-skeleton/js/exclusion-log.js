/* =========================================================
   Exclusion Log  (OWNER: Su Yi)

   Contract used by the rest of the site:
     ExclusionLog.list()                  -> [{ name, number }]
     ExclusionLog.add(payee)              -> adds a trusted contact
     ExclusionLog.remove(number)          -> removes by account number
     ExclusionLog.isExcluded(payee)       -> boolean  (onecheck.js skips screening if true)
     ExclusionLog.renderHint(payee, el)   -> optional note on the transfer page

   SECURITY TODO (from the meeting): think about how a scammer could abuse
   this, e.g. persuading a victim to "trust" them. Ideas: cooling-off period
   before an entry takes effect, amount cap even for excluded payees,
   re-confirmation for large transfers.
   ========================================================= */

window.ExclusionLog = {
  list() {
    return Store.get("exclusionLog", []);
  },

  add(payee) {
    const items = this.list();
    if (!items.some((p) => p.number === payee.number)) {
      items.push({ name: payee.name, number: payee.number });
      Store.set("exclusionLog", items);
    }
  },

  remove(number) {
    Store.set("exclusionLog", this.list().filter((p) => p.number !== number));
  },

  isExcluded(payee) {
    if (!payee) return false;
    return this.list().some((p) => p.number === payee.number);
  },

  renderHint(payee, el) {
    if (!el) return;
    el.innerHTML = this.isExcluded(payee)
      ? `<div class="slot"><div class="slot-title">Exclusion log</div>This payee is in your exclusion log, so OneCheck will be skipped.</div>`
      : "";
  }
};

/* ---------- Page code for exclusion-log.html ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("exclusion-root");
  if (!root) return;   // not on the exclusion-log page

  // TODO (Su Yi): replace this placeholder with the real add / remove UI
  const items = ExclusionLog.list();
  root.innerHTML = items.length
    ? `<ul class="tx-list">${items
        .map((p) => `<li><span>${escapeHtml(p.name)}</span><span class="muted">${escapeHtml(p.number)}</span></li>`)
        .join("")}</ul>`
    : `<div class="empty-state">${icon("list")}<p>No trusted contacts yet.</p></div>`;
});
