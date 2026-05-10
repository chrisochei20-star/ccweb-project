import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { http } from "../api/http";
import { apiUrl } from "../config/env";
import { apiFetch } from "../lib/apiClient";
import { getSessionToken } from "../session";
import { captureInviteFromSearch, postBetaClientEvent, setBetaSlugContext } from "../lib/betaTelemetry";
import { SocialProfileHub } from "./SocialProfileHub";

function betaAuthHeaders() {
  const t = getSessionToken();
  const h = {};
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

/**
 * Public beta dashboard shell — personalize via slug when backend knows user id.
 */
export function BetaUserSlugPage() {
  const { slug } = useParams();
  const [targetUserId, setTargetUserId] = useState(null);
  const [slugErr, setSlugErr] = useState(null);
  const [slugLoading, setSlugLoading] = useState(true);

  useEffect(() => {
    captureInviteFromSearch(window.location.search || "");
    if (slug) setBetaSlugContext(slug);
    postBetaClientEvent({ eventType: "beta_slug_open", path: window.location.pathname, featureKey: `slug:${slug}` });
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      setSlugLoading(true);
      setSlugErr(null);
      try {
        const res = await apiFetch(apiUrl(`/api/v1/social/by-slug/${encodeURIComponent(slug)}`), {
          credentials: "include",
          headers: betaAuthHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Public profile unavailable.");
        const uid = data.profile?.userId;
        if (!uid) throw new Error("Profile not linked.");
        if (!cancelled) setTargetUserId(uid);
      } catch (e) {
        if (!cancelled) setSlugErr(e.message || String(e));
      } finally {
        if (!cancelled) setSlugLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <section className="mx-auto max-w-2xl space-y-6 px-4 pb-24 pt-4">
      <header>
        <p className="text-xs uppercase tracking-wider text-ccweb-muted">Public profile</p>
        <h1 className="section-title mt-1">/{slug}</h1>
        <p className="muted mt-2 max-w-xl text-sm">
          CCWEB social profile and beta tester link. Sign in to follow, like, and reply.
        </p>
      </header>
      <div className="flex flex-wrap gap-3">
        <Link to="/signup" className="ccweb-gradient-btn px-5 py-2.5 text-sm">
          Join beta
        </Link>
        <Link to="/login" className="ccweb-outline-btn px-5 py-2.5 text-sm">
          Sign in
        </Link>
        <Link to="/" className="ccweb-outline-btn px-5 py-2.5 text-sm">
          Home
        </Link>
      </div>

      {slugLoading && (
        <p className="text-center text-sm text-ccweb-muted">Loading profile…</p>
      )}
      {!slugLoading && slugErr && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          {slugErr}{" "}
          <span className="text-ccweb-muted">
            (Set <code className="text-ccweb-cyan">DATABASE_URL</code> and run migrations for full social profiles.)
          </span>
        </div>
      )}
      {!slugLoading && targetUserId && <SocialProfileHub userId={targetUserId} isSelf={false} />}

      <article className="ccweb-glass rounded-2xl p-5">
        <h3 className="mb-2 text-sm font-semibold text-white">Tester checklist</h3>
        <ul className="list-inside list-disc space-y-1 text-sm text-ccweb-muted">
          <li>Learn — AI streaming & tutor</li>
          <li>Find — scanner & early signals</li>
          <li>Build — agents & developer tools</li>
          <li>Earn — revenue & growth</li>
          <li>Community — posts & reactions</li>
        </ul>
      </article>
    </section>
  );
}

export function BetaTestUserPage() {
  const { userId } = useParams();

  useEffect(() => {
    captureInviteFromSearch(window.location.search || "");
    postBetaClientEvent({ eventType: "beta_test_link_open", path: window.location.pathname, featureKey: `user:${userId}` });
  }, [userId]);

  return (
    <section className="space-y-6 px-4 pb-24 pt-4">
      <header>
        <p className="text-xs uppercase tracking-wider text-ccweb-muted">Beta test link</p>
        <h1 className="section-title mt-1">Tester session</h1>
        <p className="muted mt-2 font-mono text-xs break-all">{userId}</p>
        <p className="muted mt-2 max-w-xl">
          This URL identifies a specific tester for analytics. Sign in with the same account to align sessions with server-side logs.
        </p>
      </header>
      <Link to="/" className="ccweb-outline-btn inline-block px-5 py-2.5 text-sm">
        Open app home
      </Link>
    </section>
  );
}

export function BetaInvitePage() {
  const { code } = useParams();
  const [state, setState] = useState({ loading: true, valid: null, label: null });

  useEffect(() => {
    captureInviteFromSearch(window.location.search || "");
    if (code) sessionStorage.setItem("ccweb_invite", code.toLowerCase().slice(0, 64));
    postBetaClientEvent({ eventType: "invite_open", path: window.location.pathname, featureKey: `invite:${code}` });
    let cancelled = false;
    (async () => {
      try {
        const { data } = await http.get(`/api/v1/beta/invite/${encodeURIComponent(code)}`);
        if (!cancelled) setState({ loading: false, valid: data.valid !== false, label: data.label });
      } catch {
        if (!cancelled) setState({ loading: false, valid: false, label: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <section className="space-y-6 px-4 pb-24 pt-4">
      <header>
        <p className="text-xs uppercase tracking-wider text-ccweb-muted">Beta invite</p>
        <h1 className="section-title mt-1">{code}</h1>
        <p className="muted mt-2">
          {state.loading ? "Checking invite…" : state.valid ? `Welcome${state.label ? ` — ${state.label}` : ""}.` : "Invite not active on this deployment."}
        </p>
      </header>
      <Link to="/signup" className="ccweb-gradient-btn inline-block px-5 py-2.5 text-sm">
        Continue to signup
      </Link>
    </section>
  );
}
