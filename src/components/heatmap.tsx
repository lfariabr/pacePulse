import { formatDate } from "@/lib/format";
import type { HeatmapDay } from "@/lib/types";

export function TrainingHeatmap({ days }: { days: HeatmapDay[] }) {
  const activeDays = days.filter((day) => day.activities > 0).length;
  return (
    <div>
      <div className="heatmap-summary"><strong>{activeDays}</strong> active days in this 52-week window</div>
      <div className="heatmap-scroll">
        <div className="heatmap" role="img" aria-label={`${activeDays} active days in the last 52 weeks`}>
          {days.map((day) => (
            <span
              className={`heat-cell level-${day.level}`}
              title={`${formatDate(day.date)} · ${day.activities} activities · ${day.movingMinutes} min`}
              key={day.date}
            />
          ))}
        </div>
      </div>
      <div className="heat-legend"><span>Less</span>{[0, 1, 2, 3, 4].map((level) => <i className={`level-${level}`} key={level} />)}<span>More</span></div>
    </div>
  );
}
