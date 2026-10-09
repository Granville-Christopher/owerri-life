export const NEED_KEYS = [
  "hunger",
  "energy",
  "hygiene",
  "bladder",
  "fun",
  "social",
] as const;

export type NeedKey = (typeof NEED_KEYS)[number];

export const SKILL_KEYS = [
  "music",
  "charisma",
  "coding",
  "hustle",
  "fitness",
  "cooking",
  "comedy",
  "photography",
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

export type LookId = "ada" | "chidi" | "ngozi" | "emeka" | "zara" | "ibe";
export type TraitId =
  | "sharp"
  | "charismatic"
  | "hustler"
  | "calm"
  | "funny"
  | "fit"
  | "creative"
  | "loyal";
export type DreamId = "big-man" | "landlord" | "sound" | "padi" | "wetheral";
export type Lottery = "heir" | "struggle";
export type MoneySource = "earned" | "gifted" | "purchased";
export type Gender = "male" | "female";
export type Sick = "none" | "mild" | "severe";
export type TravelMode = "trek" | "bus" | "keke" | "okada" | "cab" | "car";
export type WorkStyle = "steady" | "jaguda" | "gist" | "oga" | "easy" | "leave";
export type NetWorthVisibility = "public" | "friends" | "hidden";
export type Pose = "stand" | "sit" | "bed";
export type DirectKind = "text" | "money" | "food" | "invite" | "post" | "voice";

export interface Job {
  careerId: string;
  level: number;
  performance: number;
  wins: number;
  workedOnDay: number | null;
}

export type FurnitureSpot = "parlour" | "kitchen" | "room";

export interface Placement {
  homeId: string;
  spot: FurnitureSpot;
  roomNo: number;
  x: number;
  z: number;
  rot: number;
}

export interface Player {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  look: LookId;
  gender: Gender | null;
  traits: TraitId[];
  dream: DreamId;
  lottery: Lottery;
  homeId: string;
  homes: string[];
  hasCar: boolean;
  cars?: string[];
  activeCar?: string;
  loanRemaining: number;
  loanWeekly: number;
  arrears: number;
  weeksUnpaid: number;
  billsOnDay: number | null;
  job: Job | null;
  pendingJob: { careerId: string; startsOnDay: number } | null;
  needs: Record<NeedKey, number>;
  skills: Record<SkillKey, number>;
  sick: Sick;
  strain: number;
  day: number;
  hour: number;
  locationId: string;
  indoors: boolean;
  lastRide: TravelMode;
  friends: string[];
  met: string[];
  blocked: string[];
  netWorthVisibility: NetWorthVisibility;
  policeInvite: { note: string; deadline: number } | null;
  detainedUntil: number | null;
  school: {
    schoolId: string;
    courseId: string;
    status: "applied" | "admitted";
    appliedOnDay: number;
    attendedOnDay: number | null;
    feesPaid: boolean;
  } | null;
  room: { stay: "hour" | "night"; placeId: string } | null;
  lands: string[];
  furniture: string[];
  layout: Record<string, Placement>;
  besideId: string | null;
  pose: Pose;
  intimacyWith: string | null;
  dmToday: number;
  lastChatKey: string;
  log: string[];
  createdAt: string;
  banned?: boolean;
}

export interface LedgerEntry {
  id: string;
  playerId: string;
  amount: number;
  source: MoneySource;
  reason: string;
  at: string;
}

export interface ChatQuote {
  id: string;
  fromName: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  venueId: string;
  fromId: string;
  fromName: string;
  text: string;
  at: string;
  replyTo?: ChatQuote | null;
}

export interface DirectMessage {
  id: string;
  box: string;
  fromId: string;
  text: string;
  at: string;
  replyTo?: ChatQuote | null;
  kind?: DirectKind;
  amount?: number;
  placeId?: string | null;
  voiceId?: string | null;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetName: string;
  note: string;
  at: string;
  reviewed?: boolean;
}

export interface Payment {
  id: string;
  reference: string;
  playerId: string;
  amount: number;
  credit?: number;
  status: "pending" | "paid" | "failed";
  at: string;
  paidAt?: string;
}

export type BetPick = "1" | "X" | "2";

export interface Fixture {
  id: string;
  home: string;
  away: string;
  league: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  result: BetPick | null;
  homeScore: number | null;
  awayScore: number | null;
}

export interface SlipLeg {
  fixtureId: string;
  pick: BetPick;
  odds: number;
  home: string;
  away: string;
}

export interface Bet {
  id: string;
  playerId: string;
  code: string;
  stake: number;
  odds: number;
  status: "open" | "won" | "lost";
  legs: SlipLeg[];
}

export interface FloorCall {
  id: string;
  venueId: string;
  fromId: string;
  fromName: string;
  kind: "spray" | "dorime";
  amount: number;
  at: number;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
}

export interface AdminAccount {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface PaystackSettings {
  secretKey: string;
  publicKey: string;
}

export interface DB {
  players: Player[];
  ledger: LedgerEntry[];
  chat: ChatMessage[];
  messages: DirectMessage[];
  reports: Report[];
  fixtures: Fixture[];
  bets: Bet[];
  requests: FriendRequest[];
  calls: FloorCall[];
  payments: Payment[];
  admins: AdminAccount[];
  paystack: PaystackSettings;
}

export interface CreateInput {
  username: string;
  email: string;
  look: LookId;
  gender: Gender;
  traits: TraitId[];
  dream: DreamId;
  careerId: string;
}

export interface Reveal {
  lottery: Lottery;
  title: string;
  cash: number;
  home: string;
  perk: string;
}
