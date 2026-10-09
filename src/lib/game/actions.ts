"use server";

import { LOOKS, npcsAt, npcById, placeById, homeById, homeAreaId, areaFromHomeName } from "./content";
import {
  applyCourse,
  applyForJob,
  attendLecture,
  createNewPlayer,
  buildSlate,
  bookRoom,
  buyCar as buyCarFromStand,
  chooseCar as chooseCarToDrive,
  sellFurniture,
  buyDrink,
  dance,
  dorime,
  dropOut,
  eat,
  enterPlace,
  furnish,
  placeFurniture,
  flyAway,
  hangOut,
  honourInvite,
  freshSlate,
  kickOff,
  leaveRoom,
  moveHome,
  npcReply,
  openPoliceCase,
  payArrears,
  placeBet,
  paySchoolFees,
  POLICE_ID,
  reportActivity,
  postChat,
  orderPlate,
  quitJob,
  restroom,
  sendOffer,
  sprayMoney,
  stepOutside,
  shower,
  sleep,
  buyLand,
  meetPerson,
  normalizeBet,
  sleepInRoom,
  topUp,
  travel,
  serveDetention,
  settlePolice,
  treat,
  validateDream,
  validateLook,
  validateTraits,
  waitHour,
  workShift,
  setPose,
  startHomeScene,
  goToHouse,
  payPeer,
  giftPlate,
  FOOD_GIFT,
} from "./engine";
import { naira, stamp } from "./format";
import { authBlocked, authCleared, authFailed, burnPasswordCheck, clearSession, hashPassword, needsUpgrade, sessionPlayerId, setSession, verifyPassword } from "./auth";
import { passwordProblem } from "./password";
import { mutate, readDb } from "./store";
import type { BetPick, ChatQuote, CreateInput, Gender, LookId, NetWorthVisibility, Placement, Reveal, TraitId, TravelMode, WorkStyle } from "./types";

export type ActionResult = { ok: true; notice?: string } | { ok: false; error: string };
export type CreateResult =
  | { ok: true; reveal: { lottery: string; title: string; cash: number; home: string; perk: string } }
  | { ok: false; error: string; suggestions?: string[] };

function cleanUsername(value: string) {
  return value.trim();
}

function usernameProblem(username: string) {
  if (!/^[a-zA-Z0-9_]{3,16}$/.test(username)) {
    return "Username needs 3 to 16 characters. Letters, numbers, and underscores are allowed.";
  }
  if (/^\d+$/.test(username)) return "A username cannot be only numbers. Add a letter or an underscore.";
  if (/^_+$/.test(username)) return "A username cannot be only underscores. Add a letter or a number.";
  return null;
}

function suggestUsernames(username: string, used: Set<string>) {
  const stem = username.replace(/[^\w]/g, "").slice(0, 12) || "owerri";
  const found: string[] = [];
  for (let n = 1; found.length < 3 && n < 80; n += 1) {
    for (const candidate of [`${stem}_${n}`, `${stem}${n}`]) {
      const name = candidate.slice(0, 16);
      if (usernameProblem(name) || used.has(name.toLowerCase())) continue;
      if (found.some((item) => item.toLowerCase() === name.toLowerCase())) continue;
      found.push(name);
      if (found.length === 3) break;
    }
  }
  return found;
}

function validAccount(username: string, email: string, password: string) {
  const nameError = usernameProblem(username);
  if (nameError) return nameError;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a real email.";
  return passwordProblem(password);
}

export async function checkUsername(raw: string): Promise<{ ok: true } | { ok: false; error: string; suggestions: string[] }> {
  const username = cleanUsername(raw);
  const problem = usernameProblem(username);
  if (problem) return { ok: false, error: problem, suggestions: [] };
  const db = await readDb();
  const used = new Set(db.players.map((player) => player.username.toLowerCase()));
  if (!used.has(username.toLowerCase())) return { ok: true };
  return {
    ok: false,
    error: "That username is taken. Change it.",
    suggestions: suggestUsernames(username, used),
  };
}

async function withPlayer(run: (playerId: string) => Promise<ActionResult>): Promise<ActionResult> {
  const id = await sessionPlayerId();
  if (!id) return { ok: false, error: "Sign in again." };
  return run(id);
}

