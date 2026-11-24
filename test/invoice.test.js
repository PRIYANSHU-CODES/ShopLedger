const assert = require('node:assert/strict');
const test = require('node:test');
const { computeInvoiceFigures, render } = require('../lib/invoice');

const mixedGstOrder = {
  id: 1001,
  items: [
    { name: 'Rice', sku: 'RICE', hsn: '1006', price: 100, qty: 1 },
    { name: 'Ghee', sku: 'GHEE', hsn: '0405', price: 200, qty: 1 }
  ],
  subtotal: 300,
  discount: 0,
  tax: 29,
  total: 329
};

test('uses an explicit whole-percent GST rate and splits the tax into CGST and SGST', () => {
  // An item with an explicit 12% rate contributes ₹30 GST on two ₹125 units.
  const figures = computeInvoiceFigures({
    items: [{ name: 'Sample item', price: 125, qty: 2, gstRate: 12 }]
  });

  assert.equal(figures.subtotal, 250);
  assert.equal(figures.discount, 0);
  assert.equal(figures.tax, 30);
  assert.equal(figures.cgst, 15);
  assert.equal(figures.sgst, 15);
  assert.equal(figures.total, 280);
  assert.equal(figures.rows[0].gstPercent, 12);
  assert.equal(figures.rows[0].lineTax, 30);
});

test('uses the product HSN rates when mixed lines have no explicit rate', () => {
  // The invoice uses the 5% and 12% HSN slabs applied at checkout.
  const figures = computeInvoiceFigures(mixedGstOrder);

  assert.deepEqual(figures.rows.map(({ gstPercent, lineTax }) => [gstPercent, lineTax]), [
    [5, 5],
    [12, 24]
  ]);
  assert.equal(figures.tax, mixedGstOrder.tax);
  assert.equal(figures.cgst, 14.50);
  assert.equal(figures.sgst, 14.50);
  assert.equal(figures.total, mixedGstOrder.total);
});

test('Ticket 1: invoice total and GST breakdown match the mixed-rate order bill', () => {
  // Checkout billed 5% on Rs. 100 of rice and 12% on Rs. 200 of ghee.
  const figures = computeInvoiceFigures(mixedGstOrder);
  const actual = {
    total: figures.total,
    tax: figures.tax,
    cgst: figures.cgst,
    sgst: figures.sgst,
    lines: figures.rows.map(({ name, gstPercent, lineTax }) => ({ name, gstPercent, lineTax }))
  };

  assert.deepEqual(actual, {
    total: mixedGstOrder.total,
    tax: mixedGstOrder.tax,
    cgst: 14.50,
    sgst: 14.50,
    lines: [
      { name: 'Rice', gstPercent: 5, lineTax: 5 },
      { name: 'Ghee', gstPercent: 12, lineTax: 24 }
    ]
  });
});

test('caps the percentage coupon and calculates GST on the discounted amount', () => {
  // SAVE10 is capped at ₹150, leaving ₹1,850 subject to 18% GST.
  const figures = computeInvoiceFigures({
    items: [{ name: 'Sample item', price: 2000, qty: 1 }],
    coupon: 'SAVE10',
    subtotal: 2000,
    discount: 150,
    tax: 333,
    total: 2183
  });

  assert.equal(figures.discount, 150);
  assert.equal(figures.rows[0].lineTax, 333);
  assert.equal(figures.tax, 333);
  assert.equal(figures.total, 2183);
});

test('subtracts a flat coupon before calculating GST', () => {
  // FLAT50 leaves ₹350 subject to 18% GST.
  const figures = computeInvoiceFigures({
    items: [{ name: 'Sample item', price: 400, qty: 1 }],
    coupon: 'FLAT50',
    subtotal: 400,
    discount: 50,
    tax: 63,
    total: 413
  });

  assert.equal(figures.discount, 50);
  assert.equal(figures.rows[0].lineTax, 63);
  assert.equal(figures.tax, 63);
  assert.equal(figures.total, 413);
});

test('prints the billed GST and total for a mixed-rate order without a mismatch notice', () => {
  // The printed bill matches the ₹29 GST and ₹329 ledger total.
  const html = render(mixedGstOrder);

  assert.match(html, /CGST \+ SGST \(Total GST\)<\/td><td class="r">₹29\.00<\/td>/);
  assert.match(html, /Invoice Total<\/td><td class="r">₹329\.00<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});

test('omits the reconciliation notice when the calculated total equals the recorded total', () => {
  // An order billed at the default rate without a coupon prints without a warning.
  const html = render({
    id: 1002,
    items: [{ name: 'Sample item', price: 100, qty: 1 }],
    total: 118
  });

  assert.match(html, /Invoice Total<\/td><td class="r">₹118\.00<\/td>/);
  assert.doesNotMatch(html, /Accountant Reconciliation Notice/);
});
