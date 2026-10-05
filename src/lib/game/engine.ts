import {
  CLUBS,
  CAREERS,
  DRINK_PRICE,
  HOTEL_RATE,
  PLATE,
  COURSES,
  careerById,
  courseById,
  dreamById,
  homeById,
  lectureLabel,
  npcById,
  TOP_UPS,
  TREATMENT_FEE,
  tripById,
  npcsAt,
  placeById,
  plotById,
  sprayFloor,
} from "./content";
import { averageNeeds, clamp, levelPay, naira, skillNeeded, stamp, weekday } from "./format";
import {
  NEED_KEYS,
  type Bet,
  type BetPick,
  type SlipLeg,
  type CreateInput,
  type DB,
  type Fixture,
  type LedgerEntry,
  type MoneySource,
  type Player,
  type Reveal,
  type SkillKey,
  type TravelMode,
  type WorkStyle,
} from "./types";

export interface Ok {
  ok: true;
  player: Player;
  ledger: LedgerEntry[];
  notice: string;
  reveal?: Reveal;
}

export interface Err {
  ok: false;
  error: string;
  player: Player;
  ledger: LedgerEntry[];
}

export type Step = Ok | Err;

function nid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function fail(player: Player, ledger: LedgerEntry[], error: string): Err {
  return { ok: false, error, player, ledger };
}

function succeed(player: Player, ledger: LedgerEntry[], notes: string[]): Ok {
  const next: Player = {
    ...player,
    log: [...notes].reverse().concat(player.log).slice(0, 12),
  };
  return { ok: true, player: next, ledger, notice: notes.filter(Boolean).join(" ") };
}

export function blankSkills(): Record<SkillKey, number> {
  return {
    music: 0,
    charisma: 0,
    coding: 0,
    hustle: 0,
    fitness: 0,
    cooking: 0,
    comedy: 0,
    photography: 0,
  };
}

export function topUp(player: Player, ledger: LedgerEntry[], amount: number): Step {
  const gain = Math.round(amount);
  if (!(TOP_UPS as readonly number[]).includes(gain)) return fail(player, ledger, "Pick a top-up amount.");
  const book = credit(ledger, player, gain, "purchased", "Top up", stamp(player.day, player.hour));
  return succeed(player, book, [`${naira(gain)} added to your balance. Purchased naira cannot pay a meet-up.`]);
}

export function buyLand(player: Player, ledger: LedgerEntry[], plotId: string): Step {
  const plot = plotById(plotId);
  if (player.lands.includes(plot.id)) return fail(player, ledger, "You already own that land.");
  const charged = debit(ledger, player, plot.price, `Land · ${plot.name}`, stamp(player.day, player.hour));
  if (!charged) return fail(player, ledger, "Your balance cannot cover that plot.");
  const next = structuredClone(player);
  next.lands = [...player.lands, plot.id];
  return succeed(next, charged, [`You bought ${plot.name}. ${naira(plot.rent)} rent lands every Saturday. It is earned naira.`]);
}

export function wallet(ledger: LedgerEntry[], playerId: string) {
  return ledger.filter((entry) => entry.playerId === playerId).reduce((sum, entry) => sum + entry.amount, 0);
}

export function poolsOf(ledger: LedgerEntry[], playerId: string) {
  const pools = { earned: 0, gifted: 0, purchased: 0 };
  for (const entry of ledger) {
    if (entry.playerId !== playerId) continue;
    pools[entry.source] += entry.amount;
  }
  return pools;
}

function entry(
  playerId: string,
  amount: number,
  source: MoneySource,
  reason: string,
  at: string,
): LedgerEntry {
  return { id: nid(), playerId, amount, source, reason, at };
}

function debit(
  ledger: LedgerEntry[],
  player: Player,
  amount: number,
  reason: string,
  at: string,
  sources: MoneySource[] = ["earned", "gifted", "purchased"],
) {
  const cost = Math.round(amount);
  if (cost <= 0) return ledger;
  const pools = poolsOf(ledger, player.id);
  const spendable = sources.reduce((sum, source) => sum + Math.max(0, pools[source]), 0);
  if (spendable < cost) return null;
  let left = cost;
  const next = ledger.slice();
  for (const source of sources) {
    const take = Math.min(Math.max(0, pools[source]), left);
    if (take > 0) {
      next.push(entry(player.id, -take, source, reason, at));
      left -= take;
    }
  }
  return left === 0 ? next : null;
}

function credit(
  ledger: LedgerEntry[],
  player: Player,
  amount: number,
  source: MoneySource,
  reason: string,
  at: string,
) {
  const gain = Math.round(amount);
  if (gain <= 0) return ledger;
  return [...ledger, entry(player.id, gain, source, reason, at)];
}

function decayNeeds(player: Player) {
  const energyDrop = player.traits.includes("calm") || player.traits.includes("fit") ? 2 : 3;
  const drop: Record<(typeof NEED_KEYS)[number], number> = {
    hunger: 4,
    energy: energyDrop,
    hygiene: 2,
    bladder: 5,
    fun: 2,
    social: 2,
  };
  for (const key of NEED_KEYS) {
    player.needs[key] = clamp(player.needs[key] - drop[key]);
  }
  const zeros = NEED_KEYS.filter((key) => player.needs[key] <= 0).length;
  if (player.needs.hunger <= 0 || player.needs.energy <= 0) player.strain += 1;
  else if (player.needs.hunger > 25 && player.needs.energy > 25) player.strain = 0;
  const before = player.sick;
  if (zeros >= 3) player.sick = "severe";
  else if (player.strain >= 8 && player.sick === "none") player.sick = "mild";
  if (player.sick === before) return null;
  if (player.sick === "severe") return "You are seriously sick. Any hospital in Owerri can treat it.";
  return "You feel sick. A chemist at Eke Ukwu Market can handle a mild case.";
}

function applyBills(player: Player, ledger: LedgerEntry[]) {
  const notes: string[] = [];
  const home = homeById(player.homeId);
  const at = stamp(player.day, player.hour);
  const charged = debit(ledger, player, home.rent, `Saturday rent · ${home.name}`, at);
  if (charged) {
    ledger = charged;
    if (player.arrears === 0) player.weeksUnpaid = 0;
    notes.push(`Saturday rent paid: ${naira(home.rent)}.`);
  } else {
    player.weeksUnpaid += 1;
    player.arrears += home.rent;
    notes.push(`Rent bounced. Arrears are now ${naira(player.arrears)}.`);
    if (player.weeksUnpaid > 2 && player.homeId !== "ikenegbu-room") {
      if (player.locationId === home.areaId) player.locationId = "ikenegbu";
      player.homeId = "ikenegbu-room";
      notes.push("More than two weeks of rent went unpaid. You were moved to an Ikenegbu room.");
    }
  }
  for (const id of player.lands) {
    const plot = plotById(id);
    ledger = credit(ledger, player, plot.rent, "earned", `Land rent · ${plot.name}`, at);
    notes.push(`${plot.name} paid ${naira(plot.rent)}.`);
  }
  if (player.loanRemaining > 0) {
    const due = Math.min(player.loanWeekly, player.loanRemaining);
    const paid = debit(ledger, player, due, "Starter loan repayment", at);
    if (paid) {
      ledger = paid;
      player.loanRemaining -= due;
      notes.push(`Loan repayment ${naira(due)}. ${naira(player.loanRemaining)} left.`);
    } else {
      notes.push("The loan repayment bounced. It is still owed.");
    }
  }
  player.billsOnDay = player.day;
  return { ledger, notes };
}

