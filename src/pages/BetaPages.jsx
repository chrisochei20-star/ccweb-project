import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { http } from "../api/http";
import { captureInviteFromSearch, postBetaClientEvent, setBetaSlugContext } from "../lib/betaTelemetry";

/**
 * Public beta dashboard shell — personalize via slug when backend knows user id.
 */
export function BetaUserSlugPage() {
  const { slug } = useParams();

  useEffect(() => {
    captureInviteFromSearch(window.location.search || "");
    if (slug) setBetaSlugContext(slug);
    postBetaClientEvent({ eventType: "beta_slug_open", path: window.location.pathname, featureKey: `slug:${slug}` });
  }, [slug]);

  return (
    <section className="space-y-6 px-4 pb-24 pt-4">
      <header>
        <p className="text-xs uppercase tracking-wider text-ccweb-muted">Beta profile link</p>
        <h1 className="section-title mt-1">/{slug}</h1>
        <p className="muted mt-2 max-w-xl">
          You opened a personal beta URL. Activity on this link is attributed for tester analytics (invite codes from invite URLs are
          stored client-side). Sign in for your full dashboard.
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
