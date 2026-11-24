# ShopLedger

## Stack

- Node.js with CommonJS, Express, and `body-parser` for JSON requests.
- Plain HTML, CSS, and browser JavaScript served from `public/`.
- JSON file storage in `data/db.json`.

## Module map

- `routes/customers.js` lists customer accounts and recent settlements and accepts new settlements.
- `routes/orders.js` lists and retrieves orders and handles checkout and cancellation.
- `routes/products.js` lists and filters products and lists active coupons.
- `routes/reports.js` serves dashboard data, GST reconciliation, cart previews, and admin export.
- `lib/coupons.js` normalizes and validates coupon codes, computes discounts, and lists active coupons.
- `lib/dates.js` formats dates, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` finds products, checks sellable stock, deducts physical stock, adjusts reservations, and summarizes inventory.
- `lib/invoice.js` uses checkout pricing for invoice figures and renders printable HTML.
- `lib/ledger.js` calculates khata balances, applies and reverses order charges, and records settlements.
- `lib/orders.js` creates, retrieves, cancels, and filters order records.
- `lib/pricing.js` calculates checkout totals, allocates discounts across lines, and computes GST.
- `lib/reports.js` builds dashboard summaries and compares invoice figures with stored order totals.
- `lib/store.js` reads and writes the JSON file and maintains recent audit entries.
- `lib/tax.js` resolves GST rates and splits tax into CGST and SGST.

## Commands

- `npm start` runs `node server.js` on port 3000 by default. Set `PORT` to override it.
- `node --test` runs the invoice tests. The `npm test` script is a placeholder that exits with an error.

## Rules

1. Write characterization tests before changing behaviour.
2. Change only the modules the ticket is about.
3. Tests never read or write `data/db.json`. Use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket

Invoice total and GST breakdown do not match what the customer was billed. Allowed implementation files are `lib/invoice.js` and, only if truly needed, `lib/tax.js`.