export function advance(player: Player, ledger: LedgerEntry[], hours: number) {
  const next = structuredClone(player);
  let book = ledger;
  const notes: string[] = [];
  const steps = Math.max(0, Math.round(hours));
  for (let i = 0; i < steps; i += 1) {
    next.hour += 1;
    if (next.hour >= 24) {
      next.hour = 0;
      next.day += 1;
      next.dmToday = 0;
      if (next.pendingJob && next.day >= next.pendingJob.startsOnDay && !next.job) {
        next.job = {
          careerId: next.pendingJob.careerId,
          level: 1,
          performance: 45,
          wins: 0,
          workedOnDay: null,
        };
        next.pendingJob = null;
        notes.push(`Your ${careerById(next.job.careerId).name} job starts today.`);
      }
      if (next.school?.status === "applied" && next.day > next.school.appliedOnDay) {
        next.school = { ...next.school, status: "admitted" };
        notes.push(`Admitted to ${courseById(next.school.courseId).name} at ${placeById(next.school.schoolId).name}.`);
      }
    }
    const sickNote = decayNeeds(next);
    if (sickNote) notes.push(sickNote);
    if (weekday(next.day) === "Saturday" && next.hour === 6 && next.billsOnDay !== next.day) {
      const billed = applyBills(next, book);
      book = billed.ledger;
      notes.push(...billed.notes);
    }
  }
  return { player: next, ledger: book, notes };
}

export function distanceKm(fromId: string, toId: string) {
  const from = placeById(fromId);
  const to = placeById(toId);
  const km = Math.hypot(from.x - to.x, from.y - to.y) / 8;
  return Math.max(0.5, Math.round(km * 10) / 10);
}

export function travelOptions(fromId: string, toId: string, hasCar: boolean, balance: number) {
  if (fromId === toId) return [];
  const km = distanceKm(fromId, toId);
  const modes: Array<{ mode: TravelMode; label: string; cost: number; hours: number; available: boolean; reason?: string }> = [
    { mode: "trek", label: "Trek", cost: 0, hours: Math.max(1, Math.round(km / 3)), available: true },
    { mode: "keke", label: "Keke", cost: Math.round(100 + 5 * km), hours: Math.max(1, Math.round(km / 12)), available: true },
    { mode: "okada", label: "Okada", cost: Math.round(150 + 8 * km), hours: Math.max(1, Math.round(km / 18)), available: true },
    { mode: "cab", label: "Cab", cost: Math.round(300 + 15 * km), hours: Math.max(1, Math.round(km / 20)), available: true },
    {
      mode: "car",
      label: "Your car",
      cost: Math.round(80 + 8 * km),
      hours: Math.max(1, Math.round(km / 20)),
      available: hasCar,
      reason: hasCar ? undefined : "The birth lottery did not give you a car.",
    },
  ];
  return modes.map((mode) => ({
    ...mode,
    affordable: mode.available && balance >= mode.cost,
  }));
}

export function travel(player: Player, ledger: LedgerEntry[], placeId: string, mode: TravelMode): Step {
  const place = placeById(placeId);
  if (place.id === player.locationId) return fail(player, ledger, "You are already there.");
  const option = travelOptions(player.locationId, place.id, player.hasCar, wallet(ledger, player.id)).find(
    (item) => item.mode === mode,
  );
  if (!option || !option.available) return fail(player, ledger, option?.reason ?? "That ride is not available.");
  let book = ledger;
  if (option.cost > 0) {
    const charged = debit(book, player, option.cost, `${option.label} to ${place.name}`, stamp(player.day, player.hour));
    if (!charged) return fail(player, ledger, "Your wallet cannot cover that fare.");
    book = charged;
  }
  const moved = advance(player, book, option.hours);
  moved.player.locationId = place.id;
  moved.player.indoors = false;
  moved.player.lastRide = mode;
  moved.player.besideId = null;
  return succeed(moved.player, moved.ledger, [...moved.notes, `You got to ${place.name} by ${option.label.toLowerCase()}.`]);
}

export function meetPerson(
  player: Player,
  ledger: LedgerEntry[],
  peerId: string,
  where: { placeId: string; indoors: boolean; name: string },
): Step {
  if (peerId === player.id) return fail(player, ledger, "You are already with yourself.");
  if (player.besideId === peerId && player.locationId === where.placeId && player.indoors === where.indoors) {
    return fail(player, ledger, `You are already beside ${where.name}.`);
  }
  let current = player;
  let book = ledger;
  if (player.locationId !== where.placeId) {
    const options = travelOptions(player.locationId, where.placeId, player.hasCar, wallet(ledger, player.id)).filter(
      (option) => option.available && option.affordable,
    );
    const ride = options.find((option) => option.mode === "cab") ?? options.find((option) => option.mode === "keke") ?? options[0];
    if (!ride) return fail(player, ledger, "Your balance cannot cover the ride to them.");
    const moved = travel(current, book, where.placeId, ride.mode);
    if (!moved.ok) return moved;
    current = moved.player;
    book = moved.ledger;
  }
  const next = structuredClone(current);
  next.locationId = where.placeId;
  next.indoors = where.indoors;
  next.besideId = peerId;
  if (!next.met.includes(peerId)) next.met.push(peerId);
  return succeed(next, book, [`You asked to meet ${where.name}. You are beside them at ${placeById(where.placeId).name}.`]);
}

export function enterPlace(player: Player, ledger: LedgerEntry[]): Step {
  const place = placeById(player.locationId);
  if (player.indoors) return fail(player, ledger, `You are already inside ${place.name}.`);
  const next = structuredClone(player);
  next.indoors = true;
  next.besideId = null;
  return succeed(next, ledger, [`You entered ${place.name}.`]);
}

export function stepOutside(player: Player, ledger: LedgerEntry[]): Step {
  if (!player.indoors) return fail(player, ledger, "You are already outside.");
  const next = structuredClone(player);
  next.indoors = false;
  next.besideId = null;
  return succeed(next, ledger, [`You stepped outside ${placeById(player.locationId).name}.`]);
}

