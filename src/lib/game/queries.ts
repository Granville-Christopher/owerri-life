import { LOOKS, courseById, dreamById, lectureLabel, npcById, npcsAt, placeById, plotById, traitById } from "./content";
import { POLICE_ID, clockIndex, indexLabel, normalizeBet, poolsOf, wallet } from "./engine";
import { homeLabel, jobTitle, moodLabel, naira, playerBio } from "./format";
import { currentPlayer } from "./auth";
import { readDb } from "./store";
import type { Bet, NetWorthVisibility, Player } from "./types";

export interface PersonCard {
  id: string;
  name: string;
  role: string;
  mood: string;
  relationship: string;
  bio: string;
  dream: string;
  home: string;
  netWorth: string | null;
  skills: string;
  look: Player["look"] | null;
  gender: Player["gender"];
  circle: string;
  friend: boolean;
  blocked: boolean;
  isNpc: boolean;
}

export interface GameView {
  me: {
    id: string;
    username: string;
    email: string;
    look: Player["look"];
    gender: Player["gender"];
    traits: Player["traits"];
    dream: Player["dream"];
    lottery: Player["lottery"];
    homeId: string;
    hasCar: boolean;
    loanRemaining: number;
    loanWeekly: number;
    arrears: number;
    weeksUnpaid: number;
    job: Player["job"];
    pendingJob: Player["pendingJob"];
    needs: Player["needs"];
    skills: Player["skills"];
    sick: Player["sick"];
    day: number;
    hour: number;
    locationId: string;
    indoors: boolean;
    lastRide: Player["lastRide"];
    friends: string[];
    netWorthVisibility: NetWorthVisibility;
    log: string[];
    policeInvite: { note: string; deadline: string } | null;
    custody: string | null;
    school: {
      status: "applied" | "admitted";
      course: string;
      school: string;
      when: string;
      feesPaid: boolean;
      fee: number;
    } | null;
    room: Player["room"];
    lands: Array<{ id: string; name: string; area: string; rent: number }>;
    besideId: string | null;
  };
  balance: number;
  pools: { earned: number; gifted: number; purchased: number };
  ledger: Array<{ id: string; amount: number; source: string; reason: string; at: string }>;
  chat: Array<{ id: string; fromId: string; fromName: string; text: string; at: string; replyTo: { id: string; fromName: string; text: string } | null }>;
  nearby: PersonCard[];
  known: PersonCard[];
  threads: Array<{
    peerId: string;
    peerName: string;
    lines: Array<{ id: string; fromId: string; text: string; at: string; replyTo: { id: string; fromName: string; text: string } | null }>;
  }>;
  city: PersonCard[];
  slate: Array<{
    id: string;
    home: string;
    away: string;
    league: string;
    homeOdds: number;
    drawOdds: number;
    awayOdds: number;
    result: "1" | "X" | "2" | null;
    homeScore: number | null;
    awayScore: number | null;
  }>;
  slips: Array<{
    id: string;
    code: string;
    stake: number;
    odds: number;
    status: "open" | "won" | "lost";
    payout: number;
    legs: Array<{ fixtureId: string; pick: "1" | "X" | "2"; odds: number; home: string; away: string;     result: "1" | "X" | "2" | null }>;
  }>;
  calls: Array<{ id: string; fromId: string; fromName: string; kind: "spray" | "dorime"; amount: number }>;
  requests: {
    incoming: Array<{ fromId: string; username: string }>;
    outgoing: Array<{ toId: string; username: string }>;
  };
}

function wealthVisible(owner: Player, viewer: Player) {
  if (owner.id === viewer.id) return true;
  if (owner.netWorthVisibility === "public") return true;
  if (owner.netWorthVisibility === "friends" && owner.friends.includes(viewer.id)) return true;
  return false;
}

