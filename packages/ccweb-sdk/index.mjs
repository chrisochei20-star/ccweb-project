/**
 * @example
 * import { createClient, createAgentHelpers } from "@ccweb/sdk";
 * const ccweb = createClient({ apiKey: process.env.CCWEB_API_KEY, baseUrl: "http://127.0.0.1:3000" });
 * const sessions = await ccweb.sessions.list();
 */
export function createClient({ apiKey, baseUrl = "http://127.0.0.1:3000" }) {
  if (!apiKey) throw new Error("apiKey is required");

  async function request(method, path, body) {
    const url = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
    const headers = {
      "Content-Type": "application/json",
      CCWEB_API_KEY: apiKey,
    };
    const res = await fetch(url, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      const err = new Error(data?.error || res.statusText);
      err.status = res.status;
      err.body = data;
      throw err;
    }
    return data;
  }

  return {
    get: (p) => request("GET", p),
    post: (p, body) => request("POST", p, body),
    delete: (p) => request("DELETE", p),
    patch: (p, body) => request("PATCH", p, body),
    sessions: {
      list: () => request("GET", "/v1/sessions"),
      create: (body) => request("POST", "/v1/sessions", body),
      get: (id) => request("GET", `/v1/sessions/${encodeURIComponent(id)}`),
      join: (id, body) => request("POST", `/v1/sessions/${encodeURIComponent(id)}/join`, body || {}),
      stream: (id, body) => request("POST", `/v1/sessions/${encodeURIComponent(id)}/stream`, body || {}),
      finish: (id, body) => request("POST", `/v1/sessions/${encodeURIComponent(id)}/finish`, body || {}),
    },
    revenue: { summary: () => request("GET", "/v1/revenue") },
    analytics: () => request("GET", "/v1/analytics"),
    agents: {
      list: () => request("GET", "/v1/agents"),
      register: (body) => request("POST", "/v1/agents", body),
      execute: (id, body) => request("POST", `/v1/agents/${encodeURIComponent(id)}/execute`, body || {}),
    },
    workflows: {
      list: () => request("GET", "/v1/workflows"),
      create: (body) => request("POST", "/v1/workflows", body),
      run: (id, body) => request("POST", `/v1/workflows/${encodeURIComponent(id)}/run`, body || {}),
    },
    dapp: {
      templates: () => request("GET", "/v1/dapp/templates"),
      deploy: (body) => request("POST", "/v1/dapp/deploy", body),
    },
    graphql: (query, variables) => request("POST", "/v1/graphql", { query, variables }),
  };
}

/** Opinionated helpers for agent automation flows */
export function createAgentHelpers(client) {
  return {
    async registerAndRun(definition, input) {
      const { id } = await client.agents.register(definition);
      return client.agents.execute(id, input);
    },
  };
}
