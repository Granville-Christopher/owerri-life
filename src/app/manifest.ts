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
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
