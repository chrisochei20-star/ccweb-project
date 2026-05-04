import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { createStreamRoom, fetchLearningProfile, listStreamRooms } from "../api/learningApi";

export function LearningHubPage() {
  const { user } = useOutletContext() || {};
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("CCWEB AI Live Lab");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const r = await listStreamRooms();
      setRooms(r.rooms || []);
      if (user?.id) {
        const me = await fetchLearningProfile(user.id);
        setProfile(me);
      } else {
        setProfile(null);
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [user?.id]);

  async function handleCreate() {
    if (!user?.id) {
      navigate("/login");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const room = await createStreamRoom({
        roomName: title.trim() || "CCWEB Session",
        topic: "AI + Web3 interactive session",
        city: "Global",
        region: "Worldwide",
        createdBy: user.id,
        createdByDisplayName: user.displayName,
        aiHostName: "CCWEB AI Host",
        curriculumTracks: ["AI Foundations", "Web3 Product Development"],
        platformRevenueSharePercent: 25,
        courseLoad: "standard",
        sessionCapacity: 120,
        expectedSessionMinutes: 90,
        tutoringIntervalMinutes: 15,
      });
      await refresh();
      navigate(`/learn/session/${room.id}`);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Create failed");
    } finally {
      setCreating(false);
    }
  }

  const liveRooms = rooms.filter((x) => x.status === "live");

  return (
    <section className="learning-page">
      <header className="page-header">
        <h1 className="section-title">Learn · AI streaming &amp; tutor</h1>
        <p className="muted">
          Join live CCWEB sessions, track time, and pay securely with Stripe when the database is configured.
        </p>
      </header>

      <div className="learning-grid learning-grid--2">
        <article className="panel learning-glass">
          <h3>Your learning wallet</h3>
          {!user && (
            <p className="muted">
              <Link to="/login">Sign in</Link> to sync credits, XP, and subscriptions from the server.
            </p>
          )}
          {user && profile?.postgres === false && (
            <p className="muted">
              Wallet sync requires <code>DATABASE_URL</code> on the API. Streaming and tutor chat still work; Stripe
              checkout for learning returns 503 until Postgres is enabled.
            </p>
          )}
          {user && profile?.postgres && profile.profile && (
            <div style={{ display: "grid", gap: "0.75rem" }}>
              <div className="learning-pill">
                Credits: {(profile.profile.creditsCents / 100).toFixed(2)} USD eq.
              </div>
              <div className="learning-pill">XP: {profile.profile.xp}</div>
              {profile.profile.subscription ? (
                <div className="learning-pill">
                  Subscription: {profile.profile.subscription.tier} · active
                </div>
              ) : (
                <p className="muted">No active subscription.</p>
              )}
              <div>
                <h4 className="muted" style={{ margin: "0.5rem 0 0.35rem" }}>
                  Recent participation
                </h4>
                <ul className="list" style={{ fontSize: "0.9rem" }}>
                  {(profile.profile.recentSessions || []).slice(0, 6).map((s) => (
                    <li key={`${s.sessionId}-${s.lastSeenAt}`}>
                      {s.title} · {s.watchMinutes} min
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {loading && <p className="muted">Loading…</p>}
          {error && <p className="error-text">{error}</p>}
        </article>

        <article className="panel learning-glass">
          <h3>Start a session</h3>
          <div className="auth-row">
            <label htmlFor="sess-title">Session title</label>
            <input id="sess-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <button type="button" className="btn btn-primary" disabled={creating} onClick={handleCreate}>
            {creating ? "Creating…" : "Create live room"}
          </button>
          <p className="muted" style={{ marginTop: "0.75rem" }}>
            Opens the live console with join, timer, Stripe pay-per-hour, tutor chat, and SSE updates.
          </p>
        </article>
      </div>

      <article className="panel learning-glass" style={{ marginTop: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <h3 style={{ margin: 0 }}>Active sessions</h3>
          <button type="button" className="btn btn-outline" onClick={refresh} disabled={loading}>
            Refresh
          </button>
        </div>
        {liveRooms.length === 0 && !loading && <p className="muted">No live rooms. Create one above.</p>}
        <ul className="list" style={{ marginTop: "0.75rem" }}>
          {liveRooms.map((room) => (
            <li key={room.id} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
              <div>
                <strong>{room.roomName}</strong>
                <div className="muted" style={{ fontSize: "0.85rem" }}>
                  {room.topic} · {room.id}
                </div>
              </div>
              <Link className="btn btn-primary" to={`/learn/session/${room.id}`}>
                Open live console
              </Link>
            </li>
          ))}
        </ul>
        <p className="muted" style={{ marginTop: "1rem" }}>
          <Link to="/learn/admin">Admin analytics</Link> ·{" "}
          <Link to="/ai-streaming">Legacy streaming studio</Link>
        </p>
      </article>
    </section>
  );
}
