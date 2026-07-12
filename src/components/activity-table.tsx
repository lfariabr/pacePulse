"use client";

import { useEffect, useRef, useState } from "react";
import { Activity as ActivityIcon, Flame, Gauge, HeartPulse, Mountain, Timer, X } from "lucide-react";
import type { Activity } from "@/lib/types";
import { formatDate, formatDistance, formatDuration, formatElevation, formatPaceOrSpeed } from "@/lib/format";

function OptionalMetric({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return <div className="detail-metric"><span>{label}</span><strong>{value}</strong></div>;
}

function ActivityDrawer({ activity, close }: { activity: Activity; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog className="activity-dialog" ref={ref} onCancel={close} onClose={close}>
      <div className="drawer-heading">
        <div><p className="eyebrow">{activity.activityType}</p><h2>{activity.name}</h2><span>{formatDate(activity.dateKey)}</span></div>
        <button className="icon-button" type="button" aria-label="Close activity details" onClick={() => ref.current?.close()}><X /></button>
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
    </dialog>
  );
}

export function ActivityTable({ activities }: { activities: Activity[] }) {
  const [selected, setSelected] = useState<Activity | null>(null);
  return (
    <>
      <div className="activity-table-wrap">
        <table className="activity-table">
          <thead><tr><th>Date</th><th>Activity</th><th>Type</th><th>Distance</th><th>Moving</th><th>Pace / speed</th><th>Elevation</th><th>Avg HR</th><th><span className="sr-only">Details</span></th></tr></thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity.id}>
                <td>{formatDate(activity.dateKey, false)}<small>{activity.year}</small></td>
                <td><strong>{activity.name}</strong></td>
                <td><span className={`type-badge sport-${activity.sportGroup.toLowerCase()}`}>{activity.activityType}</span></td>
                <td>{formatDistance(activity.distanceMeters)}</td>
                <td>{formatDuration(activity.movingSeconds)}</td>
                <td>{formatPaceOrSpeed(activity)}</td>
                <td>{activity.elevationGainMeters === null ? "—" : formatElevation(activity.elevationGainMeters)}</td>
                <td>{activity.averageHeartRate ? `${Math.round(activity.averageHeartRate)} bpm` : "—"}</td>
                <td><button className="row-action" type="button" onClick={() => setSelected(activity)}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="activity-cards">
        {activities.map((activity) => (
          <button className="activity-card" type="button" onClick={() => setSelected(activity)} key={activity.id}>
            <span className={`sport-dot sport-${activity.sportGroup.toLowerCase()}`} />
            <div><strong>{activity.name}</strong><span>{activity.activityType} · {formatDate(activity.dateKey)}</span></div>
            <div><strong>{formatDistance(activity.distanceMeters)}</strong><span>{formatDuration(activity.movingSeconds)}</span></div>
          </button>
        ))}
      </div>
      {selected && <ActivityDrawer activity={selected} close={() => setSelected(null)} />}
    </>
  );
}
