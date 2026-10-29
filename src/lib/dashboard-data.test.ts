import { describe, expect, it } from "vitest";
import type { Tables } from "@/integrations/supabase/types";
import { aggregateResponses, filterResponses } from "./dashboard-data";
import { canManageSurveys, newSurvey, surveySchema } from "./survey-schema";

const response = (value: Partial<Tables<"responses">>): Tables<"responses"> => ({
  id: "r", org_id: "o", survey_id: "s", survey_type: "csat", score: 4, created_at: "2026-10-28T12:00:00Z",
  bitrix_entity_id: null, bitrix_entity_type: null, bitrix_synced: false, channel: "link", comment: null,
  contact_email: null, contact_name: null, is_negative: false, responsible: null, service_type: null, ...value,
});
const survey = (value: Partial<Tables<"surveys">>): Tables<"surveys"> => ({
  ...newSurvey, id: "s", type: "csat", org_id: "o", public_token: "token", status: "active", service_type: null,
  created_at: "2026-10-01", updated_at: "2026-10-01", created_by: null, ...value,
});
describe("Dashboard aggregation", () => {
  it("weights CSAT using valid counts and each survey's configured threshold", () => {
    const rows = [response({ score: 5 }), response({ score: 4 }), response({ score: 2 }), response({ survey_id: "second", score: 9 }), response({ survey_id: "second", score: 8 })];
    expect(aggregateResponses(rows, [survey({}), survey({ id: "second", csat_scale: 10, csat_threshold: 9 })]).csat).toBe(60);
  });
  it("returns no score for absent responses", () => {
    const result = aggregateResponses([], []);
    expect(result.csat).toBeNull(); expect(result.nps.nps).toBeNull();
  });
  it("applies period, responsible and service filters together", () => {
    const rows = [response({ id: "match", responsible: "Ana", service_type: "Suporte" }), response({ id: "old", responsible: "Ana", service_type: "Suporte", created_at: "2026-10-01T12:00:00Z" }), response({ id: "other", responsible: "Bruno", service_type: "Suporte" })];
    expect(filterResponses(rows, { period: "7", responsible: "Ana", service: "Suporte" }, new Date("2026-10-28T12:00:00Z")).map((r) => r.id)).toEqual(["match"]);
  });
});
describe("Survey validation and permissions", () => {
  it("permits managers and administrators but not agents to manage surveys", () => {
    expect(canManageSurveys("admin")).toBe(true); expect(canManageSurveys("manager")).toBe(true); expect(canManageSurveys("agent")).toBe(false);
  });
  it("rejects a satisfaction threshold outside the configured scale", () => {
    expect(surveySchema.safeParse({ ...newSurvey, name: "CSAT", type: "csat", csat_scale: 5, csat_threshold: 6 }).success).toBe(false);
  });
});