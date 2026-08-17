import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Audiowide } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const audiowide = Audiowide({
  variable: "--font-audiowide",
  subsets: ["latin"],
  weight: "400",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://creditix.metadax.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Creditix | METADAX",
    template: "%s · Creditix",
  },
  description:
    "Organize suas dívidas, monte um plano de recuperação financeira real e identifique cobranças de juros abusivos — com base em legislação e jurisprudência vigentes.",
  icons: {
    icon: "https://cdn.metadax.com.br/favicon.ico",
    shortcut: "https://cdn.metadax.com.br/favicon.ico",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${audiowide.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