export async function createAccount(input: {
  username: string;
  email: string;
  password: string;
  ageConfirmed: boolean;
  look: string;
  gender: string;
  traits: string[];
  dream: string;
  careerId: string;
}): Promise<CreateResult> {
  if (!input.ageConfirmed) return { ok: false, error: "Owerri Life is 18+." };
  const username = cleanUsername(input.username);
  const email = input.email.trim().toLowerCase();
  const blocked = authBlocked(`join:${email}`);
  if (blocked) return { ok: false, error: blocked };
  const accountError = validAccount(username, email, input.password);
  if (accountError) return { ok: false, error: accountError };
  if (input.gender !== "male" && input.gender !== "female") return { ok: false, error: "Choose male or female." };
  const face = LOOKS.find((item) => item.id === input.look);
  if (!face || face.gender !== input.gender) return { ok: false, error: "Pick a look that matches your gender." };
  if (!validateLook(input.look) || !validateTraits(input.traits) || !validateDream(input.dream)) {
    return { ok: false, error: "Finish look, two traits, and a dream." };
  }
  const created = await mutate<{ ok: true; reveal: Reveal; id: string } | { ok: false; error: string }>((db) => {
    const used = new Set(db.players.map((player) => player.username.toLowerCase()));
    if (used.has(username.toLowerCase())) {
      return {
        save: false,
        value: { ok: false as const, error: "That username is taken. Change it.", suggestions: suggestUsernames(username, used) },
      };
    }
    if (db.players.some((player) => player.email === email)) {
      return { save: false, value: { ok: false as const, error: "That email is already in the city." } };
    }
    const id = crypto.randomUUID();
    const draft: CreateInput = {
      username,
      email,
      look: input.look as LookId,
      gender: input.gender as Gender,
      traits: input.traits as TraitId[],
      dream: input.dream as CreateInput["dream"],
      careerId: input.careerId,
    };
    try {
      const { player, ledger, reveal } = createNewPlayer(draft, id);
      player.passwordHash = hashPassword(input.password);
      db.players.push(player);
      db.ledger.push(...ledger);
      return { save: true, value: { ok: true as const, reveal, id } };
    } catch {
      return { save: false, value: { ok: false as const, error: "Pick one of the six launch careers." } };
    }
  });
  if (!created.ok) {
    authFailed(`join:${email}`);
    return created;
  }
  authCleared(`join:${email}`);
  await setSession(created.id);
  return { ok: true, reveal: created.reveal };
}

export async function login(email: string, password: string): Promise<ActionResult> {
  const handle = email.trim().toLowerCase();
  const blocked = authBlocked(`login:${handle}`);
  if (blocked) return { ok: false, error: blocked };
  const outcome = await mutate<{ ok: true; id: string } | { ok: false; error: string }>((db) => {
    const player = db.players.find((item) => item.email === handle);
    const matches = player ? verifyPassword(password, player.passwordHash) : (burnPasswordCheck(password), false);
    if (!player || !matches) {
      return { save: false, value: { ok: false as const, error: "Email or password is wrong." } };
    }
    const upgrade = needsUpgrade(player.passwordHash);
    if (upgrade) player.passwordHash = hashPassword(password);
    return { save: upgrade, value: { ok: true as const, id: player.id } };
  });
  if (!outcome.ok) {
    authFailed(`login:${handle}`);
    return outcome;
  }
  authCleared(`login:${handle}`);
  await setSession(outcome.id);
  return { ok: true, notice: "Welcome back." };
}

export async function logout(): Promise<ActionResult> {
  await clearSession();
  return { ok: true };
}

function play(
  playerId: string,
  apply: (
    player: import("./types").Player,
    db: import("./types").DB,
  ) => { ok: true; player: import("./types").Player; notice?: string } | { ok: false; error: string },
  mode?: "custody",
) {
  return mutate<ActionResult>((db) => {
    const index = db.players.findIndex((player) => player.id === playerId);
    if (index < 0) return { save: false, value: { ok: false as const, error: "Sign in again." } };
    const gate = settlePolice(db.players[index], db);
    db.players[index] = gate.player;
    if (gate.blocked && mode !== "custody") {
      return { save: true, value: { ok: false as const, error: gate.notice } };
    }
    const result = apply(db.players[index], db);
    if (!result.ok) return { save: Boolean(gate.notice), value: result };
    const after = settlePolice(result.player, db);
    db.players[index] = after.player;
    const notice = [result.notice, after.arrested ? after.notice : ""].filter(Boolean).join(" ");
    return { save: true, value: { ok: true as const, notice } };
  });
}

