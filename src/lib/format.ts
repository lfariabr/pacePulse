import type { Activity } from "@/lib/types";

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

export function formatCompactDuration(seconds: number) {
  const hours = seconds / 3600;
  return hours >= 100 ? `${Math.round(hours).toLocaleString("en-AU")}h` : `${hours.toFixed(1)}h`;
}

export function formatDistance(meters: number) {
  if (meters === 0) return "—";
  if (meters < 1000) return `${Math.round(meters).toLocaleString("en-AU")} m`;
  const km = meters / 1000;
  return `${km.toLocaleString("en-AU", {
    minimumFractionDigits: km < 100 ? 1 : 0,
    maximumFractionDigits: km < 100 ? 1 : 0,
  })} km`;
}

export function formatElevation(meters: number) {
  return `${Math.round(meters).toLocaleString("en-AU")} m`;
}

export function formatDate(dateKey: string, includeYear = true) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    ...(includeYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(date);
}

function pace(seconds: number) {
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function formatPaceOrSpeed(activity: Activity) {
  if (activity.distanceMeters <= 0 || activity.movingSeconds <= 0) return "—";
  if (activity.sportGroup === "Running") {
    return `${pace(activity.movingSeconds / (activity.distanceMeters / 1000))} /km`;
  }
  if (activity.sportGroup === "Swimming") {
    return `${pace(activity.movingSeconds / (activity.distanceMeters / 100))} /100m`;
  }
  const speed = (activity.distanceMeters / activity.movingSeconds) * 3.6;
  return `${speed.toFixed(1)} km/h`;
}

export function percentageChange(current: number, previous: number | null) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}
