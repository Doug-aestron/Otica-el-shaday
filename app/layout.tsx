import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { ColorThemeInit } from "@/components/theme/color-theme-init";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "El Shaday — Ótica",
    template: "%s | El Shaday",
  },
  description: "Ótica moderna: exames, consultas e atendimento integrado.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${dmSans.variable}`} data-color-theme="blue" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <ColorThemeInit />
        {children}
      </body>
    </html>
  );
}