export async function go(placeId: string, mode: TravelMode) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const step = travel(player, db.ledger, placeId, mode);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      const met = new Set(step.player.met);
      for (const npc of npcsAt(step.player.locationId)) met.add(npc.id);
      for (const other of db.players) {
        if (other.id !== player.id && other.locationId === step.player.locationId) met.add(other.id);
      }
      step.player.met = [...met];
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

export async function doWork(style: WorkStyle) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const step = workShift(player, db.ledger, style);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

export async function takeJob(careerId: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const step = applyForJob(player, db.ledger, careerId);
      if (!step.ok) return { ok: false, error: step.error };
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

export async function leaveJob() {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const step = quitJob(player, db.ledger);
      if (!step.ok) return { ok: false, error: step.error };
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

export async function changeHome(homeId: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const step = moveHome(player, db.ledger, homeId);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      const met = new Set(step.player.met);
      for (const npc of npcsAt(step.player.locationId)) met.add(npc.id);
      step.player.met = [...met];
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

export async function clearArrears() {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const step = payArrears(player, db.ledger);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

function simple(
  id: string,
  fn: (player: import("./types").Player, ledger: import("./types").LedgerEntry[]) => ReturnType<typeof sleep>,
) {
  return play(id, (player, db) => {
    const step = fn(player, db.ledger);
    if (!step.ok) return { ok: false, error: step.error };
    db.ledger = step.ledger;
    return { ok: true, player: step.player, notice: step.notice };
  });
}

export async function buyPlot(plotId: string) {
  return withPlayer((id) => simple(id, (player, ledger) => buyLand(player, ledger, plotId)));
}

export async function goMeet(peerId: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      if (peerId === POLICE_ID) return { ok: false, error: "The State CID does not meet. Come to the station." };
      if (player.blocked.includes(peerId)) return { ok: false, error: "You blocked this person." };
      const npc = npcById(peerId);
      const other = db.players.find((item) => item.id === peerId);
      if (!npc && !other) return { ok: false, error: "That person is not in the city." };
      if (other?.blocked.includes(player.id)) return { ok: false, error: "They are not taking messages from you." };
      const where = npc
        ? { placeId: npc.placeId, indoors: true, name: npc.name }
        : { placeId: other!.locationId, indoors: other!.indoors, name: other!.username };
      const step = meetPerson(player, db.ledger, peerId, where);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      const at = stamp(step.player.day, step.player.hour);
      const box = boxFor(player.id, peerId);
      db.messages.push({
        id: crypto.randomUUID(),
        box,
        fromId: player.id,
        text: `I want to meet. I am coming to you at ${placeById(where.placeId).name}.`,
        at,
      });
      if (npc) {
        db.messages.push({
          id: crypto.randomUUID(),
          box,
          fromId: npc.id,
          text: `I am here, at ${placeById(where.placeId).name}. Come stand with me.`,
          at,
        });
      }
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

export async function addTopUp(amount: number) {
  return withPlayer((id) => simple(id, (player, ledger) => topUp(player, ledger, amount)));
}

export async function sleepAtHome() {
  return withPlayer((id) => simple(id, sleep));
}
export async function showerAtHome() {
  return withPlayer((id) => simple(id, shower));
}
export async function buyFurniture(itemId: string) {
  return withPlayer((id) => simple(id, (player, ledger) => furnish(player, ledger, itemId)));
}
export async function moveFurniture(key: string, placement: Placement) {
  return withPlayer((id) => simple(id, (player, ledger) => placeFurniture(player, ledger, key, placement)));
}
export async function useRestroom() {
  return withPlayer((id) => simple(id, restroom));
}
export async function letTimePass() {
  return withPlayer((id) => simple(id, waitHour));
}
export async function enterDoor() {
  return withPlayer((id) => simple(id, enterPlace));
}
export async function goOutside() {
  return withPlayer((id) => simple(id, stepOutside));
}
export async function takeDrink() {
  return withPlayer((id) => simple(id, buyDrink));
}
function announce(db: import("./types").DB, player: import("./types").Player, kind: "spray" | "dorime", amount: number) {
  const now = Date.now();
  const calls = db.calls ?? [];
  calls.push({
    id: `call-${now}-${player.id}`,
    venueId: player.locationId,
    fromId: player.id,
    fromName: player.username,
    kind,
    amount,
    at: now,
  });
  db.calls = calls.filter((call) => now - call.at < 60_000).slice(-40);
}

export async function doDorime(amount: number) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const step = dorime(player, db.ledger, amount);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      announce(db, step.player, "dorime", Math.round(amount));
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}
export async function hitDanceFloor() {
  return withPlayer((id) => simple(id, dance));
}
export async function spray(amount: number) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const step = sprayMoney(player, db.ledger, amount);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      announce(db, step.player, "spray", Math.round(amount));
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}
export async function orderFood() {
  return withPlayer((id) => simple(id, orderPlate));
}
export async function buyCar(carId: string) {
  return withPlayer((id) => simple(id, (player, ledger) => buyCarFromStand(player, ledger, carId)));
}
export async function chooseCar(carId: string) {
  return withPlayer((id) => simple(id, (player, ledger) => chooseCarToDrive(player, ledger, carId)));
}
export async function sellFurniturePiece(key: string) {
  return withPlayer((id) => simple(id, (player, ledger) => sellFurniture(player, ledger, key)));
}
export async function takeRoom(stay: "night" | "hour") {
  return withPlayer((id) => simple(id, (player, ledger) => bookRoom(player, ledger, stay)));
}
export async function sleepAtHotel() {
  return withPlayer((id) => simple(id, sleepInRoom));
}
export async function checkoutRoom() {
  return withPlayer((id) => simple(id, leaveRoom));
}
export async function applyForCourse(courseId: string) {
  return withPlayer((id) => simple(id, (player, ledger) => applyCourse(player, ledger, courseId)));
}
export async function payFees() {
  return withPlayer((id) => simple(id, paySchoolFees));
}
export async function sitLecture() {
  return withPlayer((id) => simple(id, attendLecture));
}
export async function leaveSchool() {
  return withPlayer((id) => simple(id, dropOut));
}
export async function takeFlight(tripId: string) {
  return withPlayer((id) => simple(id, (player, ledger) => flyAway(player, ledger, tripId)));
}
export async function makeOffer(npcId: string) {
  return withPlayer((id) => simple(id, (player, ledger) => sendOffer(player, ledger, npcId)));
}
export async function eatBuka() {
  return withPlayer((id) => simple(id, (player, ledger) => eat(player, ledger, "buka")));
}
export async function eatGrill() {
  return withPlayer((id) => simple(id, (player, ledger) => eat(player, ledger, "grill")));
}
export async function socialise() {
  return withPlayer((id) => simple(id, hangOut));
}
export async function getTreatment() {
  return withPlayer((id) => simple(id, treat));
}

function quoteOf(replyTo?: ChatQuote | null): ChatQuote | null {
  if (!replyTo?.id || !replyTo.fromName) return null;
  return { id: replyTo.id, fromName: replyTo.fromName.slice(0, 40), text: replyTo.text.slice(0, 80) };
}

export async function sayInVenue(text: string, replyTo?: ChatQuote | null) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const posted = postChat(player, text);
      if (!posted.ok) return posted;
      db.chat.push({
        id: crypto.randomUUID(),
        venueId: player.locationId,
        fromId: player.id,
        fromName: player.username,
        text: posted.text,
        at: stamp(player.day, player.hour),
        replyTo: quoteOf(replyTo),
      });
      const here = db.chat.filter((message) => message.venueId === player.locationId).slice(-80);
      const keep = new Set(here.map((message) => message.id));
      db.chat = db.chat.filter((message) => message.venueId !== player.locationId || keep.has(message.id));
      return { ok: true, player, notice: "Sent to the group." };
    }),
  );
}

