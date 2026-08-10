export function OptionalMetric({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return <div className="detail-metric"><span>{label}</span><strong>{value}</strong></div>;
}
