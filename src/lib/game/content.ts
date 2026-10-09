import type { DreamId, FurnitureSpot, Gender, LookId, Placement, SkillKey, TraitId } from "./types";

export interface Look {
  id: LookId;
  name: string;
  gender: "male" | "female";
  shirt: string;
  skin: string;
  hair: string;
}

export const LOOKS: Look[] = [
  { id: "ada", name: "Ada", gender: "female", shirt: "#1f6b45", skin: "#f0c7a4", hair: "#2a211c" },
  { id: "chidi", name: "Chidi", gender: "male", shirt: "#245c78", skin: "#e0b08a", hair: "#1a1a1a" },
  { id: "ngozi", name: "Ngozi", gender: "female", shirt: "#7a3e6d", skin: "#f3d0b5", hair: "#4a2c22" },
  { id: "emeka", name: "Emeka", gender: "male", shirt: "#3d4f2f", skin: "#c98862", hair: "#241c16" },
  { id: "zara", name: "Zara", gender: "female", shirt: "#8c3d2f", skin: "#f6d7c3", hair: "#111111" },
  { id: "ibe", name: "Ibe", gender: "male", shirt: "#1d4e4a", skin: "#efd0b0", hair: "#3a2418" },
];

export interface Trait {
  id: TraitId;
  name: string;
  detail: string;
}

export const TRAITS: Trait[] = [
  { id: "sharp", name: "Sharp", detail: "Shifts go a little better." },
  { id: "charismatic", name: "Charismatic", detail: "Sucking up to Oga lands harder." },
  { id: "hustler", name: "Hustler", detail: "Market work teaches faster." },
  { id: "calm", name: "Calm", detail: "Energy drops slower." },
  { id: "funny", name: "Funny", detail: "Gisting fills social faster." },
  { id: "fit", name: "Fit", detail: "Energy drops slower." },
  { id: "creative", name: "Creative", detail: "Music and content shifts score higher." },
  { id: "loyal", name: "Loyal", detail: "Hanging out with friends counts for more." },
];

export interface Dream {
  id: DreamId;
  name: string;
  detail: string;
}

export const DREAMS: Dream[] = [
  { id: "big-man", name: "Big Man of Owerri", detail: "Reach level 5 on any career." },
  { id: "landlord", name: "Landlord in New Owerri", detail: "Reach ₦1,000,000 net cash." },
  { id: "sound", name: "Sound of Imo", detail: "Max out Music." },
  { id: "padi", name: "Everybody's Padi", detail: "Be friends with 4 people." },
  { id: "wetheral", name: "Wetheral King/Queen", detail: "Own a nightlife business. Later phase." },
];

export interface Career {
  id: string;
  name: string;
  skill: SkillKey;
  placeId: string;
  l1: number;
  l5: number;
}

export const CAREERS: Career[] = [
  { id: "police", name: "Police officer", skill: "fitness", placeId: "state-cid", l1: 5500, l5: 90000 },
  { id: "software", name: "Software developer", skill: "coding", placeId: "gadgets-plug", l1: 9000, l5: 180000 },
  { id: "it-support", name: "IT support", skill: "coding", placeId: "easy-life", l1: 5000, l5: 95000 },
  { id: "phone-tech", name: "Phone technician", skill: "coding", placeId: "sugar-gadgets", l1: 3500, l5: 72000 },
  { id: "club-dj", name: "Club DJ", skill: "music", placeId: "cartel-lounge", l1: 3000, l5: 60000 },
  { id: "trading", name: "Trading", skill: "hustle", placeId: "eke-ukwu", l1: 3000, l5: 42000 },
  { id: "banking", name: "Banking", skill: "charisma", placeId: "city-bank", l1: 4200, l5: 48000 },
  { id: "nursing", name: "Nursing", skill: "fitness", placeId: "teaching-hospital", l1: 3300, l5: 50000 },
  { id: "chef", name: "Chef", skill: "cooking", placeId: "mangrove-grill", l1: 2700, l5: 47000 },
  { id: "content", name: "Content Creator", skill: "charisma", placeId: "nworie-park", l1: 2400, l5: 60000 },
];

export interface Home {
  id: string;
  areaId: string;
  name: string;
  tier: string;
  rent: number;
  beds: number;
  upstairs: boolean;
  price?: number;
}

export type FurnitureGroup = "Sleep" | "Parlour" | "Kitchen" | "Fun" | "Decor";

export interface FurnitureItem {
  id: string;
  name: string;
  cost: number;
  group: FurnitureGroup;
  where: FurnitureSpot;
  w: number;
  d: number;
  fx: number;
  fz: number;
  rot: number;
}

export const FURNITURE_GROUPS: FurnitureGroup[] = ["Sleep", "Parlour", "Kitchen", "Fun", "Decor"];

const F = Math.PI;
export const FURNITURE: FurnitureItem[] = [
  { id: "bed", name: "Single bed", cost: 20_000_000, group: "Sleep", where: "room", w: 2.4, d: 2.1, fx: -0.5, fz: -1.4, rot: 0 },
  { id: "double-bed", name: "Double bed", cost: 65_000_000, group: "Sleep", where: "room", w: 3.2, d: 2.4, fx: -0.3, fz: -1.4, rot: 0 },
  { id: "wardrobe", name: "Wardrobe", cost: 28_000_000, group: "Sleep", where: "room", w: 1.9, d: 0.7, fx: 0.8, fz: -1.5, rot: 0 },
  { id: "bedside", name: "Bedside table", cost: 7_000_000, group: "Sleep", where: "room", w: 0.6, d: 0.5, fx: 0.15, fz: -1.4, rot: 0 },
  { id: "mirror", name: "Dressing mirror", cost: 22_000_000, group: "Sleep", where: "room", w: 1.5, d: 0.8, fx: 0.55, fz: -1.5, rot: 0 },
  { id: "sofa", name: "Sofa", cost: 35_000_000, group: "Parlour", where: "parlour", w: 3.1, d: 1.15, fx: 0.1, fz: -1.1, rot: 0 },
  { id: "armchair", name: "Armchair", cost: 14_000_000, group: "Parlour", where: "parlour", w: 1.3, d: 1.2, fx: -0.65, fz: -0.5, rot: 0.5 },
  { id: "table", name: "Centre table", cost: 12_000_000, group: "Parlour", where: "parlour", w: 2.8, d: 1.5, fx: 0.1, fz: -0.2, rot: 0 },
  { id: "shelf", name: "Bookshelf", cost: 18_000_000, group: "Parlour", where: "parlour", w: 1.8, d: 0.5, fx: 1, fz: -1.5, rot: 0 },
  { id: "television", name: "Television and stand", cost: 80_000_000, group: "Fun", where: "parlour", w: 1.9, d: 0.6, fx: 0.1, fz: 0.95, rot: F },
  { id: "speaker", name: "Sound system", cost: 30_000_000, group: "Fun", where: "parlour", w: 2.2, d: 0.6, fx: -0.8, fz: 0.95, rot: F },
  { id: "desk", name: "Desk and computer", cost: 40_000_000, group: "Fun", where: "parlour", w: 1.7, d: 0.9, fx: -1, fz: -1.5, rot: 0 },
  { id: "fridge", name: "Fridge", cost: 55_000_000, group: "Kitchen", where: "kitchen", w: 0.95, d: 0.8, fx: 0.9, fz: -1.3, rot: 0 },
  { id: "freezer", name: "Chest freezer", cost: 70_000_000, group: "Kitchen", where: "kitchen", w: 1.5, d: 0.85, fx: -1.3, fz: 0.3, rot: Math.PI / 2 },
  { id: "cooker", name: "Gas cooker", cost: 38_000_000, group: "Kitchen", where: "kitchen", w: 0.95, d: 0.8, fx: 0.4, fz: -1.3, rot: 0 },
  { id: "microwave", name: "Microwave on a stand", cost: 16_000_000, group: "Kitchen", where: "kitchen", w: 0.9, d: 0.6, fx: 0.05, fz: -1.3, rot: 0 },
  { id: "dining", name: "Dining table and chairs", cost: 45_000_000, group: "Kitchen", where: "kitchen", w: 2.6, d: 1.9, fx: 0, fz: 0.7, rot: 0 },
  { id: "rug", name: "Green rug", cost: 9_000_000, group: "Decor", where: "parlour", w: 5, d: 3.2, fx: 0.1, fz: -0.2, rot: 0 },
  { id: "lamp", name: "Floor lamp", cost: 8_000_000, group: "Decor", where: "parlour", w: 0.5, d: 0.5, fx: 0.65, fz: -1.3, rot: 0 },
  { id: "plant", name: "House plant", cost: 4_000_000, group: "Decor", where: "parlour", w: 0.8, d: 0.8, fx: -1, fz: -1.3, rot: 0 },
];

export function furnitureById(id: string) {
  return FURNITURE.find((item) => item.id === id) ?? null;
}

export function furnitureInstances(list: string[]) {
  const seen: Record<string, number> = {};
  return list.map((id) => {
    const n = seen[id] ?? 0;
    seen[id] = n + 1;
    return { key: `${id}:${n}`, id, n };
  });
}

export function roomSize(spot: FurnitureSpot | "bathroom" | "landing", beds: number, upstairs: boolean, duplex: boolean) {
  const studio = beds <= 1 && !upstairs;
  if (spot === "kitchen") return { w: 14, d: 10 };
  if (spot === "bathroom") return { w: 9, d: 7.5 };
  if (spot === "landing") return { w: duplex ? 20 : 16, d: duplex ? 10 : 9 };
  if (spot === "room") return studio ? { w: 14, d: 10.5 } : { w: 13, d: 10 };
  return { w: duplex ? 20 : beds > 1 ? 16 : 14, d: duplex ? 13.5 : 10.5 };
}

export function duplexStairBox(home: Home) {
  if (!home.id.includes("duplex")) return null;
  const size = roomSize("parlour", home.beds, home.upstairs, true);
  return { minX: size.w / 2 - 3.6, maxX: size.w / 2 + 0.15, minZ: -2.4, maxZ: size.d / 2 - 0.2 };
}

