import type { Metadata } from "next";
import "./globals.css";
import { Atmosphere } from "@/components/atmosphere/Atmosphere";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

// Chapter-aware metadata, sourced from lib/milestones.ts rather than a
// hand-typed string — V1's title/description went stale ("Chasing 100K")
// specifically because nothing forced them to track the real config.
import { MILESTONE_CONFIG } from "@/lib/milestones";


export const metadata: Metadata = {
  title: `GetTheMoon · ${MILESTONE_CONFIG.chapterStart / 1000}K → ${MILESTONE_CONFIG.chapterGoal / 1000}K`,
  description: "Every orbit brings us closer to the Moon.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      >
      <body>
        <Atmosphere />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
