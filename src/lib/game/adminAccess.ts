export function isAdmin(player: { email: string; username: string }) {
  const raw = process.env.ADMIN_EMAILS ?? "";
  const list = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (!list.length) return false;
  return list.includes(player.email.toLowerCase()) || list.includes(player.username.toLowerCase());
}
