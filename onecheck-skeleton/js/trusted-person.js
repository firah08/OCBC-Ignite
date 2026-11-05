/* =========================================================
   Trusted Person / "Child Alert"  (OWNER: Izz)

   Contract used by the rest of the site:
     TrustedPerson.get()                 -> { name, relationship, contact } | null
     TrustedPerson.save(person)          -> saves it
     TrustedPerson.notify(tx, result)    -> Promise<{ notified: boolean, message: string }>

   onecheck.js calls notify() for medium / high risk transfers and
   shows `message` in #trusted-person-slot.

   Right now notify() only logs to the console – replace it with a
   real call (e.g. POST /api/alert to the Python back end) and build
   the setup form on trusted-person.html.
   ========================================================= */

window.TrustedPerson = {
  get() {
    return Store.get("trustedPerson", null);
  },

  save(person) {
    Store.set("trustedPerson", person);
  },

  async notify(tx, result) {
    const person = this.get();
    if (!person) {
      return { notified: false, message: "" };   // nobody set up -> show nothing
    }
    // TODO (Izz): send the real alert
    console.log("[TrustedPerson] would alert", person, "about", tx, result);
    return {
      notified: true,
      message: "We have alerted " + person.name + " about this transfer."
    };
  }
};

/* ---------- Page code for trusted-person.html ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("trusted-root");
  if (!root) return;   // not on the trusted-person page

  // TODO (Izz): replace this placeholder with the real setup form
  const person = TrustedPerson.get();
  root.innerHTML = person
    ? `<p>Current trusted person: <strong>${escapeHtml(person.name)}</strong> (${escapeHtml(person.relationship || "")})</p>`
    : `<div class="empty-state">${icon("users")}<p>No trusted person set up yet.</p></div>`;
});
