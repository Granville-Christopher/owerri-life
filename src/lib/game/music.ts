export const MAP_TRACK = "/audio/map.mp3";

export const CLUB_TRACKS: Record<string, string> = {
  "cartel-lounge": "/audio/clubs/cartel-lounge.mp3",
  "orange-room": "/audio/clubs/orange-room.mp3",
  "wetheral-strip": "/audio/clubs/wetheral-strip.mp3",
  "channel-garden": "/audio/clubs/channel-garden.mp3",
  "zuma-grill": "/audio/clubs/zuma-grill.mp3",
  "ibari-village": "/audio/clubs/ibari-village.mp3",
  "concord-hotel": "/audio/clubs/concord-hotel.mp3",
};

export function soundtrack(indoors: boolean, placeId: string, dance: boolean, onMap: boolean) {
  if (indoors && dance) return CLUB_TRACKS[placeId] ?? null;
  if (onMap && !indoors) return MAP_TRACK;
  return null;
}
