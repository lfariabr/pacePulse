"use client";

import { AlertTriangle } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="page-shell error-state">
      <AlertTriangle size={30} />
      <p className="eyebrow">Data source error</p>
      <h1>PacePulse could not read this Strava export.</h1>
      <p>Confirm that <code>activities.csv</code> is in the project root and uses the standard Strava export headers.</p>
      <button className="button primary" onClick={reset}>Try again</button>
    </main>
  );
}
