import type { Tables } from "@/integrations/supabase/types";
import { computeCsat, computeNps } from "./metrics";

export type DashboardFilters = { period: "7" | "30" | "90" | "all"; responsible: string; service: string };
export function filterResponses(responses: Tables<"responses">[], filters: DashboardFilters, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (filters.period !== "all") start.setDate(start.getDate() - Number(filters.period) + 1);
  return responses.filter((r) => (filters.period === "all" || new Date(r.created_at) >= start)
    && (filters.responsible === "all" || r.responsible === filters.responsible)
    && (filters.service === "all" || r.service_type === filters.service));
}
export function aggregateResponses(responses: Tables<"responses">[], surveys: Tables<"surveys">[]) {
  const nps = computeNps(responses.filter((r) => r.survey_type === "nps").map((r) => r.score));
  let satisfied = 0, total = 0;
  for (const s of surveys.filter((s) => s.type === "csat")) {
    const result = computeCsat(responses.filter((r) => r.survey_id === s.id && r.survey_type === "csat").map((r) => r.score), s.csat_scale, s.csat_threshold);
    satisfied += result.satisfied; total += result.total;
  }
  return { nps, csat: total ? Math.round(satisfied / total * 1000) / 10 : null, csatTotal: total };
}