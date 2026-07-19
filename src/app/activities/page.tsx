import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ActivityTable } from "@/components/activity-table";
import { ExplorerFiltersForm } from "@/components/explorer-filters";
import { exploreActivities } from "@/lib/analytics";
import { getActivityDataset } from "@/lib/csv-source";
import { parseExplorerFilters, type SearchParams } from "@/lib/query";
import { SPORT_GROUPS, type SportGroup } from "@/lib/types";

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

  const typesByGroup = new Map<SportGroup, Set<string>>();
  for (const activity of dataset.activities) {
    const types = typesByGroup.get(activity.sportGroup) ?? new Set<string>();
    types.add(activity.activityType);
    typesByGroup.set(activity.sportGroup, types);
  }
  const typesBySport: Partial<Record<SportGroup | "", string[]>> = { "": result.activityTypes };
  for (const group of SPORT_GROUPS) {
    typesBySport[group] = [...(typesByGroup.get(group) ?? [])].sort();
  }

  return (
    <main className="page-shell activities-page">
      <section className="page-intro">
        <div><p className="eyebrow">The complete archive</p><h1>Every session.<br /><em>Nothing hidden.</em></h1></div>
        <div className="archive-count"><strong>{result.total.toLocaleString("en-AU")}</strong><span>matching activities</span></div>
      </section>

      <ExplorerFiltersForm filters={filters} years={result.availableYears} typesBySport={typesBySport} />

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
