import { careerById, dreamById, homeById, placeById, traitById } from "./content";
import type { DreamId, NeedKey, Player, Sick, SkillKey, TraitId } from "./types";
import { NEED_KEYS } from "./types";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function naira(amount: number) {
  const value = Math.round(amount);
  const abs = Math.abs(value);
  const trim = (n: number) => n.toFixed(2).replace(/\.?0+$/, "");
  if (abs >= 1e12) return `${value < 0 ? "-" : ""}₦${trim(abs / 1e12)}T`;
  if (abs >= 1e9) return `${value < 0 ? "-" : ""}₦${trim(abs / 1e9)}B`;
  return `₦${value.toLocaleString("en-NG")}`;
}

export function weekday(day: number) {
  return WEEKDAYS[(day - 1) % 7];
}

export function clockLabel(day: number, hour: number) {
  const name = WEEKDAY_SHORT[(day - 1) % 7];
  return `${name} ${String(hour).padStart(2, "0")}:00`;
}

export function stamp(day: number, hour: number) {
  return `${weekday(day)} ${String(hour).padStart(2, "0")}:00 · Day ${day}`;
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function averageNeeds(needs: Record<NeedKey, number>) {
  const total = NEED_KEYS.reduce((sum, key) => sum + needs[key], 0);
  return total / NEED_KEYS.length;
}

export function moodLabel(needs: Record<NeedKey, number>, sick: Sick) {
  let score = averageNeeds(needs);
  if (sick === "mild") score -= 15;
  if (sick === "severe") score -= 35;
  if (score < 25) return "Low";
  if (score < 45) return "Tight";
  if (score < 65) return "Alright";
  if (score < 85) return "Bright";
  return "On top";
}

export function skillNeeded(nextLevel: number) {
  if (nextLevel <= 2) return 1;
  if (nextLevel === 3) return 3;
  if (nextLevel === 4) return 5;
  return 7;
}

export function levelPay(level: number, l1: number, l5: number) {
  const t = (level - 1) / 4;
  return Math.round(l1 + (l5 - l1) * t);
}

const SKILL_LABEL: Record<SkillKey, string> = {
  music: "Music",
  charisma: "Charisma",
  coding: "Coding",
  hustle: "Hustle",
  fitness: "Fitness",
  cooking: "Cooking",
  comedy: "Comedy",
  photography: "Photography",
};

export function skillLabel(skill: SkillKey) {
  return SKILL_LABEL[skill];
}

export function jobTitle(player: Pick<Player, "job" | "pendingJob">) {
  if (player.job) {
    const career = careerById(player.job.careerId);
    return `${career.name} · L${player.job.level}`;
  }
  if (player.pendingJob) {
    const career = careerById(player.pendingJob.careerId);
    return `${career.name} · starts day ${player.pendingJob.startsOnDay}`;
  }
  return "No job yet";
}

export function playerBio(traits: TraitId[], dream: DreamId) {
  const names = traits.map((id) => traitById(id).name).join(" and ");
  return `${names}. Dream: ${dreamById(dream).name}.`;
}

export function homeLabel(homeId: string) {
  return homeById(homeId).name;
}

export function placeLabel(placeId: string) {
  return placeById(placeId).name;
}

export function dreamProgress(player: Pick<Player, "dream" | "job" | "skills" | "friends">, balance: number) {
  if (player.dream === "big-man") {
    const level = player.job?.level ?? 0;
    return { current: level, target: 5, text: "Career level" };
  }
  if (player.dream === "landlord") {
    return { current: Math.max(0, balance), target: 1_000_000, text: "Cash toward ₦1,000,000" };
  }
  if (player.dream === "sound") {
    return { current: player.skills.music, target: 10, text: "Music skill" };
  }
  if (player.dream === "padi") {
    return { current: player.friends.length, target: 4, text: "Friends" };
  }
  return { current: 0, target: 1, text: "Nightlife business is a later phase" };
}
