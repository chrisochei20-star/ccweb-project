import { KeyRound, LogOut, Shield, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { uploadProfileAvatar, uploadProfileBanner } from "../api/uploadsApi";
import { assetsUrl, apiUrl } from "../config/env";
import { ImageDropZone } from "../components/uploads/ImageDropZone";
import { apiFetch } from "../lib/apiClient";
import { toast } from "../lib/toastBus";
import { getSessionToken, logoutApi, setSession } from "../session";

export function ProfileShellPage() {
  const { user, setUser } = useOutletContext() || {};
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [pushEnabled, setPushEnabled] = useState(true);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [totpStep, setTotpStep] = useState(null);
  const [totpSecret, setTotpSecret] = useState("");
  const [totpUrl, setTotpUrl] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [backupCodes, setBackupCodes] = useState(null);

  const [betaSlug, setBetaSlug] = useState("");
  const [mediaBusy, setMediaBusy] = useState({ avatar: false, banner: false });

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPushEnabled(user.pushEnabled !== false);
    }
  }, [user]);

  useEffect(() => {
    const token = getSessionToken();
    if (!token || !user?.id) return;
    let cancelled = false;
    apiFetch(apiUrl("/api/v1/users/me"), { headers: { Authorization: `Bearer ${token}` } }, { networkRetries: 1 })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.betaSlug) setBetaSlug(d.betaSlug);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function saveProfile() {
    if (!user) return;
    setErr(null);
    setMsg(null);
    const token = getSessionToken();
    try {
      const res = await apiFetch(
        apiUrl("/api/v1/users/update"),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            displayName: displayName.trim(),
            pushEnabled,
            betaSlug: betaSlug.trim() || undefined,
          }),
        },
        { networkRetries: 2 }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setUser(data.user);
      setSession(token, data.user);
      if (data.betaSlug) setBetaSlug(data.betaSlug);
      setMsg(data.betaPublicUrl ? `Profile saved. Share: ${data.betaPublicUrl}` : "Profile saved.");
      toast.success("Profile saved.");
    } catch (e) {
      setErr(e.message);
      toast.error(e.message);
    }
  }

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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ step: "confirm", code: totpCode.trim() }),
        },
        { networkRetries: 1 }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setBackupCodes(data.backupCodes || []);
      setTotpStep("done");
      setMsg("Two-factor authentication enabled.");
      toast.success("Two-factor authentication enabled.");
      const meRes = await apiFetch(apiUrl("/api/auth/me"), { headers: { Authorization: `Bearer ${token}` } }, { networkRetries: 1 });
      const me = await meRes.json();
      if (me.user) {
        setUser(me.user);
        setSession(token, me.user);
      }
    } catch (e) {
      setErr(e.message);
      toast.error(e.message);
    }
  }

  async function handleLogout() {
    await logoutApi();
    setUser(null);
    navigate("/login");
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-3 pb-24 pt-8">
        <div className="ccweb-glass rounded-2xl p-6 text-center">
          <p className="text-ccweb-muted">Sign in to manage your profile and security.</p>
          <Link to="/login" className="mt-4 inline-block ccweb-gradient-btn">
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
    <div className="mx-auto max-w-2xl space-y-5 px-3 pb-24 pt-2 md:max-w-3xl">
      <section className="ccweb-stagger relative overflow-hidden rounded-3xl border border-white/10 shadow-[0_24px_80px_-28px_rgba(0,0,0,0.55)]">
        <div
          className="h-36 bg-cover bg-center md:h-44"
          style={{
            backgroundImage: user.bannerUrl
              ? `url(${assetsUrl(user.bannerUrl)})`
              : "linear-gradient(120deg, rgba(34,211,238,0.45), rgba(167,139,250,0.45))",
          }}
        />
        <div className="relative flex flex-col gap-1 border-t border-white/10 bg-black/50 px-5 pb-5 pt-14 backdrop-blur-lg">
          <div className="absolute -top-12 left-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#070b14] bg-gradient-to-br from-ccweb-cyan/35 to-ccweb-violet/30 text-lg font-bold text-white shadow-2xl ring-1 ring-white/15">
            {user.avatarUrl ? (
              <img src={assetsUrl(user.avatarUrl)} alt="" className="h-full w-full object-cover" />
            ) : (
              <span>{(user.displayName || "?").slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ccweb-muted">Public profile</p>
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{user.displayName || "Member"}</h1>
          <p className="text-sm text-ccweb-muted">{user.email || "Wallet-linked account"}</p>
        </div>
      </section>

      <section className="ccweb-glass rounded-2xl p-5">
        <h2 className="font-semibold text-white">Profile appearance</h2>
        <p className="mt-1 text-sm text-ccweb-muted">
          Banner and avatar are stored securely (Cloudinary when configured, otherwise the API host). JPEG/PNG/WebP/GIF —
          validated on the server.
        </p>
        <div className="mt-4 space-y-5">
          <ImageDropZone
            label="Banner"
            hint="Wide image · drag & drop or tap"
            busy={mediaBusy.banner}
            aspectClass="aspect-[21/9] max-h-40"
            previewUrl={user.bannerUrl ? assetsUrl(user.bannerUrl) : null}
            onFile={async (file) => {
              setErr(null);
              setMsg(null);
              const token = getSessionToken();
              setMediaBusy((m) => ({ ...m, banner: true }));
              try {
                const data = await uploadProfileBanner(file, token);
                setUser(data.user);
                setSession(token, data.user);
                setMsg("Banner updated.");
              } catch (e) {
                setErr(e.message);
              } finally {
                setMediaBusy((m) => ({ ...m, banner: false }));
              }
            }}
          >
            Upload banner
          </ImageDropZone>
          <div className="max-w-[160px]">
            <ImageDropZone
              label="Avatar"
              hint="Square · compressed before upload"
              busy={mediaBusy.avatar}
              aspectClass="aspect-square max-w-[160px]"
              previewUrl={user.avatarUrl ? assetsUrl(user.avatarUrl) : null}
              onFile={async (file) => {
                setErr(null);
                setMsg(null);
                const token = getSessionToken();
                setMediaBusy((m) => ({ ...m, avatar: true }));
                try {
                  const data = await uploadProfileAvatar(file, token);
                  setUser(data.user);
                  setSession(token, data.user);
                  setMsg("Profile photo updated.");
                } catch (e) {
                  setErr(e.message);
                } finally {
                  setMediaBusy((m) => ({ ...m, avatar: false }));
                }
              }}
            >
              Upload avatar
            </ImageDropZone>
          </div>
        </div>
      </section>

      <section className="ccweb-glass rounded-2xl p-5">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <KeyRound className="h-5 w-5 text-ccweb-cyan" />
          Identity
        </h2>
        <label className="mt-4 block text-xs font-medium text-ccweb-muted">Display name</label>
        <input className="ccweb-input mt-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <label className="mt-4 block text-xs font-medium text-ccweb-muted">Public beta URL slug</label>
        <p className="mt-1 text-xs text-ccweb-muted">
          Letters, numbers, hyphens — becomes <code className="text-ccweb-cyan">/u/your-slug</code>
        </p>
        <input
          className="ccweb-input mt-1 font-mono text-sm"
          placeholder="e.g. jamie-trader"
          value={betaSlug}
          onChange={(e) => setBetaSlug(e.target.value)}
        />
        <label className="mt-4 flex items-center gap-2 text-sm text-ccweb-muted">
          <input type="checkbox" checked={pushEnabled} onChange={(e) => setPushEnabled(e.target.checked)} />
          Product updates &amp; session alerts
        </label>
        {err && <p className="mt-3 text-sm text-rose-300">{err}</p>}
        {msg && <p className="mt-3 text-sm text-emerald-300">{msg}</p>}
        <button type="button" className="mt-4 ccweb-gradient-btn text-sm" onClick={saveProfile}>
          Save profile
        </button>
      </section>

      <section className="ccweb-glass rounded-2xl p-5">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <Wallet className="h-5 w-5 text-ccweb-green" />
          Wallet
        </h2>
        <p className="mt-2 text-sm text-ccweb-muted">
          {user.walletAddress || user.walletEvm
            ? `Linked: ${user.walletAddress || user.walletEvm}`
            : "Connect from the login screen with MetaMask to link an address."}
        </p>
      </section>

      <section className="ccweb-glass rounded-2xl p-5">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <Shield className="h-5 w-5 text-ccweb-violet" />
          Two-factor authentication
        </h2>
        <p className="mt-2 text-sm text-ccweb-muted">
          Use Google Authenticator or another TOTP app. Backup codes are shown once after confirmation.
        </p>
        {!totpStep && (
          <button type="button" className="mt-4 ccweb-outline-btn text-sm" onClick={beginTotp}>
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
            <p className="text-xs text-ccweb-muted break-all">Secret (manual entry): {totpSecret}</p>
            <input
              className="ccweb-input"
              placeholder="6-digit code"
              inputMode="numeric"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
            />
            <button type="button" className="ccweb-gradient-btn text-sm" onClick={confirmTotp}>
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

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 py-3 text-sm font-semibold text-rose-200"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>

      <p className="text-center text-xs text-ccweb-muted">
        <Link to="/dashboard" className="text-ccweb-cyan hover:underline">
          Classic dashboard
        </Link>
      </p>
    </div>
  );
}
