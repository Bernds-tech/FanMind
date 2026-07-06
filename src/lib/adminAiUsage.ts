import { getSupabaseHeaders, getSupabaseRestUrl } from "@/lib/supabase/config";

export type AdminAiUsageEvent = {
  id: string;
  workspace_id: string;
  feature: string;
  model: string;
  input_chars: number;
  output_chars: number;
  estimated_input_tokens: number;
  estimated_output_tokens: number;
  estimated_total_tokens: number;
  estimated_cost_cents: number;
  currency: string;
  status: string;
  error_code: string | null;
  latency_ms: number | null;
  source_route: string | null;
  created_at: string;
};

type WorkspaceRow = { id: string; name: string | null; plan_id: string | null; commercial_option: string | null };

export type AdminAiUsageSummary = {
  totalRequests: number;
  totalEstimatedCostCents: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  errorRequests: number;
  currency: string;
  byWorkspace: Array<{ workspaceId: string; workspaceName: string; requests: number; estimatedCostCents: number; inputTokens: number; outputTokens: number }>;
  byFeature: Array<{ feature: string; requests: number; estimatedCostCents: number; errorRequests: number }>;
  recentEvents: AdminAiUsageEvent[];
};

const COLUMNS = "id,workspace_id,feature,model,input_chars,output_chars,estimated_input_tokens,estimated_output_tokens,estimated_total_tokens,estimated_cost_cents,currency,status,error_code,latency_ms,source_route,created_at";

function serviceKey() { return process.env.SUPABASE_SERVICE_ROLE_KEY; }

export async function getAdminAiUsageSummary(days = 30): Promise<{ summary: AdminAiUsageSummary | null; error: string | null }> {
  const key = serviceKey();
  if (!key) return { summary: null, error: "Supabase Service Role ist nicht konfiguriert." };
  const since = new Date(Date.now() - Math.max(1, Math.min(days, 365)) * 24 * 60 * 60 * 1000).toISOString();
  try {
    const usageUrl = new URL(getSupabaseRestUrl("ai_usage_events"));
    usageUrl.searchParams.set("select", COLUMNS);
    usageUrl.searchParams.set("created_at", `gte.${since}`);
    usageUrl.searchParams.set("order", "created_at.desc");
    usageUrl.searchParams.set("limit", "1000");
    const usageResponse = await fetch(usageUrl, { headers: getSupabaseHeaders(key), cache: "no-store" });
    if (!usageResponse.ok) return { summary: null, error: `KI-Verbrauch konnte nicht geladen werden (${usageResponse.status}). Migration evtl. noch nicht live.` };
    const events = await usageResponse.json() as AdminAiUsageEvent[];
    const workspaceIds = [...new Set(events.map((event) => event.workspace_id))];
    const workspaces = new Map<string, WorkspaceRow>();
    if (workspaceIds.length) {
      const workspaceUrl = new URL(getSupabaseRestUrl("workspaces"));
      workspaceUrl.searchParams.set("select", "id,name,plan_id,commercial_option");
      workspaceUrl.searchParams.set("id", `in.(${workspaceIds.join(",")})`);
      const workspaceResponse = await fetch(workspaceUrl, { headers: getSupabaseHeaders(key), cache: "no-store" });
      if (workspaceResponse.ok) {
        for (const workspace of await workspaceResponse.json() as WorkspaceRow[]) workspaces.set(workspace.id, workspace);
      }
    }

    const byWorkspace = new Map<string, { workspaceId: string; workspaceName: string; requests: number; estimatedCostCents: number; inputTokens: number; outputTokens: number }>();
    const byFeature = new Map<string, { feature: string; requests: number; estimatedCostCents: number; errorRequests: number }>();
    for (const event of events) {
      const cost = Number(event.estimated_cost_cents ?? 0);
      const workspace = byWorkspace.get(event.workspace_id) ?? { workspaceId: event.workspace_id, workspaceName: workspaces.get(event.workspace_id)?.name ?? event.workspace_id, requests: 0, estimatedCostCents: 0, inputTokens: 0, outputTokens: 0 };
      workspace.requests += 1; workspace.estimatedCostCents += cost; workspace.inputTokens += event.estimated_input_tokens; workspace.outputTokens += event.estimated_output_tokens; byWorkspace.set(event.workspace_id, workspace);
      const feature = byFeature.get(event.feature) ?? { feature: event.feature, requests: 0, estimatedCostCents: 0, errorRequests: 0 };
      feature.requests += 1; feature.estimatedCostCents += cost; if (event.status === "error") feature.errorRequests += 1; byFeature.set(event.feature, feature);
    }

    return { summary: { totalRequests: events.length, totalEstimatedCostCents: events.reduce((sum, event) => sum + Number(event.estimated_cost_cents ?? 0), 0), totalInputTokens: events.reduce((sum, event) => sum + event.estimated_input_tokens, 0), totalOutputTokens: events.reduce((sum, event) => sum + event.estimated_output_tokens, 0), errorRequests: events.filter((event) => event.status === "error").length, currency: events[0]?.currency ?? "USD", byWorkspace: [...byWorkspace.values()].sort((a, b) => b.estimatedCostCents - a.estimatedCostCents), byFeature: [...byFeature.values()].sort((a, b) => b.estimatedCostCents - a.estimatedCostCents), recentEvents: events.slice(0, 25) }, error: null };
  } catch (error) { return { summary: null, error: error instanceof Error ? error.message : "Unbekannter Fehler" }; }
}
