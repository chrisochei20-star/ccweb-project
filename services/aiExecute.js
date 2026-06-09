/**
 * OpenAI Chat Completions when configured; deterministic mock when keys are missing
 * (set CCWEB_REQUIRE_OPENAI=1 to fail instead of mock in production).
 */

const { logger } = require("../logging/logger");

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = Number(process.env.CCWEB_OPENAI_TIMEOUT_MS) || 60_000;
const MAX_RETRIES = Number(process.env.CCWEB_OPENAI_MAX_RETRIES) || 2;
const MAX_TOKENS_CAP = Number(process.env.CCWEB_OPENAI_MAX_TOKENS_CAP) || 4096;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function requireOpenAI() {
  return process.env.CCWEB_REQUIRE_OPENAI === "1" || process.env.CCWEB_REQUIRE_OPENAI === "true";
}

function getApiKey() {
  return (process.env.OPENAI_API_KEY || process.env.CCWEB_OPENAI_API_KEY || "").trim();
}

function clampMaxTokens(n, fallback) {
  const v = Number.isFinite(n) ? n : fallback;
  return Math.min(Math.max(1, v), MAX_TOKENS_CAP);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mergeAbortSignals(parent, child) {
  if (!parent) return child;
  if (!child) return parent;
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function") {
    return AbortSignal.any([parent, child]);
  }
  parent.addEventListener("abort", () => child.abort(), { once: true });
  return child;
}

function isRetryableOpenAIStatus(status) {
  return status === 429 || status === 502 || status === 503 || status === 504;
}

/** Billing/quota 429s must not retry — only transient rate limits. */
function isOpenAIQuotaOrBillingError(err) {
  const msg = String(err?.message || "").toLowerCase();
  const status = err?.openaiStatus ?? err?.status;
  if (status === 402) return true;
  if (/insufficient_quota|exceeded your current quota|billing details|payment required|account deactivated/.test(msg)) {
    return true;
  }
  return status === 429 && /quota|billing|exceeded/.test(msg);
}

function shouldRetryOpenAIError(status, message) {
  if (isOpenAIQuotaOrBillingError({ status, openaiStatus: status, message })) return false;
  return isRetryableOpenAIStatus(status);
}

function mockChatResultForQuotaFallback(userPayload) {
  const preview =
    typeof userPayload === "string"
      ? userPayload.slice(0, 280)
      : JSON.stringify(userPayload, null, 2).slice(0, 280);
  const text = [
    "Live AI is temporarily unavailable because the OpenAI account has hit its billing or usage limit.",
    "You are seeing a local assistant response so the app keeps working.",
    "",
    `Your question: ${preview || "(empty)"}`,
    "",
    "Restore OpenAI billing to get live ChatGPT-style answers again.",
  ].join("\n");
  return {
    text,
    model: "mock",
    usage: null,
    provider: "mock",
    mock: true,
    degradedReason: "openai_quota",
    rawId: null,
  };
}

function openAIMockFallbackFromError(err, userPayload) {
  if (requireOpenAI()) throw err;
  if (!getApiKey()) throw err;
  if (!isOpenAIQuotaOrBillingError(err)) throw err;
  logAiWarn("openai_quota_fallback_mock", { message: String(err?.message || err) });
  return mockChatResultForQuotaFallback(userPayload);
}

/** Stream path: degrade to the same mock copy as /tutor/chat for quota, abort, or timeout. */
function isStreamDegradableError(err) {
  if (!err) return false;
  if (isOpenAIQuotaOrBillingError(err)) return true;
  const code = err?.code;
  return code === "AI_ABORTED" || code === "AI_TIMEOUT";
}

function degradedStreamFallback(err, userPayload) {
  if (isOpenAIQuotaOrBillingError(err)) {
    try {
      return openAIMockFallbackFromError(err, userPayload);
    } catch {
      return mockChatResultForQuotaFallback(userPayload);
    }
  }
  if (err?.code === "AI_ABORTED" || err?.code === "AI_TIMEOUT") {
    logAiWarn("tutor_stream_degraded_fallback", { code: err.code, message: String(err?.message || err) });
    return mockChatResultForQuotaFallback(userPayload);
  }
  throw err;
}

function logAiDiag(event, fields = {}) {
  logger.info({ msg: event, subsystem: "ai", ...fields });
}