export function dorime(player: Player, ledger: LedgerEntry[], amount: number): Step {
  const place = placeById(player.locationId);
  const club = place.kind === "nightlife" || place.id === "concord-hotel";
  if (!club) return fail(player, ledger, "Dorime is for the club.");
  if (!player.indoors) return fail(player, ledger, "Enter the club first.");
  const cost = Math.round(amount);
  if (![2000, 5000, 10000, 20000].includes(cost)) return fail(player, ledger, "Pick ₦2,000, ₦5,000, ₦10,000, or ₦20,000.");
  const lift = cost >= 20000 ? 24 : cost >= 10000 ? 18 : cost >= 5000 ? 14 : 10;
  return spendTime(player, ledger, 1, cost, `Dorime · ${place.name}`, (next) => {
    next.needs.fun = clamp(next.needs.fun + lift);
    next.needs.social = clamp(next.needs.social + lift);
    next.needs.bladder = clamp(next.needs.bladder - 8);
  }, `${player.username} did dorime · ${naira(cost)}.`);
}

export function buyDrink(player: Player, ledger: LedgerEntry[]): Step {
  const cost = DRINK_PRICE[player.locationId];
  if (!cost) return fail(player, ledger, "Nothing to drink here.");
  if (!player.indoors) return fail(player, ledger, "Enter first.");
  return spendTime(player, ledger, 1, cost, `Drink · ${placeById(player.locationId).name}`, (next) => {
    next.needs.fun = clamp(next.needs.fun + 12);
    next.needs.social = clamp(next.needs.social + 6);
    next.needs.bladder = clamp(next.needs.bladder - 12);
  }, `You bought a drink at ${placeById(player.locationId).name}.`);
}

export function sprayMoney(player: Player, ledger: LedgerEntry[], amount: number): Step {
  const place = placeById(player.locationId);
  const club = place.kind === "nightlife" || place.id === "concord-hotel";
  if (!club) return fail(player, ledger, "Spraying money is for the club floor.");
  if (!player.indoors) return fail(player, ledger, "Enter the club first.");
  const cost = Math.round(amount);
  const floor = sprayFloor(player.locationId);
  if (!Number.isFinite(cost) || cost < floor) return fail(player, ledger, `${place.name} starts at ${naira(floor)}.`);
  if (cost > 20_000_000) return fail(player, ledger, "That spray is too large for one shout.");
  return spendTime(player, ledger, 1, cost, `Spray · ${place.name}`, (next) => {
    next.needs.fun = clamp(next.needs.fun + 18);
    next.needs.social = clamp(next.needs.social + 22);
  }, `${player.username} sprayed ${naira(cost)}.`);
}

export function dance(player: Player, ledger: LedgerEntry[]): Step {
  const place = placeById(player.locationId);
  const club = place.kind === "nightlife" || place.id === "concord-hotel";
  if (!club) return fail(player, ledger, "There is no dance floor here.");
  if (!player.indoors) return fail(player, ledger, "Enter first.");
  return spendTime(player, ledger, 1, 0, "", (next) => {
    next.needs.fun = clamp(next.needs.fun + 28);
    next.needs.social = clamp(next.needs.social + 16);
    next.needs.energy = clamp(next.needs.energy - 14);
  }, `You danced at ${place.name}.`);
}

export function orderPlate(player: Player, ledger: LedgerEntry[]): Step {
  const plate = PLATE[player.locationId];
  if (!plate) return fail(player, ledger, "No kitchen here.");
  if (!player.indoors) return fail(player, ledger, "Enter and sit down first.");
  return spendTime(player, ledger, 1, plate.cost, `Food · ${plate.name}`, (next) => {
    next.needs.hunger = clamp(next.needs.hunger + plate.hunger);
    next.needs.fun = clamp(next.needs.fun + 6);
    next.needs.bladder = clamp(next.needs.bladder - 8);
  }, `You ate ${plate.name}.`);
}

export function bookRoom(player: Player, ledger: LedgerEntry[], stay: "night" | "hour"): Step {
  const rate = HOTEL_RATE[player.locationId];
  if (!rate) return fail(player, ledger, "This is not a hotel.");
  if (!player.indoors) return fail(player, ledger, "Enter the lobby first.");
  if (player.room?.placeId === player.locationId) return fail(player, ledger, "You already have this room. Lie down and sleep.");
  const cost = stay === "night" ? rate.night : rate.hour;
  const charged = debit(ledger, player, cost, `Room · ${placeById(player.locationId).name}`, stamp(player.day, player.hour));
  if (!charged) return fail(player, ledger, "Your wallet cannot cover that room.");
  const next = structuredClone(player);
  next.room = { stay, placeId: player.locationId };
  return succeed(next, charged, [`You took the ${stay} room at ${placeById(player.locationId).name}. Lie down when you want to sleep.`]);
}

export function sleepInRoom(player: Player, ledger: LedgerEntry[]): Step {
  if (!player.room) return fail(player, ledger, "Take a room first.");
  if (player.locationId !== player.room.placeId || !player.indoors) return fail(player, ledger, "Go inside the hotel room first.");
  const stay = player.room.stay;
  const hours = stay === "night" ? (player.hour < 8 ? 8 - player.hour : 24 - player.hour + 8) : 1;
  return spendTime(player, ledger, hours, 0, "", (next) => {
    next.room = null;
    if (stay === "night") {
      next.needs.energy = 92;
      next.needs.hunger = clamp(next.needs.hunger - 10);
    } else {
      next.needs.energy = clamp(next.needs.energy + 28);
    }
    next.needs.hygiene = clamp(next.needs.hygiene + 10);
    next.needs.bladder = clamp(next.needs.bladder - 10);
  }, stay === "night" ? "You lay down and slept until morning." : "You lay down and slept for an hour.");
}

export function leaveRoom(player: Player, ledger: LedgerEntry[]): Step {
  if (!player.room) return fail(player, ledger, "You do not have a room.");
  const next = structuredClone(player);
  next.room = null;
  return succeed(next, ledger, ["You left the room. It was already paid."]);
}

export function applyCourse(player: Player, ledger: LedgerEntry[], courseId: string): Step {
  const course = COURSES.find((item) => item.id === courseId);
  if (!course) return fail(player, ledger, "That course is not offered.");
  if (player.school) {
    const held = courseById(player.school.courseId);
    const heldSchool = placeById(player.school.schoolId).name;
    const reason =
      player.school.status === "admitted"
        ? `You are already admitted to ${heldSchool} to study ${held.name}. Drop out of your current school if you want another one.`
        : `You already applied to study ${held.name} at ${heldSchool}. Drop out if you want another school.`;
    return fail(player, ledger, reason);
  }
  if (player.locationId !== course.schoolId || !player.indoors) return fail(player, ledger, "Apply inside the school.");
  const appliedOnDay = player.day;
  const schoolName = placeById(course.schoolId).name;
  return spendTime(player, ledger, 1, course.applyFee, `Application · ${course.name}`, (next) => {
    next.school = {
      schoolId: course.schoolId,
      courseId: course.id,
      status: "admitted",
      appliedOnDay,
      attendedOnDay: null,
      feesPaid: false,
    };
  }, `Congratulations. You have been admitted to ${schoolName} to study ${course.name}.`);
}