export async function deleteVenueLine(messageId: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const message = db.chat.find((item) => item.id === messageId);
      if (!message || message.venueId !== player.locationId) return { ok: false, error: "That message is gone." };
      if (message.fromId !== player.id) return { ok: false, error: "You can only delete a message you sent." };
      db.chat = db.chat.filter((item) => item.id !== messageId);
      return { ok: true, player, notice: "Deleted." };
    }),
  );
}

function boxFor(playerId: string, peerId: string) {
  return [playerId, peerId].sort().join("|");
}

export async function sendMessage(peerId: string, text: string, replyTo?: ChatQuote | null) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const cleaned = text.trim().slice(0, 200);
      if (!cleaned) return { ok: false, error: "Write a message first." };
      if (peerId === POLICE_ID) return { ok: false, error: "The State CID does not take chat. Come to the station." };
      if (player.blocked.includes(peerId)) return { ok: false, error: "You blocked this person." };
      if (player.dmToday >= 30) return { ok: false, error: "Daily message limit reached. Let a day pass." };
      const npc = npcById(peerId);
      const other = db.players.find((item) => item.id === peerId);
      if (!npc && !other) return { ok: false, error: "That person is not in the city." };
      if (other?.blocked.includes(player.id)) return { ok: false, error: "They are not taking messages from you." };
      const at = stamp(player.day, player.hour);
      const box = boxFor(player.id, peerId);
      db.messages.push({ id: crypto.randomUUID(), box, fromId: player.id, text: cleaned, at, replyTo: quoteOf(replyTo) });
      if (npc) {
        const count = db.messages.filter((message) => message.box === box).length;
        db.messages.push({
          id: crypto.randomUUID(),
          box,
          fromId: npc.id,
          text: npcReply(cleaned, count),
          at,
        });
      }
      const next = structuredClone(player);
      next.dmToday += 1;
      if (!next.met.includes(peerId)) next.met.push(peerId);
      return { ok: true, player: next, notice: "Sent." };
    }),
  );
}

