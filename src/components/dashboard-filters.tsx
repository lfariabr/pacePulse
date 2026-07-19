"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { SPORT_GROUPS } from "@/lib/types";
import type { DashboardFilters } from "@/lib/types";

export function DashboardFiltersForm({
  filters,
  years,
  datasetStart,
  datasetEnd,
}: {
  filters: DashboardFilters;
  years: number[];
  datasetStart: string;
  datasetEnd: string;
}) {
  const [range, setRange] = useState(filters.range);

  return (
    <form className="filter-bar" method="get">
      <span className="filter-title"><SlidersHorizontal size={15} /> View</span>
      <label>
        <span>Period</span>
        <select name="range" value={range} onChange={(event) => setRange(event.target.value as DashboardFilters["range"])}>
          <option value="all">All time</option>
          <option value="12m">Trailing 12 months</option>
          <option value="ytd">Year to date</option>
          <option value="year">Calendar year</option>
          <option value="custom">Custom dates</option>
        </select>
      </label>
      {range === "year" && (
        <label>
          <span>Year</span>
          <select name="year" defaultValue={filters.year ?? datasetEnd.slice(0, 4)}>
            {years.map((year) => <option value={year} key={year}>{year}</option>)}
          </select>
        </label>
      )}
      <label>
        <span>Sport</span>
        <select name="sport" defaultValue={filters.sportGroup ?? ""}>
          <option value="">All sports</option>
          {SPORT_GROUPS.map((group) => <option value={group} key={group}>{group}</option>)}
        </select>
      </label>
      {range === "custom" && (
        <>
          <label>
            <span>From</span>
            <input type="date" name="from" min={datasetStart} max={datasetEnd} defaultValue={filters.from ?? datasetStart} />
          </label>
          <label>
            <span>To</span>
            <input type="date" name="to" min={datasetStart} max={datasetEnd} defaultValue={filters.to ?? datasetEnd} />
          </label>
        </>
      )}
      <button className="button primary" type="submit">Apply</button>
      <Link className="button" href="/"><RotateCcw size={15} /> Reset</Link>
    </form>
  );
}