function cardForNpc(id: string, viewer: Player, balance = 0): PersonCard | null {
  const npc = npcById(id);
  if (!npc) return null;
  return {
    id: npc.id,
    name: npc.name,
    role: npc.role,
    mood: npc.mood,
    relationship: viewer.friends.includes(npc.id) ? "Padi" : viewer.met.includes(npc.id) ? "You have met" : "Stranger",
    bio: npc.bio,
    dream: "Living in Owerri",
    home: npc.home,
    netWorth: npc.asking ? naira(balance) : null,
    skills: "Not listed",
    look: LOOKS[npc.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % LOOKS.length].id,
    gender: npc.asking ? "female" : null,
    circle: "Known around the venue",
    friend: viewer.friends.includes(npc.id),
    blocked: viewer.blocked.includes(npc.id),
    isNpc: true,
  };
}

function cardForPlayer(other: Player, viewer: Player, balance: number): PersonCard {
  const visible = wealthVisible(other, viewer);
  return {
    id: other.id,
    name: other.username,
    role: jobTitle(other),
    mood: moodLabel(other.needs, other.sick),
    relationship: viewer.friends.includes(other.id) ? "Padi" : "Stranger",
    bio: playerBio(other.traits, other.dream),
    dream: dreamById(other.dream).name,
    home: homeLabel(other.homeId),
    netWorth: visible ? naira(balance - other.loanRemaining - other.arrears) : null,
    skills: other.traits.map((trait) => traitById(trait).name).join(", "),
    look: other.look,
    gender: other.gender,
    circle: `${other.friends.length} on the padi ladder`,
    friend: viewer.friends.includes(other.id),
    blocked: viewer.blocked.includes(other.id),
    isNpc: false,
  };
}

