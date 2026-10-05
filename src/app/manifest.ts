import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Owerri Life",
    short_name: "Owerri Life",
    description: "A browser life simulation set in Owerri.",
    start_url: "/",
    display: "standalone",
    background_color: "#10211a",
    theme_color: "#10211a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
