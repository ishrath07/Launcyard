import type { Metadata } from "next";
import { Bricolage_Grotesque, Fraunces, Newsreader, Nunito_Sans, Outfit, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const source = Source_Sans_3({ subsets: ["latin"], variable: "--font-source" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader" });
const nunito = Nunito_Sans({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "Launchyard",
  description: "Fill a form, pick a theme, and open a live store.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} ${source.variable} ${bricolage.variable} ${newsreader.variable} ${nunito.variable}`}>
        {children}
      </body>
    </html>
  );
}