export async function buildView(playerId: string): Promise<GameView | null> {
  const db = await readDb();
  const me = db.players.find((player) => player.id === playerId);
  if (!me) return null;
  const mine = db.ledger.filter((entry) => entry.playerId === me.id);
  const balance = wallet(mine, me.id);
  const nearby: PersonCard[] = [];
  for (const npc of npcsAt(me.locationId)) {
    if (me.blocked.includes(npc.id)) continue;
    const card = cardForNpc(npc.id, me, wallet(db.ledger, npc.id));
    if (card) nearby.push(card);
  }
  for (const other of db.players) {
    if (other.id === me.id || other.locationId !== me.locationId || me.blocked.includes(other.id)) continue;
    const otherBalance = wallet(db.ledger, other.id);
    nearby.push(cardForPlayer(other, me, otherBalance));
  }
  const knownIds = new Set([...me.met, ...me.friends, ...me.blocked]);
  const known: PersonCard[] = [];
  for (const id of knownIds) {
    const npcCard = cardForNpc(id, me, wallet(db.ledger, id));
    if (npcCard) {
      known.push(npcCard);
      continue;
    }
    const other = db.players.find((player) => player.id === id);
    if (other) known.push(cardForPlayer(other, me, wallet(db.ledger, other.id)));
  }
  const boxes = new Map<string, GameView["threads"][number]>();
  for (const message of db.messages) {
    const [left, right] = message.box.split("|");
    if (left !== me.id && right !== me.id) continue;
    const peerId = left === me.id ? right : left;
    let thread = boxes.get(peerId);
    if (!thread) {
      const peerName =
        peerId === POLICE_ID
          ? "State CID"
          : npcById(peerId)?.name ?? db.players.find((player) => player.id === peerId)?.username ?? "Unknown";
      thread = { peerId, peerName, lines: [] };
      boxes.set(peerId, thread);
    }
    thread.lines.push({ id: message.id, fromId: message.fromId, text: message.text, at: message.at, replyTo: message.replyTo ?? null });
  }
  return {
    me: {
      id: me.id,
      username: me.username,
      email: me.email,
      look: me.look,
      gender: me.gender,
      traits: me.traits,
      dream: me.dream,
      lottery: me.lottery,
      homeId: me.homeId,
      hasCar: me.hasCar,
      loanRemaining: me.loanRemaining,
      loanWeekly: me.loanWeekly,
      arrears: me.arrears,
      weeksUnpaid: me.weeksUnpaid,
      job: me.job,
      pendingJob: me.pendingJob,
      needs: me.needs,
      skills: me.skills,
      sick: me.sick,
      day: me.day,
      hour: me.hour,
      locationId: me.locationId,
      indoors: me.indoors,
      lastRide: me.lastRide,
      friends: me.friends,
      netWorthVisibility: me.netWorthVisibility,
      log: me.log,
      policeInvite: me.policeInvite
        ? { note: me.policeInvite.note, deadline: indexLabel(me.policeInvite.deadline) }
        : null,
      custody:
        me.detainedUntil != null && clockIndex(me) < me.detainedUntil ? indexLabel(me.detainedUntil) : null,
      school: me.school
        ? {
            status: me.school.status,
            course: courseById(me.school.courseId).name,
            school: placeById(me.school.schoolId).name,
            when: lectureLabel(courseById(me.school.courseId)),
            feesPaid: me.school.feesPaid,
            fee: courseById(me.school.courseId).fee,
          }
        : null,
      room: me.room,
      lands: me.lands.map((id) => {
        const plot = plotById(id);
        return { id: plot.id, name: plot.name, area: plot.area, rent: plot.rent };
      }),
      besideId: me.besideId,
    },
    balance,
    pools: poolsOf(mine, me.id),
    ledger: mine.slice(-40).reverse().map((entry) => ({
      id: entry.id,
      amount: entry.amount,
      source: entry.source,
      reason: entry.reason,
      at: entry.at,
    })),
    chat: db.chat
      .filter((message) => message.venueId === me.locationId)
      .slice(-30)
      .map((message) => ({
        id: message.id,
        fromId: message.fromId,
        fromName: message.fromName,
        text: message.text,
        at: message.at,
        replyTo: message.replyTo ?? null,
      })),
    calls: (db.calls ?? [])
      .filter((call) => call.venueId === me.locationId && Date.now() - call.at < 25_000)
      .slice(-8)
      .map((call) => ({
        id: call.id,
        fromId: call.fromId,
        fromName: call.fromName,
        kind: call.kind,
        amount: call.amount,
      })),
    nearby,
    known,
    threads: [...boxes.values()],
    slate: (db.fixtures ?? []).map((game) => ({
      ...game,
      homeScore: game.homeScore ?? null,
      awayScore: game.awayScore ?? null,
    })),
    slips: (db.bets ?? [])
      .map((bet) => normalizeBet(bet, db.fixtures ?? []))
      .filter((bet): bet is Bet => bet !== null && bet.playerId === me.id)
      .map((bet) => ({
        id: bet.id,
        code: bet.code,
        stake: bet.stake,
        odds: bet.odds,
        status: bet.status,
        payout: bet.status === "won" ? Math.round(bet.stake * bet.odds) : 0,
        legs: bet.legs.map((leg) => ({
          fixtureId: leg.fixtureId,
          pick: leg.pick,
          odds: leg.odds,
          home: leg.home,
          away: leg.away,
          result: (db.fixtures ?? []).find((game) => game.id === leg.fixtureId)?.result ?? null,
        })),
      })),
    requests: {
      incoming: (db.requests ?? [])
        .filter((request) => request.toId === me.id)
        .map((request) => ({
          fromId: request.fromId,
          username: db.players.find((player) => player.id === request.fromId)?.username ?? "Unknown",
        })),
      outgoing: (db.requests ?? [])
        .filter((request) => request.fromId === me.id)
        .map((request) => ({
          toId: request.toId,
          username: db.players.find((player) => player.id === request.toId)?.username ?? "Unknown",
        })),
    },
    city: db.players
      .filter((player) => player.id !== me.id)
      .map((player) => cardForPlayer(player, me, wallet(db.ledger, player.id))),
  };
}

export async function sessionView() {
  const player = await currentPlayer();
  if (!player) return null;
  return buildView(player.id);
}
