/**
 * Build lab-measured paddle snapshot from Pickleball Effect CSV + TW codes.
 *
 * Usage (after placing paddles.csv and tw-paddle-codes.json in TEMP):
 *   node scripts/build-paddle-catalog.mjs
 *
 * Tour-level paddles that are not in the lab CSV live in
 * src/data/pickleball/tourCatalog.seed.ts and are merged at runtime by
 * loadPaddles() — there is no public tour-paddle API to scrape.
 */
import fs from "fs";
import path from "path";

const TEMP = process.env.TEMP || process.env.TMPDIR || "/tmp";
const csvPath = path.join(TEMP, "paddles.csv");
const twPath = path.join(TEMP, "tw-paddle-codes.json");
const outDir = path.join(process.cwd(), "src/data/pickleball");

const raw = fs.readFileSync(csvPath, "utf8");
const lines = raw.split(/\r?\n/).filter(Boolean);
const headers = lines[0].split(",").map((h) => h.trim());

function parseRow(line) {
  const cols = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (c === "," && !inQ) {
      cols.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  cols.push(cur);
  const o = {};
  headers.forEach((h, i) => {
    o[h] = (cols[i] || "").trim();
  });
  return o;
}

const rows = lines.slice(1).map(parseRow);
const tw = JSON.parse(fs.readFileSync(twPath, "utf8"));

const curated = [
  {
    id: "joola-perseus-pro-iv-16",
    brand: "JOOLA",
    name: "Perseus Pro IV 16mm",
    twCode: "JPERP4",
    match: (r) => r.Brand === "JOOLA" && /Perseus Pro IV \(16mm\)/.test(r["Paddle Name"]),
  },
  {
    id: "joola-perseus-pro-iv-14",
    brand: "JOOLA",
    name: "Perseus Pro IV 14mm",
    twCode: "JPERP4",
    match: (r) => r.Brand === "JOOLA" && /Perseus Pro IV \(14mm\)/.test(r["Paddle Name"]),
  },
  {
    id: "joola-hyperion-pro-iv",
    brand: "JOOLA",
    name: "Hyperion Pro IV",
    twCode: "BJHYIV",
    match: (r) => r.Brand === "JOOLA" && /Hyperion Pro IV/.test(r["Paddle Name"]),
  },
  {
    id: "crbn-trufoam-genesis-1",
    brand: "CRBN",
    name: "TruFoam Genesis 1",
    twCode: "CBTFP1",
    match: (r) => r.Brand === "CRBN" && r["Paddle Name"] === "TruFoam Genesis 1",
  },
  {
    id: "crbn-trufoam-genesis-4",
    brand: "CRBN",
    name: "TruFoam Genesis 4",
    twCode: "CBTFP4",
    match: (r) => r.Brand === "CRBN" && r["Paddle Name"] === "TruFoam Genesis 4",
  },
  {
    id: "crbn-1x-16",
    brand: "CRBN",
    name: "1X Power Series 16mm",
    twCode: "PS16PA",
    match: (r) => r.Brand === "CRBN" && /1X Power Series \(16 mm\)/.test(r["Paddle Name"]),
  },
  {
    id: "gearbox-pro-ultimate-power",
    brand: "Gearbox",
    name: "Pro Ultimate Power",
    twCode: "GBPULPW",
    match: (r) => r.Brand === "Gearbox" && /Pro Ultimate Elongated 14/.test(r["Paddle Name"]),
  },
  {
    id: "gearbox-pro-ultimate-hyper",
    brand: "Gearbox",
    name: "Pro Ultimate Hyper",
    twCode: "GBPULHY",
    match: (r) => r.Brand === "Gearbox" && /Pro Ultimate Hyper/.test(r["Paddle Name"]),
  },
  {
    id: "gearbox-gx2-elongated",
    brand: "Gearbox",
    name: "GX2 Elongated",
    twCode: "GBGX2EL",
    match: (r) => r.Brand === "Gearbox" && /GX2/.test(r["Paddle Name"]) && /Elong/i.test(r["Paddle Name"]),
  },
  {
    id: "six-zero-ruby-16",
    brand: "Six Zero",
    name: "Ruby 16mm",
    twCode: "SZERUBY",
    match: (r) => r.Brand === "Six Zero" && r["Paddle Name"] === "Ruby",
  },
  {
    id: "six-zero-ruby-pro",
    brand: "Six Zero",
    name: "Ruby Pro",
    twCode: "SZRPR",
    match: (r) => r.Brand === "Six Zero" && r["Paddle Name"] === "Ruby Pro",
  },
  {
    id: "selkirk-labs-008-invikta",
    brand: "Selkirk",
    name: "LABS Project 008 Invikta 13mm",
    twCode: "SELAB8I",
    match: (r) => /Selkirk Labs/.test(r.Brand) && /008 Invikta 13/.test(r["Paddle Name"]),
  },
  {
    id: "selkirk-labs-008-epic",
    brand: "Selkirk",
    name: "LABS Project 008 Epic 13mm",
    twCode: "SELAB8E",
    match: (r) => /Selkirk Labs/.test(r.Brand) && /008 Epic 13/.test(r["Paddle Name"]),
  },
  {
    id: "selkirk-luxx-infinigrit-invikta",
    brand: "Selkirk",
    name: "LUXX InfiniGrit Invikta",
    twCode: "BESTS03",
    match: (r) =>
      r.Brand === "Selkirk" && /Luxx Control Air Invikta Infinigrit/.test(r["Paddle Name"]),
  },
  {
    id: "paddletek-bantam-tko-c-14",
    brand: "Paddletek",
    name: "Bantam TKO-C 14.3",
    twCode: "PTBTK14",
    match: (r) => r.Brand === "Paddletek" && /Bantam TKO-C 14\.3/.test(r["Paddle Name"]),
  },
  {
    id: "franklin-c45-dynasty-16",
    brand: "Franklin",
    name: "C45 Dynasty 16",
    twCode: "FC45PDY",
    match: (r) => r.Brand === "Franklin" && /C45 Dynasty 16/.test(r["Paddle Name"]),
  },
  {
    id: "engage-alpha-pro-16",
    brand: "Engage",
    name: "Alpha Pro 16",
    twCode: "EPALPRO",
    match: (r) => r.Brand === "Engage" && r["Paddle Name"] === "Alpha Pro 16",
  },
  {
    id: "volair-mach1-forza-16",
    brand: "Volair",
    name: "Mach 1 Forza 16",
    twCode: "VLFORZ6",
    match: (r) => /Volair/.test(r.Brand) && /Forza|Mach/i.test(r["Paddle Name"]),
  },
  {
    id: "holbrook-fuze-elongated-16",
    brand: "Holbrook",
    name: "Fuze Elongated 16",
    twCode: null,
    match: (r) => r.Brand === "Holbrook" && /Fuze Elongated 16/.test(r["Paddle Name"]),
  },
  {
    id: "ronbus-ripple-r1-14",
    brand: "Ronbus",
    name: "Ripple V2 R1.14",
    twCode: null,
    match: (r) => r.Brand === "Ronbus" && /Ripple V2 R1\.14/.test(r["Paddle Name"]),
  },
];

function num(v) {
  const n = parseFloat(String(v).replace("%", ""));
  return Number.isFinite(n) ? n : null;
}
function pct(v) {
  const n = num(v);
  return n == null ? null : Math.round(n);
}
function shapeMap(s) {
  const x = (s || "").toLowerCase();
  if (x.includes("elong")) return "elongated";
  if (x.includes("wide")) return "widebody";
  if (x.includes("hybrid")) return "hybrid";
  return "standard";
}
function gritMap(g) {
  const x = (g || "").toLowerCase();
  if (x.includes("raw") || x.includes("peel")) return "raw";
  if (x.includes("paint") || x.includes("grit") || x.includes("durable")) return "grit";
  if (x.includes("thermo")) return "thermoformed";
  return "smooth";
}
function faceMap(f, grit) {
  const x = (f || "").toLowerCase();
  if (x.includes("carbon")) return "raw-carbon";
  if (x.includes("fiber")) return "fiberglass";
  if (x.includes("graph")) return "graphite";
  if (grit === "raw") return "raw-carbon";
  return "composite";
}
function coreMap(name, feel) {
  const x = `${name} ${feel}`.toLowerCase();
  if (x.includes("foam") || x.includes("trufoam") || x.includes("honeyfoam")) return "foam";
  if (x.includes("nomex")) return "nomex";
  return "polymer";
}
function biasMap(type, spinRpm) {
  const t = (type || "").toLowerCase();
  if (t.includes("power")) return "power";
  if (t.includes("control")) return "control";
  if (spinRpm && spinRpm >= 2000) return "spin";
  return "all-court";
}
function edgeFromBuild(build, name) {
  const x = `${build} ${name}`.toLowerCase();
  if (x.includes("foam") || x.includes("gen 4") || x.includes("thermo")) return "foam-injected";
  return "standard";
}

const paddles = [];
const imageCache = {};

for (const c of curated) {
  const row = rows.find(c.match);
  if (!row) {
    console.log("MISS", c.id);
    continue;
  }
  const weightOz = num(row["Weight (oz)"]);
  const swingweight = num(row["Swing Weight"]);
  const twistWeight = num(row["Twist Weight"]);
  const balanceMm = num(row["Balance Point (mm)"]);
  const thicknessMm = num(row["Core Thickness (mm)"]);
  const gripIn = num(row["Grip Size (in)"]);
  const gripLen = num(row["Grip Length (in)"]);
  const spinRpm = num(row["Spin (RPM)"]);
  const powerMph = num(row["Power (MPH)"]);
  const popMph = num(row["Pop (MPH)"]);
  const powerPct = pct(row["Power Percentile"]);
  const popPct = pct(row["Pop Percentile"]);
  const swingPct = pct(row["Swing Weight Percentile"]);
  const twistPct = pct(row["Twist Weight Percentile"]);
  const shape = shapeMap(row.Shape);
  const texture = gritMap(row["Grit Type"]);
  const face = faceMap(row["Face Material"], texture);
  const core = coreMap(`${c.name} ${row["Paddle Name"]}`, row["Impact Feel"]);
  const typeLabel = row["Paddle Type"] || row["Manual Paddle Type"] || "";
  const bias = biasMap(typeLabel, spinRpm);
  const spinScore =
    spinRpm != null
      ? Math.max(35, Math.min(98, Math.round(((spinRpm - 1700) / 500) * 100)))
      : 70;
  const powerScore = powerPct != null ? Math.max(30, Math.min(98, powerPct)) : 70;
  const popScore = popPct != null ? Math.max(30, Math.min(98, popPct)) : 70;
  const controlScore =
    powerPct != null ? Math.max(30, Math.min(98, 100 - Math.round(powerPct * 0.55))) : 70;
  const sweetSpot = twistPct != null ? Math.max(40, Math.min(95, twistPct)) : 72;
  const balance =
    balanceMm != null ? Math.max(-1, Math.min(1, (balanceMm - 238) / 20)) : 0;

  paddles.push({
    id: c.id,
    brand: c.brand,
    name: c.name,
    shape,
    core,
    face,
    texture,
    weightOz: weightOz ?? 8,
    thicknessMm: thicknessMm ?? 16,
    swingweight,
    twistWeight,
    balanceMm,
    balance: Math.round(balance * 100) / 100,
    gripCircumferenceIn: gripIn ?? 4.25,
    gripLengthIn: gripLen,
    edgeGuard: edgeFromBuild(row["Build Style"] || "", c.name),
    power: powerScore,
    control: controlScore,
    spin: spinScore,
    pop: popScore,
    sweetSpot,
    bias,
    feel: row["Impact Feel"]
      ? `${row["Impact Feel"]} impact feel on the Pickleball Effect measured unit.`
      : "Measured catalog paddle.",
    uniqueTrait: [
      thicknessMm != null ? `${thicknessMm}mm core` : null,
      swingweight != null ? `SW ${swingweight}` : null,
      spinRpm != null ? `${spinRpm} RPM spin` : null,
    ]
      .filter(Boolean)
      .join(" · "),
    bestFor: `${typeLabel || "All-court"} lean from measured firepower and control.`,
    notes:
      "Lab-measured static weight, swingweight, twist, balance, spin RPM, power MPH, and pop MPH from Pickleball Effect. Score bars map those percentiles for coaching compare — not manufacturer marketing sheets.",
    year: num(row["Year Released"]),
    approval: row["Approval Body"] || null,
    measured: {
      source: "pickleball-effect",
      powerMph,
      popMph,
      spinRpm,
      powerPercentile: powerPct,
      popPercentile: popPct,
      swingPercentile: swingPct,
      twistPercentile: twistPct,
      firepowerPercentile: pct(row["Firepower Percentile"]),
      gritType: row["Grit Type"] || null,
      paddleType: typeLabel || null,
      buildStyle: row["Build Style"] || null,
    },
    specsProvenance: "pickleball-effect-lab",
    imageProvenance: c.twCode ? "tennis-warehouse-cdn" : null,
  });

  if (c.twCode) {
    const twRow = tw.find((t) => t.code === c.twCode);
    imageCache[c.id] = {
      code: c.twCode,
      title: twRow ? twRow.title : `${c.brand} ${c.name}`,
      imageUrl: `https://img.tennis-warehouse.com/watermark/rs.php?path=${c.twCode}-1.jpg&nw=400`,
    };
  }
  console.log("OK", c.id, "SW", swingweight, "img", Boolean(c.twCode));
}

paddles.push({
  id: "racket-form-control-core-16",
  brand: "Racket Form",
  name: "Control Core 16mm",
  shape: "standard",
  core: "polymer",
  face: "composite",
  texture: "grit",
  weightOz: 7.8,
  thicknessMm: 16,
  swingweight: null,
  twistWeight: null,
  balanceMm: null,
  balance: -0.1,
  gripCircumferenceIn: 4.25,
  gripLengthIn: 5.0,
  edgeGuard: "standard",
  power: 45,
  control: 88,
  spin: 62,
  pop: 42,
  sweetSpot: 86,
  bias: "control",
  feel: "Soft polymer teaching model — dwell for dinks and resets.",
  uniqueTrait: "Coaching reference paddle — not a retail SKU.",
  bestFor: "Starters learning soft game before buying measured gear.",
  notes:
    "Racket Form teaching paddle with coaching estimates only. Compare against lab-measured catalog paddles above.",
  year: 2026,
  approval: null,
  measured: null,
  specsProvenance: "coaching-estimate",
  imageProvenance: null,
});

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, "paddles.snapshot.json"),
  JSON.stringify(
    {
      meta: {
        source: "Pickleball Effect lab spreadsheet + Tennis Warehouse CDN photos",
        sheet: "https://docs.google.com/spreadsheets/d/1CsQN9lFJge-QHjBdXE77stTxZHO90RmvXia20YG_JzA",
        updated: new Date().toISOString().slice(0, 10),
        count: paddles.length,
        note: "Measured specs from Pickleball Effect. Product photos from Tennis Warehouse CDN when matched. Score bars are percentile maps for coaching compare.",
      },
      paddles,
    },
    null,
    2,
  ),
);
fs.writeFileSync(
  path.join(outDir, "paddle-image-cache.json"),
  JSON.stringify(
    {
      meta: {
        source: "Tennis Warehouse CDN",
        count: Object.keys(imageCache).length,
        note: "Matched curated pickleball paddles to TW product codes for real photos.",
      },
      paddles: imageCache,
    },
    null,
    2,
  ),
);
console.log(`Wrote ${paddles.length} paddles, ${Object.keys(imageCache).length} images`);