function logAiWarn(event, fields = {}) {
  logger.warn({ msg: event, subsystem: "ai", ...fields });
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

/**
 * Shared OpenAI fetch with timeout, retry on transient errors, and abort propagation.
 */
async function fetchOpenAI(body, opts = {}) {
  const key = getApiKey();
  if (!key) {
    const err = new Error("OPENAI_API_KEY is not configured.");
    err.code = "AI_NOT_CONFIGURED";
    err.status = 503;
    throw err;
  }

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = Number.isFinite(opts.maxRetries) ? opts.maxRetries : MAX_RETRIES;
  const operation = opts.operation || "chat";
  const model = body.model || DEFAULT_MODEL;
  let lastErr;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const timeoutCtrl = new AbortController();
    const timeoutId = setTimeout(() => timeoutCtrl.abort(), timeoutMs);
    const signal = mergeAbortSignals(opts.signal, timeoutCtrl.signal);

    const started = Date.now();
    try {
      const res = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal,
      });

      const durationMs = Date.now() - started;

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        let parsed = {};
        try {
          parsed = JSON.parse(errText);
        } catch {
          /* ignore */
        }
        const msg = parsed.error?.message || errText.slice(0, 400) || res.statusText || "OpenAI request failed";
        const err = new Error(msg);
        err.status = res.status >= 400 && res.status < 500 ? res.status : 502;
        err.openaiStatus = res.status;

        logAiWarn("openai_request_failed", {
          operation,
          model,
          status: res.status,
          durationMs,
          attempt: attempt + 1,
        });

        if (attempt < maxRetries && shouldRetryOpenAIError(res.status, msg)) {
          await sleep(400 * (attempt + 1));
          continue;
        }
        throw err;
      }

      logAiDiag("openai_request_ok", {
        operation,
        model,
        durationMs,
        attempt: attempt + 1,
        stream: Boolean(body.stream),
      });
      return res;
    } catch (e) {
      lastErr = e;
      const durationMs = Date.now() - started;
      const aborted = e?.name === "AbortError" || signal?.aborted;

      if (aborted) {
        logAiWarn("openai_request_aborted", { operation, model, durationMs, attempt: attempt + 1 });
        const err = new Error(opts.signal?.aborted ? "OpenAI request cancelled." : "OpenAI request timed out.");
        err.code = opts.signal?.aborted ? "AI_ABORTED" : "AI_TIMEOUT";
        err.status = 504;
        throw err;
      }

      logAiWarn("openai_request_error", {
        operation,
        model,
        durationMs,
        attempt: attempt + 1,
        message: String(e?.message || e),
      });

      if (attempt < maxRetries) {
        await sleep(400 * (attempt + 1));
        continue;
      }
      throw e;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastErr || new Error("OpenAI request failed.");
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
    max_tokens: clampMaxTokens(opts.maxTokens, 1200),
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          typeof userPayload === "string" ? userPayload : JSON.stringify(userPayload, null, 2),
      },
    ],
  };

  try {
    const res = await fetchOpenAI(body, { ...opts, operation: "chat_complete" });
    const data = await res.json().catch(() => ({}));
    const text = data.choices?.[0]?.message?.content?.trim() || "";
    return {
      text,
      model,
      usage: data.usage || null,
      provider: "openai",
      mock: false,
      rawId: data.id,
    };
  } catch (e) {
    return openAIMockFallbackFromError(e, userPayload);
  }
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

/**
 * Stream plain-text deltas from OpenAI Chat Completions (streaming).
 * Yields string chunks; yields full mock text in small slices when no API key.
 */
async function* streamChatComplete(systemPrompt, userMessage, opts = {}) {
  const key = getApiKey();
  const model = opts.model || DEFAULT_MODEL;
  const userContent =
    typeof userMessage === "string" ? userMessage : JSON.stringify(userMessage, null, 2);

  if (!key) {
    if (requireOpenAI()) {
      throw Object.assign(new Error("OPENAI_API_KEY is not configured."), {
        code: "AI_NOT_CONFIGURED",
        status: 503,
      });
    }
    const mock = mockChatResult(systemPrompt, userMessage);
    const parts = mock.text.split(/(\s+)/);
    for (const p of parts) {
      if (opts.signal?.aborted) return;
      if (p) yield p;
    }
    return;
  }

  try {
    const res = await fetchOpenAI(
      {
        model,
        temperature: opts.temperature ?? 0.35,
        max_tokens: clampMaxTokens(opts.maxTokens, 1800),
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      },
      { ...opts, operation: "stream_chat" }
    );

    if (!res.body) {
      throw Object.assign(new Error("OpenAI stream body missing."), { status: 502 });
    }

    yield* readOpenAIStream(res.body, opts.signal);
  } catch (e) {
    const mock = degradedStreamFallback(e, userContent);
    if (opts.meta) {
      opts.meta.mock = true;
      opts.meta.degradedReason = mock.degradedReason || null;
    }
    const parts = mock.text.split(/(\s+)/);
    for (const p of parts) {
      if (p) yield p;
    }
  }
}

function normalizeChatMessages(messages) {
  const out = [];
  for (const m of messages || []) {
    const role = m.role === "assistant" || m.role === "system" ? m.role : "user";
    const content = String(m.content ?? "").slice(0, 200000);
    if (!content && role !== "system") continue;
    out.push({ role, content });
  }
  return out;
}

