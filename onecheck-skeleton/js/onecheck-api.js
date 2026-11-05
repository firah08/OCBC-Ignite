/* =========================================================
   OneCheck algorithm interface  (OWNER: Vestin)

   The front end only ever calls:
       const result = await OneCheckAPI.assess(tx);

   `tx` is built in js/transfer.js (see the shape at the top of that file).

   `result` MUST look like this so the screens keep working:
   {
     level:   "low" | "medium" | "high",
     score:   0-100,                      // suspicion score
     reasons: ["short plain-English reason", ...]
   }

   RIGHT NOW this is a throw-away mock written in JavaScript so
   the whole flow can be demoed. When the Python algorithm is ready:
     1. Expose it with Flask/FastAPI at POST /api/onecheck
     2. Replace the body of assess() with the fetch() shown below
   ========================================================= */

window.OneCheckAPI = {
  async assess(tx) {
    // ---- Real version (uncomment when the Python back end exists) ----
    // const res = await fetch("/api/onecheck", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify(tx)
    // });
    // if (!res.ok) throw new Error("OneCheck service error " + res.status);
    // return await res.json();

    // ---- Mock version ----
    return mockAssess(tx);
  }
};

function mockAssess(tx) {
  let score = 5;
  const reasons = [];

  if (tx.payee.isNew) {
    score += 25;
    reasons.push("You have not sent money to this payee before.");
  }
  if (tx.amount >= 5000) {
    score += 35;
    reasons.push("This is a very large amount.");
  } else if (tx.amount >= 1000) {
    score += 15;
    reasons.push("This is higher than your usual transfer amount.");
  }
  if (tx.amount > tx.fromBalance * 0.8) {
    score += 10;
    reasons.push("This would use most of the money in your account.");
  }
  const hour = new Date(tx.timestamp).getHours();
  if (hour < 6) {
    score += 10;
    reasons.push("Transfers late at night are less common for you.");
  }
  if (/(invest|crypto|guaranteed|urgent|police|officer|prize|verify|safe account)/i.test(tx.remarks || "")) {
    score += 30;
    reasons.push("The remarks contain words often used in scams.");
  }

  score = Math.min(score, 100);
  const level = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  if (reasons.length === 0) reasons.push("Nothing unusual about this transfer.");

  return { level, score, reasons };
}
