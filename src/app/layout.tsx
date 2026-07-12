import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ChartNoAxesCombined } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "PacePulse · The work, measured",
  description: "A personal performance dashboard built from six years of Strava training.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/" aria-label="PacePulse dashboard">
            <span className="brand-mark"><ChartNoAxesCombined size={19} /></span>
            <span>Pace<span>Pulse</span></span>
          </Link>
          <nav aria-label="Primary navigation">
            <Link href="/"><ChartNoAxesCombined size={16} /> Overview</Link>
            <Link href="/activities"><Activity size={16} /> Activities</Link>
          </nav>
        </header>
        {children}
        <footer>
          <span>PacePulse</span>
          <span>Built from the work. No invented scores.</span>
        </footer>
      </body>
    </html>
  );
}