export function paySchoolFees(player: Player, ledger: LedgerEntry[]): Step {
  if (!player.school || player.school.status !== "admitted") return fail(player, ledger, "Get admitted before you pay school fees.");
  if (player.school.feesPaid) return fail(player, ledger, "School fees are already paid.");
  if (player.locationId !== player.school.schoolId || !player.indoors) return fail(player, ledger, "Pay at the school.");
  const course = courseById(player.school.courseId);
  return spendTime(player, ledger, 1, course.fee, `School fees · ${course.name}`, (next) => {
    if (next.school) next.school = { ...next.school, feesPaid: true };
  }, `School fees paid for ${course.name}.`);
}

export function attendLecture(player: Player, ledger: LedgerEntry[]): Step {
  if (!player.school || player.school.status !== "admitted") return fail(player, ledger, "You are not admitted yet.");
  if (!player.school.feesPaid) return fail(player, ledger, "Pay the school fees before you sit a lecture.");
  const course = courseById(player.school.courseId);
  if (player.locationId !== course.schoolId || !player.indoors) return fail(player, ledger, "Go inside your school.");
  const weekdayIndex = (player.day - 1) % 7;
  if (!course.days.includes(weekdayIndex)) return fail(player, ledger, `No lecture today. ${course.name} holds ${lectureLabel(course)}.`);
  if (player.hour < course.startHour) return fail(player, ledger, `${course.name} starts at ${String(course.startHour).padStart(2, "0")}:00.`);
  if (player.hour >= course.startHour + course.hours) return fail(player, ledger, "That lecture has ended.");
  if (player.school.attendedOnDay === player.day) return fail(player, ledger, "You already sat today's lecture.");
  const left = course.startHour + course.hours - player.hour;
  const day = player.day;
  return spendTime(player, ledger, left, 0, "", (next) => {
    if (next.school) next.school = { ...next.school, attendedOnDay: day };
    next.skills[course.skill] = Math.min(10, next.skills[course.skill] + 0.4);
    next.needs.energy = clamp(next.needs.energy - 12);
    next.needs.fun = clamp(next.needs.fun - 4);
    next.needs.social = clamp(next.needs.social + 6);
  }, `You sat ${course.name}. ${lectureLabel(course)}.`);
}

export function flyAway(player: Player, ledger: LedgerEntry[], tripId: string): Step {
  const trip = tripById(tripId);
  if (!trip) return fail(player, ledger, "That flight is not on the board.");
  if (player.locationId !== "sam-mbakwe" || !player.indoors) return fail(player, ledger, "Check in at Sam Mbakwe Airport first.");
  const home = homeById(player.homeId);
  const charged = debit(ledger, player, trip.cost, `Flight and stay · ${trip.city}`, stamp(player.day, player.hour));
  if (!charged) return fail(player, ledger, "Your wallet cannot cover the flight and the stay.");
  const passed = advance(player, charged, trip.days * 24);
  const next = passed.player;
  next.locationId = home.areaId;
  next.indoors = true;
  next.room = null;
  next.sick = "none";
  next.strain = 0;
  next.needs.hunger = 78;
  next.needs.energy = trip.energy;
  next.needs.hygiene = 84;
  next.needs.bladder = 80;
  next.needs.fun = trip.fun;
  next.needs.social = trip.social;
  const kept = passed.notes.filter((note) => !note.toLowerCase().includes("sick"));
  return succeed(next, passed.ledger, [
    ...kept,
    `${trip.days} days in ${trip.city}. The flight and the stay were one payment. You are back inside ${home.name}.`,
  ]);
}

export function dropOut(player: Player, ledger: LedgerEntry[]): Step {
  if (!player.school) return fail(player, ledger, "You are not in a school.");
  const course = courseById(player.school.courseId);
  const next = structuredClone(player);
  next.school = null;
  return succeed(next, ledger, [`You dropped out of ${course.name} at ${placeById(course.schoolId).name}.`]);
}

export function sendOffer(player: Player, ledger: LedgerEntry[], npcId: string): Step {
  const npc = npcById(npcId);
  if (!npc?.asking) return fail(player, ledger, "That offer is not available.");
  if (player.locationId !== npc.placeId || !player.indoors) return fail(player, ledger, "Enter the pickup street first.");
  const price = npc.asking;
  const pools = poolsOf(ledger, player.id);
  const clean = Math.max(0, pools.earned) + Math.max(0, pools.gifted);
  if (clean < price && wallet(ledger, player.id) >= price) {
    return fail(player, ledger, "Topped-up naira cannot be used on a meet-up.");
  }
  const at = stamp(player.day, player.hour);
  const paid = debit(ledger, player, price, `Meet-up · ${npc.name}`, at, ["earned", "gifted"]);
  if (!paid) return fail(player, ledger, `${npc.name} set ${naira(price)}. Your earned naira cannot cover it.`);
  const credited = credit(paid, { id: npc.id } as Player, price, "earned", `Meet-up · ${player.username}`, at);
  const passed = advance(player, credited, 2);
  passed.player.needs.social = clamp(passed.player.needs.social + 24);
  passed.player.needs.fun = clamp(passed.player.needs.fun + 16);
  passed.player.needs.energy = clamp(passed.player.needs.energy - 30);
  if (!passed.player.met.includes(npc.id)) passed.player.met.push(npc.id);
  passed.player.besideId = npc.id;
  return succeed(passed.player, passed.ledger, [
    ...passed.notes,
    `Two hours later. The scene stayed dark. ${naira(price)} is now with ${npc.name}. Message her, or open her profile.`,
  ]);
}

function shiftScore(player: Player, style: WorkStyle, skill: SkillKey) {
  let score = 35 + averageNeeds(player.needs) * 0.45 + player.skills[skill] * 5;
  if (style === "steady") score += 10;
  if (style === "jaguda") score += 24;
  if (style === "gist") score += 6;
  if (style === "oga") score += 8 + player.skills.charisma * 2;
  if (style === "easy" || style === "leave") score -= 18;
  if (player.traits.includes("sharp")) score += 6;
  if (player.traits.includes("charismatic") && style === "oga") score += 6;
  if (player.traits.includes("creative") && (skill === "music" || skill === "charisma")) score += 4;
  if (player.sick === "mild") score -= 15;
  if (player.sick === "severe") score -= 40;
  return clamp(score, 5, 100);
}

