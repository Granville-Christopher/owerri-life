export const MAP_TRACK = "/audio/map.mp3";

export const AMAPIANO = Array.from({ length: 20 }, (_, index) => `/audio/amapiano/${String(index + 1).padStart(2, "0")}.mp3`);

const PLACE_TRACKS = Array.from({ length: 16 }, (_, index) => `/audio/places/${String(index + 1).padStart(2, "0")}.mp3`);

function hash(id: string) {
  let value = 0;
  for (const char of id) value = (value * 33 + char.charCodeAt(0)) >>> 0;
  return value;
}

export function placeSound(placeId: string) {
  return PLACE_TRACKS[hash(placeId) % PLACE_TRACKS.length];
}

export function placeRate(placeId: string) {
  return 0.94 + (hash(placeId) % 13) * 0.01;
}

export function pickAmapiano() {
  return AMAPIANO[Math.floor(Math.random() * AMAPIANO.length)];
}