async function chatCompleteMessages(messages, opts = {}) {
  const key = getApiKey();
  const model = opts.model || DEFAULT_MODEL;
  const msgs = normalizeChatMessages(messages);
  if (!msgs.length) {
    const err = new Error("No messages.");
    err.status = 400;
    throw err;
  }

  if (!key) {
    if (requireOpenAI()) {
      throw Object.assign(new Error("OPENAI_API_KEY is not configured."), {
        code: "AI_NOT_CONFIGURED",
        status: 503,
      });
    }
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    const mock = mockChatResult("", lastUser?.content || "");
    return {
      text: mock.text,
      model: "mock",
      usage: null,
      provider: "mock",
      mock: true,
      rawId: null,
    };
  }

  const lastUser = [...msgs].reverse().find((m) => m.role === "user");
  const userPayload = lastUser?.content || "";

  try {
    const res = await fetchOpenAI(
      {
        model,
        temperature: opts.temperature ?? 0.35,
        max_tokens: clampMaxTokens(opts.maxTokens, 2200),
        messages: msgs,
      },
      { ...opts, operation: "chat_messages" }
    );

    const data = await res.json().catch(() => ({}));
    const text = data.choices?.[0]?.message?.content?.trim() || "";
    return {
      text,
      model,
      usage: data.usage || null,
      provider: "openai",
      mock: false,
      rawId: data.id,
    };
  } catch (e) {
    return openAIMockFallbackFromError(e, userPayload);
  }
}

async function* readOpenAIStream(body, signal) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  try {
    for (;;) {
      if (signal?.aborted) {
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        return;
      }
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() || "";
      for (const line of lines) {
        const s = line.replace(/^data:\s*/, "").trim();
        if (!s || s === "[DONE]") continue;
        try {
          const j = JSON.parse(s);
          const delta = j.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          /* ignore partial JSON lines */
        }
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      /* ignore */
    }
  }
}

async function* streamChatCompleteMessages(messages, opts = {}) {
  const key = getApiKey();
  const model = opts.model || DEFAULT_MODEL;
  const msgs = normalizeChatMessages(messages);

  if (!key) {
    if (requireOpenAI()) {
      throw Object.assign(new Error("OPENAI_API_KEY is not configured."), {
        code: "AI_NOT_CONFIGURED",
        status: 503,
      });
    }
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    const mock = mockChatResult("", lastUser?.content || "");
    const parts = mock.text.split(/(\s+)/);
    for (const p of parts) {
      if (opts.signal?.aborted) return;
      if (p) yield p;
    }
    return;
  }

  const lastUser = [...msgs].reverse().find((m) => m.role === "user");
  const userPayload = lastUser?.content || "";

  try {
    const res = await fetchOpenAI(
      {
        model,
        temperature: opts.temperature ?? 0.35,
        max_tokens: clampMaxTokens(opts.maxTokens, 2200),
        stream: true,
        messages: msgs,
      },
      { ...opts, operation: "stream_messages" }
    );

    if (!res.body) {
      throw Object.assign(new Error("OpenAI stream body missing."), { status: 502 });
    }

    yield* readOpenAIStream(res.body, opts.signal);
  } catch (e) {
    const mock = degradedStreamFallback(e, userPayload);
    if (opts.meta) {
      opts.meta.mock = true;
      opts.meta.degradedReason = mock.degradedReason || null;
    }
    const parts = mock.text.split(/(\s+)/);
    for (const p of parts) {
      if (p) yield p;
    }
  }
}

/**
 * Extract 0–4 durable learner facts from one exchange (second OpenAI call).
 */
async function extractLearnerFactsFromExchange(userMessage, assistantReply, opts = {}) {
  const key = getApiKey();
  if (!key) return [];

  const system = [
    "You extract durable learner preferences/facts from one chat turn.",
    'Reply with JSON only: {"facts":["..."]} — max 4 short facts, empty array if nothing worth remembering.',
    "Facts should be stable (goals, stack, chain preference), not transient questions.",
  ].join(" ");

  const user = JSON.stringify({
    user: String(userMessage || "").slice(0, 8000),
    assistant: String(assistantReply || "").slice(0, 8000),
  });

  try {
    const out = await chatCompleteMessages(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { maxTokens: 400, temperature: 0.2, timeoutMs: 30_000, ...opts }
    );
    const text = out.text || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return [];
    const j = JSON.parse(match[0]);
    const facts = Array.isArray(j.facts) ? j.facts.map((x) => String(x).trim()).filter(Boolean) : [];
    return facts.slice(0, 4);
  } catch (e) {
    logAiWarn("learner_facts_extract_failed", { message: String(e?.message || e) });
    return [];
  }
}

module.exports = {
  chatComplete,
  chatCompleteMessages,
  streamChatComplete,
  streamChatCompleteMessages,
  extractLearnerFactsFromExchange,
  runAgent,
  runWorkflowSteps,
  getApiKey,
  mockChatResult,
  mockChatResultForQuotaFallback,
  fetchOpenAI,
  clampMaxTokens,
  isRetryableOpenAIStatus,
  isOpenAIQuotaOrBillingError,
  isStreamDegradableError,
  degradedStreamFallback,
  shouldRetryOpenAIError,
};