export function workShift(player: Player, ledger: LedgerEntry[], style: WorkStyle): Step {
  if (!player.job) return fail(player, ledger, "Get a job from your phone first.");
  const career = careerById(player.job.careerId);
  if (player.locationId !== career.placeId) {
    return fail(player, ledger, `Clock in at ${placeById(career.placeId).name}.`);
  }
  if (player.hour < 8 || player.hour > 10) return fail(player, ledger, "Shifts start between 8:00 and 10:00.");
  if (player.job.workedOnDay === player.day) return fail(player, ledger, "You already worked today.");
  if (player.sick === "severe") return fail(player, ledger, "You are too sick. Go to a hospital.");
  const startDay = player.day;
  const score = shiftScore(player, style, career.skill);
  const hours = style === "leave" ? 4 : 8;
  const passed = advance(player, ledger, hours);
  const needs = { ...passed.player.needs };
  if (style === "jaguda") {
    needs.energy = clamp(needs.energy - 28);
    needs.fun = clamp(needs.fun - 16);
  }
  if (style === "gist") {
    needs.social = clamp(needs.social + (player.traits.includes("funny") ? 22 : 16));
    needs.fun = clamp(needs.fun + 8);
  }
  if (style === "easy") needs.energy = clamp(needs.energy + 8);
  if (style === "oga") needs.social = clamp(needs.social + 4);
  const gain = (player.lottery === "struggle" ? 0.3 : 0.24) * (player.traits.includes("hustler") && career.skill === "hustle" ? 1.25 : 1);
  const skills = { ...passed.player.skills, [career.skill]: Math.min(10, passed.player.skills[career.skill] + gain) };
  let pay = Math.round(levelPay(player.job.level, career.l1, career.l5) * (0.55 + (0.6 * score) / 100));
  if (style === "leave") pay = Math.round(pay * 0.5);
  const wins = score >= 70 ? player.job.wins + 1 : player.job.wins;
  if (wins >= 4) pay = Math.round(pay * 1.15);
  let level = player.job.level;
  let performance = clamp(player.job.performance + score / 8);
  let promoted = false;
  if (performance >= 100 && level < 5 && skills[career.skill] >= skillNeeded(level + 1)) {
    level += 1;
    performance = 45;
    promoted = true;
  }
  const at = stamp(startDay, player.hour);
  const book = credit(passed.ledger, player, pay, "earned", `Shift pay · ${career.name}`, at);
  const notes = [
    ...passed.notes,
    style === "leave"
      ? `You left early. ${career.name} paid ${naira(pay)}.`
      : `${career.name} paid ${naira(pay)} for the shift.`,
  ];
  if (wins >= 4) notes.push("Four strong shifts in a row. Pay included the 15% bump.");
  if (promoted) notes.push(`Promoted to level ${level}. Performance reset to 45%.`);
  return succeed(
    {
      ...passed.player,
      needs,
      skills,
      job: {
        careerId: career.id,
        level,
        performance,
        wins: wins >= 4 ? 0 : wins,
        workedOnDay: startDay,
      },
    },
    book,
    notes,
  );
}

export function applyForJob(player: Player, ledger: LedgerEntry[], careerId: string): Step {
  if (!CAREERS.some((career) => career.id === careerId)) return fail(player, ledger, "That career is not open.");
  if (player.job) return fail(player, ledger, "Quit your current job first.");
  if (player.pendingJob) return fail(player, ledger, "You already have a job lined up.");
  const career = careerById(careerId);
  const next = structuredClone(player);
  next.pendingJob = { careerId, startsOnDay: player.day + 1 };
  return succeed(next, ledger, [`Hired for ${career.name}. First shift is tomorrow, between 8:00 and 10:00.`]);
}

export function quitJob(player: Player, ledger: LedgerEntry[]): Step {
  if (!player.job && !player.pendingJob) return fail(player, ledger, "You do not have a job.");
  const next = structuredClone(player);
  next.job = null;
  next.pendingJob = null;
  return succeed(next, ledger, ["You left the job."]);
}

export function moveHome(player: Player, ledger: LedgerEntry[], homeId: string): Step {
  const home = homeById(homeId);
  if (player.homeId === home.id) return fail(player, ledger, "You already live there.");
  const charged = debit(ledger, player, home.rent, `First week rent · ${home.name}`, stamp(player.day, player.hour));
  if (!charged) return fail(player, ledger, "You need the first week's rent in the wallet.");
  const next = structuredClone(player);
  next.homeId = home.id;
  next.locationId = home.areaId;
  next.weeksUnpaid = player.arrears > 0 ? player.weeksUnpaid : 0;
  return succeed(next, charged, [`You moved into ${home.name}.`]);
}

export function payArrears(player: Player, ledger: LedgerEntry[]): Step {
  if (player.arrears <= 0) return fail(player, ledger, "You have no rent arrears.");
  const charged = debit(ledger, player, player.arrears, "Rent arrears", stamp(player.day, player.hour));
  if (!charged) return fail(player, ledger, "Your wallet cannot cover the arrears.");
  const next = structuredClone(player);
  next.arrears = 0;
  next.weeksUnpaid = 0;
  return succeed(next, charged, ["Rent arrears cleared."]);
}

function spendTime(
  player: Player,
  ledger: LedgerEntry[],
  hours: number,
  cost: number,
  reason: string,
  apply: (player: Player) => void,
  done: string,
): Step {
  let book = ledger;
  if (cost > 0) {
    const charged = debit(ledger, player, cost, reason, stamp(player.day, player.hour));
    if (!charged) return fail(player, ledger, "Your wallet cannot cover that.");
    book = charged;
  }
  const passed = advance(player, book, hours);
  apply(passed.player);
  return succeed(passed.player, passed.ledger, [...passed.notes, done]);
}

export function eat(player: Player, ledger: LedgerEntry[], meal: "buka" | "grill"): Step {
  if (meal === "buka" && player.locationId !== "mama-nkechi") {
    return fail(player, ledger, "Mama Nkechi's buka is in Ikenegbu.");
  }
  if (meal === "grill" && player.locationId !== "mangrove-grill") {
    return fail(player, ledger, "Mangrove Grill is across town.");
  }
  const cost = meal === "buka" ? 800 : 4500;
  const place = meal === "buka" ? "the buka" : "Mangrove Grill";
  return spendTime(player, ledger, 1, cost, `Food · ${place}`, (next) => {
    next.needs.hunger = clamp(next.needs.hunger + (meal === "buka" ? 50 : 65));
    next.needs.fun = clamp(next.needs.fun + (meal === "buka" ? 4 : 12));
    next.needs.bladder = clamp(next.needs.bladder - 8);
  }, `You ate at ${place}.`);
}

export function sleep(player: Player, ledger: LedgerEntry[]): Step {
  const home = homeById(player.homeId);
  if (player.locationId !== home.areaId) return fail(player, ledger, "You can only sleep at home.");
  const hours = player.hour < 7 ? 7 - player.hour : 24 - player.hour + 7;
  return spendTime(player, ledger, hours, 0, "", (next) => {
    next.needs.energy = 95;
    next.needs.hunger = clamp(next.needs.hunger - 12);
    next.needs.bladder = clamp(next.needs.bladder - 18);
    next.needs.hygiene = clamp(next.needs.hygiene - 8);
  }, "You slept. Morning in Owerri.");
}

export function shower(player: Player, ledger: LedgerEntry[]): Step {
  const home = homeById(player.homeId);
  if (player.locationId !== home.areaId) return fail(player, ledger, "Shower at home.");
  return spendTime(player, ledger, 1, 0, "", (next) => {
    next.needs.hygiene = clamp(next.needs.hygiene + 75);
  }, "You showered.");
}

