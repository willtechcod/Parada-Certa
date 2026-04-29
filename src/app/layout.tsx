import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parada Certa - Sistema de Estacionamento",
  description: "Sistema de gerenciamento de estacionamento",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
