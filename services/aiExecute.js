/**
 * OpenAI Chat Completions when configured; deterministic mock when keys are missing
 * (set CCWEB_REQUIRE_OPENAI=1 to fail instead of mock in production).
 */

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function requireOpenAI() {
  return process.env.CCWEB_REQUIRE_OPENAI === "1" || process.env.CCWEB_REQUIRE_OPENAI === "true";
}

function getApiKey() {
  return (process.env.OPENAI_API_KEY || process.env.CCWEB_OPENAI_API_KEY || "").trim();
}

function mockChatResult(systemPrompt, userPayload) {
  const inputPreview =
    typeof userPayload === "string"
      ? userPayload.slice(0, 500)
      : JSON.stringify(userPayload, null, 2).slice(0, 1200);
  const text = [
    "[CCWEB mock AI — set OPENAI_API_KEY or CCWEB_OPENAI_API_KEY for live OpenAI output]",
    "",
    "This response is deterministic and safe for staging when API keys are unavailable.",
    `Stub summary for agent/workflow input (${inputPreview.length} chars).`,
  ].join("\n");
  return {
    text,
    model: "mock",
    usage: null,
    provider: "mock",
    mock: true,
    rawId: null,
  };
}

async function chatComplete(systemPrompt, userPayload, opts = {}) {
  const key = getApiKey();
  if (!key) {
    if (requireOpenAI()) {
      const err = new Error("OPENAI_API_KEY is not configured.");
      err.code = "AI_NOT_CONFIGURED";
      err.status = 503;
      throw err;
    }
    return mockChatResult(systemPrompt, userPayload);
  }

  const model = opts.model || DEFAULT_MODEL;
  const body = {
    model,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 1200,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          typeof userPayload === "string" ? userPayload : JSON.stringify(userPayload, null, 2),
      },
    ],
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.error?.message || res.statusText || "OpenAI request failed";
    const err = new Error(msg);
    err.status = res.status >= 400 && res.status < 500 ? res.status : 502;
    throw err;
  }

  const text = data.choices?.[0]?.message?.content?.trim() || "";
  return {
    text,
    model,
    usage: data.usage || null,
    provider: "openai",
    rawId: data.id,
  };
}

async function runAgent(agentMeta, input) {
  const system = [
    "You are an automation agent executed inside the CCWEB developer API.",
    "Respond with concise, actionable output. If tools are needed, describe steps clearly.",
    `Agent: ${agentMeta?.name || "unnamed"}`,
    agentMeta?.description ? `Description: ${agentMeta.description}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return chatComplete(system, { input: input || {}, agentId: agentMeta?.id });
}

async function runWorkflowSteps(steps, input) {
  const system =
    "You are executing a CCWEB workflow. Given steps (JSON) and input, produce the logical outcome summary and any structured result as JSON in your reply (include a JSON block if applicable).";
  return chatComplete(system, { steps, input: input || {} }, { maxTokens: 2000 });
}

module.exports = { chatComplete, runAgent, runWorkflowSteps, getApiKey, mockChatResult };
