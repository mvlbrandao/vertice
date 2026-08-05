import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vertice Scout",
  description: "Plataforma de scouting profissional para acompanhamento de atletas",
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
