import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { BrowserProvider, getAddress } from "ethers";
import { setSession } from "../session";
import { CcwebBrandMark } from "../components/brand/CcwebBrandMark";
import { apiUrl, getApiBaseUrl } from "../config/env";
import { apiFetch } from "../lib/apiClient";
import { isCapacitorNative } from "../lib/capacitorPlatform";

function mapNetworkError(err) {
  const msg = err?.message || String(err);
  if (err?.name === "AbortError" || /request cancelled/i.test(msg)) {
    return "Request timed out. Check your connection and try again.";
  }
  if (msg === "Failed to fetch" || msg === "Load failed" || /network/i.test(msg)) {
    const base = getApiBaseUrl();
    if (isCapacitorNative()) {
      return base
        ? `Cannot reach ${base}. Check mobile data or Wi‑Fi, confirm the API is online, then try again.`
        : "API URL is not configured in this build. Rebuild the APK with VITE_API_BASE_URL set to your Railway API.";
    }
    if (base) {
      return (
        `Cannot reach ${base}. If the API is up, this is usually a CORS or browser-network block: set CCWEB_ALLOWED_ORIGINS on Railway to include your exact Vercel origin (https://…vercel.app), redeploy the API, and confirm VITE_API_BASE_URL matches your Railway public URL.`
      );
    }
    return (
      "API URL is not configured. Set VITE_API_BASE_URL at build time on Vercel (and optionally VITE_CCWEB_PRODUCTION_API_FALLBACK), redeploy the SPA, and set CCWEB_ALLOWED_ORIGINS on the API."
    );
  }
  return msg;
}

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export function LoginPage() {
  const { setUser } = useOutletContext();
  return (
    <AuthPage
      mode="login"
      title="Welcome back"
      subtitle="Sign in with email, Google, or your wallet."
      action="Sign in"
      prompt="New here?"
      promptHref="/signup"
      promptLabel="Create account"
      setUser={setUser}
    />
  );
}

export function SignupPage() {
  const { setUser } = useOutletContext();
  return (
    <AuthPage
      mode="signup"
      title="Create your account"
      subtitle="Join CCWEB — learn Web3, ship products, earn."
      action="Create account"
      prompt="Already registered?"
      promptHref="/login"
      promptLabel="Sign in"
      setUser={setUser}
    />
  );
}