export function restroom(player: Player, ledger: LedgerEntry[]): Step {
  return spendTime(player, ledger, 1, 0, "", (next) => {
    next.needs.bladder = 100;
  }, "You used the restroom.");
}

export function waitHour(player: Player, ledger: LedgerEntry[]): Step {
  return spendTime(player, ledger, 1, 0, "", () => undefined, "An hour passed.");
}

export function hangOut(player: Player, ledger: LedgerEntry[]): Step {
  const allowed = ["nworie-park", "cartel-lounge", "mama-nkechi", "eke-ukwu", "cartel-beach", "heartland-resort"];
  if (!allowed.includes(player.locationId)) return fail(player, ledger, "Nothing social is happening here.");
  const cost = player.locationId === "cartel-lounge" ? 1000 : 0;
  const socialBoost = player.traits.includes("loyal") && player.friends.length > 0 ? 8 : 0;
  return spendTime(player, ledger, 2, cost, `Hang out · ${placeById(player.locationId).name}`, (next) => {
    next.needs.fun = clamp(next.needs.fun + 22);
    next.needs.social = clamp(next.needs.social + 16 + socialBoost);
    next.needs.hunger = clamp(next.needs.hunger - 6);
  }, `You hung out at ${placeById(player.locationId).name}.`);
}

export function treat(player: Player, ledger: LedgerEntry[]): Step {
  if (player.sick === "none") return fail(player, ledger, "You are not sick.");
  const place = placeById(player.locationId);
  const atHospital = place.kind === "health";
  const atChemist = player.locationId === "eke-ukwu";
  if (player.sick === "severe" && !atHospital) {
    return fail(player, ledger, "Severe sickness needs a hospital. Open Health on the map.");
  }
  if (!atHospital && !atChemist) return fail(player, ledger, "Buy drugs at Eke Ukwu Market, or go to a hospital.");
  const cost = TREATMENT_FEE[player.locationId] ?? (atHospital ? 8000 : 1500);
  const where = atHospital ? place.name : "the chemist";
  return spendTime(player, ledger, 2, cost, `Treatment · ${where}`, (next) => {
    next.sick = "none";
    next.strain = 0;
    next.needs.energy = clamp(next.needs.energy + 20);
  }, `Treatment at ${where} cleared the sickness.`);
}

function priceOdd(probability: number) {
  return Math.max(1.15, Math.round((1 / (probability * 1.08)) * 100) / 100);
}