export async function deleteDirectLine(messageId: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const message = db.messages.find((item) => item.id === messageId);
      if (!message || !message.box.split("|").includes(player.id)) return { ok: false, error: "That message is gone." };
      if (message.fromId !== player.id) return { ok: false, error: "You can only delete a message you sent." };
      db.messages = db.messages.filter((item) => item.id !== messageId);
      return { ok: true, player, notice: "Deleted." };
    }),
  );
}

function pushDirect(
  db: import("./types").DB,
  player: import("./types").Player,
  peerId: string,
  text: string,
  extra?: { kind?: import("./types").DirectKind; amount?: number; placeId?: string | null },
) {
  db.messages.push({
    id: crypto.randomUUID(),
    box: boxFor(player.id, peerId),
    fromId: player.id,
    text,
    at: stamp(player.day, player.hour),
    kind: extra?.kind ?? "text",
    amount: extra?.amount,
    placeId: extra?.placeId ?? null,
  });
}

export async function sitDown() {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const partner = player.besideId ? db.players.find((item) => item.id === player.besideId) ?? null : null;
      const moved = setPose(player, "sit", partner);
      if (partner && moved.partner) {
        const index = db.players.findIndex((item) => item.id === partner.id);
        if (index >= 0) db.players[index] = moved.partner;
      }
      return { ok: true, player: moved.player, notice: "You sat down." };
    }),
  );
}

export async function standUp() {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const partner = player.intimacyWith || player.besideId
        ? db.players.find((item) => item.id === (player.intimacyWith ?? player.besideId)) ?? null
        : null;
      const moved = setPose(player, "stand", partner);
      if (partner && moved.partner) {
        const index = db.players.findIndex((item) => item.id === partner.id);
        if (index >= 0) db.players[index] = moved.partner;
      }
      return { ok: true, player: moved.player, notice: "You stood up." };
    }),
  );
}

export async function doFawwwk(peerId: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      if (player.blocked.includes(peerId)) return { ok: false, error: "You blocked this person." };
      const other = db.players.find((item) => item.id === peerId) ?? null;
      if (other?.blocked.includes(player.id)) return { ok: false, error: "They are not taking that from you." };
      const npc = other ? null : npcById(peerId);
      if (!other && !npc) return { ok: false, error: "That person is not in the city." };
      const step = startHomeScene(player, other, peerId);
      if (!step.ok) return { ok: false, error: step.error };
      if (other && step.partner) {
        const index = db.players.findIndex((item) => item.id === other.id);
        if (index >= 0) db.players[index] = step.partner;
      }
      const next = structuredClone(step.player);
      next.besideId = peerId;
      next.needs.social = Math.min(100, next.needs.social + 18);
      next.needs.fun = Math.min(100, next.needs.fun + 14);
      next.needs.energy = Math.max(0, next.needs.energy - 20);
      if (other && step.partner) {
        const index = db.players.findIndex((item) => item.id === other.id);
        if (index >= 0) {
          db.players[index].needs.social = Math.min(100, db.players[index].needs.social + 18);
          db.players[index].needs.fun = Math.min(100, db.players[index].needs.fun + 14);
          db.players[index].needs.energy = Math.max(0, db.players[index].needs.energy - 20);
        }
      }
      return { ok: true, player: next, notice: other ? `You and ${other.username} went to bed.` : `You and ${npc!.name} went to bed.` };
    }),
  );
}