export function clampPlacement(item: FurnitureItem, home: Home, p: Placement): Placement {
  const duplex = home.id.includes("duplex");
  const size = roomSize(p.spot, home.beds, home.upstairs, duplex);
  const turned = Math.abs(Math.sin(p.rot)) > 0.7;
  const hw = (turned ? item.d : item.w) / 2;
  const hd = (turned ? item.w : item.d) / 2;
  let maxX = Math.max(0, size.w / 2 - hw - 0.25);
  const minZ = -size.d / 2 + hd + 0.2;
  const maxZ = Math.max(minZ, size.d / 2 - hd - 0.1);
  if (duplex && p.spot === "parlour") {
    const stair = duplexStairBox(home);
    if (stair) maxX = Math.min(maxX, stair.minX - hw - 0.35);
  }
  return {
    ...p,
    x: Math.round(Math.min(maxX, Math.max(-maxX, p.x)) * 100) / 100,
    z: Math.round(Math.min(maxZ, Math.max(minZ, p.z)) * 100) / 100,
    rot: Math.round((((p.rot % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) * 1000) / 1000,
  };
}

export function placeIn(item: FurnitureItem, home: Home, spot: FurnitureSpot, roomNo: number, shift: number): Placement {
  const size = roomSize(spot, home.beds, home.upstairs, home.id.includes("duplex"));
  return clampPlacement(item, home, {
    homeId: home.id,
    spot,
    roomNo,
    x: item.fx * (size.w / 2 - 1.4) + shift,
    z: item.fz * (size.d / 2 - 1.3),
    rot: item.rot,
  });
}

const DUPLEX_SEATS: Record<string, { x: number; z: number; rot: number }> = {
  sofa: { x: -3.4, z: -2.35, rot: 0 },
  armchair: { x: -6.35, z: 0.15, rot: 0.72 },
  table: { x: -3.2, z: 0.2, rot: 0 },
  rug: { x: -3.2, z: 0.15, rot: 0 },
  television: { x: -3.2, z: 4.35, rot: Math.PI },
  speaker: { x: -5.45, z: 4.35, rot: Math.PI },
  lamp: { x: -1.15, z: -2.55, rot: 0 },
  plant: { x: -7.6, z: 3.7, rot: 0 },
  shelf: { x: -7.7, z: -4.55, rot: 0 },
  desk: { x: 1.15, z: -4.4, rot: 0 },
};

export function defaultPlacement(item: FurnitureItem, home: Home, n: number): Placement {
  const studio = home.beds <= 1 && !home.upstairs;
  const spot: FurnitureSpot = studio ? "room" : item.where;
  const roomNo = spot === "room" && !studio ? 1 + (n % Math.max(home.beds, 1)) : 1;
  const seat = home.id.includes("duplex") && spot === "parlour" ? DUPLEX_SEATS[item.id] : null;
  if (seat) {
    return clampPlacement(item, home, { homeId: home.id, spot, roomNo, x: seat.x, z: seat.z, rot: seat.rot });
  }
  return placeIn(item, home, spot, roomNo, spot === "room" && !studio ? 0 : n * 1.1);
}

export function fillLayout(furniture: string[], layout: Record<string, Placement> | undefined, homeId: string) {
  const next: Record<string, Placement> = {};
  const home = homeById(homeId);
  for (const piece of furnitureInstances(furniture)) {
    const item = furnitureById(piece.id);
    if (!item) continue;
    const kept = layout?.[piece.key];
    const placed = kept && HOMES.some((entry) => entry.id === kept.homeId) ? kept : defaultPlacement(item, home, piece.n);
    const stair = placed.spot === "parlour" ? duplexStairBox(homeById(placed.homeId)) : null;
    const onStair = stair && placed.x + item.w / 2 > stair.minX && placed.x - item.w / 2 < stair.maxX && placed.z + item.d / 2 > stair.minZ && placed.z - item.d / 2 < stair.maxZ;
    next[piece.key] = onStair ? defaultPlacement(item, home, piece.n) : placed;
  }
  return next;
}

export const HOMES: Home[] = [
  { id: "ikenegbu-room", areaId: "ikenegbu", name: "Ekwema Crescent room", tier: "Cheapest", rent: 2500, beds: 1, upstairs: false },
  { id: "ikenegbu-2bed", areaId: "ikenegbu", name: "Chukwuma Nwonadi St 2-bed flat", tier: "2-bed", rent: 8000, beds: 2, upstairs: false, price: 220000 },
  { id: "world-bank-flat", areaId: "world-bank", name: "Egwumba Street 2-bed flat", tier: "2-bed", rent: 7000, beds: 2, upstairs: false },
  { id: "world-bank-3bed", areaId: "world-bank", name: "World Bank Area L 3-bed flat", tier: "3-bed", rent: 14000, beds: 3, upstairs: false, price: 480000 },
  { id: "aladinma-flat", areaId: "aladinma", name: "Amaze Njoku St 3-bed flat", tier: "3-bed", rent: 18000, beds: 3, upstairs: false },
  { id: "aladinma-4bed", areaId: "aladinma", name: "Lake Nwaebere 4-bed flat", tier: "4-bed", rent: 28000, beds: 4, upstairs: true, price: 1200000 },
  { id: "new-owerri-flat", areaId: "new-owerri", name: "Harmony Heights mini-flat", tier: "High", rent: 60000, beds: 1, upstairs: false },
  { id: "new-owerri-2bed", areaId: "new-owerri", name: "Royal Gardens 2-bed flat", tier: "2-bed", rent: 24000, beds: 2, upstairs: false, price: 750000 },
  { id: "new-owerri-3bed", areaId: "new-owerri", name: "Harmony Heights 3-bed flat", tier: "3-bed", rent: 38000, beds: 3, upstairs: false, price: 1400000 },
  { id: "new-owerri-4bed", areaId: "new-owerri", name: "Royal Gardens 4-bed flat", tier: "4-bed", rent: 55000, beds: 4, upstairs: true, price: 2400000 },
  { id: "new-owerri-duplex", areaId: "new-owerri", name: "Harmony Heights duplex", tier: "Duplex", rent: 95000, beds: 4, upstairs: true, price: 4200000 },
];

export interface Place {
  id: string;
  name: string;
  area: string;
  kind: "nightlife" | "food" | "market" | "public" | "work" | "home" | "health" | "hotel" | "pickup" | "school" | "airport";
  x: number;
  y: number;
  hours: string;
  tier: string;
  summary: string;
  activities: string[];
}

export const PLACES: Place[] = [
  {
    id: "wetheral-strip",
    name: "Wetheral Strip",
    area: "Egbu Road",
    kind: "nightlife",
    x: 104,
    y: 32,
    hours: "22:00 – 05:00",
    tier: "Nightlife",
    summary: "The nightlife street on the open ground beside Owerri Mall, just east of the road.",
    activities: ["Drinks", "Dance", "Spray money"],
  },
  {
    id: "cartel-lounge",
    name: "Cartel Lifestyle",
    area: "New Owerri",
    kind: "nightlife",
    x: 78,
    y: 72,
    hours: "22:00 – 05:00",
    tier: "Club",
    summary: "The big club. Park outside, step out, then enter for drinks, dance, and spraying money. DJ shifts run here.",
    activities: ["Drinks", "Dance", "Spray money", "Club DJ shifts"],
  },
  {
    id: "orange-room",
    name: "Orange Room",
    area: "New Owerri",
    kind: "nightlife",
    x: 50,
    y: 76,
    hours: "22:00 – 05:00",
    tier: "Lounge",
    summary: "Claret Academy Street, 2nd Round, on the World Bank estate side of New Owerri. The bus stop outside carries the same name. Not Wetheral.",
    activities: ["Drinks", "Dance", "Spray money"],
  },
  {
    id: "cartel-beach",
    name: "Cartel Beach House",
    area: "New Owerri",
    kind: "public",
    x: 58,
    y: 86,
    hours: "Always open",
    tier: "Beach bar",
    summary: "Ikenna Nzimiro Avenue. The beach house, not the club. Drinks, a grill, and a slower evening.",
    activities: ["Hang out", "Eat", "Drinks"],
  },
  {
    id: "heartland-resort",
    name: "Heartland Resort",
    area: "Owerri",
    kind: "public",
    x: 34,
    y: 78,
    hours: "Always open",
    tier: "Relaxation",
    summary: "The new Owerri beach. Vendors, games, and open ground. It is not Cartel Beach House.",
    activities: ["Hang out", "Eat", "Drinks"],
  },
  {
    id: "channel-garden",
    name: "Channel Garden",
    area: "Wetheral",
    kind: "nightlife",
    x: 36,
    y: 60,
    hours: "22:00 – 05:00",
    tier: "Outdoor bar",
    summary: "Open-air bar. Music outside, cars along the fence.",
    activities: ["Drinks", "Dance"],
  },
  {
    id: "zuma-grill",
    name: "Zuma Grill",
    area: "Centre",
    kind: "nightlife",
    x: 60,
    y: 64,
    hours: "12:00 – 05:00",
    tier: "Food and nightlife",
    summary: "Grill by day, lounge by night. Eat, drink, or dance.",
    activities: ["Eat", "Drinks", "Dance", "Spray money"],
  },
  {
    id: "ibari-village",
    name: "Ibari Village",
    area: "Ibari",
    kind: "nightlife",
    x: 28,
    y: 72,
    hours: "22:00 – 05:00",
    tier: "Live music",
    summary: "Live music, local food, and an open yard.",
    activities: ["Eat", "Drinks", "Dance"],
  },
  {
    id: "eke-ukwu",
    name: "Eke Ukwu Market",
    area: "Centre",
    kind: "market",
    x: 52,
    y: 48,
    hours: "07:00 – 19:00",
    tier: "Market",
    summary: "Traders, loaders, and a chemist stall for mild sickness.",
    activities: ["Trading shifts", "Chemist", "Hang out"],
  },
  {
    id: "city-bank",
    name: "City Centre Bank",
    area: "Centre",
    kind: "work",
    x: 60,
    y: 40,
    hours: "08:00 – 16:00",
    tier: "Work",
    summary: "Banking careers clock in at the hall on the centre road.",
    activities: ["Banking shifts"],
  },
  {
    id: "teaching-hospital",
    name: "Federal Teaching Hospital",
    area: "Orlu Road",
    kind: "health",
    x: 28,
    y: 28,
    hours: "Always open",
    tier: "Health",
    summary: "Federal Teaching Hospital, Owerri. 105 Hospital Road, off Orlu Road. Emergency is open all night. Severe sickness can be treated here. ₦8,000.",
    activities: ["Nursing shifts", "Treatment"],
  },
  {
    id: "general-hospital",
    name: "General Hospital",
    area: "Wetheral Road",
    kind: "health",
    x: 38,
    y: 20,
    hours: "Always open",
    tier: "Health",
    summary: "The old General Hospital, on the Wetheral side of town. Public wards. Severe sickness can be treated here. ₦5,000.",
    activities: ["Treatment"],
  },
  {
    id: "umezuruike-hospital",
    name: "Umezuruike Hospital",
    area: "Wetheral Road",
    kind: "health",
    x: 48,
    y: 30,
    hours: "Always open",
    tier: "Health",
    summary: "21/23 Umezuruike Street. A private hospital that has been in Owerri since after the war. Severe sickness can be treated here. ₦12,000.",
    activities: ["Treatment"],
  },
  {
    id: "st-davids",
    name: "St David's Hospital",
    area: "Mbari Road",
    kind: "health",
    x: 44,
    y: 46,
    hours: "Always open",
    tier: "Health",
    summary: "14 Mbari Road. A private hospital in the centre. Severe sickness can be treated here. ₦10,000.",
    activities: ["Treatment"],
  },
  {
    id: "shelly-hospital",
    name: "Shelly Hospital",
    area: "Aladinma",
    kind: "health",
    x: 78,
    y: 40,
    hours: "Always open",
    tier: "Health",
    summary: "Shelly Hospital, Aladinma, off Port Harcourt Road. Severe sickness can be treated here. ₦11,000.",
    activities: ["Treatment"],
  },
  {
    id: "imo-specialist",
    name: "Imo Specialist Hospital",
    area: "Umuguma",
    kind: "health",
    x: 72,
    y: 52,
    hours: "Always open",
    tier: "Health",
    summary: "Imo Specialist Hospital, Umuguma, New Owerri. Severe sickness can be treated here. ₦15,000.",
    activities: ["Treatment"],
  },
  {
    id: "mangrove-grill",
    name: "Mangrove",
    area: "Ikenegbu",
    kind: "food",
    x: 96,
    y: 46,
    hours: "11:00 – 23:00",
    tier: "Mid-high",
    summary: "Mangrove grill, Ikenegbu. A proper plate, a bar, and the kitchen where chefs work.",
    activities: ["Eat", "Drinks", "Chef shifts"],
  },
  {
    id: "donalds",
    name: "Donald's Place",
    area: "Centre",
    kind: "food",
    x: 50,
    y: 56,
    hours: "08:00 – 22:00",
    tier: "Mid",
    summary: "A mid-range plate and a cold drink.",
    activities: ["Eat", "Drinks"],
  },
  {
    id: "dominos",
    name: "Domino's Pizza",
    area: "Centre",
    kind: "food",
    x: 58,
    y: 56,
    hours: "09:00 – 21:00",
    tier: "Pizza",
    summary: "Beside Donald's. The real shop is Plot F, 10 Achike Udenwa Avenue, New Owerri. Pizza, a cold drink, and a booth.",
    activities: ["Eat", "Drinks"],
  },
  {
    id: "cold-stone",
    name: "Cold Stone",
    area: "Centre",
    kind: "food",
    x: 58,
    y: 64,
    hours: "09:00 – 22:00",
    tier: "Ice cream",
    summary: "Cold Stone Creamery, Plot F10, Achike Udenwa Avenue. The shop sits back from the road, beside Domino's. Ice cream mixed on a frozen stone slab.",
    activities: ["Eat"],
  },
  {
    id: "kilimanjaro",
    name: "Kilimanjaro Eatery",
    area: "World Bank side",
    kind: "food",
    x: 34,
    y: 54,
    hours: "10:00 – 21:00",
    tier: "Mid",
    summary: "Reliable mid-range food.",
    activities: ["Eat"],
  },
  {
    id: "november-5",
    name: "November 5 Kitchen",
    area: "Aladinma",
    kind: "food",
    x: 84,
    y: 42,
    hours: "11:00 – 22:00",
    tier: "Mid",
    summary: "A restaurant in Aladinma, not a roadside eatery. Plates downstairs, a room upstairs.",
    activities: ["Eat"],
  },
  {
    id: "nworie-park",
    name: "Nworie Park",
    area: "Nworie",
    kind: "public",
    x: 36,
    y: 66,
    hours: "06:00 – 18:00",
    tier: "Free",
    summary: "Open ground by the river. Creators shoot here.",
    activities: ["Hang out", "Content shifts"],
  },
  {
    id: "mama-nkechi",
    name: "Mama Nkechi Buka",
    area: "Ikenegbu",
    kind: "food",
    x: 76,
    y: 56,
    hours: "06:30 – 21:00",
    tier: "Cheap",
    summary: "The broke-player default. Rice, stew, and gist.",
    activities: ["Eat", "Hang out"],
  },
  {
    id: "ikenegbu",
    name: "Ikenegbu",
    area: "Ikenegbu",
    kind: "home",
    x: 86,
    y: 40,
    hours: "Your room if you live here",
    tier: "Cheapest rent",
    summary: "Rooms and self-contain. Cheapest rent in the city.",
    activities: ["Sleep and shower if this is home"],
  },
  {
    id: "world-bank",
    name: "World Bank",
    area: "World Bank",
    kind: "home",
    x: 20,
    y: 50,
    hours: "Your flat if you live here",
    tier: "Low-mid rent",
    summary: "Quiet flats west of the centre.",
    activities: ["Sleep and shower if this is home"],
  },
  {
    id: "aladinma",
    name: "Aladinma",
    area: "Aladinma",
    kind: "home",
    x: 74,
    y: 24,
    hours: "Your flat if you live here",
    tier: "Mid rent",
    summary: "A mid-rent neighbourhood toward the north-east.",
    activities: ["Sleep and shower if this is home"],
  },
  {
    id: "new-owerri",
    name: "New Owerri",
    area: "New Owerri",
    kind: "home",
    x: 68,
    y: 80,
    hours: "Your place if you live here",
    tier: "High rent",
    summary: "Mini-flats and duplexes. The landlord dream lives here.",
    activities: ["Sleep and shower if this is home"],
  },
  {
    id: "relief-market",
    name: "Relief Market",
    area: "Wetheral by MCC",
    kind: "market",
    x: 70,
    y: 36,
    hours: "07:00 – 19:00",
    tier: "Market",
    summary: "Relief, on Wetheral Road by MCC. The stadium lane comes in beside the stalls. Stock, gist, and street food.",
    activities: ["Hang out", "Eat"],
  },
  {
    id: "everyday",
    name: "Everyday Supermarket",
    area: "World Bank",
    kind: "market",
    x: 20,
    y: 40,
    hours: "08:00 – 20:30",
    tier: "Shop",
    summary: "Everyday Supermarket on the open land at Ibis Royale, Area A, World Bank Road, beside Assumpta Cathedral. Set back off the road.",
    activities: ["Groceries", "Household"],
  },
  {
    id: "ikenegbu-market",
    name: "Ikenegbu Market",
    area: "Ikenegbu",
    kind: "market",
    x: 94,
    y: 46,
    hours: "07:00 – 19:00",
    tier: "Market",
    summary: "Neighbourhood market beside the rooms.",
    activities: ["Hang out"],
  },
  {
    id: "owerri-mall",
    name: "Owerri Mall",
    area: "Egbu Road",
    kind: "market",
    x: 92,
    y: 30,
    hours: "10:00 – 21:00",
    tier: "Mall",
    summary: "3 Egbu Road. Shops, air conditioning, and a food court. This is not New Owerri.",
    activities: ["Eat", "Hang out"],
  },
  {
    id: "assumpta-cathedral",
    name: "Assumpta Cathedral",
    area: "World Bank",
    kind: "public",
    x: 14,
    y: 40,
    hours: "06:00 – 20:00",
    tier: "Church",
    summary: "Maria Assumpta Cathedral on the open land at Ibis Royale, Area A, World Bank Road. The dome is set back off the road.",
    activities: ["Mass", "Quiet"],
  },
  {
    id: "heroes-square",
    name: "Heroes Square",
    area: "Wetheral",
    kind: "public",
    x: 46,
    y: 38,
    hours: "Always open",
    tier: "Public",
    summary: "The iconic stadium arena on Wetheral Road. Full football pitch, athletics track, grandstands, floodlights, matchdays, and evening rallies.",
    activities: ["Hang out", "Watch Match", "Run Track"],
  },
  {
    id: "mbari",
    name: "Mbari Art Centre",
    area: "Centre",
    kind: "public",
    x: 48,
    y: 52,
    hours: "10:00 – 18:00",
    tier: "Culture",
    summary: "Museum and art centre. Quiet rooms, then the street again.",
    activities: ["Hang out"],
  },
  {
    id: "amusement-park",
    name: "Amusement Park",
    area: "West",
    kind: "public",
    x: 18,
    y: 64,
    hours: "11:00 – 20:00",
    tier: "Fun",
    summary: "Rides and noise. Fun goes up, cash goes down.",
    activities: ["Hang out"],
  },
  {
    id: "sam-mbakwe",
    name: "Sam Mbakwe Airport",
    area: "Ngor Okpala",
    kind: "airport",
    x: 118,
    y: 6,
    hours: "Always open",
    tier: "Airport",
    summary: "Imo Airport. One payment covers the flight and the stay. When the days finish, you are back inside your house.",
    activities: ["Fly out", "Come home"],
  },
  {
    id: "oguta-lake",
    name: "Oguta Lake",
    area: "Day trip",
    kind: "public",
    x: 10,
    y: 82,
    hours: "08:00 – 18:00",
    tier: "Day trip",
    summary: "A longer ride out of town. Water, photos, and pepper soup.",
    activities: ["Eat", "Hang out"],
  },
  {
    id: "imsu",
    name: "IMSU",
    area: "Okigwe Road",
    kind: "school",
    x: 76,
    y: 14,
    hours: "08:00 – 16:00",
    tier: "University",
    summary: "Imo State University, Owerri campus. Apply for a course and you are admitted. Pay the fees, then sit your lectures.",
    activities: ["Apply", "Lectures", "Drop out"],
  },
  {
    id: "futo",
    name: "FUTO",
    area: "Ihiagwa",
    kind: "school",
    x: 8,
    y: 74,
    hours: "08:00 – 16:00",
    tier: "University",
    summary: "Federal University of Technology, Owerri. The campus is in Ihiagwa. Apply and you are admitted, or visit and meet people.",
    activities: ["Apply", "Lectures", "Drop out"],
  },
  {
    id: "fedpoly-nekede",
    name: "Federal Polytechnic Nekede",
    area: "Nekede",
    kind: "school",
    x: 26,
    y: 88,
    hours: "08:00 – 16:00",
    tier: "Polytechnic",
    summary: "Federal Polytechnic, Nekede. Apply and you are admitted. You can also visit to meet people.",
    activities: ["Apply", "Lectures", "Drop out"],
  },
  {
    id: "campus-gate",
    name: "Campus Gate",
    area: "Ihiagwa",
    kind: "public",
    x: 18,
    y: 74,
    hours: "Always open",
    tier: "Campus",
    summary: "The road into FUTO at Ihiagwa. It stops at the campus gate.",
    activities: ["Hang out"],
  },
  {
    id: "stadium",
    name: "Dan Anyiam Stadium",
    area: "Wetheral",
    kind: "public",
    x: 34,
    y: 12,
    hours: "09:00 – 22:00",
    tier: "Sports",
    summary: "Dan Anyiam Stadium sits behind General Hospital, beside the Owerri West palms. Full pitch, stands, floodlights, and matchdays.",
    activities: ["Hang out", "Watch Match", "Run Track"],
  },
  {
    id: "owerri-west-palms",
    name: "Owerri West Palms",
    area: "Owerri West",
    kind: "public",
    x: 26,
    y: 12,
    hours: "06:00 – 18:00",
    tier: "Farm",
    summary: "Palm stands on the Owerri West side, next to Dan Anyiam Stadium and behind General Hospital.",
    activities: ["Hang out"],
  },
  {
    id: "state-cid",
    name: "State CID",
    area: "Port Harcourt Road",
    kind: "public",
    x: 48,
    y: 66,
    hours: "Always open",
    tier: "Police",
    summary: "State Criminal Investigation Department. Report an activity or call the police on a resident. No officer stands here. The system sends the invite, and it makes the arrest if they do not come in.",
    activities: ["Report an activity", "Call the police", "Honour an invite"],
  },
  {
    id: "polling-unit",
    name: "Polling Unit 001",
    area: "Centre",
    kind: "public",
    x: 58,
    y: 20,
    hours: "08:00 – 16:00",
    tier: "Civic",
    summary: "Where the city votes when a governor race is on.",
    activities: ["Hang out"],
  },
  {
    id: "budget-lodge",
    name: "Budget Lodge",
    area: "Works Layout",
    kind: "hotel",
    x: 30,
    y: 70,
    hours: "Always open",
    tier: "Low",
    summary: "Small guesthouse. ₦8,000 a night or ₦2,500 an hour. A place to sleep and recover.",
    activities: ["Book a room", "Sleep"],
  },
  {
    id: "business-hotel",
    name: "Business Hotel",
    area: "Tetlow Road",
    kind: "hotel",
    x: 58,
    y: 28,
    hours: "Always open",
    tier: "Medium",
    summary: "Mid-range hotel on Tetlow Road, the phone street between here and IMSU. ₦35,000 a night. Lobby, rooms, and a quiet bar.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "anonymous-gadgets",
    name: "Anonymous Gadgets",
    area: "Tetlow Road",
    kind: "work",
    x: 64,
    y: 20,
    hours: "08:30 – 17:30",
    tier: "Phones",
    summary: "Anonymous Gadgets, 49 Tetlow Road. Phones and gadgets on the street between the Business Hotel and IMSU.",
    activities: ["Phones", "Gadgets"],
  },
  {
    id: "sugar-gadgets",
    name: "Sugar Gadgets",
    area: "Tetlow Road",
    kind: "work",
    x: 64,
    y: 22,
    hours: "09:00 – 18:00",
    tier: "Phones",
    summary: "Sugar Gadgets on Tetlow Road. Phones, accessories, and repairs along the vendor street.",
    activities: ["Phones", "Gadgets"],
  },
  {
    id: "buc-phones",
    name: "BUC Phones",
    area: "Tetlow Road",
    kind: "work",
    x: 66,
    y: 18,
    hours: "09:00 – 18:00",
    tier: "Phones",
    summary: "BUC Phones, 49 Tetlow Road. A full phone shop on the IMSU side of the street.",
    activities: ["Phones", "Gadgets"],
  },
  {
    id: "elion-phones",
    name: "Elion Phones",
    area: "Tetlow Road",
    kind: "work",
    x: 66,
    y: 26,
    hours: "09:00 – 18:00",
    tier: "Phones",
    summary: "Elion Phones and Accessories, 17 Tetlow Road.",
    activities: ["Phones", "Accessories"],
  },
  {
    id: "ocha-gadgets",
    name: "Ocha Gadgets",
    area: "Tetlow Road",
    kind: "work",
    x: 68,
    y: 16,
    hours: "08:30 – 18:00",
    tier: "Phones",
    summary: "Ocha Gadgets, 17 Tetlow Road. Phones on the same vendor row.",
    activities: ["Phones", "Gadgets"],
  },
  {
    id: "maxii-gadgets",
    name: "Maxii Gadgets",
    area: "Tetlow Road",
    kind: "work",
    x: 68,
    y: 28,
    hours: "08:30 – 18:30",
    tier: "Phones",
    summary: "Maxii Gadgets, 44 Njemanze Road at Tetlow Road.",
    activities: ["Phones", "Gadgets"],
  },
  {
    id: "easy-life",
    name: "Easy Life Gadgets",
    area: "Tetlow Road",
    kind: "work",
    x: 62,
    y: 16,
    hours: "07:30 – 18:30",
    tier: "Phones",
    summary: "Easy Life Gadgets, 5 Tetlow Road.",
    activities: ["Phones", "Gadgets"],
  },
  {
    id: "gadgets-plug",
    name: "Gadgets Plug Hub",
    area: "Tetlow Road",
    kind: "work",
    x: 62,
    y: 28,
    hours: "09:00 – 18:00",
    tier: "Phones",
    summary: "Gadgets Plug Hub, 4 Tetlow Road.",
    activities: ["Phones", "Gadgets"],
  },
  {
    id: "concord-hotel",
    name: "Concord Hotel",
    area: "Port Harcourt Road",
    kind: "hotel",
    x: 74,
    y: 68,
    hours: "Always open",
    tier: "High",
    summary: "Imo Concord Hotel, Port Harcourt Road, New Owerri. ₦150,000 a night. Park under the canopy, then the lobby or the club.",
    activities: ["Book a room", "Drinks", "Dance", "Spray money"],
  },
  {
    id: "concord-avenue",
    name: "Concord Avenue",
    area: "Port Harcourt Road",
    kind: "pickup",
    x: 70,
    y: 62,
    hours: "22:00 – 05:00",
    tier: "Pickup",
    summary: "Adults who opted in are listed here. Offers stay in-game. The scene fades to black. Nothing explicit.",
    activities: ["See who is listed", "Send an offer"],
  },
  {
    id: "works-layout",
    name: "Works Layout",
    area: "Works Layout",
    kind: "pickup",
    x: 22,
    y: 58,
    hours: "22:00 – 05:00",
    tier: "Pickup",
    summary: "A pickup street. Tap her, pay the price on her head, and the scene fades to black. The naira is added to her.",
    activities: ["See who is listed", "Send an offer"],
  },
  {
    id: "hospital-junction",
    name: "Hospital Junction",
    area: "Hospital Junction",
    kind: "pickup",
    x: 28,
    y: 26,
    hours: "22:00 – 05:00",
    tier: "Pickup",
    summary: "The third pickup zone. Tap her, pay her price, and the scene fades to black. The naira is added to her.",
    activities: ["See who is listed", "Send an offer"],
  },
  {
    id: "rockview-hotel",
    name: "Rockview Hotel",
    area: "Government Station",
    kind: "hotel",
    x: 50,
    y: 8,
    hours: "Always open",
    tier: "High",
    summary: "Plot CP2, Government Station Layout. Reach it from Wetheral Road or Okigwe Road. ₦90,000 a night. A bar in the lobby.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "all-seasons",
    name: "All Seasons Hotel",
    area: "New Owerri",
    kind: "hotel",
    x: 60,
    y: 80,
    hours: "Always open",
    tier: "High",
    summary: "All Seasons Avenue, off Port Harcourt Road. Pool, gym, and a restaurant. ₦130,000 a night.",
    activities: ["Book a room", "Drinks", "Eat"],
  },
  {
    id: "titanium-hotel",
    name: "Titanium Hotel",
    area: "New Owerri",
    kind: "hotel",
    x: 68,
    y: 94,
    hours: "Always open",
    tier: "Relaxation",
    summary: "Max Aluminium Road, off Port Harcourt Road. Suites and a pool. ₦55,000 a night.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "oxygen-resort",
    name: "Oxygen Hotel",
    area: "New Owerri",
    kind: "hotel",
    x: 88,
    y: 82,
    hours: "Always open",
    tier: "Resort",
    summary: "Lady Annas Nwosu Lane. Gardens, a pool, a gym, and a grill. ₦110,000 a night.",
    activities: ["Book a room", "Drinks", "Eat"],
  },
  {
    id: "eleven-fortyfive",
    name: "11:45 Hotel",
    area: "New Owerri",
    kind: "hotel",
    x: 48,
    y: 86,
    hours: "Always open",
    tier: "Medium",
    summary: "Claret Academy Street, behind the Orange Room bus stop. ₦28,000 a night. The lounge next door does not sleep.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "city-global",
    name: "City Global Hotel",
    area: "Port Harcourt Road",
    kind: "hotel",
    x: 54,
    y: 62,
    hours: "Always open",
    tier: "Low",
    summary: "Off Housing Junction on Port Harcourt Road. A plain room. ₦12,000 a night.",
    activities: ["Book a room"],
  },
  {
    id: "de-moon",
    name: "De Moon",
    area: "New Owerri",
    kind: "hotel",
    x: 36,
    y: 92,
    hours: "Always open",
    tier: "Relaxation",
    summary: "Plot C4, Area U. A quiet relaxation house. ₦40,000 a night.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "protea-hotel",
    name: "Protea Hotel",
    area: "New Owerri",
    kind: "hotel",
    x: 12,
    y: 72,
    hours: "Always open",
    tier: "High",
    summary: "Protea Hotel Owerri Select, Protea Road, Nekede Pocket Layout. ₦160,000 a night.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "links-hotel",
    name: "Links Hotel",
    area: "New Owerri",
    kind: "hotel",
    x: 54,
    y: 38,
    hours: "Always open",
    tier: "Medium",
    summary: "Chief Evan Enwerem Avenue, opposite the Imo House of Assembly, near Dan Anyiam Stadium. ₦50,000 a night.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "muna-suites",
    name: "Muna Suites",
    area: "New Owerri",
    kind: "hotel",
    x: 72,
    y: 50,
    hours: "Always open",
    tier: "High",
    summary: "Umuguma Way, off Port Harcourt Road, opposite the General Hospital side. ₦75,000 a night.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "ibis-royale",
    name: "Ibis Royale",
    area: "World Bank",
    kind: "hotel",
    x: 10,
    y: 48,
    hours: "Always open",
    tier: "Medium",
    summary: "Area A, World Bank Road. Pool and a restaurant. ₦38,000 a night.",
    activities: ["Book a room", "Drinks", "Eat"],
  },
  {
    id: "immaculate-golden",
    name: "Immaculate Golden",
    area: "Wetheral Road",
    kind: "hotel",
    x: 56,
    y: 18,
    hours: "Always open",
    tier: "Low",
    summary: "107 Wetheral Road. A straightforward room on the old road. ₦22,000 a night.",
    activities: ["Book a room"],
  },
  {
    id: "fullmoon-hotel",
    name: "Full Moon Hotel",
    area: "New Owerri",
    kind: "hotel",
    x: 98,
    y: 76,
    hours: "Always open",
    tier: "Medium",
    summary: "Fullmoon Avenue, Housing Area C, by Akanchawa Road. ₦65,000 a night.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "autograph-hotel",
    name: "The Autograph",
    area: "Works Layout",
    kind: "hotel",
    x: 10,
    y: 36,
    hours: "Always open",
    tier: "Medium",
    summary: "40–43 Works Layout Road. Apartments and rooms on the layout. ₦45,000 a night.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "onyx-royal",
    name: "Onyx Royal",
    area: "Works Layout",
    kind: "hotel",
    x: 46,
    y: 46,
    hours: "Always open",
    tier: "High",
    summary: "628 Works Layout Road. Suites on the long road through the layout. ₦70,000 a night.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "cradle-hotel",
    name: "Cradle Hotel",
    area: "Works Layout",
    kind: "hotel",
    x: 14,
    y: 56,
    hours: "Always open",
    tier: "Low",
    summary: "C-30 Works Layout. A plain, busy hotel. ₦18,000 a night.",
    activities: ["Book a room"],
  },
  {
    id: "de-bernards",
    name: "De Bernard's Ville",
    area: "Works Layout",
    kind: "hotel",
    x: 32,
    y: 30,
    hours: "Always open",
    tier: "Medium",
    summary: "Works Layout. Rooms, a pool, and a kitchen. ₦42,000 a night.",
    activities: ["Book a room", "Drinks", "Eat"],
  },
  {
    id: "summer-suites",
    name: "Summer Suites",
    area: "Works Layout",
    kind: "hotel",
    x: 42,
    y: 58,
    hours: "Always open",
    tier: "Low",
    summary: "Works Layout Road. An older hotel with a bar. ₦15,000 a night.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "prestige-hotel",
    name: "Prestige Hotel",
    area: "Works Layout",
    kind: "hotel",
    x: 18,
    y: 66,
    hours: "Always open",
    tier: "Low",
    summary: "97 Works Layout Road. A small hotel at the south end of the layout. ₦20,000 a night.",
    activities: ["Book a room"],
  },
  {
    id: "kavana-hotel",
    name: "Kavana Hotel",
    area: "Works Layout",
    kind: "hotel",
    x: 36,
    y: 72,
    hours: "Always open",
    tier: "Medium",
    summary: "21 Nkwerre Street, Works Layout. Rooms and a food court. ₦32,000 a night.",
    activities: ["Book a room", "Drinks", "Eat"],
  },
  {
    id: "kingplatz-hotel",
    name: "Kingplatz Hotel",
    area: "Works Layout",
    kind: "hotel",
    x: 8,
    y: 52,
    hours: "Always open",
    tier: "Medium",
    summary: "420b Works Layout Road. A newer hotel on the west side. ₦25,000 a night.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "earls-court",
    name: "Earls Court",
    area: "Works Layout",
    kind: "hotel",
    x: 44,
    y: 66,
    hours: "Always open",
    tier: "Medium",
    summary: "Off Iho Dimeze Street, Works Layout. Executive rooms. ₦28,000 a night.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "diamond-cruz",
    name: "Diamond Cruz",
    area: "Douglas Road",
    kind: "hotel",
    x: 46,
    y: 52,
    hours: "Always open",
    tier: "Medium",
    summary: "Off Douglas Road, beside Works Layout. ₦24,000 a night.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "josephs-pot",
    name: "Joseph's Pot",
    area: "Ikenegbu",
    kind: "food",
    x: 84,
    y: 38,
    hours: "08:00 – 22:00",
    tier: "Local",
    summary: "Plot 119, Ikenegbu Layout, after Maris Junction. Ofe Owerri, and whatever else fits in the pot.",
    activities: ["Eat", "Drinks"],
  },
  {
    id: "feedwell",
    name: "Feedwell",
    area: "Ikenegbu",
    kind: "food",
    x: 90,
    y: 44,
    hours: "08:00 – 21:00",
    tier: "Local",
    summary: "13 Oduobi Crescent, Ikenegbu Layout. A full plate and a busy room.",
    activities: ["Eat"],
  },
  {
    id: "crunchies",
    name: "Crunchies",
    area: "Mbari Road",
    kind: "food",
    x: 44,
    y: 44,
    hours: "07:00 – 21:00",
    tier: "Fast food",
    summary: "79 Mbari Road. Fried chicken, chips, and a quick sit-down.",
    activities: ["Eat", "Drinks"],
  },
  {
    id: "golden-villa",
    name: "Golden Villa",
    area: "New Owerri",
    kind: "hotel",
    x: 78,
    y: 96,
    hours: "Always open",
    tier: "High",
    summary: "Plot SH/19, Commercial District G, New Owerri, opposite the Imo Trade and Investment Centre. A quiet hotel. ₦85,000 a night.",
    activities: ["Book a room", "Drinks"],
  },
  {
    id: "the-warehouse",
    name: "The Warehouse",
    area: "New Owerri",
    kind: "food",
    x: 90,
    y: 84,
    hours: "12:00 – 00:00",
    tier: "Lounge",
    summary: "High Chief Emmanuel K. Uzor Avenue, Area E, Plot RR/8. A resto-lounge and the bowling lanes.",
    activities: ["Eat", "Drinks", "Hang out"],
  },
  {
    id: "car-stand",
    name: "Car Stand",
    area: "River bank",
    kind: "work",
    x: 8,
    y: 8,
    hours: "08:00 – 18:00",
    tier: "Cars",
    summary: "The lot behind the river bank. Rows of cars, and one you can drive home.",
    activities: ["Buy a car"],
  },
  {
    id: "trip-ph",
    name: "Hotel Presidential, Port Harcourt",
    area: "Port Harcourt",
    kind: "hotel",
    x: -520,
    y: -40,
    hours: "Always open",
    tier: "Trip",
    summary: "Your paid stay in Port Harcourt. Fly home when you are done.",
    activities: ["Hotel", "Rest"],
  },
  {
    id: "trip-lagos",
    name: "Eko Hotel, Lagos",
    area: "Lagos",
    kind: "hotel",
    x: -540,
    y: -80,
    hours: "Always open",
    tier: "Trip",
    summary: "Your paid stay on the island. Fly home when you are done.",
    activities: ["Hotel", "Rest"],
  },
  {
    id: "trip-calabar",
    name: "Transcorp Hotel, Calabar",
    area: "Calabar",
    kind: "hotel",
    x: -560,
    y: -120,
    hours: "Always open",
    tier: "Trip",
    summary: "Your paid stay in the garden city. Fly home when you are done.",
    activities: ["Hotel", "Rest"],
  },
  {
    id: "trip-abuja",
    name: "Transcorp Hilton, Abuja",
    area: "Abuja",
    kind: "hotel",
    x: -580,
    y: -160,
    hours: "Always open",
    tier: "Trip",
    summary: "Your paid stay in the capital. Fly home when you are done.",
    activities: ["Hotel", "Rest"],
  },
  {
    id: "trip-accra",
    name: "Labadi Beach Hotel, Accra",
    area: "Accra",
    kind: "hotel",
    x: -600,
    y: -200,
    hours: "Always open",
    tier: "Trip",
    summary: "Your paid stay on the coast. Fly home when you are done.",
    activities: ["Hotel", "Rest"],
  },
  {
    id: "trip-dubai",
    name: "Marina Hotel, Dubai",
    area: "Dubai",
    kind: "hotel",
    x: -620,
    y: -240,
    hours: "Always open",
    tier: "Trip",
    summary: "Your paid stay in Dubai. Fly home when you are done.",
    activities: ["Hotel", "Rest"],
  },
  {
    id: "trip-london",
    name: "The Savoy, London",
    area: "London",
    kind: "hotel",
    x: -640,
    y: -280,
    hours: "Always open",
    tier: "Trip",
    summary: "Your paid stay in London. Fly home when you are done.",
    activities: ["Hotel", "Rest"],
  },
];

export const DRINK_PRICE: Record<string, number> = {
  "wetheral-strip": 1500,
  "cartel-lounge": 2500,
  "orange-room": 2000,
  "cartel-beach": 2000,
  "heartland-resort": 1500,
  "rockview-hotel": 4000,
  "all-seasons": 4500,
  "titanium-hotel": 3000,
  "oxygen-resort": 3500,
  "eleven-fortyfive": 2500,
  "de-moon": 2000,
  "protea-hotel": 5000,
  "links-hotel": 3000,
  "muna-suites": 3500,
  "ibis-royale": 2500,
  "fullmoon-hotel": 3000,
  "autograph-hotel": 2500,
  "onyx-royal": 3500,
  "de-bernards": 2500,
  "summer-suites": 1500,
  "kavana-hotel": 2000,
  "kingplatz-hotel": 2000,
  "earls-court": 2500,
  "diamond-cruz": 2000,
  "josephs-pot": 1500,
  dominos: 1500,
  "the-warehouse": 2500,
  "golden-villa": 3000,
  crunchies: 1000,
  "channel-garden": 1500,
  "zuma-grill": 3000,
  "ibari-village": 1200,
  "mangrove-grill": 2000,
  donalds: 1200,
  "business-hotel": 3500,
  "concord-hotel": 5000,
  "owerri-mall": 1500,
};

export const PLATE: Record<string, { cost: number; hunger: number; name: string }> = {
  "mama-nkechi": { cost: 5000, hunger: 50, name: "Buka plate" },
  "relief-market": { cost: 5000, hunger: 40, name: "Street food" },
  "heartland-resort": { cost: 5000, hunger: 48, name: "Vendor plate" },
  "ibari-village": { cost: 10000, hunger: 48, name: "Local plate" },
  crunchies: { cost: 10000, hunger: 50, name: "Fried chicken" },
  "cartel-beach": { cost: 10000, hunger: 52, name: "Beach grill" },
  "oguta-lake": { cost: 10000, hunger: 50, name: "Pepper soup" },
  "kavana-hotel": { cost: 10000, hunger: 55, name: "Food court plate" },
  "owerri-mall": { cost: 10000, hunger: 45, name: "Food court" },
  donalds: { cost: 20000, hunger: 55, name: "Donald's plate" },
  dominos: { cost: 12000, hunger: 48, name: "Pizza" },
  "cold-stone": { cost: 8000, hunger: 22, name: "Ice cream" },
  "the-warehouse": { cost: 25000, hunger: 60, name: "Warehouse plate" },
  kilimanjaro: { cost: 20000, hunger: 55, name: "Kilimanjaro plate" },
  "november-5": { cost: 20000, hunger: 58, name: "November 5 plate" },
  feedwell: { cost: 20000, hunger: 62, name: "Ikenegbu plate" },
  "ibis-royale": { cost: 20000, hunger: 55, name: "Hotel plate" },
  "de-bernards": { cost: 20000, hunger: 58, name: "Hotel plate" },
  "mangrove-grill": { cost: 30000, hunger: 65, name: "Mangrove plate" },
  "josephs-pot": { cost: 30000, hunger: 70, name: "Ofe Owerri" },
  "zuma-grill": { cost: 30000, hunger: 60, name: "Zuma plate" },
  "all-seasons": { cost: 30000, hunger: 62, name: "Hotel plate" },
  "oxygen-resort": { cost: 30000, hunger: 58, name: "Grill plate" },
};

export const HOTEL_RATE: Record<string, { night: number; hour: number }> = {
  "budget-lodge": { night: 8000, hour: 2500 },
  "business-hotel": { night: 35000, hour: 8000 },
  "concord-hotel": { night: 150000, hour: 25000 },
  "rockview-hotel": { night: 90000, hour: 18000 },
  "all-seasons": { night: 130000, hour: 28000 },
  "titanium-hotel": { night: 55000, hour: 12000 },
  "oxygen-resort": { night: 110000, hour: 24000 },
  "eleven-fortyfive": { night: 28000, hour: 7000 },
  "city-global": { night: 12000, hour: 3500 },
  "de-moon": { night: 40000, hour: 9000 },
  "protea-hotel": { night: 160000, hour: 32000 },
  "links-hotel": { night: 50000, hour: 11000 },
  "muna-suites": { night: 75000, hour: 16000 },
  "ibis-royale": { night: 38000, hour: 8500 },
  "immaculate-golden": { night: 22000, hour: 5500 },
  "fullmoon-hotel": { night: 65000, hour: 14000 },
  "autograph-hotel": { night: 45000, hour: 10000 },
  "onyx-royal": { night: 70000, hour: 15000 },
  "cradle-hotel": { night: 18000, hour: 4500 },
  "de-bernards": { night: 42000, hour: 9000 },
  "summer-suites": { night: 15000, hour: 4000 },
  "prestige-hotel": { night: 20000, hour: 5000 },
  "kavana-hotel": { night: 32000, hour: 7000 },
  "kingplatz-hotel": { night: 25000, hour: 6000 },
  "earls-court": { night: 28000, hour: 6500 },
  "diamond-cruz": { night: 24000, hour: 5500 },
  "golden-villa": { night: 85000, hour: 18000 },
};

export type CarCategory = "Sedan" | "SUV" | "Luxury Crossover" | "Sports Coupe" | "Supercar" | "Electric" | "Pickup";

export interface CarDeal {
  id: string;
  name: string;
  category: CarCategory;
  price: number;
  speed: string;
  flexFactor: string;
  defaultColor: number;
  desc: string;
  emoji: string;
}

export const CAR_CATALOG: CarDeal[] = [
  { id: "corolla", name: "Toyota Corolla LE", category: "Sedan", price: 15_000_000, speed: "180 km/h · 1.8L", flexFactor: "⭐⭐ Small Big Boy", defaultColor: 0xe5e7eb, desc: "The honest first car. Cheap to run, hard to break, loved at every junction in Owerri.", emoji: "🚗" },
  { id: "camry-v6", name: "Toyota Camry XSE Sports Edition", category: "Sedan", price: 25_000_000, speed: "200 km/h · 3.5L V6", flexFactor: "⭐⭐⭐ Reliable Daily Hustle", defaultColor: 0x94a3b8, desc: "Unbreakable engine, cheap parts, fast acceleration, and cold AC. Owerri daily commuter favourite.", emoji: "🚘" },
  { id: "accord", name: "Honda Accord Sport", category: "Sedan", price: 22_000_000, speed: "205 km/h · 2.0 Turbo", flexFactor: "⭐⭐⭐ Clean Daily Driver", defaultColor: 0x1d4ed8, desc: "Sharp handling and a smooth ride along Port Harcourt Road.", emoji: "🚘" },
  { id: "hilux", name: "Toyota Hilux Double Cab", category: "Pickup", price: 45_000_000, speed: "175 km/h · 2.8 Diesel", flexFactor: "⭐⭐⭐ Hustler's Workhorse", defaultColor: 0x166534, desc: "Carry anything, go anywhere, even when the road is flooded.", emoji: "🛻" },
  { id: "lexus-rx", name: "Lexus RX350 Luxury Crossover", category: "Luxury Crossover", price: 70_000_000, speed: "210 km/h · V6 AWD", flexFactor: "⭐⭐⭐⭐ Clean Owerri Big Boy", defaultColor: 0xf8fafc, desc: "Smooth luxury ride, premium sound system, perfect for navigating New Owerri estates and airport runs.", emoji: "🚗" },
  { id: "benz-c300", name: "Mercedes-Benz C300", category: "Sedan", price: 85_000_000, speed: "250 km/h · 2.0 Turbo", flexFactor: "⭐⭐⭐⭐ Boardroom Boy", defaultColor: 0x111827, desc: "The three-pointed star that makes the gatemen salute.", emoji: "🚘" },
  { id: "prado", name: "Toyota Land Cruiser Prado", category: "SUV", price: 120_000_000, speed: "190 km/h · 4.0 V6", flexFactor: "⭐⭐⭐⭐ Politician's Pick", defaultColor: 0x374151, desc: "High seat, strong body, ready for any road in Imo State.", emoji: "🚙" },
  { id: "sports-coupe", name: "Velocity GT Sports Coupe", category: "Sports Coupe", price: 250_000_000, speed: "290 km/h · 4.0L Turbo", flexFactor: "⭐⭐⭐⭐⭐ Nightlife Club King", defaultColor: 0xdc2626, desc: "Low-slung race engineered body, aggressive front splitter, pops and bangs outside Cartel Lifestyle club.", emoji: "🏎️" },
  { id: "range-rover", name: "Range Rover Autobiography", category: "SUV", price: 400_000_000, speed: "225 km/h · 5.0 V8", flexFactor: "⭐⭐⭐⭐⭐ Chief's Choice", defaultColor: 0x0f172a, desc: "Leather, wood and a quiet cabin. The ride of the real big man.", emoji: "🚙" },
  { id: "g-wagon", name: "Mercedes-Benz G63 AMG (G-Wagon)", category: "SUV", price: 600_000_000, speed: "240 km/h · Twin Turbo V8", flexFactor: "⭐⭐⭐⭐⭐ Top Big Man of Imo", defaultColor: 0x18181b, desc: "The ultimate status symbol on Wetheral Road and Port Harcourt Road. Commanding presence with roaring dual side exhausts.", emoji: "🚙" },
  { id: "bmw-m4", name: "BMW M4 Competition", category: "Sports Coupe", price: 750_000_000, speed: "290 km/h · 3.0 Twin Turbo", flexFactor: "⭐⭐⭐⭐⭐ Fast Lane Flexer", defaultColor: 0x2563eb, desc: "Rear-wheel drive fury with a growl you hear from Ikenegbu.", emoji: "🏎️" },
  { id: "tesla-3", name: "Tesla Model 3", category: "Electric", price: 900_000_000, speed: "261 km/h · Electric Dual Motor", flexFactor: "⭐⭐⭐⭐ Silent Tech Boy", defaultColor: 0xf1f5f9, desc: "Silent, quick and clever. No petrol queue, no noise, all swag.", emoji: "⚡" },
  { id: "porsche-911", name: "Porsche 911 Carrera S", category: "Sports Coupe", price: 1_500_000_000, speed: "308 km/h · 3.0 Flat-6", flexFactor: "⭐⭐⭐⭐⭐ Weekend Warrior", defaultColor: 0xfacc15, desc: "The icon. Rear-engine, razor sharp, impossible to ignore.", emoji: "🏎️" },
  { id: "tesla-s", name: "Tesla Model S Plaid", category: "Electric", price: 2_500_000_000, speed: "322 km/h · Tri-Motor Electric", flexFactor: "⭐⭐⭐⭐⭐ Future Big Man", defaultColor: 0xb91c1c, desc: "Zero to 100 in under two seconds. The quietest way to arrive loudly.", emoji: "⚡" },
  { id: "maybach", name: "Mercedes-Maybach S680", category: "Sedan", price: 4_000_000_000, speed: "250 km/h · V12", flexFactor: "⭐⭐⭐⭐⭐ Owner of Everything", defaultColor: 0x1e293b, desc: "Reclining rear seats and champagne holders. You do not drive this, you are driven in it.", emoji: "🚘" },
  { id: "bentley", name: "Bentley Continental GT", category: "Sports Coupe", price: 6_000_000_000, speed: "333 km/h · W12", flexFactor: "⭐⭐⭐⭐⭐ Old Money Energy", defaultColor: 0x14532d, desc: "Handmade luxury with a grand-tourer heart.", emoji: "🏎️" },
  { id: "urus", name: "Lamborghini Urus", category: "SUV", price: 9_000_000_000, speed: "305 km/h · Twin Turbo V8", flexFactor: "⭐⭐⭐⭐⭐ Super SUV King", defaultColor: 0xea580c, desc: "A bull in a suit. The fastest SUV to ever pull up at Cartel Lifestyle.", emoji: "🚙" },
  { id: "huracan", name: "Lamborghini Huracán", category: "Supercar", price: 12_000_000_000, speed: "325 km/h · 5.2 V10", flexFactor: "⭐⭐⭐⭐⭐ Raging Bull", defaultColor: 0xfacc15, desc: "Wedge shaped, scissor-fast and impossibly low. Every head on Wetheral turns.", emoji: "🏎️" },
  { id: "ferrari", name: "Ferrari 488 Pista", category: "Supercar", price: 20_000_000_000, speed: "340 km/h · Twin Turbo V8", flexFactor: "⭐⭐⭐⭐⭐ Prancing Horse", defaultColor: 0xdc2626, desc: "Italian red, screaming engine, pure drama.", emoji: "🏎️" },
  { id: "rolls", name: "Rolls-Royce Phantom", category: "Sedan", price: 35_000_000_000, speed: "250 km/h · 6.75 V12", flexFactor: "⭐⭐⭐⭐⭐ Royal Highness", defaultColor: 0x0b0b0f, desc: "A silent palace on wheels with a starlight ceiling.", emoji: "🚘" },
  { id: "bugatti", name: "Bugatti Chiron", category: "Supercar", price: 2_000_000_000_000, speed: "420 km/h · Quad-Turbo W16", flexFactor: "👑 Untouchable", defaultColor: 0x1d4ed8, desc: "The most expensive thing on four wheels in all of Owerri.", emoji: "🏎️" },
];

const LEGACY_CAR: CarDeal = { ...CAR_CATALOG[1], id: "Executive Sedan", name: "Executive Sedan", price: 25_000_000 };

export function carById(idOrName?: string | null): CarDeal | null {
  if (!idOrName) return null;
  if (idOrName === "Executive Sedan") return LEGACY_CAR;
  return CAR_CATALOG.find((car) => car.id === idOrName) ?? null;
}

export const SPRAY_FLOOR: Record<string, number> = {
  "wetheral-strip": 100_000,
  "cartel-lounge": 200_000,
};

export function sprayFloor(placeId: string) {
  return SPRAY_FLOOR[placeId] ?? 150_000;
}

export const DORIME_AMOUNTS = [2000, 5000, 10000, 20000] as const;

export const TOP_UPS = [5_000, 20_000, 50_000, 100_000, 500_000] as const;

export const TREATMENT_FEE: Record<string, number> = {
  "eke-ukwu": 1500,
  "teaching-hospital": 8000,
  "general-hospital": 5000,
  "umezuruike-hospital": 12000,
  "st-davids": 10000,
  "shelly-hospital": 11000,
  "imo-specialist": 15000,
};

export const BET_STAKES = [500, 1000, 2000, 5000, 10000] as const;

export const CLUBS: Array<{ name: string; league: string }> = [
  { name: "Arsenal", league: "Premier League" },
  { name: "Chelsea", league: "Premier League" },
  { name: "Liverpool", league: "Premier League" },
  { name: "Manchester City", league: "Premier League" },
  { name: "Manchester United", league: "Premier League" },
  { name: "Tottenham", league: "Premier League" },
  { name: "Newcastle", league: "Premier League" },
  { name: "Aston Villa", league: "Premier League" },
  { name: "Real Madrid", league: "La Liga" },
  { name: "Barcelona", league: "La Liga" },
  { name: "Atletico Madrid", league: "La Liga" },
  { name: "Sevilla", league: "La Liga" },
  { name: "Villarreal", league: "La Liga" },
  { name: "Real Sociedad", league: "La Liga" },
  { name: "Inter", league: "Serie A" },
  { name: "Milan", league: "Serie A" },
  { name: "Juventus", league: "Serie A" },
  { name: "Napoli", league: "Serie A" },
  { name: "Roma", league: "Serie A" },
  { name: "Lazio", league: "Serie A" },
  { name: "Bayern Munich", league: "Bundesliga" },
  { name: "Borussia Dortmund", league: "Bundesliga" },
  { name: "RB Leipzig", league: "Bundesliga" },
  { name: "Bayer Leverkusen", league: "Bundesliga" },
  { name: "Eintracht Frankfurt", league: "Bundesliga" },
  { name: "Paris Saint-Germain", league: "Ligue 1" },
  { name: "Marseille", league: "Ligue 1" },
  { name: "Lyon", league: "Ligue 1" },
  { name: "Monaco", league: "Ligue 1" },
  { name: "Lille", league: "Ligue 1" },
  { name: "Ajax", league: "Eredivisie" },
  { name: "PSV", league: "Eredivisie" },
  { name: "Feyenoord", league: "Eredivisie" },
  { name: "Benfica", league: "Primeira Liga" },
  { name: "Porto", league: "Primeira Liga" },
  { name: "Sporting", league: "Primeira Liga" },
  { name: "Celtic", league: "Scottish Premiership" },
  { name: "Rangers", league: "Scottish Premiership" },
  { name: "Galatasaray", league: "Super Lig" },
  { name: "Fenerbahce", league: "Super Lig" },
];

export interface Plot {
  id: string;
  name: string;
  area: string;
  price: number;
  rent: number;
  blurb: string;
  kind?: "land" | "farm" | "board" | "business";
  needLevel?: number;
}

export const LANDS: Plot[] = [
  { id: "ikenegbu-plot", name: "Ikenegbu half-plot", area: "Ikenegbu", price: 80000, rent: 4000, blurb: "A small piece behind the layout. Tenants pay every Saturday." },
  { id: "aladinma-plot", name: "Aladinma plot", area: "Aladinma", price: 150000, rent: 7000, blurb: "Residential land. The rent is small and steady." },
  { id: "works-plot", name: "Works Layout plot", area: "Works Layout", price: 220000, rent: 12000, blurb: "Near the hotels on Works Layout Road. Rooms and shops sit on it." },
  { id: "world-bank-plot", name: "World Bank plot", area: "World Bank", price: 360000, rent: 16000, blurb: "Estate land. Quiet tenants." },
  { id: "wetheral-plot", name: "Wetheral corner", area: "Wetheral Road", price: 480000, rent: 22000, blurb: "A corner on the old road. Shops want the frontage." },
  { id: "new-owerri-plot", name: "New Owerri plot", area: "New Owerri", price: 850000, rent: 38000, blurb: "The expensive side of town. The rent matches the address." },
  { id: "egbu-farm", name: "Egbu cassava farm", area: "Egbu", price: 240000, rent: 14000, kind: "farm", needLevel: 3, blurb: "Opens at career level 3. The harvest pays every Saturday." },
  { id: "nekede-farm", name: "Nekede rice field", area: "Nekede", price: 420000, rent: 22000, kind: "farm", needLevel: 4, blurb: "Opens at career level 4. A bigger field on the Nekede side." },
  { id: "owerri-west-farm", name: "Owerri West palms", area: "Owerri West", price: 700000, rent: 36000, kind: "farm", needLevel: 5, blurb: "Opens at career level 5. The palms pay like a landlord." },
  { id: "wetheral-board", name: "Wetheral billboard", area: "Wetheral Road", price: 180000, rent: 15000, kind: "board", blurb: "A weekly ad slot on the night road. The payment is earned." },
  { id: "ph-road-board", name: "Port Harcourt Road board", area: "New Owerri", price: 320000, rent: 24000, kind: "board", blurb: "The busy frontage. Advertisers pay you every Saturday." },
  { id: "airport-board", name: "Airport road board", area: "Sam Mbakwe", price: 260000, rent: 18000, kind: "board", blurb: "Everyone leaving town sees this one." },
  { id: "pure-water", name: "Pure water kiosk", area: "Ikenegbu", price: 250_000, rent: 50_000, kind: "business", blurb: "A kiosk on the junction. Every sachet is yours. Pays every Saturday." },
  { id: "provision-shop", name: "Provision shop", area: "Aladinma", price: 1_000_000, rent: 200_000, kind: "business", blurb: "Noodles, Indomie and cold drinks. People buy daily. Pays every Saturday." },
  { id: "bakery", name: "Owerri bakery", area: "World Bank", price: 4_000_000, rent: 800_000, kind: "business", blurb: "Hot bread before sunrise. The queue is long. Pays every Saturday." },
  { id: "filling-station", name: "Filling station", area: "Wetheral Road", price: 18_000_000, rent: 3_600_000, kind: "business", blurb: "Four pumps on the road to Port Harcourt. Pays every Saturday." },
  { id: "supermarket", name: "Supermarket chain", area: "New Owerri", price: 80_000_000, rent: 16_000_000, kind: "business", blurb: "Three branches across town. Pays every Saturday." },
  { id: "hotel-chain", name: "Hotel chain", area: "Works Layout", price: 350_000_000, rent: 70_000_000, kind: "business", blurb: "Rooms full from Friday to Sunday. Pays every Saturday." },
  { id: "shopping-mall", name: "Shopping mall", area: "Egbu", price: 1_500_000_000, rent: 300_000_000, kind: "business", blurb: "A whole mall with your name on the front. Pays every Saturday." },
  { id: "estate-towers", name: "Estate towers", area: "New Owerri", price: 7_000_000_000, rent: 1_400_000_000, kind: "business", blurb: "Tenants queue to rent the penthouses. Pays every Saturday." },
  { id: "bank-licence", name: "Commercial bank", area: "Wetheral Road", price: 35_000_000_000, rent: 7_000_000_000, kind: "business", blurb: "A bank with branches in every state. Pays every Saturday." },
  { id: "oil-block", name: "Oil block", area: "Niger Delta", price: 160_000_000_000, rent: 32_000_000_000, kind: "business", blurb: "Barrels pour in day and night. Pays every Saturday." },
  { id: "telecom", name: "Telecom network", area: "Lagos", price: 800_000_000_000, rent: 160_000_000_000, kind: "business", blurb: "Every phone in Owerri runs on your towers. Pays every Saturday." },
  { id: "airline", name: "Private airline", area: "Sam Mbakwe", price: 4_000_000_000_000, rent: 800_000_000_000, kind: "business", blurb: "Your jets fly out of Sam Mbakwe. Pays every Saturday." },
  { id: "refinery", name: "Oil refinery", area: "Port Harcourt", price: 20_000_000_000_000, rent: 4_000_000_000_000, kind: "business", blurb: "Petrol for the whole country. Pays every Saturday." },
  { id: "empire", name: "Owerri Life Group", area: "Everywhere", price: 100_000_000_000_000, rent: 20_000_000_000_000, kind: "business", blurb: "The empire. Everybody works for you. Pays every Saturday." },
];

export interface Course {
  id: string;
  schoolId: string;
  name: string;
  skill: SkillKey;
  fee: number;
  applyFee: number;
  days: number[];
  startHour: number;
  hours: number;
}

const LECTURE_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const COURSES: Course[] = [
  { id: "imsu-law", schoolId: "imsu", name: "Law", skill: "charisma", fee: 120000, applyFee: 5000, days: [0, 2], startHour: 9, hours: 2 },
  { id: "imsu-mass", schoolId: "imsu", name: "Mass Communication", skill: "comedy", fee: 80000, applyFee: 5000, days: [1, 3], startHour: 11, hours: 2 },
  { id: "imsu-medicine", schoolId: "imsu", name: "Medicine and Surgery", skill: "fitness", fee: 180000, applyFee: 5000, days: [0, 2, 4], startHour: 8, hours: 2 },
  { id: "imsu-nursing", schoolId: "imsu", name: "Nursing Science", skill: "fitness", fee: 110000, applyFee: 5000, days: [1, 3], startHour: 8, hours: 2 },
  { id: "imsu-accounting", schoolId: "imsu", name: "Accounting", skill: "hustle", fee: 90000, applyFee: 5000, days: [0, 2], startHour: 13, hours: 2 },
  { id: "imsu-pol", schoolId: "imsu", name: "Political Science", skill: "charisma", fee: 70000, applyFee: 5000, days: [1, 4], startHour: 14, hours: 2 },
  { id: "imsu-cs", schoolId: "imsu", name: "Computer Science", skill: "coding", fee: 100000, applyFee: 5000, days: [0, 2, 4], startHour: 11, hours: 2 },
  { id: "imsu-biz", schoolId: "imsu", name: "Business Administration", skill: "hustle", fee: 75000, applyFee: 5000, days: [1, 3], startHour: 9, hours: 2 },
  { id: "imsu-econ", schoolId: "imsu", name: "Economics", skill: "hustle", fee: 85000, applyFee: 5000, days: [2, 4], startHour: 10, hours: 2 },
  { id: "imsu-theatre", schoolId: "imsu", name: "Theatre Arts", skill: "comedy", fee: 60000, applyFee: 5000, days: [3, 4], startHour: 15, hours: 2 },
  { id: "imsu-music", schoolId: "imsu", name: "Music", skill: "music", fee: 65000, applyFee: 5000, days: [0, 3], startHour: 16, hours: 2 },
  { id: "futo-cs", schoolId: "futo", name: "Computer Science", skill: "coding", fee: 150000, applyFee: 8000, days: [0, 2, 4], startHour: 8, hours: 2 },
  { id: "futo-food", schoolId: "futo", name: "Food Science and Technology", skill: "cooking", fee: 100000, applyFee: 8000, days: [1, 3], startHour: 10, hours: 2 },
  { id: "futo-eee", schoolId: "futo", name: "Electrical Engineering", skill: "coding", fee: 160000, applyFee: 8000, days: [0, 2, 4], startHour: 10, hours: 2 },
  { id: "futo-mech", schoolId: "futo", name: "Mechanical Engineering", skill: "fitness", fee: 140000, applyFee: 8000, days: [1, 3], startHour: 8, hours: 2 },
  { id: "futo-civil", schoolId: "futo", name: "Civil Engineering", skill: "hustle", fee: 130000, applyFee: 8000, days: [0, 2], startHour: 13, hours: 2 },
  { id: "futo-pet", schoolId: "futo", name: "Petroleum Engineering", skill: "hustle", fee: 170000, applyFee: 8000, days: [1, 4], startHour: 9, hours: 2 },
  { id: "futo-arch", schoolId: "futo", name: "Architecture", skill: "photography", fee: 145000, applyFee: 8000, days: [0, 3], startHour: 11, hours: 2 },
  { id: "futo-it", schoolId: "futo", name: "Information Technology", skill: "coding", fee: 120000, applyFee: 8000, days: [2, 4], startHour: 8, hours: 2 },
  { id: "futo-cyber", schoolId: "futo", name: "Cyber Security", skill: "coding", fee: 155000, applyFee: 8000, days: [1, 3], startHour: 14, hours: 2 },
  { id: "futo-micro", schoolId: "futo", name: "Microbiology", skill: "fitness", fee: 110000, applyFee: 8000, days: [0, 2], startHour: 15, hours: 2 },
  { id: "nekede-account", schoolId: "fedpoly-nekede", name: "Accountancy", skill: "hustle", fee: 45000, applyFee: 3000, days: [0, 2], startHour: 9, hours: 2 },
  { id: "nekede-com", schoolId: "fedpoly-nekede", name: "Computer Engineering", skill: "coding", fee: 55000, applyFee: 3000, days: [1, 4], startHour: 11, hours: 2 },
  { id: "nekede-hosp", schoolId: "fedpoly-nekede", name: "Hospitality Management", skill: "cooking", fee: 40000, applyFee: 3000, days: [2, 4], startHour: 14, hours: 2 },
  { id: "nekede-eee", schoolId: "fedpoly-nekede", name: "Electrical Engineering", skill: "coding", fee: 50000, applyFee: 3000, days: [0, 2, 4], startHour: 8, hours: 2 },
  { id: "nekede-mass", schoolId: "fedpoly-nekede", name: "Mass Communication", skill: "comedy", fee: 38000, applyFee: 3000, days: [1, 3], startHour: 10, hours: 2 },
  { id: "nekede-biz", schoolId: "fedpoly-nekede", name: "Business Administration", skill: "hustle", fee: 35000, applyFee: 3000, days: [0, 3], startHour: 13, hours: 2 },
  { id: "nekede-bank", schoolId: "fedpoly-nekede", name: "Banking and Finance", skill: "charisma", fee: 42000, applyFee: 3000, days: [1, 3], startHour: 8, hours: 2 },
  { id: "nekede-slt", schoolId: "fedpoly-nekede", name: "Science Lab Technology", skill: "coding", fee: 40000, applyFee: 3000, days: [2, 4], startHour: 9, hours: 2 },
  { id: "nekede-estate", schoolId: "fedpoly-nekede", name: "Estate Management", skill: "hustle", fee: 36000, applyFee: 3000, days: [0, 2], startHour: 15, hours: 2 },
  { id: "nekede-cs", schoolId: "fedpoly-nekede", name: "Computer Science", skill: "coding", fee: 48000, applyFee: 3000, days: [1, 4], startHour: 14, hours: 2 },
];

export function courseById(id: string) {
  const course = COURSES.find((item) => item.id === id);
  if (!course) throw new Error(`Missing course ${id}`);
  return course;
}

export function coursesAt(schoolId: string) {
  return COURSES.filter((course) => course.schoolId === schoolId);
}

export interface Trip {
  id: string;
  city: string;
  days: number;
  cost: number;
  blurb: string;
  energy: number;
  fun: number;
  social: number;
}

export const TRIPS: Trip[] = [
  { id: "ph", city: "Port Harcourt", days: 1, cost: 35000, energy: 70, fun: 72, social: 64, blurb: "A short hop. The waterfront, then the hotel." },
  { id: "lagos", city: "Lagos", days: 2, cost: 95000, energy: 74, fun: 90, social: 82, blurb: "Island by day, mainland noise at night." },
  { id: "calabar", city: "Calabar", days: 3, cost: 140000, energy: 78, fun: 88, social: 70, blurb: "The garden city. You walk more than you planned." },
  { id: "abuja", city: "Abuja", days: 3, cost: 160000, energy: 88, fun: 70, social: 60, blurb: "Wide roads and a quiet hotel. You actually rest." },
  { id: "accra", city: "Accra", days: 4, cost: 380000, energy: 76, fun: 86, social: 78, blurb: "The coast, the food, and a longer flight home." },
  { id: "dubai", city: "Dubai", days: 5, cost: 750000, energy: 80, fun: 80, social: 66, blurb: "Glass and heat. You come back a little dazed." },
  { id: "london", city: "London", days: 7, cost: 1200000, energy: 62, fun: 74, social: 68, blurb: "A full week. The landing feels like jet lag." },
];

export function tripById(id: string) {
  return TRIPS.find((trip) => trip.id === id) ?? null;
}

export function isTripPlace(id: string) {
  return id.startsWith("trip-");
}

export function tripFromPlace(id: string) {
  if (!isTripPlace(id)) return null;
  return tripById(id.slice(5));
}

export function lectureLabel(course: Course) {
  const end = course.startHour + course.hours;
  const days = course.days.map((day) => LECTURE_DAYS[day]).join(", ");
  return `${days} · ${String(course.startHour).padStart(2, "0")}:00–${String(end).padStart(2, "0")}:00`;
}

export function placeActs(place: Place) {
  const club = place.kind === "nightlife" || place.id === "concord-hotel";
  return {
    drink: DRINK_PRICE[place.id] ?? null,
    plate: PLATE[place.id] ?? null,
    dance: club,
    spray: club,
    hotel: HOTEL_RATE[place.id] ?? null,
    pickup: place.kind === "pickup",
  };
}

export interface Npc {
  id: string;
  name: string;
  placeId: string;
  role: string;
  mood: string;
  bio: string;
  home: string;
  asking?: number;
}

export const NPCS: Npc[] = [
  { id: "npc-adaeze", name: "Adaeze", placeId: "cartel-lounge", role: "Resident DJ", mood: "Bright", bio: "Runs the decks and notices who shows up on time.", home: "Aladinma" },
  { id: "npc-nonso", name: "Nonso", placeId: "cartel-lounge", role: "Bartender", mood: "Alright", bio: "Knows the regulars and who is only passing through.", home: "World Bank" },
  { id: "npc-obi", name: "Obi", placeId: "eke-ukwu", role: "Trader", mood: "Tight", bio: "Buys and resells from a stall near the main aisle.", home: "Ikenegbu" },
  { id: "npc-chioma", name: "Chioma", placeId: "eke-ukwu", role: "Chemist", mood: "Alright", bio: "Sells basic drugs for mild sickness.", home: "Ikenegbu" },
  { id: "npc-okeke", name: "Mrs Okeke", placeId: "city-bank", role: "Branch lead", mood: "Bright", bio: "Watches performance and does not enjoy lateness.", home: "New Owerri" },
  { id: "npc-ifeanyi", name: "Ifeanyi", placeId: "city-bank", role: "Teller", mood: "Alright", bio: "Counts other people's money all day.", home: "Aladinma" },
  { id: "npc-amaka", name: "Nurse Amaka", placeId: "teaching-hospital", role: "Nurse", mood: "Tight", bio: "On shift more often than not.", home: "World Bank" },
  { id: "npc-okoro", name: "Dr Okoro", placeId: "teaching-hospital", role: "Doctor", mood: "Alright", bio: "Sees severe cases on Orlu Road. Mild ones can start at the chemist in Eke Ukwu.", home: "New Owerri" },
  { id: "npc-nurse-ngozi", name: "Nurse Ngozi", placeId: "general-hospital", role: "Nurse", mood: "Tight", bio: "The public wards on Wetheral stay full.", home: "Ikenegbu" },
  { id: "npc-dr-umez", name: "Dr Umeh", placeId: "umezuruike-hospital", role: "Doctor", mood: "Alright", bio: "Umezuruike Street. He still does the evening round.", home: "Wetheral Road" },
  { id: "npc-ada-david", name: "Sister Ada", placeId: "st-davids", role: "Nurse", mood: "Bright", bio: "14 Mbari Road. She points you to the ward.", home: "Centre" },
  { id: "npc-dr-shelly", name: "Dr Ifeoma", placeId: "shelly-hospital", role: "Doctor", mood: "Alright", bio: "Aladinma. Severe cases are admitted, not sent away.", home: "Aladinma" },
  { id: "npc-dr-umuguma", name: "Dr Emeka", placeId: "imo-specialist", role: "Doctor", mood: "Bright", bio: "Umuguma specialist wards, on the New Owerri side.", home: "New Owerri" },
  { id: "npc-bisi", name: "Chef Bisi", placeId: "mangrove-grill", role: "Head chef", mood: "Bright", bio: "The kitchen is fast and the gas is not free.", home: "Ikenegbu" },
  { id: "npc-seyi", name: "Seyi", placeId: "mangrove-grill", role: "Waiter", mood: "Bright", bio: "Remembers who tips and who only windows-shops the menu.", home: "Ikenegbu" },
  { id: "npc-kamsi", name: "Kamsi", placeId: "nworie-park", role: "Creator", mood: "On top", bio: "Films the river and the people who stop.", home: "New Owerri" },
  { id: "npc-smalls", name: "Smalls", placeId: "nworie-park", role: "Local musician", mood: "Alright", bio: "Plays when the evening is kind.", home: "Ikenegbu" },
  { id: "npc-nkechi", name: "Mama Nkechi", placeId: "mama-nkechi", role: "Buka owner", mood: "Bright", bio: "Feeds the street and remembers who owes a plate.", home: "Ikenegbu" },
  { id: "npc-chuka", name: "Chuka", placeId: "mama-nkechi", role: "Regular", mood: "Alright", bio: "Eats here between shifts and knows the area gossip.", home: "Ikenegbu" },
  { id: "npc-uche", name: "Mama Uche", placeId: "ikenegbu", role: "Neighbour", mood: "Alright", bio: "Keeps an eye on the compound gate.", home: "Ikenegbu" },
  { id: "npc-tunde", name: "Tunde", placeId: "world-bank", role: "Neighbour", mood: "Bright", bio: "Works in town and comes home before the traffic locks.", home: "World Bank" },
  { id: "npc-kelechi", name: "Kelechi", placeId: "aladinma", role: "Neighbour", mood: "Alright", bio: "Talks land prices even when nobody asked.", home: "Aladinma" },
  { id: "npc-sochima", name: "Sochima", placeId: "new-owerri", role: "Neighbour", mood: "On top", bio: "Lives in a flat and calls it a temporary step.", home: "New Owerri" },
  { id: "npc-dj-flex", name: "Flex", placeId: "wetheral-strip", role: "Street DJ", mood: "Bright", bio: "Plays from a booth on the open ground beside Owerri Mall.", home: "Egbu Road" },
  { id: "npc-lola", name: "Lola", placeId: "orange-room", role: "Host", mood: "Bright", bio: "Walks the lounge on Claret Academy Street and knows who is spending.", home: "New Owerri" },
  { id: "npc-kachi", name: "Kachi", placeId: "cartel-beach", role: "Host", mood: "Bright", bio: "Keeps the beach house moving. The club is a different building.", home: "New Owerri" },
  { id: "npc-nneoma", name: "Nneoma", placeId: "heartland-resort", role: "Vendor", mood: "Alright", bio: "Sells plates on the new beach and points people away from Cartel Beach House.", home: "Ikenegbu" },
  { id: "npc-chinedu", name: "Chinedu", placeId: "rockview-hotel", role: "Front desk", mood: "Bright", bio: "Checks you in at Government Station Layout.", home: "Aladinma" },
  { id: "npc-ugo", name: "Ugo", placeId: "all-seasons", role: "Front desk", mood: "On top", bio: "The pool and the rooms both answer to the desk.", home: "New Owerri" },
  { id: "npc-lillian", name: "Lillian", placeId: "titanium-hotel", role: "Host", mood: "Bright", bio: "Shows the suites and the pool on Max Aluminium Road.", home: "New Owerri" },
  { id: "npc-obinna", name: "Obinna", placeId: "oxygen-resort", role: "Grill", mood: "Alright", bio: "Works the grill between the garden and the pool.", home: "New Owerri" },
  { id: "npc-chidera", name: "Chidera", placeId: "eleven-fortyfive", role: "Front desk", mood: "Tight", bio: "Hands over keys behind the Orange Room bus stop.", home: "New Owerri" },
  { id: "npc-nnamdi", name: "Nnamdi", placeId: "city-global", role: "Front desk", mood: "Alright", bio: "A short check-in off Housing Junction.", home: "World Bank" },
  { id: "npc-ogechi", name: "Ogechi", placeId: "de-moon", role: "Host", mood: "Bright", bio: "Keeps Area U quiet. This is a rest house, not a club.", home: "New Owerri" },
  { id: "npc-somto", name: "Somto", placeId: "protea-hotel", role: "Front desk", mood: "Bright", bio: "Checks guests in on Protea Road.", home: "New Owerri" },
  { id: "npc-ginika", name: "Ginika", placeId: "links-hotel", role: "Front desk", mood: "Alright", bio: "The desk faces the House of Assembly side of the avenue.", home: "New Owerri" },
  { id: "npc-lotanna", name: "Lotanna", placeId: "muna-suites", role: "Host", mood: "On top", bio: "Walks guests through the suites off Umuguma Way.", home: "New Owerri" },
  { id: "npc-nkiru", name: "Nkiru", placeId: "ibis-royale", role: "Front desk", mood: "Alright", bio: "Area A, World Bank Road. The pool is behind the lobby.", home: "World Bank" },
  { id: "npc-adaora", name: "Adaora", placeId: "immaculate-golden", role: "Front desk", mood: "Tight", bio: "Hands over a key on Wetheral Road and goes back to the book.", home: "Ikenegbu" },
  { id: "npc-chisom", name: "Chisom", placeId: "fullmoon-hotel", role: "Front desk", mood: "Bright", bio: "Housing Area C. Check-in is from 2 in the afternoon.", home: "New Owerri" },
  { id: "npc-amaka-desk", name: "Amaka", placeId: "autograph-hotel", role: "Front desk", mood: "Bright", bio: "40–43 Works Layout Road. She keeps the apartment keys.", home: "Works Layout" },
  { id: "npc-ebuka", name: "Ebuka", placeId: "onyx-royal", role: "Front desk", mood: "Bright", bio: "628 Works Layout Road. The suites are down the corridor.", home: "Works Layout" },
  { id: "npc-ifunanya", name: "Ifunanya", placeId: "cradle-hotel", role: "Front desk", mood: "Alright", bio: "C-30 Works Layout. She writes the room number and moves on.", home: "Works Layout" },
  { id: "npc-chinyere", name: "Chinyere", placeId: "de-bernards", role: "Host", mood: "Bright", bio: "The pool and the kitchen are both hers to point at.", home: "Works Layout" },
  { id: "npc-tobe", name: "Tobe", placeId: "summer-suites", role: "Bar", mood: "Alright", bio: "Works Layout Road. The outdoor bar is the reason most people stop.", home: "Works Layout" },
  { id: "npc-uchenna", name: "Uchenna", placeId: "prestige-hotel", role: "Front desk", mood: "Alright", bio: "97 Works Layout Road. A short check-in.", home: "Works Layout" },
  { id: "npc-kelechi-kavana", name: "Kelechi", placeId: "kavana-hotel", role: "Host", mood: "Bright", bio: "21 Nkwerre Street. Rooms upstairs, food court below.", home: "Works Layout" },
  { id: "npc-obiageli", name: "Obiageli", placeId: "kingplatz-hotel", role: "Front desk", mood: "Bright", bio: "420b Works Layout Road. The paint is still new.", home: "Works Layout" },
  { id: "npc-zubby", name: "Zubby", placeId: "earls-court", role: "Front desk", mood: "Alright", bio: "Off Iho Dimeze Street. Executive rooms, quiet corridor.", home: "Works Layout" },
  { id: "npc-cruz", name: "Chuka", placeId: "diamond-cruz", role: "Front desk", mood: "Alright", bio: "Off Douglas Road, a short walk from Works Layout.", home: "Douglas Road" },
  { id: "npc-cruise", name: "Cruise", placeId: "josephs-pot", role: "Owner", mood: "On top", bio: "The pot does not follow the usual rules. Ofe Owerri still comes out hot.", home: "Ikenegbu" },
  { id: "npc-munachi", name: "Munachi", placeId: "feedwell", role: "Server", mood: "Bright", bio: "Oduobi Crescent stays full from morning till the pots cool.", home: "Ikenegbu" },
  { id: "npc-uzo", name: "Uzo", placeId: "crunchies", role: "Counter", mood: "Alright", bio: "Bags the chicken on Mbari Road and calls the next number.", home: "Centre" },
  { id: "npc-ebuka-bar", name: "Ebuka", placeId: "channel-garden", role: "Bartender", mood: "Alright", bio: "Pours drinks in the open air.", home: "World Bank" },
  { id: "npc-zainab", name: "Zainab", placeId: "zuma-grill", role: "Host", mood: "On top", bio: "Runs the floor when the grill turns into a lounge.", home: "New Owerri" },
  { id: "npc-uchechi", name: "Uchechi", placeId: "ibari-village", role: "Singer", mood: "Bright", bio: "Sings when the band is in the mood.", home: "Ikenegbu" },
  { id: "npc-donald", name: "Donald", placeId: "donalds", role: "Owner", mood: "Alright", bio: "Stands by the till.", home: "Aladinma" },
  { id: "npc-domino", name: "Chiamaka", placeId: "dominos", role: "Counter", mood: "Bright", bio: "Boxes the pizza beside Donald's and calls the name on the slip.", home: "Centre" },
  { id: "npc-coldstone", name: "Ife", placeId: "cold-stone", role: "Scooper", mood: "On top", bio: "Mixes the ice cream on the cold slab and does not rush the toppings.", home: "New Owerri" },
  { id: "npc-assumpta", name: "Father Ugo", placeId: "assumpta-cathedral", role: "Priest", mood: "Calm", bio: "Keeps the cathedral on the open land at Ibis Royale. Mass is quiet, and the dome is the landmark.", home: "World Bank" },
  { id: "npc-everyday", name: "Cynthia", placeId: "everyday", role: "Cashier", mood: "Bright", bio: "Runs the till on the same open land as the cathedral, beside Ibis Royale.", home: "World Bank" },
  { id: "npc-anonymous", name: "Nonso Plug", placeId: "anonymous-gadgets", role: "Vendor", mood: "Bright", bio: "49 Tetlow Road. He unlocks a phone and slides it across the glass.", home: "Tetlow Road" },
  { id: "npc-sugar", name: "Sugar", placeId: "sugar-gadgets", role: "Vendor", mood: "On top", bio: "Calls the price before you finish asking. The cases are on the wall behind him.", home: "Tetlow Road" },
  { id: "npc-buc", name: "Uche BUC", placeId: "buc-phones", role: "Vendor", mood: "Alright", bio: "BUC Phones. He keeps the sealed boxes under the counter.", home: "Tetlow Road" },
  { id: "npc-elion", name: "Elion", placeId: "elion-phones", role: "Vendor", mood: "Bright", bio: "Accessories at 17 Tetlow. Chargers, glass, and pouches.", home: "Tetlow Road" },
  { id: "npc-ocha", name: "Ocha", placeId: "ocha-gadgets", role: "Vendor", mood: "Alright", bio: "Knows which phone is still in stock this afternoon.", home: "Tetlow Road" },
  { id: "npc-maxii", name: "Maxii", placeId: "maxii-gadgets", role: "Vendor", mood: "Bright", bio: "The Njemanze corner of Tetlow. Tested and boxed.", home: "Tetlow Road" },
  { id: "npc-easylife", name: "Prosper", placeId: "easy-life", role: "Vendor", mood: "Alright", bio: "5 Tetlow Road. Opens earlier than the rest of the street.", home: "Tetlow Road" },
  { id: "npc-plug", name: "Hub", placeId: "gadgets-plug", role: "Vendor", mood: "Bright", bio: "4 Tetlow Road. Points you to the phone you can actually pay for.", home: "Tetlow Road" },
  { id: "npc-golden", name: "Amara", placeId: "golden-villa", role: "Front desk", mood: "Bright", bio: "Checks you in opposite the trade centre.", home: "New Owerri" },
  { id: "npc-warehouse", name: "Kelechi Ware", placeId: "the-warehouse", role: "Host", mood: "Bright", bio: "Points you to a lane or a table on Uzor Avenue.", home: "New Owerri" },
  { id: "npc-cars", name: "Obi Cars", placeId: "car-stand", role: "Dealer", mood: "Alright", bio: "Walks the rows behind the river bank and knows which car still starts.", home: "Nworie" },
  { id: "npc-hajiya", name: "Hajiya", placeId: "kilimanjaro", role: "Owner", mood: "Alright", bio: "The kitchen answers to her.", home: "World Bank" },
  { id: "npc-femi", name: "Femi", placeId: "november-5", role: "Chef", mood: "Tight", bio: "Plates leave when they are ready, not when you are.", home: "Aladinma" },
  { id: "npc-rita", name: "Rita", placeId: "relief-market", role: "Trader", mood: "Bright", bio: "Has a stall on the Wetheral side, by MCC, and a loud voice.", home: "Relief" },
  { id: "npc-mall-guard", name: "Guard Pious", placeId: "owerri-mall", role: "Security", mood: "Tight", bio: "Watches the Egbu Road entrance.", home: "Egbu Road" },
  { id: "npc-square", name: "Emeka Square", placeId: "heroes-square", role: "Regular", mood: "Alright", bio: "Sits on the low wall every evening.", home: "Ikenegbu" },
  { id: "npc-stadium", name: "Coach Ifeanyi", placeId: "stadium", role: "Coach", mood: "Bright", bio: "Walks the track behind General Hospital and shouts at late players.", home: "Wetheral" },
  { id: "npc-palms", name: "Papa Palms", placeId: "owerri-west-palms", role: "Farmer", mood: "Alright", bio: "Keeps the Owerri West palms beside Dan Anyiam Stadium.", home: "Owerri West" },
  { id: "npc-curator", name: "Ada Mbari", placeId: "mbari", role: "Curator", mood: "Alright", bio: "Talks about the works if you ask once.", home: "Aladinma" },
  { id: "npc-front-desk", name: "Blessing", placeId: "budget-lodge", role: "Front desk", mood: "Alright", bio: "Hands over the room key and goes back to her phone.", home: "Works Layout" },
  { id: "npc-concierge", name: "Mr Dan", placeId: "business-hotel", role: "Concierge", mood: "Bright", bio: "The lobby is his.", home: "New Owerri" },
  { id: "npc-concord-host", name: "Vera", placeId: "concord-hotel", role: "Host", mood: "On top", bio: "The canopy, the lobby, and the club floor.", home: "New Owerri" },
  { id: "npc-airport", name: "Ifunanya", placeId: "sam-mbakwe", role: "Check-in", mood: "Bright", bio: "Sells the flight and the stay as one ticket, then waves you toward the gate.", home: "Ngor Okpala" },
  { id: "npc-imsu-reg", name: "Mrs Obi", placeId: "imsu", role: "Registrar", mood: "Tight", bio: "Takes applications at IMSU and does not like a half-filled form.", home: "Aladinma" },
  { id: "npc-imsu-student", name: "Chiamaka", placeId: "imsu", role: "Student", mood: "Bright", bio: "Lives for the days her lecture actually holds.", home: "Aladinma" },
  { id: "npc-futo-reg", name: "Prof Eze", placeId: "futo", role: "Lecturer", mood: "Alright", bio: "Teaches at FUTO and starts when the clock says so.", home: "Ihiagwa" },
  { id: "npc-futo-student", name: "Tobe", placeId: "futo", role: "Student", mood: "Tight", bio: "Crosses from the gate into campus for computer science.", home: "Ihiagwa" },
  { id: "npc-poly-reg", name: "Mrs Nwosu", placeId: "fedpoly-nekede", role: "Registrar", mood: "Alright", bio: "Runs the desk at Federal Polytechnic Nekede.", home: "Nekede" },
  { id: "npc-poly-student", name: "Ijeoma", placeId: "fedpoly-nekede", role: "Student", mood: "Bright", bio: "Knows which lecture rooms are actually open.", home: "Nekede" },
  { id: "npc-amara", name: "Amara", placeId: "concord-avenue", role: "Listed", mood: "Alright", bio: "Opted in. She set her own price. The meet-up fades to black.", home: "New Owerri", asking: 20000 },
  { id: "npc-halima", name: "Halima", placeId: "concord-avenue", role: "Listed", mood: "Bright", bio: "Opted in. Her price is on her head. Fade to black.", home: "Aladinma", asking: 15000 },
  { id: "npc-tobi", name: "Tobi", placeId: "concord-avenue", role: "Listed", mood: "On top", bio: "Opted in. If you cannot meet it, she stays. Nothing explicit is shown.", home: "New Owerri", asking: 60000 },
  { id: "npc-chinaza", name: "Chinaza", placeId: "works-layout", role: "Listed", mood: "Alright", bio: "Opted in. A lower price than the rest of this street.", home: "Ikenegbu", asking: 3000 },
  { id: "npc-ifeoma", name: "Ifeoma", placeId: "works-layout", role: "Listed", mood: "Alright", bio: "Opted in. She can switch it off. Nothing explicit is shown.", home: "Ikenegbu", asking: 8000 },
  { id: "npc-uju", name: "Uju", placeId: "works-layout", role: "Listed", mood: "Tight", bio: "Opted in. Her price is high. Check someone else if you cannot meet it.", home: "World Bank", asking: 250000 },
  { id: "npc-peace", name: "Peace", placeId: "hospital-junction", role: "Listed", mood: "Bright", bio: "Opted in. The lowest price on this junction.", home: "Ikenegbu", asking: 5000 },
  { id: "npc-nneka", name: "Nneka", placeId: "hospital-junction", role: "Listed", mood: "Tight", bio: "Opted in for in-game offers only. Fade to black.", home: "World Bank", asking: 12000 },
  { id: "npc-kemi", name: "Kemi", placeId: "hospital-junction", role: "Listed", mood: "Alright", bio: "Opted in. She set a mid price and stays if you cannot meet it.", home: "Aladinma", asking: 25000 },
  { id: "npc-blessing", name: "Blessing", placeId: "concord-avenue", role: "Listed", mood: "Bright", bio: "Opted in. Standing on Concord Avenue. Fade to black.", home: "New Owerri", asking: 18000 },
  { id: "npc-chika", name: "Chika", placeId: "concord-avenue", role: "Listed", mood: "Alright", bio: "Opted in. Her price is on her head.", home: "Aladinma", asking: 35000 },
  { id: "npc-oma", name: "Oma", placeId: "works-layout", role: "Listed", mood: "Bright", bio: "Opted in. Works Layout after dark.", home: "World Bank", asking: 7000 },
  { id: "npc-sandra", name: "Sandra", placeId: "works-layout", role: "Listed", mood: "On top", bio: "Opted in. A higher price on this street.", home: "New Owerri", asking: 45000 },
  { id: "npc-rita", name: "Rita", placeId: "hospital-junction", role: "Listed", mood: "Alright", bio: "Opted in. Hospital Junction after visiting hours.", home: "Ikenegbu", asking: 9000 },
  { id: "npc-lillian", name: "Lillian", placeId: "hospital-junction", role: "Listed", mood: "Tight", bio: "Opted in. She waits by the junction lamps.", home: "Aladinma", asking: 40000 },
];

export function lookById(id: string) {
  const found = LOOKS.find((look) => look.id === id);
  if (!found) throw new Error(`Unknown look ${id}`);
  return found;
}

export function careerById(id: string) {
  const found = CAREERS.find((career) => career.id === id);
  if (!found) throw new Error(`Unknown career ${id}`);
  return found;
}

export function homeById(id: string) {
  const found = HOMES.find((home) => home.id === id);
  if (!found) throw new Error(`Unknown home ${id}`);
  return found;
}

export function placeById(id: string) {
  const found = PLACES.find((place) => place.id === id);
  if (!found) throw new Error(`Unknown place ${id}`);
  return found;
}

export function clockFace(hour: number) {
  return `${String(((hour % 24) + 24) % 24).padStart(2, "0")}:00`;
}

export function parsePlaceHours(hours: string): { always: boolean; open: number; close: number } {
  if (!hours || /always|your room|your flat|your place/i.test(hours)) {
    return { always: true, open: 0, close: 24 };
  }
  const match = hours.match(/(\d{1,2})(?::(\d{2}))?\s*[–-]\s*(\d{1,2})(?::(\d{2}))?/);
  if (!match) return { always: true, open: 0, close: 24 };
  const open = Number(match[1]);
  const close = Number(match[3]) === 24 ? 24 : Number(match[3]);
  return { always: false, open, close };
}

export function placeIsOpen(place: Place, hour: number) {
  const spec = parsePlaceHours(place.hours);
  if (spec.always) return true;
  const now = ((hour % 24) + 24) % 24;
  if (spec.open === spec.close) return true;
  if (spec.open < spec.close) return now >= spec.open && now < spec.close;
  return now >= spec.open || now < spec.close;
}

export function placeClosedNotice(place: Place, hour: number) {
  if (placeIsOpen(place, hour)) return null;
  const spec = parsePlaceHours(place.hours);
  return `${place.name} is not open now. Come back by ${clockFace(spec.open)}.`;
}

export function canSitAt(place: Place) {
  return (
    place.kind === "nightlife" ||
    place.kind === "hotel" ||
    place.kind === "home" ||
    place.id === "cartel-beach" ||
    place.id === "heartland-resort" ||
    place.id === "oxygen-resort" ||
    place.id === "nworie-park"
  );
}

const FEMALE_NPC = new Set(
  [
    "Adaeze", "Chioma", "Amaka", "Ngozi", "Ada", "Ifeoma", "Bisi", "Kamsi", "Nkechi", "Uche", "Lola",
    "Nneoma", "Lillian", "Chidera", "Ogechi", "Ginika", "Nkiru", "Adaora", "Chisom", "Ifunanya",
    "Chinyere", "Obiageli", "Munachi", "Zainab", "Uchechi", "Chiamaka", "Ife", "Cynthia", "Amara",
    "Hajiya", "Rita", "Blessing", "Vera", "Ijeoma", "Halima", "Tobi", "Chinaza", "Uju", "Peace",
    "Nneka", "Kemi", "Chika", "Oma", "Sandra", "Okeke",
  ].map((name) => name.toLowerCase()),
);

export function npcGender(npc: Npc): Gender {
  if (npc.asking) return "female";
  const name = npc.name.replace(/^(Mrs|Nurse|Dr|Sister|Chef|Mama|Father|Prof|Guard|Mr)\s+/i, "").split(" ")[0];
  if (FEMALE_NPC.has(name.toLowerCase())) return "female";
  return "male";
}

export function lookForGender(gender: Gender | null | undefined, seed = "") {
  const pool = LOOKS.filter((look) => !gender || look.gender === gender);
  const list = pool.length ? pool : LOOKS;
  let hash = 0;
  for (const char of seed) hash = (hash * 33 + char.charCodeAt(0)) >>> 0;
  return list[hash % list.length].id;
}

export function matchLook(look: LookId, gender: Gender | null | undefined, seed = ""): LookId {
  const pal = LOOKS.find((item) => item.id === look);
  if (!gender || pal?.gender === gender) return look;
  return lookForGender(gender, seed || look);
}

export function npcLook(npc: Npc): LookId {
  return lookForGender(npcGender(npc), npc.id);
}

export function homeAreaId(homeId: string) {
  return homeById(homeId).areaId;
}

export function areaFromHomeName(home: string) {
  const named = PLACES.find(
    (place) =>
      place.kind === "home" &&
      (place.name.toLowerCase() === home.toLowerCase() || place.area.toLowerCase() === home.toLowerCase() || place.id === home.toLowerCase().replace(/\s+/g, "-")),
  );
  return named?.id ?? "ikenegbu";
}

export function npcById(id: string) {
  return NPCS.find((npc) => npc.id === id) ?? null;
}

export function npcsAt(placeId: string) {
  return NPCS.filter((npc) => npc.placeId === placeId);
}

export function plotById(id: string) {
  const found = LANDS.find((plot) => plot.id === id);
  if (!found) throw new Error(`Unknown plot ${id}`);
  return found;
}

export function dreamById(id: DreamId) {
  const found = DREAMS.find((dream) => dream.id === id);
  if (!found) throw new Error(`Unknown dream ${id}`);
  return found;
}

export function traitById(id: TraitId) {
  const found = TRAITS.find((trait) => trait.id === id);
  if (!found) throw new Error(`Unknown trait ${id}`);
  return found;
}
