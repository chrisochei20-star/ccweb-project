/**
 * Developer Public API auth headers (Express reads ccweb-api-key).
 */
export function developerApiKeyHeaders(apiKey) {
  const key = String(apiKey || "").trim();
  if (!key) return {};
  return { "CCWEB-API-Key": key };
}
