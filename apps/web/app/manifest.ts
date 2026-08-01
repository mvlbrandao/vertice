import type { MetadataRoute } from "next";

const monogram =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#0D1B2A"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-weight="700" font-size="220" fill="#ffffff">LH</text></svg>`,
  );

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vertice Scout — Luís Henrique",
    short_name: "Vertice Scout",
    description: "Plataforma de scouting profissional para acompanhamento de atleta",
    start_url: "/",
    display: "standalone",
    background_color: "#E9EEF2",
    theme_color: "#0D1B2A",
    icons: [
      { src: monogram, sizes: "192x192", type: "image/svg+xml", purpose: "any" },
      { src: monogram, sizes: "512x512", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