export async function inviteOver(peerId: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      if (peerId === POLICE_ID) return { ok: false, error: "The State CID does not come over." };
      if (player.blocked.includes(peerId)) return { ok: false, error: "You blocked this person." };
      const npc = npcById(peerId);
      const other = db.players.find((item) => item.id === peerId);
      if (!npc && !other) return { ok: false, error: "That person is not in the city." };
      if (other?.blocked.includes(player.id)) return { ok: false, error: "They are not taking messages from you." };
      const home = homeById(player.homeId);
      const text = `${player.username} invited you over to ${home.name}. Only you two can see this.`;
      pushDirect(db, player, peerId, text, { kind: "invite" });
      if (npc) {
        const step = goToHouse(player, db.ledger, { placeId: home.areaId, name: home.name, peerId });
        if (!step.ok) return { ok: false, error: step.error };
        db.ledger = step.ledger;
        db.messages.push({
          id: crypto.randomUUID(),
          box: boxFor(player.id, peerId),
          fromId: npc.id,
          text: `I am coming. See you at ${home.name}.`,
          at: stamp(step.player.day, step.player.hour),
        });
        return { ok: true, player: step.player, notice: `${npc.name} is coming over.` };
      }
      return { ok: true, player, notice: `Invite sent to ${other!.username}.` };
    }),
  );
}

export async function visitHouseOf(peerId: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      if (peerId === POLICE_ID) return { ok: false, error: "The State CID is not a house." };
      if (player.blocked.includes(peerId)) return { ok: false, error: "You blocked this person." };
      const npc = npcById(peerId);
      const other = db.players.find((item) => item.id === peerId);
      if (!npc && !other) return { ok: false, error: "That person is not in the city." };
      if (other?.blocked.includes(player.id)) return { ok: false, error: "They are not taking visitors from you." };
      const where = other
        ? { placeId: homeAreaId(other.homeId), name: `${other.username}'s house`, peerId }
        : { placeId: areaFromHomeName(npc!.home), name: `${npc!.name}'s place`, peerId };
      const step = goToHouse(player, db.ledger, where);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      pushDirect(db, step.player, peerId, `I am at your house.`, { kind: "text", placeId: where.placeId });
      if (other) {
        other.besideId = player.id;
        if (!other.met.includes(player.id)) other.met.push(player.id);
      }
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

export async function sendMoney(peerId: string, amount: number) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      if (peerId === POLICE_ID) return { ok: false, error: "The State CID does not take a transfer here." };
      if (player.blocked.includes(peerId)) return { ok: false, error: "You blocked this person." };
      const other = db.players.find((item) => item.id === peerId);
      if (!other) return { ok: false, error: "You can only send money to another resident." };
      if (other.blocked.includes(player.id)) return { ok: false, error: "They are not taking money from you." };
      const step = payPeer(player, db.ledger, other, amount, `Transfer to ${other.username}`);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      const index = db.players.findIndex((item) => item.id === other.id);
      if (index >= 0) db.players[index] = step.other;
      pushDirect(db, player, peerId, `${player.username} sent you ${naira(Math.round(amount))}.`, {
        kind: "money",
        amount: Math.round(amount),
      });
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

export async function buyThemFood(peerId: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      if (player.blocked.includes(peerId)) return { ok: false, error: "You blocked this person." };
      const other = db.players.find((item) => item.id === peerId);
      if (!other) return { ok: false, error: "You can only buy food for another resident." };
      if (other.blocked.includes(player.id)) return { ok: false, error: "They are not taking food from you." };
      const step = giftPlate(player, db.ledger, other);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      const index = db.players.findIndex((item) => item.id === other.id);
      if (index >= 0) db.players[index] = step.other;
      pushDirect(db, player, peerId, `${player.username} bought you ${FOOD_GIFT.name} · ${naira(FOOD_GIFT.cost)}.`, {
        kind: "food",
        amount: FOOD_GIFT.cost,
      });
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

export async function postToChat(peerId: string, text: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const cleaned = text.trim().slice(0, 200);
      if (!cleaned) return { ok: false, error: "Write something to post." };
      if (player.blocked.includes(peerId)) return { ok: false, error: "You blocked this person." };
      const npc = npcById(peerId);
      const other = db.players.find((item) => item.id === peerId);
      if (!npc && !other) return { ok: false, error: "That person is not in the city." };
      if (other?.blocked.includes(player.id)) return { ok: false, error: "They are not taking posts from you." };
      pushDirect(db, player, peerId, cleaned, { kind: "post" });
      return { ok: true, player, notice: "Posted in this private chat." };
    }),
  );
}

