"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";
import { SPORT_GROUPS } from "@/lib/types";
import type { ExplorerFilters, SportGroup } from "@/lib/types";

export function ExplorerFiltersForm({
  filters,
  years,
  typesBySport,
}: {
  filters: ExplorerFilters;
  years: number[];
  typesBySport: Partial<Record<SportGroup | "", string[]>>;
}) {
  const [sportGroup, setSportGroup] = useState<SportGroup | "">(filters.sportGroup ?? "");
  const availableTypes = useMemo(() => typesBySport[sportGroup] ?? [], [typesBySport, sportGroup]);
  const initialType = filters.activityType && availableTypes.includes(filters.activityType) ? filters.activityType : "";

  return (
    <form className="explorer-filters" method="get">
      <label className="search-field">
        <span className="sr-only">Search activity names</span>
        <Search size={17} />
        <input type="search" name="q" defaultValue={filters.q} placeholder="Search activity names…" />
      </label>
      <label>
        <span>Sport group</span>
        <select
          name="sport"
          value={sportGroup}
          onChange={(event) => setSportGroup(event.target.value as SportGroup | "")}
        >
          <option value="">All sports</option>
          {SPORT_GROUPS.map((group) => <option value={group} key={group}>{group}</option>)}
        </select>
      </label>
      <label>
        <span>Exact type</span>
        <select name="type" defaultValue={initialType} key={sportGroup}>
          <option value="">All types</option>
          {availableTypes.map((type) => <option value={type} key={type}>{type}</option>)}
        </select>
      </label>
      <label>
        <span>Year</span>
        <select name="year" defaultValue={filters.year ?? ""}>
          <option value="">All years</option>
          {years.map((year) => <option value={year} key={year}>{year}</option>)}
        </select>
      </label>
      <label>
        <span>Sort</span>
        <select name="sort" defaultValue={filters.sort}>
          <option value="date">Date</option>
          <option value="distance">Distance</option>
          <option value="duration">Moving time</option>
          <option value="elevation">Elevation</option>
        </select>
      </label>
      <label>
        <span>Order</span>
        <select name="direction" defaultValue={filters.direction}>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </label>
      <button className="button primary" type="submit"><SlidersHorizontal size={15} /> Apply</button>
      <Link className="button" href="/activities"><RotateCcw size={15} /> Reset</Link>
    </form>
  );
}
