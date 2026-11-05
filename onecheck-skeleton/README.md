# OneCheck – Front-end Skeleton

Plain HTML / CSS / JavaScript. No build step, no installs.

> The look follows Singapore retail web banking (OCBC-style red, white header, Open Sans), but the bank is a fictional "DemoBank" with fake accounts and fake data. A banner on every page says so.

## Branding

The bank name lives in one place: `BRAND` at the top of `js/data.js`. We deliberately use a fictional name and logo and keep the prototype banner, because the site will be hosted on a public domain and a convincing copy of a real bank's login/transfer pages is exactly what phishing sites look like. For the slides, say it is "modelled on OCBC's online banking".

## Run it

Open `index.html` in a browser, or (recommended) serve the folder so paths behave like a real site:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## The flow

```
index.html  ->  transfer.html  ->  onecheck.html  ->  complete.html
 (home)         (fill the form)    (low/med/high)      (receipt)
```

Side pages (linked in the nav): `trusted-person.html`, `exclusion-log.html`.

State is passed between pages with `sessionStorage` via the `Store` helper in `js/app.js`. Click **Reset demo data** in the footer to start over.

The transfer page has three tabs: **Saved payee**, **New payee** and **PayNow** (`transfer.html?mode=paynow` opens PayNow directly). Demo PayNow numbers: `91234567`, `98765432`, `81112222`. After a transfer, a new payee is saved, so paying them again is no longer "new".

## Shared helpers (in `js/app.js`, available on every page)

| Helper | What it does |
|---|---|
| `Store.get/set/remove(key)` | sessionStorage wrapper (all keys prefixed `demo_`) |
| `getAccounts()`, `getPayees()`, `getRecentTransactions()` | Live demo data |
| `formatMoney(n)`, `formatDate(iso)`, `formatDateTime(iso)`, `maskNumber(no)` | Formatting |
| `escapeHtml(str)` | **Always** use this when putting user text into `innerHTML` |
| `icon("shield")` | Inline SVG icon. Names: home, transfer, paynow, bill, qr, shield, user, users, list, bell, logout, chevron, check, alert, stop, info, print, plus, card, wallet, lock, menu, help |
| `showToast("message")` | Small pop-up message at the bottom |
| `renderStepper(el, step)` | The Transfer details / OneCheck review / Done stepper (step 1, 2 or 3) |
| `completeTransfer(tx, result)` | Deducts balance, saves payee, writes receipt, goes to `complete.html` |

Add `data-demo-only` to any link that isn't built; clicking it shows a "not part of the prototype" toast.

Useful CSS classes: `card`, `card-head`, `btn btn-primary | btn-secondary | btn-ghost | btn-danger`, `btn-row end`, `form-row`, `form-grid`, `notice`, `notice warn`, `badge low|medium|high`, `summary` (key/value list), `empty-state`, `layout-main-side`, `layout-narrow`. Colours are CSS variables at the top of `css/style.css` (`--brand`, `--low`, `--medium`, `--high`, ...).

## Who edits what

| Owner | Files | What to do |
|---|---|---|
| **Jor El** | `index.html`, `transfer.html`, `complete.html`, `js/home.js`, `js/transfer.js`, `js/complete.js`, `js/data.js`, `js/app.js` | Skeleton site, fake accounts, shared helpers |
| **Vestin** | `js/onecheck-api.js` | Replace the mock `assess()` with a call to the Python algorithm. Also integration + deployment |
| **Mushfira** | `onecheck.html`, `js/onecheck.js` (`render*Screen()` functions), CSS section "OneCheck Level Screen" | Make the low / medium / high screens polished |
| **Izz** | `trusted-person.html`, `js/trusted-person.js`, CSS section "Trusted Person" | Trusted person setup + alert on risky transfers |
| **Su Yi** | `exclusion-log.html`, `js/exclusion-log.js`, CSS section "Exclusion Log" | Exclusion log + anti-abuse rules |

Try to stay inside your own files so merges are painless. If you need to change a shared file (`app.js`, `data.js`, `style.css` outside your section), tell the group chat first.

## The contract between the pieces

**Transaction (`tx`)** – built in `js/transfer.js`, sent to the algorithm:

```js
{
  id, timestamp,                       // ISO string
  fromAccountId, fromAccountName, fromAccountNumber, fromBalance,
  channel,                             // "Internal" | "FAST" | "PayNow"
  payee: {
    id, name, bank, number,
    type,                              // "saved" | "new" | "paynow"
    isNew,                             // never paid before
    pastTransfers,                     // how many times paid before
    lastPaid, addedOn                  // "YYYY-MM-DD" (lastPaid may be null)
  },
  amount,                              // number
  purpose,                             // e.g. "Investment", "" if not chosen
  remarks,                             // string
  dailyLimit                           // number
}
```

**OneCheck result** – returned by `OneCheckAPI.assess(tx)`:

```js
{ level: "low" | "medium" | "high", score: 0-100, reasons: ["..."] }
```

**Hooks the OneCheck page calls**

| Hook | Owner | Called when |
|---|---|---|
| `ExclusionLog.isExcluded(payee)` | Su Yi | Before scoring. `true` skips OneCheck entirely |
| `OneCheckAPI.assess(tx)` | Vestin | Scores the transfer |
| `TrustedPerson.notify(tx, result)` | Izz | After scoring, only for medium / high |

Need more fields for your feature? Add them to `tx` in `transfer.js` and tell Vestin.

## Trying each risk level (with the mock algorithm)

| Level | Try this |
|---|---|
| Low | Pay **Mum (Tan Mei Ling)**, S$50 |
| Medium | Pay **Lim Wei Jie**, S$500 |
| High | Pay **Quick Crypto Invest**, S$3,000, remarks "guaranteed crypto returns" |

(The daily transfer limit is S$5,000, set in `js/data.js`.)

## Connecting the Python back end later

1. Vestin exposes the algorithm as `POST /api/onecheck` (Flask or FastAPI) and serves these static files from the same server so no CORS setup is needed.
2. In `js/onecheck-api.js`, comment out `return mockAssess(tx);` and uncomment the `fetch(...)` block.
3. For SQLite (alerts, exclusion log), move the `Store` calls in `trusted-person.js` / `exclusion-log.js` behind small API endpoints.

## Git workflow (from the meeting)

```bash
git clone <repo-link>
git checkout -b <your-name>-<feature>      # e.g. mushfira-level-screens
# ...work, then...
git add .
git commit -m "Describe what you changed"
git push -u origin <your-name>-<feature>
```

Open a pull request into `main` when your part works. Internal deadline: **14 November**.