export async function talkBeside(peerId: string, text: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const cleaned = text.trim().slice(0, 200);
      if (!cleaned) return { ok: false, error: "Write a message first." };
      if (player.blocked.includes(peerId)) return { ok: false, error: "You blocked this person." };
      const npc = npcById(peerId);
      const other = db.players.find((item) => item.id === peerId);
      if (!npc && !other) return { ok: false, error: "That person is not in the city." };
      if (other?.blocked.includes(player.id)) return { ok: false, error: "They are not taking messages from you." };
      const here = other
        ? other.locationId === player.locationId
        : npc!.placeId === player.locationId || player.besideId === peerId;
      if (!here && player.besideId !== peerId) return { ok: false, error: "Walk up to them first." };
      const next = structuredClone(player);
      next.besideId = peerId;
      next.dmToday += 1;
      if (!next.met.includes(peerId)) next.met.push(peerId);
      pushDirect(db, next, peerId, cleaned, { kind: "text", placeId: next.locationId });
      if (npc) {
        db.messages.push({
          id: crypto.randomUUID(),
          box: boxFor(next.id, peerId),
          fromId: npc.id,
          text: npcReply(cleaned, db.messages.filter((message) => message.box === boxFor(next.id, peerId)).length),
          at: stamp(next.day, next.hour),
          placeId: next.locationId,
        });
      }
      return { ok: true, player: next, notice: "Said." };
    }),
  );
}

export async function placeSlip(selections: Array<{ fixtureId: string; pick: BetPick }>, stake: number, sharedCode = "") {
  return withPlayer((id) =>
    play(id, (player, db) => {
      if (!db.fixtures?.length) db.fixtures = buildSlate();
      const step = placeBet(player, db.ledger, db.fixtures, db.bets ?? [], selections, stake, sharedCode);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      db.bets = step.bets;
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

export async function loadBooking(code: string) {
  const cleaned = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleaned.length < 4) return { ok: false as const, error: "Type the booking code." };
  const id = await sessionPlayerId();
  if (!id) return { ok: false as const, error: "Sign in again." };
  const db = await readDb();
  const fixtures = db.fixtures ?? [];
  const ticket = (db.bets ?? []).map((bet) => normalizeBet(bet, fixtures)).find((bet) => bet?.code === cleaned);
  if (!ticket) return { ok: false as const, error: "No ticket uses that code." };
  const closed = ticket.legs.some((leg) => {
    const game = fixtures.find((fixture) => fixture.id === leg.fixtureId);
    return !game || Boolean(game.result);
  });
  if (closed) return { ok: false as const, error: "Those games have already been played." };
  return {
    ok: true as const,
    code: ticket.code,
    legs: ticket.legs.map((leg) => ({ fixtureId: leg.fixtureId, pick: leg.pick, odds: leg.odds, home: leg.home, away: leg.away })),
  };
}

export async function playGames() {
  return withPlayer((id) =>
    play(id, (player, db) => {
      if (!db.fixtures?.length) db.fixtures = buildSlate();
      const step = kickOff(player, db.ledger, db.fixtures, db.bets ?? []);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      db.fixtures = step.fixtures;
      db.bets = step.bets;
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

export async function newGames() {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const step = freshSlate(db.fixtures ?? []);
      if (!step.ok) return { ok: false, error: step.error };
      db.fixtures = step.fixtures;
      db.bets = step.bets;
      return { ok: true, player, notice: step.notice };
    }),
  );
}

export async function sendFriendRequest(username: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const handle = username.trim().toLowerCase();
      if (!handle) return { ok: false, error: "Type their username." };
      const other = db.players.find((item) => item.username.toLowerCase() === handle);
      if (!other) return { ok: false, error: "No account uses that username." };
      if (other.id === player.id) return { ok: false, error: "That is you." };
      if (player.blocked.includes(other.id) || other.blocked.includes(player.id)) return { ok: false, error: "That request cannot be sent." };
      if (player.friends.includes(other.id)) return { ok: false, error: "Already your padi." };
      db.requests = db.requests ?? [];
      if (db.requests.some((request) => request.fromId === player.id && request.toId === other.id)) {
        return { ok: false, error: "You already sent that request." };
      }
      const incoming = db.requests.find((request) => request.fromId === other.id && request.toId === player.id);
      if (incoming) {
        const next = structuredClone(player);
        next.friends = [...next.friends, other.id];
        other.friends = [...new Set([...other.friends, player.id])];
        db.requests = db.requests.filter((request) => request.id !== incoming.id);
        return { ok: true, player: next, notice: `${other.username} is your padi now.` };
      }
      db.requests.push({ id: crypto.randomUUID(), fromId: player.id, toId: other.id });
      return { ok: true, player, notice: `Request sent to ${other.username}.` };
    }),
  );
}

export async function acceptFriendRequest(fromId: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const request = (db.requests ?? []).find((item) => item.fromId === fromId && item.toId === player.id);
      if (!request) return { ok: false, error: "That request is gone." };
      const other = db.players.find((item) => item.id === fromId);
      if (!other) return { ok: false, error: "That account is gone." };
      const next = structuredClone(player);
      if (!next.friends.includes(other.id)) next.friends.push(other.id);
      if (!other.friends.includes(player.id)) other.friends.push(player.id);
      if (!next.met.includes(other.id)) next.met.push(other.id);
      db.requests = db.requests.filter((item) => item.id !== request.id);
      return { ok: true, player: next, notice: `${other.username} is your padi now.` };
    }),
  );
}

