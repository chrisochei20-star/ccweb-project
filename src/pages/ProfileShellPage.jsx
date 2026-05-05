import { KeyRound, LogOut, Shield, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
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

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPushEnabled(user.pushEnabled !== false);
    }
  }, [user]);

  async function saveProfile() {
    if (!user) return;
    setErr(null);
    setMsg(null);
    const token = getSessionToken();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user.id,
          displayName: displayName.trim(),
          pushEnabled,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setUser(data);
      setSession(token, data, undefined);
      setMsg("Profile saved.");
    } catch (e) {
      setErr(e.message);
    }
  }

  async function beginTotp() {
    setErr(null);
    setMsg(null);
    setBackupCodes(null);
    const token = getSessionToken();
    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ step: "begin" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Setup failed");
      setTotpSecret(data.secret || "");
      setTotpUrl(data.otpauthUrl || "");
      setTotpStep("scan");
    } catch (e) {
      setErr(e.message);
    }
  }

  async function confirmTotp() {
    setErr(null);
    const token = getSessionToken();
    try {
      const res = await fetch("/api/auth/2fa/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ step: "confirm", code: totpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      setBackupCodes(data.backupCodes || []);
      setTotpStep("done");
      setMsg("Two-factor authentication enabled.");
      const me = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (me.user) {
        setUser(me.user);
        setSession(token, me.user, undefined);
      }
    } catch (e) {
      setErr(e.message);
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
    <div className="mx-auto max-w-lg space-y-5 px-3 pb-24 pt-4 md:max-w-xl">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-ccweb-muted">Profile</p>
        <h1 className="mt-1 text-2xl font-bold text-white">Account</h1>
        <p className="mt-1 text-sm text-ccweb-muted">{user.email || "Wallet-only account"}</p>
      </header>

      <section className="ccweb-glass rounded-2xl p-5">
        <h2 className="flex items-center gap-2 font-semibold text-white">
          <KeyRound className="h-5 w-5 text-ccweb-cyan" />
          Identity
        </h2>
        <label className="mt-4 block text-xs font-medium text-ccweb-muted">Display name</label>
        <input className="ccweb-input mt-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
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