export function buildSlate(rng: () => number = Math.random): Fixture[] {
  const pool = [...CLUBS];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const swap = Math.floor(rng() * (i + 1));
    const current = pool[i];
    pool[i] = pool[swap];
    pool[swap] = current;
  }
  const fixtures: Fixture[] = [];
  for (let i = 0; i + 1 < pool.length && fixtures.length < 20; i += 2) {
    const home = pool[i];
    const away = pool[i + 1];
    const draw = 0.2 + rng() * 0.12;
    const homeP = (1 - draw) * (0.35 + rng() * 0.35);
    const awayP = 1 - draw - homeP;
    fixtures.push({
      id: `fx-${fixtures.length}-${home.name}-${away.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      home: home.name,
      away: away.name,
      league: home.league === away.league ? home.league : `${home.league} / ${away.league}`,
      homeOdds: priceOdd(homeP),
      drawOdds: priceOdd(draw),
      awayOdds: priceOdd(awayP),
      result: null,
      homeScore: null,
      awayScore: null,
    });
  }
  return fixtures;
}

function playFixture(fixture: Fixture, rng: () => number): BetPick {
  const home = 1 / fixture.homeOdds;
  const draw = 1 / fixture.drawOdds;
  const away = 1 / fixture.awayOdds;
  const roll = rng() * (home + draw + away);
  if (roll < home) return "1";
  if (roll < home + draw) return "X";
  return "2";
}

function scoreLine(result: BetPick, rng: () => number): [number, number] {
  const few = () => Math.floor(rng() * 4);
  if (result === "X") {
    const goals = few();
    return [goals, goals];
  }
  const low = few();
  const high = low + 1 + Math.floor(rng() * 3);
  return result === "1" ? [high, low] : [low, high];
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function multiplyOdds(odds: number[]) {
  const raw = odds.reduce((product, odd) => product * odd, 1);
  return Math.round(raw * 100) / 100;
}

function legKey(legs: Array<{ fixtureId: string; pick: string }>) {
  return legs.map((leg) => `${leg.fixtureId}:${leg.pick}`).sort().join("|");
}

export function bookingCode(taken: string[], rng: () => number = Math.random) {
  const used = new Set(taken.map((code) => code.toUpperCase()));
  for (let attempt = 0; attempt < 24; attempt += 1) {
    let code = "";
    for (let i = 0; i < 6; i += 1) code += CODE_CHARS[Math.floor(rng() * CODE_CHARS.length)];
    if (!used.has(code)) return code;
  }
  return `B${Date.now().toString(36).slice(-5).toUpperCase()}`;
}

type LooseBet = Partial<Bet> & { fixtureId?: string; pick?: BetPick };

export function normalizeBet(raw: LooseBet, fixtures: Fixture[]): Bet | null {
  if (!raw.id || !raw.playerId) return null;
  let legs = (raw.legs ?? []).filter((leg) => leg?.fixtureId && (leg.pick === "1" || leg.pick === "X" || leg.pick === "2"));
  if (!legs.length && raw.fixtureId && (raw.pick === "1" || raw.pick === "X" || raw.pick === "2")) {
    const game = fixtures.find((fixture) => fixture.id === raw.fixtureId);
    legs = [{
      fixtureId: raw.fixtureId,
      pick: raw.pick,
      odds: raw.odds ?? 1,
      home: game?.home ?? "Home",
      away: game?.away ?? "Away",
    }];
  }
  if (!legs.length) return null;
  return {
    id: raw.id,
    playerId: raw.playerId,
    code: (raw.code || "LEGACY").toUpperCase(),
    stake: Math.round(raw.stake ?? 0),
    odds: raw.odds && raw.odds > 0 ? raw.odds : multiplyOdds(legs.map((leg) => leg.odds)),
    status: raw.status === "won" || raw.status === "lost" ? raw.status : "open",
    legs,
  };
}

export function placeBet(
  player: Player,
  ledger: LedgerEntry[],
  fixtures: Fixture[],
  bets: Array<Bet | LooseBet>,
  selections: Array<{ fixtureId: string; pick: BetPick }>,
  stake: number,
  sharedCode = "",
): { ok: true; player: Player; ledger: LedgerEntry[]; bets: Bet[]; notice: string } | { ok: false; error: string } {
  const amount = Math.round(stake);
  if (!Number.isFinite(amount) || amount < 100) return { ok: false, error: "The smallest stake is ₦100." };
  if (amount > 1_000_000) return { ok: false, error: "The largest stake on one ticket is ₦1,000,000." };
  if (!selections.length) return { ok: false, error: "Add at least one game." };
  const seen = new Set<string>();
  const legs: SlipLeg[] = [];
  for (const selection of selections) {
    if (selection.pick !== "1" && selection.pick !== "X" && selection.pick !== "2") return { ok: false, error: "Bet 1, X, or 2." };
    if (seen.has(selection.fixtureId)) return { ok: false, error: "A ticket can only pick one result per game." };
    seen.add(selection.fixtureId);
    const fixture = fixtures.find((item) => item.id === selection.fixtureId);
    if (!fixture || fixture.result) return { ok: false, error: "One of those games is not open." };
    const odds = selection.pick === "1" ? fixture.homeOdds : selection.pick === "X" ? fixture.drawOdds : fixture.awayOdds;
    legs.push({ fixtureId: fixture.id, pick: selection.pick, odds, home: fixture.home, away: fixture.away });
  }
  const kept = bets.map((bet) => normalizeBet(bet, fixtures)).filter((bet): bet is Bet => Boolean(bet));
  const wanted = sharedCode.trim().toUpperCase();
  let code = "";
  if (wanted) {
    const match = kept.find((bet) => bet.code === wanted);
    if (!match || legKey(match.legs) !== legKey(legs)) return { ok: false, error: "That booking code is for a different set of games." };
    code = wanted;
  } else {
    code = bookingCode(kept.map((bet) => bet.code));
  }
  const odds = multiplyOdds(legs.map((leg) => leg.odds));
  const charged = debit(ledger, player, amount, `Bet · ${code}`, stamp(player.day, player.hour));
  if (!charged) return { ok: false, error: "Your balance cannot cover that stake." };
  const ticket: Bet = {
    id: `bet-${player.id}-${code}-${Date.now()}`,
    playerId: player.id,
    code,
    stake: amount,
    odds,
    status: "open",
    legs,
  };
  const games = legs.length === 1 ? "1 game" : `${legs.length} games`;
  return {
    ok: true,
    player,
    ledger: charged,
    bets: [...kept, ticket],
    notice: `Booking code ${code}. ${games} at ${odds.toFixed(2)}. A win pays ${naira(Math.round(amount * odds))}.`,
  };
}

export function kickOff(
  player: Player,
  ledger: LedgerEntry[],
  fixtures: Fixture[],
  bets: Array<Bet | LooseBet>,
  rng: () => number = Math.random,
): { ok: true; player: Player; ledger: LedgerEntry[]; fixtures: Fixture[]; bets: Bet[]; notice: string } | { ok: false; error: string } {
  const open = fixtures.some((fixture) => !fixture.result);
  if (!open) return { ok: false, error: "The scores are already up. Open a new set when you are done." };
  const passed = advance(player, ledger, 2);
  let book = passed.ledger;
  const played = fixtures.map((fixture) => {
    if (fixture.result) return fixture;
    const result = playFixture(fixture, rng);
    const [homeScore, awayScore] = scoreLine(result, rng);
    return { ...fixture, result, homeScore, awayScore };
  });
  const kept = bets.map((bet) => normalizeBet(bet, played)).filter((bet): bet is Bet => Boolean(bet));
  let won = 0;
  let hadSlip = false;
  const settled = kept.map((bet) => {
    if (bet.status !== "open") return bet;
    const landed = bet.legs.every((leg) => played.find((fixture) => fixture.id === leg.fixtureId)?.result === leg.pick);
    if (bet.playerId === player.id) hadSlip = true;
    if (!landed) return { ...bet, status: "lost" as const };
    const payout = Math.round(bet.stake * bet.odds);
    book = credit(book, { id: bet.playerId } as Player, payout, "earned", `Bet win · ${bet.code}`, stamp(passed.player.day, passed.player.hour));
    if (bet.playerId === player.id) won += payout;
    return { ...bet, status: "won" as const };
  });
  const notice = [won > 0 ? `Full time. Your ticket paid ${naira(won)}.` : hadSlip ? "Full time. Your ticket did not land." : "Full time. The scores are up.", ...passed.notes].join(" ");
  passed.player.log = [notice, ...passed.player.log].slice(0, 12);
  return { ok: true, player: passed.player, ledger: book, fixtures: played, bets: settled, notice };
}

export function freshSlate(
  fixtures: Fixture[],
  rng: () => number = Math.random,
): { ok: true; fixtures: Fixture[]; bets: Bet[]; notice: string } | { ok: false; error: string } {
  if (fixtures.some((fixture) => !fixture.result)) return { ok: false, error: "Play this set before opening a new one." };
  return { ok: true, fixtures: buildSlate(rng), bets: [], notice: "A new set of 20 games is up." };
}

export function postChat(player: Player, text: string): { ok: true; text: string } | { ok: false; error: string } {
  const cleaned = text.trim().slice(0, 200);
  if (!cleaned) return { ok: false, error: "Write something first." };
  return { ok: true, text: cleaned };
}

export function markChat(player: Player) {
  const next = structuredClone(player);
  next.lastChatKey = `${player.day}:${player.hour}`;
  return next;
}

const REPLIES = [
  "I dey around. How your side?",
  "This city no dey sleep. Talk.",
  "If you need direction, ask. I know this area.",
  "Make we see for the venue, no long story.",
  "I hear you. Keep your money in the wallet, not in gist.",
];

export function npcReply(text: string, index: number) {
  if (text.trim().length < 2) return "Say that again, clearer.";
  return REPLIES[index % REPLIES.length];
}

export const POLICE_ID = "state-cid";
const INVITE_HOURS = 6;
const CUSTODY_HOURS = 8;

export function clockIndex(player: Player) {
  return player.day * 24 + player.hour;
}

export function indexLabel(index: number) {
  const day = Math.floor(index / 24);
  const hour = index - day * 24;
  return stamp(Math.max(1, day), hour);
}

function policeMessage(db: DB, player: Player, text: string) {
  db.messages.push({
    id: nid(),
    box: [POLICE_ID, player.id].sort().join("|"),
    fromId: POLICE_ID,
    text,
    at: stamp(player.day, player.hour),
  });
}

export function settlePolice(player: Player, db: DB) {
  const next = structuredClone(player);
  const now = clockIndex(next);
  if (next.detainedUntil != null) {
    if (now >= next.detainedUntil) {
      next.detainedUntil = null;
      next.log = ["The State CID released you.", ...next.log].slice(0, 12);
      return { player: next, blocked: false, arrested: false, notice: "The State CID released you." };
    }
    next.locationId = POLICE_ID;
    next.indoors = true;
    return {
      player: next,
      blocked: true,
      arrested: false,
      notice: `You are in custody at the State CID until ${indexLabel(next.detainedUntil)}.`,
    };
  }
  if (next.policeInvite && now >= next.policeInvite.deadline) {
    next.policeInvite = null;
    next.detainedUntil = now + CUSTODY_HOURS;
    next.locationId = POLICE_ID;
    next.indoors = true;
    const notice = "You did not honour the State CID invite. You have been arrested.";
    next.log = [notice, ...next.log].slice(0, 12);
    policeMessage(db, next, `${notice} Custody runs until ${indexLabel(next.detainedUntil)}.`);
    return { player: next, blocked: true, arrested: true, notice };
  }
  return { player: next, blocked: false, arrested: false, notice: "" };
}

export function openPoliceCase(reporter: Player, db: DB, targetId: string, note: string): Step {
  const cleaned = note.trim().slice(0, 240);
  if (cleaned.length < 8) return fail(reporter, db.ledger, "Say what happened, at least a short line.");
  if (targetId === reporter.id) return fail(reporter, db.ledger, "You cannot call the police on yourself.");
  const target = db.players.find((item) => item.id === targetId);
  if (!target) return fail(reporter, db.ledger, "The State CID only invites registered residents.");
  if (target.detainedUntil != null && clockIndex(target) < target.detainedUntil) {
    return fail(reporter, db.ledger, `${target.username} is already in custody.`);
  }
  if (target.policeInvite) return fail(reporter, db.ledger, `${target.username} already has an open invite.`);
  const deadline = clockIndex(target) + INVITE_HOURS;
  target.policeInvite = { note: cleaned, deadline };
  target.log = [`State CID invite. Honour it before ${indexLabel(deadline)}.`, ...target.log].slice(0, 12);
  policeMessage(
    db,
    target,
    `State CID invite. A report was filed: "${cleaned}". Come inside the State Criminal Investigation Department on Port Harcourt Road before ${indexLabel(deadline)}. If you do not honour this invite, you will be arrested.`,
  );
  db.reports.push({
    id: nid(),
    reporterId: reporter.id,
    targetId: target.id,
    targetName: target.username,
    note: cleaned,
    at: stamp(reporter.day, reporter.hour),
  });
  const passed = advance(reporter, db.ledger, 1);
  return succeed(passed.player, passed.ledger, [
    `You reported ${target.username} to the State CID. They have until ${indexLabel(deadline)} to honour the invite.`,
    ...passed.notes,
  ]);
}

export function reportActivity(player: Player, ledger: LedgerEntry[], db: DB, note: string): Step {
  if (player.locationId !== POLICE_ID || !player.indoors) return fail(player, ledger, "File that inside the State CID.");
  const cleaned = note.trim().slice(0, 240);
  if (cleaned.length < 8) return fail(player, ledger, "Say what happened, at least a short line.");
  db.reports.push({
    id: nid(),
    reporterId: player.id,
    targetId: "",
    targetName: "Activity",
    note: cleaned,
    at: stamp(player.day, player.hour),
  });
  const passed = advance(player, ledger, 1);
  return succeed(passed.player, passed.ledger, ["Activity report filed with the State CID.", ...passed.notes]);
}

export function honourInvite(player: Player, ledger: LedgerEntry[]): Step {
  if (!player.policeInvite) return fail(player, ledger, "You have no State CID invite.");
  if (player.locationId !== POLICE_ID || !player.indoors) return fail(player, ledger, "Go inside the State CID to honour the invite.");
  const next = structuredClone(player);
  next.policeInvite = null;
  const passed = advance(next, ledger, 1);
  return succeed(passed.player, passed.ledger, ["You honoured the State CID invite. They let you leave.", ...passed.notes]);
}

export function serveDetention(player: Player, ledger: LedgerEntry[]): Step {
  if (player.detainedUntil == null || clockIndex(player) >= player.detainedUntil) {
    return fail(player, ledger, "You are not in custody.");
  }
  const left = player.detainedUntil - clockIndex(player);
  const passed = advance(player, ledger, left);
  passed.player.detainedUntil = null;
  passed.player.locationId = POLICE_ID;
  passed.player.indoors = true;
  return succeed(passed.player, passed.ledger, [
    `${left} hours passed in custody. The State CID released you.`,
    ...passed.notes,
  ]);
}

export function createNewPlayer(input: CreateInput, id: string, rng: () => number = Math.random) {
  const lottery = rng() < 0.5 ? "heir" : "struggle";
  const skills = blankSkills();
  const player: Player = {
    id,
    username: input.username,
    email: input.email,
    passwordHash: "",
    look: input.look,
    gender: input.gender,
    traits: input.traits,
    dream: input.dream,
    lottery,
    homeId: lottery === "heir" ? "new-owerri-flat" : "ikenegbu-room",
    hasCar: lottery === "heir",
    loanRemaining: lottery === "struggle" ? 20000 : 0,
    loanWeekly: lottery === "struggle" ? 2000 : 0,
    arrears: 0,
    weeksUnpaid: 0,
    billsOnDay: null,
    job: null,
    pendingJob: null,
    needs: { hunger: 72, energy: 80, hygiene: 76, bladder: 84, fun: 60, social: 42 },
    skills,
    sick: "none",
    strain: 0,
    day: 1,
    hour: 8,
    locationId: lottery === "heir" ? "new-owerri" : "ikenegbu",
    indoors: true,
    lastRide: "trek",
    friends: [],
    met: npcsAt(lottery === "heir" ? "new-owerri" : "ikenegbu").map((npc) => npc.id),
    blocked: [],
    netWorthVisibility: "friends",
    policeInvite: null,
    detainedUntil: null,
    school: null,
    room: null,
    lands: [],
    besideId: null,
    dmToday: 0,
    lastChatKey: "",
    log: [],
    createdAt: new Date().toISOString(),
  };
  let ledger: LedgerEntry[] = [];
  const reveal: Reveal =
    lottery === "heir"
      ? {
          lottery,
          title: "Heir",
          cash: 180000,
          home: "New Owerri mini-flat",
          perk: "A car and a level 3 job, starting today.",
        }
      : {
          lottery,
          title: "Struggle",
          cash: 8000,
          home: "Ikenegbu room",
          perk: "A ₦20,000 starter loan, Hustle 2, and skills that rise 25% faster.",
        };
  ledger = credit(ledger, player, reveal.cash, "gifted", `Birth lottery · ${reveal.title}`, stamp(1, 8));
  if (lottery === "heir") {
    player.job = { careerId: input.careerId, level: 3, performance: 45, wins: 0, workedOnDay: null };
  } else {
    player.skills.hustle = 2;
  }
  const dream = dreamById(input.dream);
  player.log = [
    lottery === "heir"
      ? `Birth lottery: Heir. ${reveal.home}, a car, and ${careerById(input.careerId).name} at level 3.`
      : "Birth lottery: Struggle. Ikenegbu room, a small loan, and faster skill gain.",
    `Dream locked in: ${dream.name}.`,
  ];
  return { player, ledger, reveal };
}

export function validateLook(id: string) {
  return ["ada", "chidi", "ngozi", "emeka", "zara", "ibe"].includes(id);
}

export function validateTraits(traits: string[]) {
  const allowed = new Set(["sharp", "charismatic", "hustler", "calm", "funny", "fit", "creative", "loyal"]);
  return traits.length === 2 && new Set(traits).size === 2 && traits.every((trait) => allowed.has(trait));
}

export function validateDream(id: string) {
  return ["big-man", "landlord", "sound", "padi", "wetheral"].includes(id);
}
