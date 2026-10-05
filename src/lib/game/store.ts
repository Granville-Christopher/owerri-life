import { readFileSync } from "fs";
import path from "path";
import { MongoClient } from "mongodb";
import { buildSlate } from "./engine";
import type { ChatMessage, DB } from "./types";

const seedChat: ChatMessage[] = [
  {
    id: "seed-lounge",
    venueId: "cartel-lounge",
    fromId: "npc-adaeze",
    fromName: "Adaeze",
    text: "Sound check done. DJs, come before the room fills.",
    at: "Monday 07:40 · Day 1",
  },
  {
    id: "seed-market",
    venueId: "eke-ukwu",
    fromId: "npc-obi",
    fromName: "Obi",
    text: "Market don open. If you dey trade, no come late.",
    at: "Monday 07:20 · Day 1",
  },
  {
    id: "seed-buka",
    venueId: "mama-nkechi",
    fromId: "npc-nkechi",
    fromName: "Mama Nkechi",
    text: "Rice is ready. Come eat before the afternoon rush.",
    at: "Monday 07:10 · Day 1",
  },
  {
    id: "seed-park",
    venueId: "nworie-park",
    fromId: "npc-kamsi",
    fromName: "Kamsi",
    text: "Light is good by the river this morning.",
    at: "Monday 07:30 · Day 1",
  },
];

const globalMongo = globalThis as unknown as { owerriMongo?: MongoClient };

function client() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Add MONGODB_URI to .env.local.");
  if (!globalMongo.owerriMongo) globalMongo.owerriMongo = new MongoClient(uri);
  return globalMongo.owerriMongo;
}

function emptyDb(): DB {
  return { players: [], ledger: [], chat: seedChat, messages: [], reports: [], fixtures: buildSlate(), bets: [], requests: [] };
}

function hydrate(parsed: Partial<DB> | null): DB {
  if (!parsed) return emptyDb();
  const players = parsed.players ?? [];
  for (const player of players) {
    if (typeof player.indoors !== "boolean") player.indoors = false;
    if (!player.lastRide) player.lastRide = "trek";
    if (player.policeInvite === undefined) player.policeInvite = null;
    if (player.detainedUntil === undefined) player.detainedUntil = null;
    if (player.school === undefined) player.school = null;
    if (player.room === undefined) player.room = null;
    if (!player.lands) player.lands = [];
    if (player.besideId === undefined) player.besideId = null;
  }
  return {
    players,
    ledger: parsed.ledger ?? [],
    chat: parsed.chat ?? seedChat,
    messages: parsed.messages ?? [],
    reports: parsed.reports ?? [],
    fixtures: parsed.fixtures?.length ? parsed.fixtures : buildSlate(),
    bets: parsed.bets ?? [],
    requests: parsed.requests ?? [],
  };
}

function localSave(): DB | null {
  try {
    const raw = readFileSync(path.join(process.cwd(), "data", "game.json"), "utf8");
    return hydrate(JSON.parse(raw) as Partial<DB>);
  } catch {
    return null;
  }
}

type CityDoc = DB & { _id: "state" };

async function collection() {
  const db = client().db("owerri-life");
  return db.collection<CityDoc>("city");
}

async function load(): Promise<DB> {
  const city = await collection();
  const doc = await city.findOne({ _id: "state" });
  if (doc) return hydrate(doc as unknown as Partial<DB>);
  const initial = localSave() ?? emptyDb();
  await city.insertOne({ _id: "state", ...initial });
  return initial;
}

async function persist(state: DB) {
  const city = await collection();
  await city.updateOne({ _id: "state" }, { $set: state }, { upsert: true });
}

let chain: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const run = chain.then(work, work);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function readDb() {
  return enqueue(async () => structuredClone(await load()));
}

export function mutate<T>(fn: (db: DB) => { save: boolean; value: T }) {
  return enqueue(async () => {
    const db = await load();
    const { save, value } = fn(db);
    if (save) await persist(db);
    return value;
  });
}
