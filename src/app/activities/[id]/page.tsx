import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity as ActivityIcon, ArrowLeft, Flame, Gauge, HeartPulse, Mountain, Timer } from "lucide-react";
import { OptionalMetric } from "@/components/optional-metric";
import { getActivityById } from "@/lib/csv-source";
import { formatDate, formatDistance, formatDuration, formatElevation, formatPaceOrSpeed } from "@/lib/format";

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const activity = await getActivityById(id);
  if (!activity) notFound();

  return (
    <main className="page-shell">
      <Link className="text-link" href="/"><ArrowLeft size={15} /> Back to Overview</Link>

      <div className="drawer-heading" style={{ marginTop: 18 }}>
        <div>
          <p className="eyebrow">{activity.activityType}</p>
          <h2>{activity.name}</h2>
          <span>{formatDate(activity.dateKey)}</span>
        </div>
      </div>

      <div className="drawer-hero">
        <div><ActivityIcon size={18} /><span>Distance</span><strong>{formatDistance(activity.distanceMeters)}</strong></div>
        <div><Timer size={18} /><span>Moving time</span><strong>{formatDuration(activity.movingSeconds)}</strong></div>
        <div><Gauge size={18} /><span>Pace / speed</span><strong>{formatPaceOrSpeed(activity)}</strong></div>
      </div>

      <div className="detail-grid">
        <OptionalMetric label="Elapsed time" value={formatDuration(activity.elapsedSeconds)} />
        <OptionalMetric label="Elevation gain" value={activity.elevationGainMeters === null ? null : formatElevation(activity.elevationGainMeters)} />
        <OptionalMetric label="Average heart rate" value={activity.averageHeartRate === null ? null : `${Math.round(activity.averageHeartRate)} bpm`} />
        <OptionalMetric label="Max heart rate" value={activity.maxHeartRate === null ? null : `${Math.round(activity.maxHeartRate)} bpm`} />
        <OptionalMetric label="Relative effort" value={activity.relativeEffort === null ? null : Math.round(activity.relativeEffort).toLocaleString("en-AU")} />
        <OptionalMetric label="Calories" value={activity.calories === null ? null : `${Math.round(activity.calories).toLocaleString("en-AU")} kcal`} />
        <OptionalMetric label="Average power" value={activity.averageWatts === null ? null : `${Math.round(activity.averageWatts)} W`} />
        <OptionalMetric label="Weighted power" value={activity.weightedAverageWatts === null ? null : `${Math.round(activity.weightedAverageWatts)} W`} />
        <OptionalMetric label="Average cadence" value={activity.averageCadence === null ? null : Math.round(activity.averageCadence).toLocaleString("en-AU")} />
        <OptionalMetric label="Steps" value={activity.totalSteps === null ? null : Math.round(activity.totalSteps).toLocaleString("en-AU")} />
        <OptionalMetric label="Temperature" value={activity.averageTemperature === null ? null : `${activity.averageTemperature.toFixed(1)}°C`} />
        <OptionalMetric label="Gear" value={activity.gear} />
      </div>

      <div className="drawer-note">
        {activity.averageHeartRate !== null ? <HeartPulse size={16} /> : activity.elevationGainMeters ? <Mountain size={16} /> : <Flame size={16} />}
        <span>Only metrics recorded by Strava are shown. Missing values are never treated as zero.</span>
      </div>
    </main>
  );
}