export async function declineFriendRequest(fromId: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      db.requests = (db.requests ?? []).filter((item) => !(item.fromId === fromId && item.toId === player.id));
      return { ok: true, player, notice: "Request declined." };
    }),
  );
}

export async function addFriend(peerId: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      if (peerId === player.id) return { ok: false, error: "That is you." };
      if (player.blocked.includes(peerId)) return { ok: false, error: "Unblock them first." };
      if (player.friends.includes(peerId)) return { ok: false, error: "Already your padi." };
      const name = npcById(peerId)?.name ?? db.players.find((item) => item.id === peerId)?.username;
      if (!name) return { ok: false, error: "That person is not in the city." };
      const next = structuredClone(player);
      next.friends = [...next.friends, peerId];
      if (!next.met.includes(peerId)) next.met.push(peerId);
      return { ok: true, player: next, notice: `${name} is your padi now.` };
    }),
  );
}

export async function blockPerson(peerId: string) {
  return withPlayer((id) =>
    play(id, (player) => {
      const next = structuredClone(player);
      next.blocked = [...new Set([...next.blocked, peerId])];
      next.friends = next.friends.filter((friend) => friend !== peerId);
      return { ok: true, player: next, notice: "Blocked." };
    }),
  );
}

export async function unblockPerson(peerId: string) {
  return withPlayer((id) =>
    play(id, (player) => {
      const next = structuredClone(player);
      next.blocked = next.blocked.filter((blocked) => blocked !== peerId);
      return { ok: true, player: next, notice: "Unblocked." };
    }),
  );
}

export async function callPolice(peerId: string, note: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const step = openPoliceCase(player, db, peerId, note);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

export async function fileActivity(note: string) {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const step = reportActivity(player, db.ledger, db, note);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

export async function honourPoliceInvite() {
  return withPlayer((id) =>
    play(id, (player, db) => {
      const step = honourInvite(player, db.ledger);
      if (!step.ok) return { ok: false, error: step.error };
      db.ledger = step.ledger;
      return { ok: true, player: step.player, notice: step.notice };
    }),
  );
}

export async function serveCustody() {
  return withPlayer((id) =>
    play(
      id,
      (player, db) => {
        const step = serveDetention(player, db.ledger);
        if (!step.ok) return { ok: false, error: step.error };
        db.ledger = step.ledger;
        return { ok: true, player: step.player, notice: step.notice };
      },
      "custody",
    ),
  );
}

export async function setWealthPrivacy(value: NetWorthVisibility) {
  return withPlayer((id) =>
    play(id, (player) => {
      const next = structuredClone(player);
      next.netWorthVisibility = value;
      return { ok: true, player: next, notice: "Net worth privacy updated." };
    }),
  );
}
