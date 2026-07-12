import type { LucideIcon } from "lucide-react";

export function MetricCard({
  label,
  value,
  note,
  change,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  change?: number | null;
  icon: LucideIcon;
}) {
  return (
    <article className="metric-card">
      <div className="metric-heading"><span>{label}</span><Icon size={17} /></div>
      <strong>{value}</strong>
      <div className="metric-note">
        {change !== undefined && change !== null && (
          <span className={change >= 0 ? "change positive" : "change negative"}>
            {change >= 0 ? "+" : ""}{change.toFixed(0)}%
          </span>
        )}
        <span>{note}</span>
      </div>
    </article>
  );
}
