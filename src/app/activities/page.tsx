import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { ActivityTable } from "@/components/activity-table";
import { exploreActivities } from "@/lib/analytics";
import { getActivityDataset } from "@/lib/csv-source";
import { parseExplorerFilters, type SearchParams } from "@/lib/query";
import { SPORT_GROUPS } from "@/lib/types";

function pageHref(params: SearchParams, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first && key !== "page") query.set(key, first);
  }
  query.set("page", String(page));
  return `/activities?${query.toString()}`;
}

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = parseExplorerFilters(params);
  const dataset = await getActivityDataset();
  const result = exploreActivities(dataset.activities, filters);

  return (
    <main className="page-shell activities-page">
      <section className="page-intro">
        <div><p className="eyebrow">The complete archive</p><h1>Every session.<br /><em>Nothing hidden.</em></h1></div>
        <div className="archive-count"><strong>{result.total.toLocaleString("en-AU")}</strong><span>matching activities</span></div>
      </section>

      <form className="explorer-filters" method="get">
        <label className="search-field"><span className="sr-only">Search activity names</span><Search size={17} /><input type="search" name="q" defaultValue={filters.q} placeholder="Search activity names…" /></label>
        <label><span>Sport group</span><select name="sport" defaultValue={filters.sportGroup ?? ""}><option value="">All sports</option>{SPORT_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label>
        <label><span>Exact type</span><select name="type" defaultValue={filters.activityType ?? ""}><option value="">All types</option>{result.activityTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label><span>Year</span><select name="year" defaultValue={filters.year ?? ""}><option value="">All years</option>{result.availableYears.map((year) => <option key={year}>{year}</option>)}</select></label>
        <label><span>Sort</span><select name="sort" defaultValue={filters.sort}><option value="date">Date</option><option value="distance">Distance</option><option value="duration">Moving time</option><option value="elevation">Elevation</option></select></label>
        <label><span>Order</span><select name="direction" defaultValue={filters.direction}><option value="desc">Descending</option><option value="asc">Ascending</option></select></label>
        <button className="button primary" type="submit"><SlidersHorizontal size={15} /> Apply</button>
      </form>

      <section className="panel explorer-panel">
        <div className="explorer-meta"><span>Page {result.page} of {result.pageCount}</span><span>50 activities per page</span></div>
        {result.activities.length ? <ActivityTable activities={result.activities} /> : <div className="empty large">No activities match these filters.</div>}
        <nav className="pagination" aria-label="Activity pages">
          {result.page > 1 ? <Link href={pageHref(params, result.page - 1)}><ChevronLeft size={16} /> Previous</Link> : <span />}
          <span>{((result.page - 1) * result.pageSize + 1).toLocaleString("en-AU")}–{Math.min(result.page * result.pageSize, result.total).toLocaleString("en-AU")} of {result.total.toLocaleString("en-AU")}</span>
          {result.page < result.pageCount ? <Link href={pageHref(params, result.page + 1)}>Next <ChevronRight size={16} /></Link> : <span />}
        </nav>
      </section>
    </main>
  );
}
