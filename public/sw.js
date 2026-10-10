self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "notify" || typeof data.body !== "string") return;
  event.waitUntil(
    self.registration.showNotification("Owerri Life", {
      body: data.body,
      tag: typeof data.tag === "string" ? data.tag : "owerri-life",
    }),
  );
});