function AuthPage({ mode, title, subtitle, action, prompt, promptHref, promptLabel, setUser }) {
  const [searchParams] = useSearchParams();
  const refFromUrl = (searchParams.get("ref") || "").trim();
  const utmSource = (searchParams.get("utm_source") || "").trim();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState(null);
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();

  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

  useEffect(() => {
    let cancelled = false;
    if (!googleClientId) return undefined;
    (async () => {
      try {
        await loadGoogleScript();
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (resp) => {
            const idToken = resp.credential;
            if (!idToken) return;
            setLoading(true);
            setError(null);
            try {
              const r = await apiFetch(
                apiUrl("/api/auth/oauth/google"),
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    idToken,
                    referralCode: refFromUrl || undefined,
                    utm_source: utmSource || undefined,
                  }),
                },
                { networkRetries: 2 }
              );
              const data = await r.json();
              if (!r.ok) throw new Error(data.error || "Google sign-in failed");
              const access = data.accessToken || data.token;
              setSession(access, data.user, data.refreshToken);
              setUser(data.user);
              navigate("/", { replace: true });
            } catch (e) {
              setError(mapNetworkError(e));
            } finally {
              setLoading(false);
            }
          },
        });
        const el = document.getElementById("google-signin-btn");
        if (el) {
          window.google.accounts.id.renderButton(el, {
            theme: "filled_blue",
            size: "large",
            width: 280,
            text: "continue_with",
            shape: "pill",
          });
        }
      } catch {
        /* GIS unavailable */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [googleClientId, navigate, setUser]);

  async function submitPassword() {
    setError(null);
    setLoading(true);
    try {
      if (import.meta.env.VITE_CCWEB_AUTH_TRACE === "1") {
        // eslint-disable-next-line no-console -- gated production diagnostics
        console.info("[ccweb-auth-trace] submitPassword", {
          apiBase: getApiBaseUrl(),
          loginUrl: apiUrl("/api/auth/login"),
          mode,
        });
      }
      if (!getApiBaseUrl()) {
        throw new Error(
        "API URL is not configured. Production builds use repo `.env.production` or set VITE_API_BASE_URL in the host build environment (Vercel, Railway, etc.); optional `<meta name=\"ccweb-api-base-url\">` fallback."
        );
      }
      if (mode === "signup") {
        const reg = await apiFetch(
          apiUrl("/api/auth/register"),
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              email,
              password,
              displayName: displayName.trim() || undefined,
              referralCode: refFromUrl || undefined,
              utm_source: utmSource || undefined,
            }),
          },
          { networkRetries: 2 }
        );
        let regData;
        try {
          regData = await reg.json();
        } catch {
          throw new Error(reg.ok ? "Invalid response from API." : `Registration failed (HTTP ${reg.status}). Check VITE_API_BASE_URL points to your API origin (e.g. Railway).`);
        }
        if (!reg.ok) throw new Error(regData.error || "Registration failed");
      }
      const loginRes = await apiFetch(
        apiUrl("/api/auth/login"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        },
        { networkRetries: 2 }
      );
      let data;
      try {
        data = await loginRes.json();
      } catch {
        throw new Error(
          loginRes.ok ? "Invalid response from API." : `Login failed (HTTP ${loginRes.status}). Check VITE_API_BASE_URL and CORS (CCWEB_ALLOWED_ORIGINS).`
        );
      }
      if (!loginRes.ok) throw new Error(data.error || "Authentication failed");
      if (data.needsTwoFactor && data.twoFactorToken) {
        setTwoFactorToken(data.twoFactorToken);
        setLoading(false);
        return;
      }
      const access = data.accessToken || data.token;
      setSession(access, data.user, data.refreshToken);
      setUser(data.user);
      navigate("/", { replace: true });
    } catch (e) {
      if (import.meta.env.VITE_CCWEB_AUTH_TRACE === "1") {
        // eslint-disable-next-line no-console -- gated production diagnostics
        console.warn("[ccweb-auth-trace] submitPassword error", e?.message || e, e?.cause || "");
      }
      setError(mapNetworkError(e));
    } finally {
      setLoading(false);
    }
  }

  async function submitTwoFactor() {
    setError(null);
    setLoading(true);
    try {
      const loginRes = await apiFetch(
        apiUrl("/api/auth/login/2fa"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ twoFactorToken, code: otp.trim() }),
        },
        { networkRetries: 2 }
      );
      const data = await loginRes.json();
      if (!loginRes.ok) throw new Error(data.error || "Invalid code");
      const access = data.accessToken || data.token;
      setSession(access, data.user, data.refreshToken);
      setUser(data.user);
      navigate("/", { replace: true });
    } catch (e) {
      setError(mapNetworkError(e));
    } finally {
      setLoading(false);
    }
  }

  async function connectWallet() {
    setError(null);
    if (!window.ethereum) {
      setError("MetaMask or another injected wallet is required.");
      return;
    }
    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const nonceRes = await apiFetch(
        apiUrl("/api/auth/wallet/nonce"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        },
        { networkRetries: 2 }
      );
      const nonceJson = await nonceRes.json();
      if (!nonceRes.ok) throw new Error(nonceJson.error || "Nonce failed");
      const { message } = nonceJson;
      const signature = await signer.signMessage(message);
      const verifyRes = await apiFetch(
        apiUrl("/api/auth/wallet/connect"),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            address: getAddress(address),
            message,
            signature,
            chainType: "evm",
            referralCode: refFromUrl || undefined,
            utm_source: utmSource || undefined,
          }),
        },
        { networkRetries: 2 }
      );
      const data = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(data.error || "Wallet verification failed");
      const access = data.accessToken || data.token;
      setSession(access, data.user, data.refreshToken);
      setUser(data.user);
      navigate("/", { replace: true });
    } catch (e) {
      setError(e.shortMessage || mapNetworkError(e));
    } finally {
      setLoading(false);
    }
  }

  const nativeAuth = isCapacitorNative();

  return (
    <div className="mx-auto max-w-md px-3 pb-28 pt-6 md:pb-12 md:pt-8">
      {nativeAuth && (
        <div className="mb-8 flex flex-col items-center text-center">
          <CcwebBrandMark size={72} showGlow className="mb-4" />
          <p className="text-lg font-bold tracking-tight text-white">CCWEB</p>
          <p className="mt-1 max-w-xs text-xs text-ccweb-muted">
            Learn Web3, ship products, and grow your business.
          </p>
        </div>
      )}
      <div className={`rounded-2xl p-6 md:p-8 ${nativeAuth ? "border border-white/10 bg-[#070b14]" : "ccweb-glass"}`}>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        <p className="mt-2 text-sm text-ccweb-muted">{subtitle}</p>

        {!twoFactorToken ? (
          <>
            {mode === "signup" && (
              <label className="mt-6 block">
                <span className="text-xs font-medium text-ccweb-muted">Display name</span>
                <input
                  className="ccweb-input mt-1"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  data-ccweb-e2e="signup-display-name"
                />
              </label>
            )}
            <label className="mt-4 block">
              <span className="text-xs font-medium text-ccweb-muted">Email</span>
              <input
                className="ccweb-input mt-1"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                data-ccweb-e2e="auth-email"
              />
            </label>
            <label className="mt-4 block">
              <span className="text-xs font-medium text-ccweb-muted">Password</span>
              <input
                className="ccweb-input mt-1"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                data-ccweb-e2e="auth-password"
              />
            </label>

            {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}

            <button type="button" className="mt-6 w-full ccweb-gradient-btn" disabled={loading} onClick={submitPassword} data-ccweb-e2e="auth-submit">
              {loading ? "Please wait…" : action}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wide">
                <span className="bg-[rgba(10,19,40,0.95)] px-3 text-ccweb-muted">Or continue with</span>
              </div>
            </div>

            {googleClientId ? (
              <div id="google-signin-btn" className="flex justify-center" />
            ) : (
              <p className="text-center text-xs text-ccweb-muted">
                Set <code className="text-ccweb-cyan">VITE_GOOGLE_CLIENT_ID</code> to enable Google sign-in.
              </p>
            )}

            <button type="button" className="mt-6 flex w-full items-center justify-center gap-2 ccweb-outline-btn" disabled={loading} onClick={connectWallet}>
              <Wallet className="h-4 w-4 shrink-0" aria-hidden />
              Connect MetaMask
            </button>

            <p className="mt-8 text-center text-sm text-ccweb-muted">
              {prompt}{" "}
              <Link to={promptHref} className="font-medium text-ccweb-cyan hover:underline">
                {promptLabel}
              </Link>
              {mode === "login" && (
                <>
                  {" · "}
                  <Link to="/forgot-password" className="hover:underline">
                    Forgot password?
                  </Link>
                </>
              )}
            </p>
          </>
        ) : (
          <>
            <p className="mt-6 text-sm text-ccweb-muted">Enter the 6-digit code from your authenticator app.</p>
            <input
              className="ccweb-input mt-4 tracking-[0.4em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
            <button type="button" className="mt-6 w-full ccweb-gradient-btn" disabled={loading || otp.length < 6} onClick={submitTwoFactor}>
              {loading ? "Verifying…" : "Verify & sign in"}
            </button>
            <button
              type="button"
              className="mt-4 w-full text-sm text-ccweb-muted hover:text-white"
              onClick={() => {
                setTwoFactorToken(null);
                setOtp("");
                setError(null);
              }}
            >
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
