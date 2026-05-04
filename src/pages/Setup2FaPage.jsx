import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { GlassCard } from "../ui/GlassCard";
import { GhostInput } from "../ui/GhostInput";
import { PrimaryButton } from "../ui/PrimaryButton";
import { api, unwrap } from "../lib/api";
import { useAuthStore } from "../store/authStore";

export function Setup2FaPage() {
  const { user } = useAuthStore();
  const [step, setStep] = useState("begin");
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  async function begin() {
    setErr(null);
    setLoading(true);
    try {
      const data = await unwrap(api.post("/api/auth/2fa/setup", { step: "begin" }));
      setOtpauthUrl(data.otpauthUrl || "");
      setSecret(data.secret || "");
      setStep("scan");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirm(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const data = await unwrap(api.post("/api/auth/2fa/setup", { step: "confirm", code: code.trim() }));
      setBackupCodes(data.backupCodes || []);
      setStep("done");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 py-4">
      <header>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ccweb-cyan">Security</span>
        <h1 className="mt-1 text-2xl font-bold text-ccweb-text">Google Authenticator (2FA)</h1>
        <p className="mt-2 text-sm text-ccweb-muted">
          Scan the QR in your app, then confirm with a 6-digit code. Backup codes are shown once — store them safely.
        </p>
      </header>

      {step === "begin" && (
        <GlassCard>
          <PrimaryButton type="button" disabled={loading} onClick={begin} className="w-full">
            {loading ? "Starting…" : "Start setup"}
          </PrimaryButton>
          {err ? <p className="mt-3 text-sm text-red-400">{err}</p> : null}
        </GlassCard>
      )}

      {step === "scan" && (
        <GlassCard>
          <p className="text-sm text-ccweb-muted">Scan this QR in Google Authenticator or Authy.</p>
          {otpauthUrl ? (
            <div className="mt-4 flex justify-center rounded-[16px] border border-white/10 bg-white p-3">
              <img
                alt="2FA QR"
                className="h-44 w-44"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=176x176&data=${encodeURIComponent(otpauthUrl)}`}
              />
            </div>
          ) : null}
          <p className="mt-3 break-all font-mono text-xs text-ccweb-muted">Secret: {secret}</p>
          <form className="mt-4 space-y-3" onSubmit={confirm}>
            <div>
              <label className="mb-1 block text-xs text-ccweb-muted" htmlFor="code">
                Verification code
              </label>
              <GhostInput id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="000000" />
            </div>
            {err ? <p className="text-sm text-red-400">{err}</p> : null}
            <PrimaryButton type="submit" disabled={loading} className="w-full">
              {loading ? "Saving…" : "Enable 2FA"}
            </PrimaryButton>
          </form>
        </GlassCard>
      )}

      {step === "done" && backupCodes && (
        <GlassCard>
          <h2 className="font-semibold text-ccweb-text">Backup codes</h2>
          <p className="mt-2 text-sm text-ccweb-muted">Save these offline. They won&apos;t be shown again.</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs text-ccweb-sky-200 sm:text-sm">
            {backupCodes.map((c) => (
              <li key={c} className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5">
                {c}
              </li>
            ))}
          </ul>
          <Link to="/profile" className="mt-4 inline-block text-sm font-medium text-ccweb-sky-300 hover:underline">
            Back to profile →
          </Link>
        </GlassCard>
      )}
    </div>
  );
}
