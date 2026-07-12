"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyVolume } from "@/lib/types";

const series = [
  ["runningHours", "Running", "#ff6b35"],
  ["cyclingHours", "Cycling", "#52c2ff"],
  ["swimmingHours", "Swimming", "#5eead4"],
  ["strengthHours", "Strength", "#c084fc"],
  ["mobilityHours", "Mobility", "#fbbf24"],
  ["otherHours", "Other", "#64748b"],
] as const;

type Metric = "hours" | "distance" | "activities";

export function VolumeChart({ data }: { data: MonthlyVolume[] }) {
  const [metric, setMetric] = useState<Metric>("hours");
  return (
    <div>
      <div className="chart-switch" role="group" aria-label="Volume metric">
        {(["hours", "distance", "activities"] as const).map((option) => (
          <button
            type="button"
            className={metric === option ? "active" : ""}
            onClick={() => setMetric(option)}
            key={option}
          >
            {option === "hours" ? "Time" : option === "distance" ? "Distance" : "Sessions"}
          </button>
        ))}
      </div>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 14, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#222c38" vertical={false} />
            <XAxis dataKey="label" stroke="#758193" tickLine={false} axisLine={false} minTickGap={30} fontSize={11} />
            <YAxis stroke="#758193" tickLine={false} axisLine={false} fontSize={11} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,.035)" }}
              contentStyle={{ background: "#101720", border: "1px solid #2a3544", borderRadius: 12, color: "#f4f7fb" }}
              formatter={(value, name) => [
                `${Number(value).toFixed(metric === "activities" ? 0 : 1)}${metric === "hours" ? " h" : metric === "distance" ? " km" : ""}`,
                String(name),
              ]}
            />
            {metric === "hours" ? series.map(([key, name, color]) => (
              <Bar dataKey={key} name={name} stackId="volume" fill={color} radius={key === "otherHours" ? [3, 3, 0, 0] : 0} key={key} />
            )) : (
              <Bar
                dataKey={metric === "distance" ? "distanceKm" : "activityCount"}
                name={metric === "distance" ? "Distance" : "Sessions"}
                fill="#ff6b35"
                radius={[4, 4, 0, 0]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
