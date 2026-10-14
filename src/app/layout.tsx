import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import { APP_NAME } from "@/lib/brand";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const serif = Fraunces({ variable: "--font-serif-display", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: `${APP_NAME} – AI CV builder`, template: `%s · ${APP_NAME}` },
  description:
    "Answer a few questions, upload your diplomas, pick a design and get a professional, ATS-ready CV written by AI.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
