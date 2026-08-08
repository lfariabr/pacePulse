import type { Metadata } from "next";
import {
  CalendarDays,
  Clock3,
  Database,
  Dumbbell,
  ListChecks,
} from "lucide-react";
import { TrainingHeatmap } from "@/components/heatmap";
import { MetricCard } from "@/components/metric-card";
import {
  formatCompactDuration,
  formatDate,
  formatDuration,
  formatLocalTime,
  formatNumber,
} from "@/lib/format";
import { buildStrengthSummary } from "@/lib/strength-analytics";
import { getStrengthLedger } from "@/lib/strength-source";
import type { StrengthSession } from "@/lib/types";

export const metadata: Metadata = {
  title: "Strength Journey · PacePulse",
  description: "A private, reconciled view of gym consistency and strength work.",
};

export const dynamic = "force-dynamic";

function sourceLabel(session: StrengthSession) {
  if (session.source === "combined") return "War Room + Strava";
  if (session.source === "war-room") return "War Room";
  return "Strava";
}

function sessionDetail(session: StrengthSession) {
  const conditioning = session.conditioning
    .map((effort) => `${effort.kind}${effort.durationMinutes ? ` ${effort.durationMinutes}m` : ""}`)
    .join(" · ");
  if (conditioning) return conditioning;
  if (session.pullUps !== null) return `${formatNumber(session.pullUps)} pull-ups`;
  return "Recorded strength session";
}

export default async function StrengthPage() {
  const ledger = await getStrengthLedger();
  const summary = buildStrengthSummary(ledger.sessions);
  const maximumMonthlySessions = Math.max(
    ...summary.monthly.map((month) => month.sessions),
    1,
  );
  const startYear = summary.datasetStart.slice(0, 4);
  const endYear = summary.datasetEnd.slice(0, 4);
  const yearLabel = startYear === endYear ? startYear : `${startYear}–${endYear}`;

  return (
    <main className="page-shell">
      <section className="hero strength-hero">
        <div>
          <p className="eyebrow"><span className="live-dot" /> Reconciled strength archive</p>
          <h1>Built,<br /><em>rep by rep.</em></h1>
          <p className="hero-copy">
            Gym work recovered from the War Room, reconciled with Strava, and made
            legible without exposing the journal behind it.
          </p>
        </div>
        <div className="hero-stat">
          <span>Strength ledger</span>
          <strong>{formatNumber(summary.sessions)}</strong>
          <small>unique sessions after reconciliation</small>
          <div>{formatDate(summary.datasetStart)} <span>→</span> {formatDate(summary.datasetEnd)}</div>
        </div>
      </section>

      <div className="section-heading first">
        <div><p className="eyebrow">{yearLabel} strength volume</p><h2>The work behind the miles</h2></div>
        <span className="pill">War Room authoritative</span>
      </div>

      <section className="metric-grid">
        <MetricCard
          label="Sessions"
          value={formatNumber(summary.sessions)}
          note="deduplicated workouts"
          icon={Dumbbell}
        />
        <MetricCard
          label="Training time"
          value={formatCompactDuration(summary.durationSeconds)}
          note="scheduled gym work"
          icon={Clock3}
        />
        <MetricCard
          label="Active days"
          value={formatNumber(summary.activeDays)}
          note="days with strength work"
          icon={CalendarDays}
        />
        <MetricCard
          label="Pull-ups"
          value={formatNumber(summary.pullUps)}
          note={summary.pushUps ? `plus ${formatNumber(summary.pushUps)} push-ups` : "session totals recorded"}
          icon={ListChecks}
        />
      </section>

      <section className="dashboard-grid main-analysis strength-analysis">
        <article className="panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Volume over time</p><h2>Monthly strength rhythm</h2></div>
            <span className="panel-note">Sessions · hours · pull-ups</span>
          </div>
          <div className="strength-month-list">
            {summary.monthly.map((month) => (
              <div className="strength-month-row" key={month.month}>
                <strong>{month.label}</strong>
                <div className="strength-month-track" aria-hidden="true">
                  <span style={{ width: `${(month.sessions / maximumMonthlySessions) * 100}%` }} />
                </div>
                <div className="strength-month-total">
                  <strong>{month.sessions}</strong>
                  <span>{formatCompactDuration(month.durationSeconds)}</span>
                </div>
                <span>{formatNumber(month.pullUps)} pull-ups</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Rotation</p><h2>Training focus</h2></div>
          </div>
          <div className="strength-focus-list">
            {summary.focusBreakdown.map((item) => (
              <div className="strength-focus-row" key={item.focus}>
                <div>
                  <strong>{item.focus}</strong>
                  <span>{item.sessions} sessions · {formatCompactDuration(item.durationSeconds)}</span>
                </div>
                <strong>{item.percentage.toFixed(0)}%</strong>
                <div className="strength-focus-track"><span style={{ width: `${item.percentage}%` }} /></div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel heatmap-panel strength-heatmap-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">Strength consistency</p><h2>The last 52 weeks</h2></div>
          <span className="panel-note">Colour reflects workout minutes</span>
        </div>
        <TrainingHeatmap days={summary.heatmap} itemLabel="workout" />
      </section>

      <section className="dashboard-grid secondary-analysis strength-secondary">
        <article className="panel source-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Data confidence</p><h2>How {formatNumber(summary.sessions)} was reconciled</h2></div>
            <Database size={20} />
          </div>
          <div className="source-ledger">
            <div><strong>{ledger.diagnostics.warRoomWorkouts}</strong><span>reviewed War Room workouts</span></div>
            <div><strong>{ledger.diagnostics.confidentDuplicates}</strong><span>confident Strava duplicates</span></div>
            <div><strong>{ledger.diagnostics.acceptedPossibleDuplicates}</strong><span>confirmed near-duplicates</span></div>
            <div>
              <strong>{ledger.diagnostics.stravaOnlySessions}</strong>
              <span>
                {ledger.diagnostics.stravaOnlySessions === 1
                  ? "Strava-only session retained"
                  : "Strava-only sessions retained"}
              </span>
            </div>
          </div>
          <p className="source-note">
            Matching changes reconciliation only. Original timestamps and source records remain untouched.
          </p>
        </article>

        <article className="panel pullup-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Recorded volume</p><h2>Pull-up progression</h2></div>
          </div>
          <strong>{formatNumber(summary.pullUps)}</strong>
          <p>Pull-ups counted from individual workout entries—not from cumulative monthly checkpoints.</p>
          <div className="pullup-months">
            {summary.monthly.filter((month) => month.pullUps > 0).slice(-4).map((month) => (
              <div key={month.month}><span>{month.label}</span><strong>{formatNumber(month.pullUps)}</strong></div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel recent-panel strength-recent-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">Latest work</p><h2>Recent strength sessions</h2></div>
          <span className="panel-note">Structured facts only</span>
        </div>
        <div className="strength-recent-list">
          {summary.recent.map((session) => (
            <article className="strength-recent-row" key={session.id}>
              <span className={`source-badge source-${session.source}`}>{sourceLabel(session)}</span>
              <div>
                <strong>{session.name}</strong>
                <span>{sessionDetail(session)}</span>
              </div>
              <time dateTime={session.dateLocal}>
                <strong>{formatDate(session.dateKey)}</strong>
                <span>{formatLocalTime(session.dateLocal)}</span>
              </time>
              <strong>{formatDuration(session.durationSeconds)}</strong>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
