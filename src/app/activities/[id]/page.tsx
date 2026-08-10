import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity as ActivityIcon, ArrowLeft, Flame, Gauge, HeartPulse, Mountain, Timer } from "lucide-react";
import { OptionalMetric } from "@/components/optional-metric";
import { getActivityById } from "@/lib/csv-source";
import { activityDetailMetrics, formatDate, formatDistance, formatDuration, formatPaceOrSpeed } from "@/lib/format";

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
        {activityDetailMetrics(activity).map((metric) => (
          <OptionalMetric label={metric.label} value={metric.value} key={metric.label} />
        ))}
      </div>

      <div className="drawer-note">
        {activity.averageHeartRate !== null ? <HeartPulse size={16} /> : activity.elevationGainMeters ? <Mountain size={16} /> : <Flame size={16} />}
        <span>Only metrics recorded by Strava are shown. Missing values are never treated as zero.</span>
      </div>
    </main>
  );
}
