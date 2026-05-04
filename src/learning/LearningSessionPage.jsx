import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import {
  fetchChannelMessages,
  fetchSessionDetail,
  finishRoom,
  getStreamRoom,
  listAttendance,
  postChannelMessage,
  postTutorMessage,
  quoteAccess,
  startLearningCheckout,
  upsertAttendance,
} from "../api/learningApi";
import { useLearningStore } from "../store/learningStore";

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function LearningSessionPage() {
  const { roomId } = useParams();
  const { user } = useOutletContext() || {};
  const [searchParams] = useSearchParams();
  const paid = searchParams.get("paid");

  const joinedAtRef = useRef(null);
  const tickRef = useRef(null);

  const [room, setRoom] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [channel, setChannel] = useState([]);
  const [detail, setDetail] = useState(null);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(paid ? "Payment completed — if access was purchased, try Join again." : "");
  const [hours, setHours] = useState(1);
  const [payLoading, setPayLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [tutorInput, setTutorInput] = useState("");
  const [tutorThread, setTutorThread] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [watchMinutes, setWatchMinutes] = useState(0);

  const { isLiveJoined, setSessionState, resetSession } = useLearningStore();

  const uid = user?.id || "";
  const displayName = user?.displayName || "Guest";

  useEffect(() => {
    const st = useLearningStore.getState();
    if (st.isLiveJoined && st.activeRoomId && st.activeRoomId !== roomId) {
      useLearningStore.getState().resetSession();
      joinedAtRef.current = null;
    }
  }, [roomId]);

  const loadAll = useCallback(async () => {
    if (!roomId) return;
    setError("");
    try {
      const r = await getStreamRoom(roomId);
      setRoom(r);
      const att = await listAttendance(roomId);
      setAttendees(att.attendees || []);
      setSummary(att.summary || null);
      const ch = await fetchChannelMessages(roomId).catch(() => ({ messages: [] }));
      setChannel(ch.messages || []);
      const d = await fetchSessionDetail(roomId).catch(() => null);
      setDetail(d);
      const q = await quoteAccess(roomId, hours).catch(() => null);
      setQuote(q);
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Load failed");
    }
  }, [roomId, hours]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!roomId || !room) return undefined;
    const url = `${window.location.origin}/api/learning/sessions/${encodeURIComponent(roomId)}/events`;
    const es = new EventSource(url);
    es.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        if (payload.type === "attendance" && payload.attendance) {
          setAttendees((prev) => {
            const others = prev.filter((a) => a.userId !== payload.attendance.userId);
            return [...others, payload.attendance];
          });
          if (payload.metrics) {
            setRoom((prev) => (prev ? { ...prev, metrics: payload.metrics } : prev));
          }
        }
        if (payload.type === "channel_message" && payload.message) {
          setChannel((prev) => [...prev, payload.message]);
        }
      } catch {
        /* ignore */
      }
    };
    es.onerror = () => {
      /* browser auto-reconnects */
    };
    return () => {
      es.close();
    };
  }, [roomId, room?.id]);

  useEffect(() => {
    if (!isLiveJoined || !joinedAtRef.current) {
      if (tickRef.current) clearInterval(tickRef.current);
      return undefined;
    }
    tickRef.current = setInterval(() => {
      const sec = Math.floor((Date.now() - joinedAtRef.current) / 1000);
      setElapsed(sec);
      const mins = Math.max(1, Math.ceil(sec / 60));
      setWatchMinutes(mins);
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [isLiveJoined]);

  const handleLeave = useCallback(async () => {
    if (!roomId || !uid) {
      resetSession();
      joinedAtRef.current = null;
      return;
    }
    try {
      await upsertAttendance(roomId, {
        userId: uid,
        displayName,
        watchMinutes,
        isOrganic: true,
        isActive: false,
        interactionScore: Math.min(100, watchMinutes * 2),
      });
    } catch {
      /* ignore */
    }
    resetSession();
    joinedAtRef.current = null;
    setElapsed(0);
    try {
      const att = await listAttendance(roomId);
      setAttendees(att.attendees || []);
      setSummary(att.summary || null);
    } catch {
      /* ignore */
    }
  }, [roomId, uid, displayName, watchMinutes, resetSession]);

  useEffect(() => {
    if (!isLiveJoined || !roomId || !uid) return undefined;
    const id = setInterval(async () => {
      try {
        await upsertAttendance(roomId, {
          userId: uid,
          displayName,
          watchMinutes,
          isOrganic: true,
          isActive: true,
          interactionScore: Math.min(100, watchMinutes * 2),
        });
        const att = await listAttendance(roomId);
        setAttendees(att.attendees || []);
        setSummary(att.summary || null);
      } catch (e) {
        if (e.response?.status === 402) {
          setError(e.response?.data?.error || "Payment required");
          handleLeave();
        }
      }
    }, 12000);
    return () => clearInterval(id);
  }, [isLiveJoined, roomId, uid, displayName, watchMinutes, handleLeave]);

  async function handleJoin() {
    if (!uid) {
      setError("Sign in to join with your user id.");
      return;
    }
    setError("");
    setInfo("");
    try {
      await upsertAttendance(roomId, {
        userId: uid,
        displayName,
        watchMinutes: 1,
        isOrganic: true,
        isActive: true,
        interactionScore: 1,
      });
      joinedAtRef.current = Date.now();
      setSessionState({
        isLiveJoined: true,
        activeRoomId: roomId,
        joinedAt: joinedAtRef.current,
        watchMinutes: 1,
        sseUrl: `/api/learning/sessions/${roomId}/events`,
      });
      setElapsed(0);
      await loadAll();
    } catch (e) {
      const st = e.response?.status;
      const data = e.response?.data;
      if (st === 402) {
        setError(data?.error || "Paywall: purchase access or subscribe.");
        const q = await quoteAccess(roomId, hours).catch(() => null);
        setQuote(q);
      } else {
        setError(data?.error || e.message || "Join failed");
      }
    }
  }

  async function handlePaySession() {
    if (!uid) {
      setError("Sign in to pay.");
      return;
    }
    setPayLoading(true);
    setError("");
    try {
      const successUrl = `${window.location.origin}/learn/session/${roomId}?paid=1`;
      const cancelUrl = `${window.location.origin}/learn/session/${roomId}?cancelled=1`;
      const { checkoutUrl } = await startLearningCheckout({
        kind: "session_access",
        userId: uid,
        streamRoomId: roomId,
        hours,
        successUrl,
        cancelUrl,
      });
      if (checkoutUrl) window.location.href = checkoutUrl;
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Checkout failed");
    } finally {
      setPayLoading(false);
    }
  }

  async function handleBuyCredits() {
    if (!uid) return;
    setPayLoading(true);
    setError("");
    try {
      const { checkoutUrl } = await startLearningCheckout({
        kind: "credits",
        userId: uid,
        amountUsd: 25,
        successUrl: `${window.location.origin}/learn?paid=1`,
        cancelUrl: `${window.location.origin}/learn/session/${roomId}`,
      });
      if (checkoutUrl) window.location.href = checkoutUrl;
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Checkout failed");
    } finally {
      setPayLoading(false);
    }
  }

  async function handleSubscribe(tier) {
    if (!uid) return;
    setPayLoading(true);
    setError("");
    try {
      const { checkoutUrl } = await startLearningCheckout({
        kind: "subscription",
        userId: uid,
        tier,
        successUrl: `${window.location.origin}/learn?paid=1`,
        cancelUrl: `${window.location.origin}/learn/session/${roomId}`,
      });
      if (checkoutUrl) window.location.href = checkoutUrl;
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Checkout failed");
    } finally {
      setPayLoading(false);
    }
  }

  async function handleSendChat(e) {
    e.preventDefault();
    if (!chatInput.trim() || !uid) return;
    try {
      await postChannelMessage(roomId, {
        userId: uid,
        displayName,
        message: chatInput.trim(),
        type: "chat",
      });
      setChatInput("");
      const ch = await fetchChannelMessages(roomId);
      setChannel(ch.messages || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  async function handleTutorSend(e) {
    e.preventDefault();
    if (!tutorInput.trim() || !uid) return;
    try {
      const out = await postTutorMessage({ userId: uid, message: tutorInput.trim() });
      setTutorThread((prev) => [
        ...prev,
        { role: "user", text: tutorInput.trim(), at: out.user.at },
        { role: "assistant", text: out.assistant.text, at: out.assistant.at, xp: out.xpGained },
      ]);
      setTutorInput("");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  async function handleFinish() {
    if (!roomId) return;
    try {
      await finishRoom(roomId, { finishedBy: uid || "system" });
      await loadAll();
      await handleLeave();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  }

  const platformPct = room?.monetization?.platformRevenueSharePercent ?? quote?.platformFeePercent ?? 25;

  const lessonCards = useMemo(
    () => [
      { title: "Foundations", body: "Core concepts for this live block — follow the host prompts and use chat for Q&A." },
      { title: "Applied practice", body: "Short exercises you can complete during the session; progress updates your XP when Postgres is on." },
      { title: "Wrap-up quiz", body: "3 quick checks: wallet hygiene, risk signals, and protocol basics (honor-system self grade)." },
    ],
    []
  );

  if (!roomId) {
    return <p className="muted">Missing room id.</p>;
  }

  return (
    <section className="learning-page">
      <div style={{ marginBottom: "1rem" }}>
        <Link to="/learn" className="muted">
          ← Learning hub
        </Link>
      </div>
      <header className="page-header">
        <h1 className="section-title">{room?.roomName || "Live session"}</h1>
        <p className="muted">{room?.topic}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
          <span className="learning-pill">Room {roomId}</span>
          <span className="learning-pill">Status: {room?.status || "…"}</span>
          <span className="learning-pill">CCWEB share: {platformPct}%</span>
          {room?.streamingMode && <span className="learning-pill">Mode: {room.streamingMode}</span>}
        </div>
      </header>

      {error && <p className="error-text">{error}</p>}
      {info && <p className="muted">{info}</p>}

      <div className="learning-grid learning-grid--2">
        <article className="panel learning-glass">
          <h3>Live console</h3>
          <div className="learning-timer learning-shimmer">{formatDuration(elapsed)}</div>
          <p className="muted">Tracked watch minutes (sent to API): {watchMinutes}</p>
          {quote && (
            <div className="muted" style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>
              Est. {hours}h total ≈ <strong>${quote.estimatedTotalUsd}</strong> (platform ≈ ${quote.estimatedPlatformUsd},{" "}
              creator ≈ ${quote.estimatedCreatorUsd})
              {quote.postgres === false && " · enable Postgres for paywall + ledger"}
            </div>
          )}
          <div className="auth-row" style={{ marginTop: "0.75rem" }}>
            <label htmlFor="hours-buy">Hours to purchase</label>
            <input
              id="hours-buy"
              type="number"
              min={0.25}
              max={12}
              step={0.25}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button type="button" className="btn btn-primary" disabled={!uid || isLiveJoined} onClick={handleJoin}>
              Join live
            </button>
            <button type="button" className="btn btn-outline" disabled={!isLiveJoined} onClick={handleLeave}>
              Leave
            </button>
            <button type="button" className="btn btn-outline" disabled={payLoading} onClick={handlePaySession}>
              Stripe · pay session
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="button" className="btn btn-outline" disabled={payLoading || !uid} onClick={handleBuyCredits}>
              Buy credits ($25)
            </button>
            <button type="button" className="btn btn-outline" disabled={payLoading || !uid} onClick={() => handleSubscribe("standard")}>
              Subscribe Standard
            </button>
            <button type="button" className="btn btn-outline" disabled={payLoading || !uid} onClick={() => handleSubscribe("premium")}>
              Subscribe Premium
            </button>
          </div>
          {uid && (
            <button type="button" className="btn btn-outline" style={{ marginTop: "0.75rem" }} onClick={handleFinish}>
              End session (host)
            </button>
          )}
          <p className="muted" style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}>
            Video: configure <code>LIVEKIT_URL</code> for WebRTC. Otherwise this page uses CCWEB SSE + chat for real-time class sync.
          </p>
        </article>

        <article className="panel learning-glass">
          <h3>Participants ({summary?.activeAttenders ?? attendees.filter((a) => a.isActive).length} active)</h3>
          <ul className="list" style={{ maxHeight: 220, overflow: "auto" }}>
            {attendees.map((a) => (
              <li key={a.userId}>
                <strong>{a.displayName}</strong> · {a.watchMinutes} min · {a.isActive ? "live" : "away"}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <div className="learning-grid learning-grid--2" style={{ marginTop: "1.25rem" }}>
        <article className="panel learning-glass">
          <h3>Room chat</h3>
          <div className="learning-chat-scroll">
            {channel.map((m) => (
              <div key={m.id} className={`learning-msg ${m.userId === uid ? "learning-msg--user" : ""}`}>
                <div className="muted" style={{ fontSize: "0.75rem" }}>
                  {m.displayName} · {new Date(m.at).toLocaleTimeString()}
                </div>
                {m.message}
              </div>
            ))}
          </div>
          <form onSubmit={handleSendChat} style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
            <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Message class…" style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary" disabled={!uid}>
              Send
            </button>
          </form>
        </article>

        <article className="panel learning-glass">
          <h3>AI tutor</h3>
          <div className="learning-chat-scroll">
            {tutorThread.map((m, i) => (
              <div
                key={`${m.at}-${i}`}
                className={`learning-msg ${m.role === "user" ? "learning-msg--user" : "learning-msg--ai"}`}
              >
                {m.text}
                {m.xp ? <div className="muted" style={{ fontSize: "0.75rem" }}>+{m.xp} XP</div> : null}
              </div>
            ))}
          </div>
          <form onSubmit={handleTutorSend} style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexDirection: "column" }}>
            <textarea
              rows={3}
              value={tutorInput}
              onChange={(e) => setTutorInput(e.target.value)}
              placeholder="Ask the tutor…"
            />
            <button type="submit" className="btn btn-primary" disabled={!uid}>
              Ask tutor
            </button>
          </form>
          <div style={{ marginTop: "1rem" }}>
            <h4 className="muted">Lesson cards</h4>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {lessonCards.map((c) => (
                <div key={c.title} style={{ padding: "0.65rem", borderRadius: 12, border: "1px solid rgba(120,170,255,0.15)" }}>
                  <strong>{c.title}</strong>
                  <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.88rem" }}>
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      {detail?.session && (
        <article className="panel learning-glass" style={{ marginTop: "1.25rem" }}>
          <h3>Session revenue (closed bookings)</h3>
          <p className="muted">
            Gross ${Number(detail.session.total_gross_usd).toFixed(2)} · CCWEB ${Number(detail.session.total_platform_usd).toFixed(2)} ·
            Creator ${Number(detail.session.total_creator_usd).toFixed(2)}
          </p>
          <ul className="list" style={{ fontSize: "0.88rem" }}>
            {(detail.ledger || []).map((row) => (
              <li key={row.id}>
                User {row.user_id}: {row.watch_minutes} min → gross ${Number(row.gross_usd).toFixed(2)} (platform $
                {Number(row.platform_usd).toFixed(2)})
              </li>
            ))}
          </ul>
        </article>
      )}
    </section>
  );
}
