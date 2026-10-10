const fs = require('fs');
const path = require('path');

// Reproducible PRNG matching Python random.seed(42) behavior or deterministic calculation
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

console.log("Products initialized:", products.length);
