import { useCallback, useMemo, useState } from "react";
import { Shield } from "lucide-react";
import { apiFetch } from "../lib/apiClient";
import { apiUrl } from "../config/env";

function headers(adminKey) {
  return {
    "Content-Type": "application/json",
    "X-CCWEB-Admin": adminKey,
  };
}

export function AdminOpsPage() {
  const [adminKey, setAdminKey] = useState(() => (typeof localStorage !== "undefined" ? localStorage.getItem("ccweb_admin_ops_key") || "" : ""));
  const [tab, setTab] = useState("payouts");
  const [busy, setBusy] = useState(false);
  const [payouts, setPayouts] = useState([]);
  const [reports, setReports] = useState([]);
  const [audit, setAudit] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [mpListings, setMpListings] = useState([]);
  const [err, setErr] = useState("");

  const canQuery = useMemo(() => adminKey.trim().length > 0, [adminKey]);

  const loadPayouts = useCallback(async () => {
    if (!canQuery) return;
    setBusy(true);
    setErr("");
    try {
      localStorage.setItem("ccweb_admin_ops_key", adminKey.trim());
      const res = await apiFetch(apiUrl("/api/v1/admin/ops/payouts?limit=80"), { headers: headers(adminKey.trim()) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setPayouts(data.payouts || []);
    } catch (e) {
      setErr(e.message || "Error");
    } finally {
      setBusy(false);
    }
  }, [adminKey, canQuery]);

  const loadReports = useCallback(async () => {
    if (!canQuery) return;
    setBusy(true);
    setErr("");
    try {
      const res = await apiFetch(apiUrl("/api/v1/admin/ops/reports?limit=80"), { headers: headers(adminKey.trim()) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReports(data.reports || []);
    } catch (e) {
      setErr(e.message || "Error");
    } finally {
      setBusy(false);
    }
  }, [adminKey, canQuery]);

  const loadAudit = useCallback(async () => {
    if (!canQuery) return;
    setBusy(true);
    setErr("");
    try {
      const res = await apiFetch(apiUrl("/api/v1/admin/ops/audit?limit=120"), { headers: headers(adminKey.trim()) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setAudit(data.logs || []);
    } catch (e) {
      setErr(e.message || "Error");
    } finally {
      setBusy(false);
    }
  }, [adminKey, canQuery]);

  const loadRevenue = useCallback(async () => {
    if (!canQuery) return;
    setBusy(true);
    setErr("");
    try {
      const res = await apiFetch(apiUrl("/api/v1/admin/ops/revenue/flutterwave"), { headers: headers(adminKey.trim()) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setRevenue(data.snapshot || null);
    } catch (e) {
      setErr(e.message || "Error");
    } finally {
      setBusy(false);
    }
  }, [adminKey, canQuery]);

  const loadMarketplace = useCallback(async () => {
    if (!canQuery) return;
    setBusy(true);
    setErr("");
    try {
      const res = await apiFetch(
        apiUrl("/api/v1/admin/ops/marketplace/listings?moderationStatus=pending_review&limit=80"),
        { headers: headers(adminKey.trim()) }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMpListings(data.listings || []);
    } catch (e) {
      setErr(e.message || "Error");
    } finally {
      setBusy(false);
    }
  }, [adminKey, canQuery]);

  async function payoutPost(path, body = {}) {
    if (!canQuery) return;
    setBusy(true);
    setErr("");
    try {
      const res = await apiFetch(apiUrl(path), {
        method: "POST",
        headers: headers(adminKey.trim()),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.detail?.message || "Failed");
      if (path.includes("/marketplace/listings/") && path.includes("/moderate")) await loadMarketplace();
      else await loadPayouts();
    } catch (e) {
      setErr(e.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-3 pb-10 pt-4">
      <header className="flex items-start gap-3">
        <div className="rounded-2xl bg-white/10 p-3 text-ccweb-green">
          <Shield className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-green">Admin</p>
          <h1 className="text-2xl font-bold text-white">Operations &amp; payouts</h1>
          <p className="mt-1 text-sm text-ccweb-muted">
            Approve Flutterwave payout requests, monitor trust reports, audit actions, and revenue snapshots. Requires{" "}
            <code className="text-ccweb-green">CCWEB_ADMIN_KEY</code> on the server.
          </p>
        </div>
      </header>

      <div className="ccweb-glass rounded-2xl p-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-ccweb-muted">Admin key</label>
        <input
          type="password"
          className="ccweb-input mt-2 w-full"
          value={adminKey}
          onChange={(e) => setAdminKey(e.target.value)}
          autoComplete="off"
          placeholder="Stored locally as ccweb_admin_ops_key"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {["payouts", "reports", "audit", "revenue", "marketplace"].map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t ? "ccweb-gradient-btn" : "bg-white/5 text-ccweb-muted"}`}
            onClick={() => {
              setTab(t);
              if (t === "payouts") loadPayouts();
              if (t === "reports") loadReports();
              if (t === "audit") loadAudit();
              if (t === "revenue") loadRevenue();
              if (t === "marketplace") loadMarketplace();
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {err && <p className="text-sm text-red-400">{err}</p>}

      {tab === "payouts" && (
        <div className="space-y-3">
          <button type="button" className="ccweb-gradient-btn text-sm" disabled={!canQuery || busy} onClick={loadPayouts}>
            Refresh payouts
          </button>
          <ul className="space-y-2 text-sm text-ccweb-muted">
            {payouts.map((p) => (
              <li key={p.id} className="ccweb-glass rounded-xl p-3 text-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs text-ccweb-muted">{p.id}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs uppercase">{p.status}</span>
                </div>
                <p className="mt-1">
                  {(p.amountMinor / 100).toFixed(2)} {p.currency} · creator {p.creatorUserId || "—"} · hint {p.bankHint || "—"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {p.status === "pending_review" && (
                    <>
                      <button
                        type="button"
                        className="rounded-lg bg-emerald-600/80 px-3 py-1 text-xs font-semibold text-white"
                        disabled={busy}
                        onClick={() => payoutPost(`/api/v1/admin/ops/payouts/${encodeURIComponent(p.id)}/approve`)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="rounded-lg bg-red-600/70 px-3 py-1 text-xs font-semibold text-white"
                        disabled={busy}
                        onClick={async () => {
                          const reason = typeof window !== "undefined" ? window.prompt("Rejection reason", "policy") : "policy";
                          if (reason === null) return;
                          await payoutPost(`/api/v1/admin/ops/payouts/${encodeURIComponent(p.id)}/reject`, { reason });
                        }}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {p.status === "approved" && (
                    <button
                      type="button"
                      className="rounded-lg bg-sky-600/80 px-3 py-1 text-xs font-semibold text-white"
                      disabled={busy}
                      onClick={() => payoutPost(`/api/v1/admin/ops/payouts/${encodeURIComponent(p.id)}/execute-transfer`)}
                    >
                      Execute transfer
                    </button>
                  )}
                  {(p.status === "transfer_submitted" || p.status === "approved") && (
                    <button
                      type="button"
                      className="rounded-lg bg-white/10 px-3 py-1 text-xs font-semibold text-white"
                      disabled={busy}
                      onClick={() => payoutPost(`/api/v1/admin/ops/payouts/${encodeURIComponent(p.id)}/sync-transfer`)}
                    >
                      Sync status
                    </button>
                  )}
                </div>
              </li>
            ))}
            {payouts.length === 0 && <li className="text-ccweb-muted">No rows loaded.</li>}
          </ul>
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-3">
          <button type="button" className="ccweb-gradient-btn text-sm" disabled={!canQuery || busy} onClick={loadReports}>
            Refresh reports
          </button>
          <ul className="space-y-2 text-sm">
            {reports.map((r) => (
              <li key={r.id} className="ccweb-glass rounded-xl p-3 text-ccweb-muted">
                <span className="font-mono text-xs">{r.id}</span> · {r.targetType} / {r.targetId} · {r.status}
                <p className="mt-1 text-white">{r.body}</p>
              </li>
            ))}
            {reports.length === 0 && <li className="text-ccweb-muted">No rows loaded.</li>}
          </ul>
        </div>
      )}

      {tab === "audit" && (
        <div className="space-y-3">
          <button type="button" className="ccweb-gradient-btn text-sm" disabled={!canQuery || busy} onClick={loadAudit}>
            Refresh audit
          </button>
          <ul className="max-h-[480px] space-y-1 overflow-auto font-mono text-xs text-ccweb-muted">
            {audit.map((a) => (
              <li key={a.id}>
                {new Date(a.createdAt).toISOString()} · {a.action} · {a.targetType}:{a.targetId}
              </li>
            ))}
            {audit.length === 0 && <li>No rows loaded.</li>}
          </ul>
        </div>
      )}

      {tab === "marketplace" && (
        <div className="space-y-3">
          <button type="button" className="ccweb-gradient-btn text-sm" disabled={!canQuery || busy} onClick={loadMarketplace}>
            Refresh marketplace queue
          </button>
          <p className="text-xs text-ccweb-muted">Listings in pending_review (when CCWEB_MP_REQUIRE_LISTING_REVIEW=1).</p>
          <ul className="space-y-2 text-sm text-ccweb-muted">
            {mpListings.map((l) => (
              <li key={l.id} className="ccweb-glass rounded-xl p-3 text-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{l.title}</span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs uppercase">{l.moderationStatus}</span>
                </div>
                <p className="mt-1 text-xs text-ccweb-muted">
                  Store {l.storeTitle} · owner {l.storeOwnerId || "—"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-emerald-600/80 px-3 py-1 text-xs font-semibold text-white"
                    disabled={busy}
                    onClick={() =>
                      payoutPost(`/api/v1/admin/ops/marketplace/listings/${encodeURIComponent(l.id)}/moderate`, {
                        moderationStatus: "visible",
                      })
                    }
                  >
                    Approve (visible)
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-red-600/70 px-3 py-1 text-xs font-semibold text-white"
                    disabled={busy}
                    onClick={() =>
                      payoutPost(`/api/v1/admin/ops/marketplace/listings/${encodeURIComponent(l.id)}/moderate`, {
                        moderationStatus: "hidden",
                      })
                    }
                  >
                    Hide
                  </button>
                </div>
              </li>
            ))}
            {mpListings.length === 0 && <li className="text-ccweb-muted">No rows loaded.</li>}
          </ul>
        </div>
      )}

      {tab === "revenue" && (
        <div className="space-y-3">
          <button type="button" className="ccweb-gradient-btn text-sm" disabled={!canQuery || busy} onClick={loadRevenue}>
            Refresh revenue
          </button>
          {revenue && (
            <pre className="ccweb-glass overflow-auto rounded-xl p-4 text-xs text-ccweb-green">{JSON.stringify(revenue, null, 2)}</pre>
          )}
        </div>
      )}
    </div>
  );
}
