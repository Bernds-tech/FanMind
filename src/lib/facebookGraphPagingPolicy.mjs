import { META_GRAPH_API_VERSION } from "./metaIntegrationPolicy.mjs";

export function validateFacebookGraphPagingUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.host !== "graph.facebook.com" ||
      url.username ||
      url.password ||
      !url.pathname.startsWith(`/${META_GRAPH_API_VERSION}/`)
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}
