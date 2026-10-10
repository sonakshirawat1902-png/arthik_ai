const fs = require('fs');
const path = require('path');

// Seeded Pseudo Random Number Generator (PRNG) matching Mulberry32 for deterministic reproducibility
function mulberry32(a) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 8, t | 30);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

const rng = mulberry32(42);

function randint(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function choice(arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function weightedChoice(items, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = rng() * sum;
  for (let i = 0; i < items.length; i++) {
    if (r < weights[i]) return items[i];
    r -= weights[i];
  }
  return items[items.length - 1];
}

const products = [
  ["P01", "Block-Print Bedsheet Set", "Home Textiles", 1800, 1050],
  ["P02", "Blue Pottery Vase", "Decor", 950, 520],
  ["P03", "Brass Diya Set", "Festive", 600, 330],
  ["P04", "Jaipuri Razai (Quilt)", "Home Textiles", 3200, 2350],
  ["P05", "Handmade Soap Gift Box", "Gifts", 450, 160],
  ["P06", "Scented Candle Trio", "Gifts", 700, 280],
  ["P07", "Wooden Jewellery Box", "Decor", 1200, 640],
  ["P08", "Cushion Cover Pair", "Home Textiles", 700, 360],
  ["P09", "Terracotta Planter", "Decor", 400, 260],
  ["P10", "Silk Scarf", "Accessories", 1500, 800],
  ["P11", "Leather Wallet", "Accessories", 1100, 700],
  ["P12", "Ceramic Mug Set", "Kitchen", 800, 590],
];

const base = {
  "P01": [30,29,31,30,32,30,31,33,32],
  "P02": [14,15,14,16,15,15,16,15,15],
  "P03": [10,9,10,9,10,11,12,14,15],
  "P04": [22,20,12,6,5,4,4,7,9],
  "P05": [28,30,29,31,33,34,35,37,38],
  "P06": [16,17,18,17,18,19,18,19,19],
  "P07": [9,9,10,9,10,10,11,10,10],
  "P08": [22,21,22,23,22,21,22,23,22],
  "P09": [18,19,20,21,22,22,21,20,18],
  "P10": [8,8,9,10,9,9,8,9,9],
  "P11": [7,7,8,7,8,7,7,8,7],
  "P12": [24,24,25,26,25,26,27,28,30]
};

const months = [1, 2, 3, 4, 5, 6, 7, 8, 9];
let sales = [];
let sid = 1;

months.forEach((m, mi) => {
  const nd = m === 2 ? 28 : [4, 6, 9].includes(m) ? 30 : 31;
  products.forEach(p => {
    const [pid, name, cat, price, cost] = p;
    const units = Math.round(base[pid][mi] * 2.3);
    let ucost = cost;
    if (pid === 'P01' && m >= 9) ucost = 1190;

    let left = units;
    while (left > 0) {
      const qty = Math.min(left, weightedChoice([1, 2, 3], [0.7, 0.2, 0.1]));
      left -= qty;
      const day = randint(1, nd);
      let disc = 0;
      if (m === 9 && (pid === 'P04' || pid === 'P12')) {
        disc = choice([0, 0.10, 0.15, 0.15]);
      } else if (rng() < 0.08) {
        disc = 0.05;
      }
      const ch = weightedChoice(["Store", "Online", "WhatsApp"], [0.55, 0.30, 0.15]);
      const dateStr = `2026-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const discAmt = Math.round(price * qty * disc * 100) / 100;
      sales.push([`S${String(sid).padStart(5, '0')}`, dateStr, pid, qty, price, discAmt, ucost, ch]);
      sid++;
    }
  });
});

// Sort by date then sid
sales.sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]));
sales.forEach((r, i) => {
  r[0] = `S${String(i + 1).padStart(5, '0')}`;
});

const salesCsvLines = [
  'sale_id,date,product_id,quantity,unit_price,discount_amount,unit_cost_at_sale,channel',
  ...sales.map(r => r.join(','))
];

fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
fs.writeFileSync(path.join(__dirname, 'data', 'sales.csv'), salesCsvLines.join('\n'));
console.log('Successfully generated full sales.csv with', sales.length, 'records!');
