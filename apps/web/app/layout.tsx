import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vertice Scout — Luís Henrique",
  description: "Plataforma de scouting profissional para acompanhamento de atleta",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0D1B2A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
