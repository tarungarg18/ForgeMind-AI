import type { Metadata } from "next";
import { IBM_Plex_Sans, Sora } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { EquipmentProvider } from "@/components/EquipmentContext";

const body = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ForgeMind AI",
  description: "Ask questions about plant equipment using your documents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${display.variable} antialiased`}>
        <EquipmentProvider>
          <AppShell>{children}</AppShell>
        </EquipmentProvider>
      </body>
    </html>
  );
}
