import { useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchLearningAdminAnalytics } from "../api/learningApi";

export function LearningAdminPage() {
  const [key, setKey] = useState(() => sessionStorage.getItem("ccweb_admin_key") || "");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    sessionStorage.setItem("ccweb_admin_key", key);
    try {
      const out = await fetchLearningAdminAnalytics(key.trim());
      setData(out);
    } catch (e) {
      setData(null);
      setError(e.response?.data?.error || e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  const chartData =
    data?.recentLedger?.map((row) => ({
      name: (row.user_id || "").slice(0, 8),
      gross: Number(row.gross_usd),
      platform: Number(row.platform_usd),
    })) || [];

  return (
    <section className="learning-page">
      <header className="page-header">
        <h1 className="section-title">Learning analytics (admin)</h1>
        <p className="muted">
          Requires <code>CCWEB_ADMIN_KEY</code> on the server and matching <code>X-CCWEB-Admin</code> header.
        </p>
      </header>

      <article className="panel learning-glass" style={{ maxWidth: 560 }}>
        <div className="auth-row">
          <label htmlFor="adm-key">Admin key</label>
          <input
            id="adm-key"
            type="password"
            autoComplete="off"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Paste admin key"
          />
        </div>
        <button type="button" className="btn btn-primary" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Load analytics"}
        </button>
        {error && <p className="error-text">{error}</p>}
      </article>

      {data?.monetization && (
        <div className="learning-grid" style={{ marginTop: "1.25rem", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <article className="panel learning-glass">
            <h4>Flutterwave captured (all-time)</h4>
            <p className="learning-timer" style={{ fontSize: "1.35rem", margin: 0 }}>
              ${Number((data.monetization.payments ?? data.monetization.stripe)?.capturedGrossUsd ?? 0).toFixed(2)}
            </p>
            <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.85rem" }}>
              {(data.monetization.payments ?? data.monetization.stripe)?.transactionCount ?? 0} transactions · escrow $
              {Number((data.monetization.payments ?? data.monetization.stripe)?.escrowUsd ?? 0).toFixed(2)} · learning checkout $
              {Number((data.monetization.payments ?? data.monetization.stripe)?.learningCheckoutUsd ?? 0).toFixed(2)}
            </p>
          </article>
          <article className="panel learning-glass">
            <h4>AI streaming (sessions)</h4>
            <p className="muted" style={{ margin: 0, fontSize: "0.85rem" }}>
              Gross ${Number(data.monetization.aiStreaming?.sessionsLifetimeGrossUsd ?? 0).toFixed(2)} · Platform $
              {Number(data.monetization.aiStreaming?.sessionsLifetimePlatformUsd ?? 0).toFixed(2)} · Creator $
              {Number(data.monetization.aiStreaming?.sessionsLifetimeCreatorUsd ?? 0).toFixed(2)}
            </p>
          </article>
          <article className="panel learning-glass">
            <h4>Credit metering ({data.monetization.creditMetering?.windowDays ?? 90}d)</h4>
            <ul className="list" style={{ fontSize: "0.8rem", margin: 0 }}>
              {(data.monetization.creditMetering?.byKind || []).slice(0, 6).map((r) => (
                <li key={r.kind}>
                  {r.kind}: ${Number(r.grossUsd).toFixed(2)}
                </li>
              ))}
              {(data.monetization.creditMetering?.byKind || []).length === 0 && (
                <li className="muted">No overage metering rows yet.</li>
              )}
            </ul>
          </article>
        </div>
      )}

      {data?.monetization?.topPayingUsers?.length > 0 && (
        <article className="panel learning-glass" style={{ marginTop: "1.25rem" }}>
          <h3>Top payers (userId in metadata)</h3>
          <ul className="list">
            {data.monetization.topPayingUsers.map((r) => (
              <li key={r.userId}>
                <code>{(r.userId || "").slice(0, 12)}…</code> — ${Number(r.totalUsd).toFixed(2)} ({r.transactionCount} tx)
              </li>
            ))}
          </ul>
        </article>
      )}

      {data?.summary && (
        <div className="learning-grid" style={{ marginTop: "1.25rem", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
          <article className="panel learning-glass">
            <h4>Active sessions</h4>
            <p className="learning-timer" style={{ fontSize: "2rem", margin: 0 }}>
              {data.summary.active_sessions}
            </p>
          </article>
          <article className="panel learning-glass">
            <h4>Lifetime gross</h4>
            <p className="learning-timer" style={{ fontSize: "1.5rem", margin: 0 }}>
              ${Number(data.summary.lifetime_gross).toFixed(2)}
            </p>
          </article>
          <article className="panel learning-glass">
            <h4>CCWEB (platform)</h4>
            <p className="learning-timer" style={{ fontSize: "1.5rem", margin: 0 }}>
              ${Number(data.summary.lifetime_platform).toFixed(2)}
            </p>
          </article>
          <article className="panel learning-glass">
            <h4>Ledger rows</h4>
            <p className="learning-timer" style={{ fontSize: "1.5rem", margin: 0 }}>
              {data.summary.ledger_rows}
            </p>
          </article>
        </div>
      )}

      {data?.liveSessions?.length > 0 && (
        <article className="panel learning-glass" style={{ marginTop: "1.25rem" }}>
          <h3>Live DB sessions</h3>
          <ul className="list">
            {data.liveSessions.map((s) => (
              <li key={s.id}>
                <Link to={`/learn/session/${s.stream_room_id}`}>{s.title}</Link> · hourly ${Number(s.hourly_rate_usd).toFixed(2)}
              </li>
            ))}
          </ul>
        </article>
      )}

      {chartData.length > 0 && (
        <article className="panel learning-glass" style={{ marginTop: "1.25rem", height: 320 }}>
          <h3>Recent per-user gross (sample)</h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: "#8ca3c4", fontSize: 11 }} />
              <YAxis tick={{ fill: "#8ca3c4", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#0a1328", border: "1px solid #162b48" }}
                labelStyle={{ color: "#d8e8ff" }}
              />
              <Bar dataKey="gross" fill="#4f7bff" name="Gross" />
              <Bar dataKey="platform" fill="#11d4ff" name="CCWEB" />
            </BarChart>
          </ResponsiveContainer>
        </article>
      )}

      <p className="muted" style={{ marginTop: "1.5rem" }}>
        <Link to="/learn">← Learning hub</Link>
      </p>
    </section>
  );
}
