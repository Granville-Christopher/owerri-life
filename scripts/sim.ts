import assert from "node:assert/strict";
import { createNewPlayer, advance, travel, wallet, workShift, poolsOf } from "../src/lib/game/engine";

const input = {
  username: "Adaeze",
  email: "ada@example.com",
  look: "ada" as const,
  gender: "female" as const,
  traits: ["sharp", "calm"] as ["sharp", "calm"],
  dream: "big-man" as const,
  careerId: "banking",
};

const heir = createNewPlayer(input, "heir", () => 0);
assert.equal(heir.player.lottery, "heir");
assert.equal(heir.player.homeId, "new-owerri-flat");
assert.equal(heir.player.job?.level, 3);
assert.equal(wallet(heir.ledger, heir.player.id), 180000);

const struggle = createNewPlayer(input, "struggle", () => 0.9);
assert.equal(struggle.player.lottery, "struggle");
assert.equal(struggle.player.skills.hustle, 2);
assert.equal(wallet(struggle.ledger, struggle.player.id), 8000);

const hoursToSaturday = (6 - 1) * 24 + (6 - 8);
const billed = advance(struggle.player, struggle.ledger, hoursToSaturday);
assert.equal(weekdayName(billed.player.day), "Saturday");
assert.equal(billed.player.hour, 6);
assert.equal(wallet(billed.ledger, struggle.player.id), 8000 - 2500 - 2000);
assert.equal(billed.player.loanRemaining, 18000);
assert.ok(billed.ledger.some((row) => row.reason.includes("Saturday rent")));

const broke = advance(heir.player, [], 454);
assert.equal(broke.player.homeId, "ikenegbu-room");
assert.ok(broke.player.weeksUnpaid > 2);
assert.equal(wallet(broke.ledger, heir.player.id), 0);

const worker = structuredClone(heir.player);
worker.locationId = "city-bank";
worker.hour = 8;
const shift = workShift(worker, heir.ledger, "steady");
assert.equal(shift.ok, true);
if (shift.ok) {
  const sum = shift.ledger.filter((row) => row.playerId === worker.id).reduce((total, row) => total + row.amount, 0);
  assert.equal(wallet(shift.ledger, worker.id), sum);
  assert.ok(sum > 180000);
  const pools = poolsOf(shift.ledger, worker.id);
  assert.equal(pools.earned + pools.gifted + pools.purchased, sum);
}

const poor = structuredClone(struggle.player);
poor.locationId = "ikenegbu";
const ride = travel(poor, [], "new-owerri", "cab");
assert.equal(ride.ok, false);

const trek = travel(poor, struggle.ledger, "eke-ukwu", "trek");
assert.equal(trek.ok, true);
if (trek.ok) {
  assert.equal(trek.player.locationId, "eke-ukwu");
  assert.ok(trek.player.hour !== poor.hour || trek.player.day !== poor.day);
}

console.log("economy checks passed");

function weekdayName(day: number) {
  return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][(day - 1) % 7];
}
