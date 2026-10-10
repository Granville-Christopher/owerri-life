self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;
  if (data.type === "watch") {
    event.waitUntil(watchNotes());
    return;
  }
  if (data.type !== "notify" || typeof data.body !== "string") return;
  event.waitUntil(
    self.registration.showNotification("Owerri Life", {
      body: data.body,
      tag: typeof data.tag === "string" ? data.tag : "owerri-life",
    }),
  );
});

let seen = null;
let timer = 0;

async function watchNotes() {
  await pollNotes();
  if (timer) return;
  const again = () => {
    timer = setTimeout(() => {
      pollNotes().finally(again);
    }, 8000);
  };
  again();
}

async function pollNotes() {
  try {
    const response = await fetch("/api/alerts", { credentials: "include", cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    const alerts = Array.isArray(data.alerts) ? data.alerts : [];
    const incoming = Number(data.incoming) || 0;
    if (!seen) {
      seen = { ids: new Set(alerts.map((alert) => alert.id).filter(Boolean)), incoming };
      return;
    }
    const fresh = alerts.filter((alert) => alert && alert.id && !seen.ids.has(alert.id));
    for (const alert of alerts) {
      if (alert && alert.id) seen.ids.add(alert.id);
    }
    const requestJump = incoming > seen.incoming;
    seen.incoming = incoming;
    if (!fresh.length && !requestJump) return;
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const open = windows.some((client) => client.visibilityState === "visible");
    if (open) return;
    for (const alert of fresh) {
      await self.registration.showNotification("Owerri Life", { body: String(alert.text || "New update"), tag: alert.id });
    }
    if (requestJump && !fresh.length) {
      await self.registration.showNotification("Owerri Life", { body: "Someone sent you a padi request.", tag: "padi-request" });
    }
  } catch {
    /* The next poll tries again. */
  }
}
