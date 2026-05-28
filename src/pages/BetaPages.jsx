import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { captureInviteFromSearch, postBetaClientEvent, setBetaSlugContext } from "../lib/betaTelemetry";
import { PublicProfileView } from "./PublicProfilePage";

/**
 * Public profile at /u/:slug — backed by PostgreSQL slug + profile bundle API.
 */
export function BetaUserSlugPage() {
  const { slug } = useParams();

  useEffect(() => {
    captureInviteFromSearch(window.location.search || "");
    if (slug) setBetaSlugContext(slug);
    postBetaClientEvent({ eventType: "beta_slug_open", path: window.location.pathname, featureKey: `slug:${slug}` });
  }, [slug]);

  return <PublicProfileView slug={slug} />;
}

import { http } from "../api/http";

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
      <Link to="/" className="ccweb-outline-btn inline-block min-h-[44px] px-5 py-2.5 text-sm leading-[44px]">
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
      <Link to="/signup" className="ccweb-gradient-btn inline-block min-h-[44px] px-5 py-2.5 text-sm leading-[44px]">
        Continue to signup
      </Link>
    </section>
  );
}
