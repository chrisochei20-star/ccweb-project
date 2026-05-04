import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GlassCard } from "../ui/GlassCard";
import { GhostInput } from "../ui/GhostInput";
import { PrimaryButton } from "../ui/PrimaryButton";
import { useAuthStore } from "../store/authStore";

import { getPendingTwoFactorToken } from "../store/authStore";

export function TwoFactorLoginPage() {
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();
  const { completeTwoFactor, loading } = useAuthStore();

  useEffect(() => {
    if (!getPendingTwoFactorToken()) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    try {
      await completeTwoFactor(useBackup ? backup.trim() : code.trim());
      navigate("/dashboard", { replace: true });
    } catch (e2) {
      setErr(e2.message);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <GlassCard>
        <h1 className="text-xl font-bold text-ccweb-text">Two-factor authentication</h1>
        <p className="mt-2 text-sm text-ccweb-muted">
          Enter the 6-digit code from your authenticator app, or use a one-time backup code.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          {!useBackup ? (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ccweb-muted" htmlFor="totp">
                Authenticator code
              </label>
              <GhostInput
                id="totp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
                placeholder="000000"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ccweb-muted" htmlFor="backup">
                Backup code
              </label>
              <GhostInput
                id="backup"
                value={backup}
                onChange={(e) => setBackup(e.target.value.trim())}
                placeholder="XXXXXXXX"
              />
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ccweb-muted">
            <input type="checkbox" checked={useBackup} onChange={(e) => setUseBackup(e.target.checked)} />
            Use backup code instead
          </label>
          {err ? <p className="text-sm text-red-400">{err}</p> : null}
          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? "Verifying…" : "Continue"}
          </PrimaryButton>
        </form>
        <p className="mt-4 text-center text-sm text-ccweb-muted">
          <Link to="/login" className="text-ccweb-sky-300 hover:underline">
            Back to login
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
