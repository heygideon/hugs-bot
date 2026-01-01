import type { Metadata } from "next";
import { Crimson_Pro } from "next/font/google";
import "./globals.css";

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson-pro",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hugs-bot.gideon.sh"),
  title: "an affectionate cat",
  description: "a slack bot that sends hugs",
  openGraph: {
    images: {
      url: "/og.png",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${crimsonPro.variable}`}>
      <body>{children}</body>
    </html>
  );
}
