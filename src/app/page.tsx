import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Clock3,
  Dumbbell,
  MapPinned,
  Trophy,
} from "lucide-react";
import { DashboardFiltersForm } from "@/components/dashboard-filters";
import { TrainingHeatmap } from "@/components/heatmap";
import { MetricCard } from "@/components/metric-card";
import { VolumeChart } from "@/components/volume-chart";
import {
  buildDashboardSummary,
  heatmapSeries,
  mergedHeatmap,
  mergedRecent,
  mergeStrengthSessions,
  monthlyStrengthHours,
  resolveWindow,
  strengthTotals,
  windowStrengthSessions,
  withStrengthBreakdown,
} from "@/lib/analytics";
import { getActivityDataset } from "@/lib/csv-source";
import {
  formatCompactDuration,
  formatDate,
  formatDistance,
  formatDuration,
  formatNumber,
  formatPaceOrSpeed,
} from "@/lib/format";
import { parseDashboardFilters, type SearchParams } from "@/lib/query";
import { getStrengthLedger } from "@/lib/strength-source";
import type { RecentEntry } from "@/lib/types";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseDashboardFilters(await searchParams);
  const [dataset, ledger] = await Promise.all([getActivityDataset(), getStrengthLedger()]);
  const cardioActivities = dataset.activities.filter((activity) => activity.sportGroup !== "Strength");
  if (!cardioActivities.length) throw new Error("No valid activities are available.");
  const allStrengthSessions = mergeStrengthSessions(ledger.sessions, dataset.activities);

  // One combined, sport-independent window drives every shared panel (monthly zero-fill,
  // heatmap, strength totals) so cardio-only date bounds never clip strength data at the edges.
  const cardioOnlyStart = cardioActivities.at(-1)!.dateKey;
  const cardioOnlyEnd = cardioActivities[0].dateKey;
  const combinedMinimum = allStrengthSessions.length
    ? [cardioOnlyStart, allStrengthSessions.at(-1)!.dateKey].sort()[0]
    : cardioOnlyStart;
  const combinedMaximum = allStrengthSessions.length
    ? [cardioOnlyEnd, allStrengthSessions[0].dateKey].sort().at(-1)!
    : cardioOnlyEnd;

  const summary = buildDashboardSummary(
    cardioActivities,
    filters,
    { minimum: combinedMinimum, maximum: combinedMaximum },
    20,
  );
  const maximumAnnualHours = Math.max(...summary.annual.map((year) => year.movingSeconds / 3600), 1);

  const window = resolveWindow(filters, combinedMinimum, combinedMaximum);
  const selectedStrengthSessions = windowStrengthSessions(allStrengthSessions, window.from, window.to);
  const strength = strengthTotals(selectedStrengthSessions);

  const showStrengthInBreakdown = !filters.sportGroup || filters.sportGroup === "Strength";
  const sportBreakdown = showStrengthInBreakdown
    ? withStrengthBreakdown(summary.sportBreakdown, selectedStrengthSessions)
    : summary.sportBreakdown;

  const strengthHoursByMonth = showStrengthInBreakdown ? monthlyStrengthHours(selectedStrengthSessions) : new Map<string, number>();
  const monthly = summary.monthly.map((month) => ({
    ...month,
    strengthHours: strengthHoursByMonth.get(month.month) ?? 0,
  }));

  // The consistency heatmap intentionally ignores the sportGroup filter (it's the
  // "whole picture" panel), so it's built from window-filtered cardio activities
  // directly rather than summary.heatmap, which is scoped to the selected sport.
  const cardioForHeatmap = cardioActivities.filter(
    (activity) => activity.dateKey >= window.from && activity.dateKey <= window.to,
  );
  const heatmap = mergedHeatmap(heatmapSeries(cardioForHeatmap, window.to), selectedStrengthSessions, window.to);

  const recent = showStrengthInBreakdown
    ? mergedRecent(summary.recent, selectedStrengthSessions, 8)
    : summary.recent.slice(0, 8).map((data): RecentEntry => ({ kind: "activity", data }));

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow"><span className="live-dot" /> Personal performance archive</p>
          <h1>The work,<br /><em>measured.</em></h1>
          <p className="hero-copy">
            Six years of running, riding, swimming and strength—made legible.
            No vanity score. Just the shape of the work.
          </p>
        </div>
        <div className="hero-stat">
          <span>Dataset</span>
          <strong>{dataset.activities.length.toLocaleString("en-AU")}</strong>
          <small>unique Strava activities</small>
          <div>{formatDate(summary.datasetStart)} <span>→</span> {formatDate(summary.datasetEnd)}</div>
        </div>
      </section>

      <DashboardFiltersForm
        filters={filters}
        years={summary.availableYears}
        datasetStart={summary.datasetStart}
        datasetEnd={summary.datasetEnd}
      />

      <div className="section-heading first">
        <div><p className="eyebrow">Selected volume</p><h2>{summary.periodLabel}</h2></div>
        {filters.sportGroup && <span className="pill">{filters.sportGroup}</span>}
      </div>

      <section className="metric-grid">
        <MetricCard
          label="Activities"
          value={summary.totals.activities.toLocaleString("en-AU")}
          note="completed sessions"
          change={summary.comparison?.activities}
          icon={Activity}
        />
        <MetricCard
          label="Moving time"
          value={formatCompactDuration(summary.totals.movingSeconds)}
          note="time in motion"
          change={summary.comparison?.movingSeconds}
          icon={Clock3}
        />
        <MetricCard
          label="Distance"
          value={formatDistance(summary.totals.distanceMeters)}
          note="across distance sports"
          change={summary.comparison?.distanceMeters}
          icon={MapPinned}
        />
        <MetricCard
          label="Strength sessions"
          value={formatNumber(strength.sessions)}
          note="War Room + Strava, reconciled"
          icon={Dumbbell}
        />
        <MetricCard
          label="Pull-ups"
          value={formatNumber(strength.pullUps)}
          note="total reps this period"
          icon={Trophy}
        />
      </section>

      <section className="dashboard-grid main-analysis">
        <article className="panel volume-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Volume over time</p><h2>Monthly rhythm</h2></div>
            <span className="panel-note">Sport-aware · monthly</span>
          </div>
          {monthly.length ? <VolumeChart data={monthly} /> : <p className="empty">No activities in this period.</p>}
        </article>

        <article className="panel sport-panel">
          <div className="panel-heading"><div><p className="eyebrow">Distribution</p><h2>Sport mix</h2></div></div>
          <div className="sport-list">
            {sportBreakdown.map((sport) => (
              <div className="sport-row" key={sport.sportGroup}>
                <div><strong>{sport.sportGroup}</strong><span>{sport.activities} sessions · {formatCompactDuration(sport.movingSeconds)}</span></div>
                <strong>{sport.percentage.toFixed(0)}%</strong>
                <div className="sport-track"><span className={`sport-${sport.sportGroup.toLowerCase()}`} style={{ width: `${Math.max(sport.percentage, 1)}%` }} /></div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel heatmap-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">Consistency</p><h2>The last 52 weeks</h2></div>
          <span className="panel-note">Colour reflects moving minutes</span>
        </div>
        <TrainingHeatmap days={heatmap} />
      </section>

      <section className="dashboard-grid secondary-analysis">
        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Long view</p><h2>Year by year</h2></div></div>
          <div className="annual-list">
            {summary.annual.map((year) => {
              const hours = year.movingSeconds / 3600;
              return (
                <div className="annual-row" key={year.year}>
                  <div><strong>{year.year}</strong>{year.isPartial && <span>partial</span>}</div>
                  <div className="annual-bar"><span style={{ width: `${(hours / maximumAnnualHours) * 100}%` }} /></div>
                  <div><strong>{Math.round(hours).toLocaleString("en-AU")}h</strong><span>{year.activities} sessions</span></div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Edge of the archive</p><h2>Personal records</h2></div><Trophy size={20} /></div>
          <div className="record-grid">
            {summary.records.map((record) => (
              <Link className="record" href={`/activities/${record.activity.id}`} key={record.label}>
                <span>{record.label}</span><strong>{record.value}</strong><small>{record.detail}</small>
              </Link>
            ))}
            {!summary.records.length && <p className="empty">No records for this selection.</p>}
          </div>
        </article>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">Latest work</p><h2>Recent activities</h2></div>
          <Link className="text-link" href="/activities">Explore all <ArrowRight size={15} /></Link>
        </div>
        <div className="recent-list">
          {recent.map((entry) => {
            if (entry.kind === "strength") {
              const session = entry.data;
              return (
                <div className="recent-row" key={session.id}>
                  <span className="sport-dot sport-strength" />
                  <div><strong>{session.name}</strong><span>{session.focus} · {formatDate(session.dateKey)}</span></div>
                  <span>—</span>
                  <span>{formatDuration(session.durationSeconds)}</span>
                  <span>{session.pullUps === null ? "—" : `${session.pullUps} pull-ups`}</span>
                </div>
              );
            }
            const activity = entry.data;
            return (
              <div className="recent-row" key={activity.id}>
                <span className={`sport-dot sport-${activity.sportGroup.toLowerCase()}`} />
                <div><strong>{activity.name}</strong><span>{activity.activityType} · {formatDate(activity.dateKey)}</span></div>
                <span>{formatDistance(activity.distanceMeters)}</span>
                <span>{formatDuration(activity.movingSeconds)}</span>
                <span>{formatPaceOrSpeed(activity)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
