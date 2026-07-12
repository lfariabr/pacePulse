import { z } from "zod";
import { SPORT_GROUPS } from "@/lib/types";
import type { DashboardFilters, ExplorerFilters } from "@/lib/types";

export type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const dashboardSchema = z.object({
  range: z.enum(["all", "12m", "ytd", "year", "custom"]).catch("all"),
  year: z.coerce.number().int().optional().catch(undefined),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().catch(undefined),
  sportGroup: z.enum(SPORT_GROUPS).optional().catch(undefined),
});

export function parseDashboardFilters(params: SearchParams): DashboardFilters {
  return dashboardSchema.parse({
    range: first(params.range) ?? "all",
    year: first(params.year) || undefined,
    from: first(params.from) || undefined,
    to: first(params.to) || undefined,
    sportGroup: first(params.sport) || undefined,
  });
}

const explorerSchema = z.object({
  q: z.string().max(120).optional().catch(undefined),
  sportGroup: z.enum(SPORT_GROUPS).optional().catch(undefined),
  activityType: z.string().max(80).optional().catch(undefined),
  year: z.coerce.number().int().optional().catch(undefined),
  sort: z.enum(["date", "distance", "duration", "elevation"]).catch("date"),
  direction: z.enum(["asc", "desc"]).catch("desc"),
  page: z.coerce.number().int().positive().catch(1),
});

export function parseExplorerFilters(params: SearchParams): ExplorerFilters {
  const parsed = explorerSchema.parse({
    q: first(params.q) || undefined,
    sportGroup: first(params.sport) || undefined,
    activityType: first(params.type) || undefined,
    year: first(params.year) || undefined,
    sort: first(params.sort) ?? "date",
    direction: first(params.direction) ?? "desc",
    page: first(params.page) ?? "1",
  });
  return { ...parsed, pageSize: 50 };
}
