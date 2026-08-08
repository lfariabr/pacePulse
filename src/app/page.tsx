import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Clock3,
  MapPinned,
  Mountain,
  Trophy,
} from "lucide-react";
import { DashboardFiltersForm } from "@/components/dashboard-filters";
import { TrainingHeatmap } from "@/components/heatmap";
import { MetricCard } from "@/components/metric-card";
import { VolumeChart } from "@/components/volume-chart";
import { buildDashboardSummary } from "@/lib/analytics";
import { getActivityDataset } from "@/lib/csv-source";
import {
  formatCompactDuration,
  formatDate,
  formatDistance,
  formatDuration,
  formatElevation,
  formatPaceOrSpeed,
} from "@/lib/format";
import { parseDashboardFilters, type SearchParams } from "@/lib/query";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseDashboardFilters(await searchParams);
  const dataset = await getActivityDataset();
  const summary = buildDashboardSummary(dataset.activities, filters);
  const maximumAnnualHours = Math.max(...summary.annual.map((year) => year.movingSeconds / 3600), 1);

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
          label="Elevation"
          value={formatElevation(summary.totals.elevationGainMeters)}
          note="vertical gain"
          change={summary.comparison?.elevationGainMeters}
          icon={Mountain}
        />
      </section>

      <section className="dashboard-grid main-analysis">
        <article className="panel volume-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Volume over time</p><h2>Monthly rhythm</h2></div>
            <span className="panel-note">Sport-aware · monthly</span>
          </div>
          {summary.monthly.length ? <VolumeChart data={summary.monthly} /> : <p className="empty">No activities in this period.</p>}
        </article>

        <article className="panel sport-panel">
          <div className="panel-heading"><div><p className="eyebrow">Distribution</p><h2>Sport mix</h2></div></div>
          <div className="sport-list">
            {summary.sportBreakdown.map((sport) => (
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
        <TrainingHeatmap days={summary.heatmap} />
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
              <div className="record" key={record.label}>
                <span>{record.label}</span><strong>{record.value}</strong><small>{record.detail}</small>
              </div>
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
          {summary.recent.map((activity) => (
            <div className="recent-row" key={activity.id}>
              <span className={`sport-dot sport-${activity.sportGroup.toLowerCase()}`} />
              <div><strong>{activity.name}</strong><span>{activity.activityType} · {formatDate(activity.dateKey)}</span></div>
              <span>{formatDistance(activity.distanceMeters)}</span>
              <span>{formatDuration(activity.movingSeconds)}</span>
              <span>{formatPaceOrSpeed(activity)}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
