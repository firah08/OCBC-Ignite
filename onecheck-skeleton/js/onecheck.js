/* =========================================================
   OneCheck result page  (OWNER of the screens: Mushfira)

   Flow of this page:
     1. read pendingTx           (set by transfer.js)
     2. ExclusionLog.isExcluded  (Su Yi) -> skip straight to completion
     3. OneCheckAPI.assess(tx)   (Vestin) -> { level, score, reasons }
     4. show the low / medium / high screen
     5. medium/high -> TrustedPerson.notify(tx, result)  (Izz)
     6. user proceeds -> completeTransfer() in app.js, or cancels

   Mushfira: restyle / redesign the three render*Screen() functions
   and the CSS under "OneCheck Level Screen" in css/style.css.
   Keep the data-action="proceed" / "cancel" attributes so the
   buttons stay wired up (or change the wiring in bindActions()).
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const root = document.getElementById("onecheck-root");
  const tx = Store.get("pendingTx");

  if (!tx) {
    window.location.href = "transfer.html";
    return;
  }

  renderStepper(document.getElementById("stepper"), 2);
  renderLoading(root);

  // Su Yi's feature: trusted contacts skip screening
  if (ExclusionLog.isExcluded(tx.payee)) {
    completeTransfer(tx, {
      level: "low",
      score: 0,
      reasons: ["Payee is in your exclusion log, so OneCheck was skipped."],
      skipped: true
    });
    return;
  }

  let result;
  try {
    // small delay so the "checking…" screen is visible during the demo
    const [res] = await Promise.all([
      OneCheckAPI.assess(tx),
      new Promise((resolve) => setTimeout(resolve, 1200))
    ]);
    result = res;
  } catch (err) {
    renderError(root, err);
    return;
  }

  renderResult(root, tx, result);

  // Izz's feature: alert the trusted person for risky transfers
  if (result.level !== "low") {
    TrustedPerson.notify(tx, result).then((info) => {
      if (info && info.message) {
        document.getElementById("trusted-person-slot").innerHTML =
          `<div class="slot"><div class="slot-title">Trusted person</div>${escapeHtml(info.message)}</div>`;
      }
    });
  }
});

/* ---------- Screens ---------- */

function renderLoading(root) {
  root.innerHTML = `
    <div class="card center">
      <div class="spinner"></div>
      <h2>Checking this transfer…</h2>
      <p class="muted">OneCheck is reviewing the payee, amount and remarks.</p>
    </div>`;
}

function renderError(root, err) {
  root.innerHTML = `
    <div class="card">
      <h2>Sorry, we could not check this transfer</h2>
      <p class="muted">${escapeHtml(err && err.message ? err.message : "Unknown error")}</p>
      <div class="btn-row"><a class="btn btn-secondary" href="transfer.html">Back to transfer</a></div>
    </div>`;
}

function summaryHtml(tx) {
  return `
    <dl class="summary">
      <div><dt>From</dt><dd>${escapeHtml(tx.fromAccountName)}</dd></div>
      <div><dt>To</dt><dd>${escapeHtml(tx.payee.name)}</dd></div>
      <div><dt>${tx.channel === "PayNow" ? "PayNow" : "Bank / account"}</dt><dd>${escapeHtml(tx.channel === "PayNow" ? tx.payee.number.replace("PayNow ", "") : tx.payee.bank + " " + tx.payee.number)}</dd></div>
      <div><dt>Amount</dt><dd>${formatMoney(tx.amount)}</dd></div>
      ${tx.purpose ? `<div><dt>Purpose</dt><dd>${escapeHtml(tx.purpose)}</dd></div>` : ""}
      ${tx.remarks ? `<div><dt>Remarks</dt><dd>${escapeHtml(tx.remarks)}</dd></div>` : ""}
    </dl>`;
}

function reasonsHtml(result) {
  return `<ul>${result.reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>`;
}

function scoreBarHtml(result) {
  return `
    <div class="score-bar ${result.level}"><span style="width:${result.score}%"></span></div>
    <div class="hint">Suspicion score: ${result.score} / 100</div>`;
}

/* ----- LOW ----- */
function renderLowScreen(tx, result) {
  return `
    <div class="card risk-screen risk-low">
      <div class="risk-icon">${icon("check")}</div>
      <span class="badge low">Low risk</span>
      <h2>This transfer looks safe</h2>
      ${scoreBarHtml(result)}
      ${reasonsHtml(result)}
      ${summaryHtml(tx)}
      <div class="btn-row end">
        <button class="btn btn-ghost" data-action="cancel">Cancel</button>
        <button class="btn btn-primary" data-action="proceed">Confirm transfer</button>
      </div>
    </div>`;
}

/* ----- MEDIUM ----- */
function renderMediumScreen(tx, result) {
  return `
    <div class="card risk-screen risk-medium">
      <div class="risk-icon">${icon("alert")}</div>
      <span class="badge medium">Medium risk</span>
      <h2>Please double-check before you send</h2>
      ${scoreBarHtml(result)}
      <p>We noticed a few things that scammers often do:</p>
      ${reasonsHtml(result)}
      ${summaryHtml(tx)}
      <div class="btn-row end">
        <button class="btn btn-ghost" data-action="cancel">Go back</button>
        <button class="btn btn-primary" data-action="proceed">I know this person – continue</button>
      </div>
    </div>`;
}

/* ----- HIGH ----- */
function renderHighScreen(tx, result) {
  return `
    <div class="card risk-screen risk-high">
      <div class="risk-icon">${icon("stop")}</div>
      <span class="badge high">High risk</span>
      <h2>This transfer looks like a scam</h2>
      ${scoreBarHtml(result)}
      <p>Strong warning signs were found:</p>
      ${reasonsHtml(result)}
      ${summaryHtml(tx)}
      <div class="form-row" style="margin-top:16px">
        <label style="font-weight:400;display:flex;gap:8px;align-items:flex-start">
          <input type="checkbox" id="ack" style="margin-top:4px"> I understand the risk and still want to send this money.
        </label>
      </div>
      <div class="btn-row end">
        <button class="btn btn-ghost" data-action="proceed" id="proceed-high" disabled>Send anyway</button>
        <button class="btn btn-danger" data-action="cancel">Cancel transfer</button>
      </div>
    </div>`;
}

/* ---------- Pick the screen + wire buttons ---------- */

function renderResult(root, tx, result) {
  const screens = { low: renderLowScreen, medium: renderMediumScreen, high: renderHighScreen };
  const render = screens[result.level] || renderMediumScreen;
  root.innerHTML = render(tx, result);
  bindActions(root, tx, result);
}

function bindActions(root, tx, result) {
  const ack = root.querySelector("#ack");
  const proceedHigh = root.querySelector("#proceed-high");
  if (ack && proceedHigh) {
    ack.addEventListener("change", () => { proceedHigh.disabled = !ack.checked; });
  }

  root.querySelectorAll('[data-action="proceed"]').forEach((btn) => {
    btn.addEventListener("click", () => completeTransfer(tx, result));
  });
  root.querySelectorAll('[data-action="cancel"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      Store.remove("pendingTx");
      window.location.href = "transfer.html";
    });
  });
}
