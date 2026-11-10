import type { Metadata } from "next";
import { Merriweather, Titillium_Web } from "next/font/google";
import { getUser } from "@/lib/auth";
import { Providers } from "@/components/Providers";
import "./globals.css";

const display = Merriweather({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

const body = Titillium_Web({
  subsets: ["latin"],
  weight: ["200", "300", "400", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Desk",
  description: "A personal desk for your projects, notes and documents.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // A database hiccup must not take the whole app down just to pick the desk colour.
  const user = await getUser().catch(() => null);
  return (
    <html
      lang="en"
      data-palette={user?.palette ?? "walnut"}
      data-time="day"
      className={`${display.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
