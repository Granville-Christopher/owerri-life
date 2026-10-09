import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dest = join(root, "public", "cars");
const UA = "OwerriLife/1.0 (educational city game; CC-BY/CC-BY-SA photos from Wikimedia Commons)";

const JOBS = [
  ["corolla", "Toyota Corolla E210 sedan"],
  ["camry-v6", "Toyota Camry XSE"],
  ["accord", "Honda Accord sedan"],
  ["hilux", "Toyota Hilux double cab"],
  ["lexus-rx", "Lexus RX 350"],
  ["benz-c300", "Mercedes-Benz C-Class sedan"],
  ["prado", "Toyota Land Cruiser Prado"],
  ["sports-coupe", "Ford Mustang GT coupe"],
  ["range-rover", "Range Rover Autobiography"],
  ["g-wagon", "Mercedes-Benz G 63 AMG"],
  ["bmw-m4", "BMW M4 Competition"],
  ["tesla-3", "Tesla Model 3"],
  ["porsche-911", "Porsche 911 Carrera"],
  ["tesla-s", "Tesla Model S"],
  ["maybach", "Mercedes-Maybach S-Class"],
  ["bentley", "Bentley Continental GT"],
  ["urus", "Lamborghini Urus"],
  ["huracan", "Lamborghini Huracan"],
  ["ferrari", "Ferrari 488"],
  ["rolls", "Rolls-Royce Phantom"],
  ["bugatti", "Bugatti Chiron"],
  ["okada", "Honda CG 125 motorcycle"],
  ["cab", "yellow taxi sedan"],
  ["bus", "green city bus"],
];

const DIRECT = {
  bugatti: "Bugatti_Chiron,_GIMS_2018,_Le_Grand-Saconnex_(1X7A1112).jpg",
  okada: "Honda_CG125.jpg",
  cab: "NYC_Taxi_Ford_Crown_Victoria.jpg",
  bus: "Arriva_London_bus_LV12_(LJ61_AZZ),_route_142,_24_April_2012.jpg",
  rolls: "Rolls-Royce_Phantom_VIII_1X7A0405.jpg",
};

const skip = /logo|icon|badge|emblem|engine|interior|dashboard|seat|wheel|cutaway|blueprint|svg|diagram/i;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function search(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|mime|size|extmetadata&iiurlwidth=1400&format=json`;
  let res = await fetch(url, { headers: { "User-Agent": UA } });
  if (res.status === 429) {
    await wait(4000);
    res = await fetch(url, { headers: { "User-Agent": UA } });
  }
  if (!res.ok) throw new Error(`search ${query}: ${res.status}`);
  const data = await res.json();
  const pages = Object.values(data.query?.pages ?? {});
  for (const page of pages) {
    const title = String(page.title ?? "");
    const info = page.imageinfo?.[0];
    if (!info || info.mime !== "image/jpeg") continue;
    if (skip.test(title)) continue;
    const src = info.thumburl || info.url;
    if (src) return { src, title, artist: info.extmetadata?.Artist?.value ?? "Wikimedia Commons" };
  }
  return null;
}

await mkdir(dest, { recursive: true });
const credits = ["# Real vehicle photos — Wikimedia Commons (CC-BY / CC-BY-SA)", ""];
for (const [id, query] of JOBS) {
  const file = `${id}.jpg`;
  try {
    await access(join(dest, file));
    console.log("HAVE", id);
    continue;
  } catch {
    /* download */
  }
  await wait(1200);
  let hit = DIRECT[id]
    ? { src: `https://commons.wikimedia.org/wiki/Special:FilePath/${DIRECT[id]}?width=1400`, title: `File:${DIRECT[id]}` }
    : await search(query);
  if (!hit) {
    console.error("MISS", id, query);
    continue;
  }
  let img = await fetch(hit.src, { headers: { "User-Agent": UA, Accept: "image/*" } });
  if (!img.ok && DIRECT[id]) {
    await wait(2500);
    img = await fetch(hit.src, { headers: { "User-Agent": UA, Accept: "image/*" } });
  }
  if (!img.ok) {
    hit = await search(query);
    if (!hit) {
      console.error("FAIL", id, img.status);
      continue;
    }
    img = await fetch(hit.src, { headers: { "User-Agent": UA } });
  }
  if (!img.ok) {
    console.error("FAIL", id, img.status);
    continue;
  }
  const buf = Buffer.from(await img.arrayBuffer());
  await writeFile(join(dest, file), buf);
  credits.push(`- ${file}: ${hit.title}`);
  console.log("OK", id, buf.length, hit.title);
}
await writeFile(join(dest, "CREDITS.txt"), `${credits.join("\n")}\n`);
console.log("done");
