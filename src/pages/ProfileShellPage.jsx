import { ExternalLink, Lock, Loader2, LogOut, MessageSquare, Shield, Wallet } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { uploadProfileAvatar, uploadProfileBanner, formatUploadError } from "../api/uploadsApi";
import { updateProfile, fetchProfileFeed } from "../api/profileApi";
import { ProfileBottomSheet } from "../components/profile/ProfileBottomSheet";
import { ProfileFeedList } from "../components/profile/ProfileFeedList";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileTabs } from "../components/profile/ProfileTabs";
import { apiUrl } from "../config/env";
import { apiFetch } from "../lib/apiClient";
import { disconnectSharedRealtimeSocket } from "../lib/realtimeSocket";
import { toast } from "../lib/toastBus";
import { validateUploadFileSize } from "../lib/uploadLimits";
import { getSessionToken, logoutApi, setSession } from "../session";
import { CCWEB_UI_LOAD_TIMEOUT_MS } from "../constants/loadTimeout";
import { useAppShellContext } from "../hooks/useAppShellContext";
import { useAuthGateRecovery } from "../hooks/useAuthGateRecovery";
import { useProfileStore, syncProfileFromUpload } from "../store/profileStore";
import { formatUserFacingError } from "../lib/userFacingError";

export function ProfileShellPage() {
  const { user: shellUser, setUser, authHydrated, refreshSession } = useAppShellContext();
  const navigate = useNavigate();
  const {
    storeUser,
    social,
    creator,
    monetization,
    betaSlugFromStore,
    betaPublicUrl,
    profileLoading,
    profileOffline,
    stats,
    hydrateMe,
    applyBundle,
  } = useProfileStore(
    useShallow((s) => ({
      storeUser: s.user,
      social: s.social,
      creator: s.creator,
      monetization: s.monetization,
      betaSlugFromStore: s.betaSlug,
      betaPublicUrl: s.betaPublicUrl,
      profileLoading: s.loading,
      profileOffline: s.offline,
      stats: s.stats,
      hydrateMe: s.hydrateMe,
      applyBundle: s.applyBundle,
    }))
  );

  const user = storeUser || shellUser;

  const [editOpen, setEditOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [betaSlug, setBetaSlug] = useState("");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [socialLinkLabel, setSocialLinkLabel] = useState("");
  const [socialLinkUrl, setSocialLinkUrl] = useState("");
  const [socialLinks, setSocialLinks] = useState([]);
  const [saveBusy, setSaveBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const [whatsappHandle, setWhatsappHandle] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [feedItems, setFeedItems] = useState([]);
  const [feedError, setFeedError] = useState(null);
  const [feedLoading, setFeedLoading] = useState(false);

  const [mediaBusy, setMediaBusy] = useState({ avatar: false, banner: false });
  const [mediaProgress, setMediaProgress] = useState({ avatar: null, banner: null });
  const [mediaError, setMediaError] = useState({ avatar: null, banner: null });

  const [totpStep, setTotpStep] = useState(null);
  const [totpSecret, setTotpSecret] = useState("");
  const [totpUrl, setTotpUrl] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [backupCodes, setBackupCodes] = useState(null);
  const [gateTimedOut, setGateTimedOut] = useState(false);
  const uploadAbortRef = useRef({ avatar: null, banner: null });

  useEffect(() => {
    const waitingHydrate = !authHydrated;
    const waitingUserWithToken = Boolean(authHydrated && !user && getSessionToken());
    if (!waitingHydrate && !waitingUserWithToken) {
      setGateTimedOut(false);
      return undefined;
    }
    const id = window.setTimeout(() => setGateTimedOut(true), CCWEB_UI_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [authHydrated, user]);

  useAuthGateRecovery({ gateTimedOut, authHydrated, refreshSession });

  useEffect(() => {
    if (!authHydrated || !shellUser?.id) return;
    useProfileStore.getState().applySessionUser(shellUser);
    hydrateMe().catch(() => {});
  }, [authHydrated, shellUser?.id, hydrateMe]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setWebsite(user.website || "");
      setPushEnabled(user.pushEnabled !== false);
      setSocialLinks(Array.isArray(user.socialLinks) ? user.socialLinks : []);
      // Hydrate WhatsApp / X handles from stored social links
      const links = Array.isArray(user.socialLinks) ? user.socialLinks : [];
      const wa = links.find((l) => /whatsapp/i.test(l.label));
      const tw = links.find((l) => /twitter|x\.com/i.test(l.label));
      if (wa) setWhatsappHandle(wa.url || "");
      if (tw) setTwitterHandle(tw.url || "");
    }
  }, [user]);

  useEffect(() => {
    if (betaSlugFromStore) setBetaSlug(betaSlugFromStore);
  }, [betaSlugFromStore]);

  const loadFeed = useCallback(async () => {
    if (!user?.id) return;
    setFeedLoading(true);
    setFeedError(null);
    try {
      const data = await fetchProfileFeed(user.id, activeTab);
      setFeedItems(data.items || []);
    } catch (e) {
      setFeedError(formatUserFacingError(e, "Could not load tab."));
      setFeedItems([]);
    } finally {
      setFeedLoading(false);
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    if (user?.id) loadFeed();
  }, [user?.id, activeTab, loadFeed]);

  async function saveProfile() {
    if (!user) return;
    setErr(null);
    setMsg(null);
    setSaveBusy(true);
    const token = getSessionToken();
    try {
      const links = [...socialLinks.filter((l) => !/whatsapp|twitter|x\.com/i.test(l.label))];
      if (socialLinkUrl.trim()) {
        links.push({ label: socialLinkLabel.trim() || "Link", url: socialLinkUrl.trim() });
      }
      if (whatsappHandle.trim()) {
        links.push({ label: "WhatsApp", url: whatsappHandle.trim() });
      }
      if (twitterHandle.trim()) {
        links.push({ label: "X (Twitter)", url: twitterHandle.trim() });
      }
      const bundle = await updateProfile({
        displayName: displayName.trim(),
        pushEnabled,
        betaSlug: betaSlug.trim() || undefined,
        bio: bio.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
        socialLinks: links.slice(0, 10),
      });
      applyBundle(bundle);
      setUser(bundle.user);
      setSession(token, bundle.user);
      if (bundle.betaSlug) setBetaSlug(bundle.betaSlug);
      setSocialLinks(bundle.user?.socialLinks || []);
      setSocialLinkLabel("");
      setSocialLinkUrl("");
      setEditOpen(false);
      setMsg(bundle.betaPublicUrl ? `Profile saved. Share: ${bundle.betaPublicUrl}` : "Profile saved.");
      toast.success("Profile saved.");
    } catch (e) {
      setErr(e.message);
      toast.error(e.message);
    } finally {
      setSaveBusy(false);
    }
  }

  const runAvatarUpload = useCallback(
    async (file) => {
      const sizeErr = validateUploadFileSize(file);
      if (sizeErr) {
        setMediaError((m) => ({ ...m, avatar: sizeErr }));
        toast.error(sizeErr);
        return;
      }
      setMediaError((m) => ({ ...m, avatar: null }));
      const token = getSessionToken();
      uploadAbortRef.current.avatar?.abort();
      const controller = new AbortController();
      uploadAbortRef.current.avatar = controller;
      setMediaBusy((m) => ({ ...m, avatar: true }));
      setMediaProgress((p) => ({ ...p, avatar: 0 }));
      try {
        const data = await uploadProfileAvatar(file, {
          onProgress: (pct) => setMediaProgress((p) => ({ ...p, avatar: pct })),
          signal: controller.signal,
        });
        syncProfileFromUpload(token, data);
        setUser(data.user);
        toast.success("Profile photo updated.");
      } catch (e) {
        if (e?.name === "AbortError" || /abort/i.test(String(e?.message))) return;
        const m = formatUploadError(e);
        setMediaError((s) => ({ ...s, avatar: m }));
        toast.error(m);
        throw e;
      } finally {
        setMediaProgress((p) => ({ ...p, avatar: null }));
        setMediaBusy((m) => ({ ...m, avatar: false }));
        if (uploadAbortRef.current.avatar === controller) uploadAbortRef.current.avatar = null;
      }
    },
    [setUser]
  );

  const runBannerUpload = useCallback(
    async (file) => {
      const sizeErr = validateUploadFileSize(file);
      if (sizeErr) {
        setMediaError((m) => ({ ...m, banner: sizeErr }));
        toast.error(sizeErr);
        return;
      }
      setMediaError((m) => ({ ...m, banner: null }));
      const token = getSessionToken();
      uploadAbortRef.current.banner?.abort();
      const controller = new AbortController();
      uploadAbortRef.current.banner = controller;
      setMediaBusy((m) => ({ ...m, banner: true }));
      setMediaProgress((p) => ({ ...p, banner: 0 }));
      try {
        const data = await uploadProfileBanner(file, {
          onProgress: (pct) => setMediaProgress((p) => ({ ...p, banner: pct })),
          signal: controller.signal,
        });
        syncProfileFromUpload(token, data);
        setUser(data.user);
        toast.success("Banner updated.");
      } catch (e) {
        if (e?.name === "AbortError" || /abort/i.test(String(e?.message))) return;
        const m = formatUploadError(e);
        setMediaError((s) => ({ ...s, banner: m }));
        toast.error(m);
        throw e;
      } finally {
        setMediaProgress((p) => ({ ...p, banner: null }));
        setMediaBusy((m) => ({ ...m, banner: false }));
        if (uploadAbortRef.current.banner === controller) uploadAbortRef.current.banner = null;
      }
    },
    [setUser]
  );

  async function beginTotp() {
    setErr(null);
    setMsg(null);
    setBackupCodes(null);
    const token = getSessionToken();
    try {
      const res = await apiFetch(
        apiUrl("/api/auth/2fa/setup"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ step: "begin" }),
        },
        { networkRetries: 1 }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Setup failed");
      setTotpSecret(data.secret || "");
      setTotpUrl(data.otpauthUrl || "");
      setTotpStep("scan");
    } catch (e) {
      setErr(e.message);
      toast.error(e.message);
    }
  }

  async function confirmTotp() {
    setErr(null);
    const token = getSessionToken();
    try {
      const res = await apiFetch(
        apiUrl("/api/auth/2fa/setup"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ step: "confirm", code: totpCode.trim() }),
        },
        { networkRetries: 1 }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setBackupCodes(data.backupCodes || []);
      setTotpStep("done");
      toast.success("Two-factor authentication enabled.");
      const meRes = await apiFetch(apiUrl("/api/auth/me"), { headers: { Authorization: `Bearer ${token}` } }, { networkRetries: 1 });
      const me = await meRes.json();
      if (me.user) {
        setUser(me.user);
        setSession(token, me.user);
        useProfileStore.getState().applySessionUser(me.user);
      }
    } catch (e) {
      setErr(e.message);
      toast.error(e.message);
    }
  }

  async function handleLogout() {
    uploadAbortRef.current.avatar?.abort();
    uploadAbortRef.current.banner?.abort();
    await logoutApi();
    disconnectSharedRealtimeSocket();
    setUser(null);
    useProfileStore.getState().reset();
    navigate("/login");
  }

  if (!authHydrated) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-ccweb-muted" role="status">
        {!gateTimedOut ? <Loader2 className="h-7 w-7 shrink-0 animate-spin" aria-hidden /> : null}
        <span className="text-sm text-center max-w-sm">
          {gateTimedOut
            ? "We could not verify your session in time. Check your connection or try signing in again."
            : "Loading profile…"}
        </span>
        {gateTimedOut && getSessionToken() && typeof refreshSession === "function" && (
          <button type="button" className="ccweb-outline-btn min-h-[44px] px-4 text-sm" onClick={() => refreshSession()}>
            Retry session
          </button>
        )}
      </div>
    );
  }

  if (!user) {
    if (getSessionToken()) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-ccweb-muted" role="status">
          {!gateTimedOut ? <Loader2 className="h-7 w-7 shrink-0 animate-spin" aria-hidden /> : null}
          <span className="text-sm text-center max-w-sm">
            {gateTimedOut
              ? "We could not load your account in time. Check your connection or try signing in again."
              : "Syncing account…"}
          </span>
          {gateTimedOut && typeof refreshSession === "function" && (
            <button type="button" className="ccweb-outline-btn min-h-[44px] px-4 text-sm" onClick={() => refreshSession()}>
              Retry session
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-lg px-3 pb-24 pt-8">
        <div className="ccweb-glass rounded-2xl p-6 text-center">
          <p className="text-ccweb-muted">Sign in to manage your profile and security.</p>
          <Link to="/login" className="mt-4 inline-block ccweb-gradient-btn min-h-[44px] px-5 leading-[44px]">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const otpQr = totpUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(totpUrl)}`
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-3 pb-24 pt-2 md:max-w-3xl">
      {profileOffline && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          You appear offline. Profile counts may be stale until you reconnect.
        </p>
      )}

      <ProfileHeader
        user={user}
        social={social}
        creator={creator}
        monetization={monetization}
        stats={stats}
        betaPublicUrl={betaPublicUrl}
        loading={profileLoading}
        isSelf
        onEdit={() => setEditOpen(true)}
        avatarUpload={{
          busy: mediaBusy.avatar,
          progress: mediaProgress.avatar,
          error: mediaError.avatar,
          onRetry: () => setMediaError((s) => ({ ...s, avatar: null })),
          onFile: runAvatarUpload,
        }}
        bannerUpload={{
          busy: mediaBusy.banner,
          progress: mediaProgress.banner,
          error: mediaError.banner,
          onRetry: () => setMediaError((s) => ({ ...s, banner: null })),
          onFile: runBannerUpload,
          compressOptions: { maxWidth: 2200, maxHeight: 820, quality: 0.88 },
        }}
      />

        <button
          type="button"
          className="ccweb-glass flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-500/30 px-4 py-3 text-white hover:border-blue-400/50"
            onClick={() => navigate("/growth-hub")}
        >
          <Wallet className="h-5 w-5 text-ccweb-green" />
          <span>My Wallet</span>
        </button>


      <ProfileTabs active={activeTab} onChange={setActiveTab} isSelf sticky />
      <ProfileFeedList tab={activeTab} items={feedItems} loading={feedLoading} error={feedError} onRetry={loadFeed} />


      {/* Payment / Transaction Dashboard */}
      <section className="ccweb-glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-white">
            <Wallet className="h-5 w-5 text-ccweb-green" />
            Transactions
          </h2>
          <button
            type="button"
            className="text-xs text-ccweb-cyan hover:underline"
            onClick={async () => {
              setTxLoading(true);
              try {
                const res = await apiFetch(apiUrl("/api/growth/orders"));
                const d = await res.json().catch(() => ({}));
                setTransactions(d.orders || []);
              } catch { setTransactions([]); } finally { setTxLoading(false); }
            }}
          >
            {txLoading ? "Loading…" : "Refresh"}
          </button>
        </div>
        {transactions.length === 0 && !txLoading && (
          <p className="mt-3 text-sm text-ccweb-muted">No transactions yet. Complete a marketplace order to see your history.</p>
        )}
        {txLoading && <p className="mt-3 text-sm text-ccweb-muted animate-pulse">Loading transactions…</p>}
        {transactions.length > 0 && (
          <ul className="mt-4 space-y-2">
            {transactions.map((tx) => {
              const isIncoming = tx.sellerId === user.id;
              return (
                <li key={tx.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{tx.listingTitle || tx.id}</p>
                    <p className="mt-0.5 text-xs text-ccweb-muted capitalize">{tx.status?.replace(/_/g, " ")}</p>
                  </div>
                  <span className={`text-sm font-bold ${isIncoming ? "text-ccweb-green" : "text-rose-400"}`}>
                    {isIncoming ? "+" : "-"}${tx.amountUsd}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="ccweb-glass rounded-2xl p-5">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <Shield className="h-5 w-5 text-ccweb-violet" />
          Two-factor authentication
        </h2>
        <p className="mt-2 text-sm text-ccweb-muted">Authenticator app + one-time backup codes.</p>
        {!totpStep && (
          <button type="button" className="ccweb-outline-btn mt-4 min-h-[44px] text-sm" onClick={beginTotp}>
            Set up authenticator
          </button>
        )}
        {totpStep === "scan" && (
          <div className="mt-4 space-y-3">
            {otpQr && (
              <div className="flex justify-center rounded-xl bg-white p-3">
                <img src={otpQr} alt="Authenticator QR" width={160} height={160} className="h-40 w-40" />
              </div>
            )}
            <p className="text-xs text-ccweb-muted break-all">Secret: {totpSecret}</p>
            <input
              className="ccweb-input"
              placeholder="6-digit code"
              inputMode="numeric"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
            />


            <button type="button" className="ccweb-gradient-btn min-h-[44px] text-sm" onClick={confirmTotp}>
              Confirm &amp; enable
            </button>
          </div>
        )}
        {totpStep === "done" && backupCodes?.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="text-sm font-medium text-amber-100">Backup codes (save offline)</p>
            <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs text-amber-50">
              {backupCodes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {err && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {formatUserFacingError(err, "Could not save profile.")}
        </p>
      )}
      {msg && <p className="text-sm text-emerald-300">{msg}</p>}

      <button
        type="button"
        className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 py-3 text-sm font-semibold text-rose-200"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>

      <ProfileBottomSheet open={editOpen} title="Edit profile" onClose={() => setEditOpen(false)}>
        <div className="space-y-5">
          <p className="text-xs text-ccweb-muted">Update how others see you on CCWEB.</p>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ccweb-muted">Display name</label>
            <input className="ccweb-input mt-1.5 min-h-[44px]" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-ccweb-muted">Bio</label>
            <textarea className="ccweb-input mt-1.5 min-h-[100px] resize-y" maxLength={500} placeholder="Tell the community about yourself…" value={bio} onChange={(e) => setBio(e.target.value)} />
            <p className="mt-1 text-[10px] text-ccweb-muted">{bio.length}/500 · use #tags for interests</p>
          </div>
          <div>
            <label className="text-xs font-medium text-ccweb-muted">Location</label>
            <input className="ccweb-input mt-1" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-ccweb-muted">Website</label>
            <input className="ccweb-input mt-1" placeholder="https://…" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-ccweb-muted">Public URL slug</label>
            <input
              className="ccweb-input mt-1 font-mono text-sm"
              placeholder="jamie-trader"
              value={betaSlug}
              onChange={(e) => setBetaSlug(e.target.value)}
            />


            <p className="mt-1 text-[11px] text-ccweb-muted">Becomes /u/your-slug</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ccweb-muted">Social link</p>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row">
              <input
                className="ccweb-input sm:flex-1"
                placeholder="Label"
                value={socialLinkLabel}
                onChange={(e) => setSocialLinkLabel(e.target.value)}
              />


              <input
                className="ccweb-input sm:flex-[2]"
                placeholder="https://…"
                value={socialLinkUrl}
                onChange={(e) => setSocialLinkUrl(e.target.value)}
              />


            </div>
            {socialLinks.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-ccweb-muted">
                {socialLinks.map((l, i) => (
                  <li key={`${l.url}-${i}`} className="flex justify-between gap-2">
                    <span className="truncate">{l.label}: {l.url}</span>
                    <button
                      type="button"
                      className="shrink-0 text-rose-300"
                      onClick={() => setSocialLinks((arr) => arr.filter((_, j) => j !== i))}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* WhatsApp & X (Twitter) quick-connect */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
            <p className="text-xs font-semibold text-ccweb-muted uppercase tracking-wider">Quick connect</p>
            <div className="flex items-center gap-3">
              <span className="text-lg">📱</span>
              <input
                className="ccweb-input flex-1"
                placeholder="WhatsApp number or link"
                value={whatsappHandle}
                onChange={(e) => setWhatsappHandle(e.target.value)}
              />


            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg text-[#1DA1F2]">X</span>
              <input
                className="ccweb-input flex-1"
                placeholder="X / Twitter profile URL"
                value={twitterHandle}
                onChange={(e) => setTwitterHandle(e.target.value)}
              />


            </div>
            <p className="text-[10px] text-ccweb-muted">These appear as connect buttons on your public profile.</p>
          </div>
          <label className="flex min-h-[44px] items-center gap-2 text-sm text-ccweb-muted">
            <input type="checkbox" checked={pushEnabled} onChange={(e) => setPushEnabled(e.target.checked)} />
            Product updates &amp; session alerts
          </label>
          <button
            type="button"
            className="ccweb-gradient-btn w-full min-h-[44px] text-sm"
            disabled={saveBusy}
            onClick={saveProfile}
          >
            {saveBusy ? "Saving…" : "Save profile"}
          </button>
        </div>
      </ProfileBottomSheet>

      <p className="text-center text-xs text-ccweb-muted">
        <Link to="/dashboard" className="text-ccweb-cyan hover:underline">
          Classic dashboard
        </Link>
      </p>
    </div>
  );
}
