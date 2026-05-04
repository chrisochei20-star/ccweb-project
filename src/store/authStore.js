import { create } from "zustand";
import { api, unwrap } from "../lib/api";
import { clearSession, getSessionToken, getStoredUser, setSession } from "../session";

const TWOFA_PENDING = "ccweb_2fa_pending_token";

export const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  loading: false,
  error: null,

  setUser: (user) => set({ user }),

  hydrate: async () => {
    const token = getSessionToken();
    if (!token) {
      set({ user: null });
      return null;
    }
    set({ loading: true, error: null });
    try {
      const data = await unwrap(api.get("/api/auth/me"));
      set({ user: data.user, loading: false });
      return data.user;
    } catch {
      clearSession();
      set({ user: null, loading: false });
      return null;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await unwrap(
        api.post("/api/auth/login", { email, password })
      );
      if (data.needsTwoFactor && data.twoFactorToken) {
        try {
          sessionStorage.setItem(TWOFA_PENDING, data.twoFactorToken);
        } catch {
          /* ignore */
        }
        set({ loading: false });
        return { needsTwoFactor: true, twoFactorToken: data.twoFactorToken };
      }
      const access = data.accessToken || data.token;
      setSession(access, data.user, data.refreshToken);
      set({ user: data.user, loading: false });
      return { ok: true, user: data.user };
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  completeTwoFactor: async (codeOrBackup) => {
    const token = (() => {
      try {
        return sessionStorage.getItem(TWOFA_PENDING);
      } catch {
        return null;
      }
    })();
    if (!token) throw new Error("Missing 2FA session. Log in again.");
    set({ loading: true, error: null });
    try {
      const data = await unwrap(
        api.post("/api/auth/login/2fa", {
          twoFactorToken: token,
          code: String(codeOrBackup || "").trim(),
        })
      );
      try {
        sessionStorage.removeItem(TWOFA_PENDING);
      } catch {
        /* ignore */
      }
      const access = data.accessToken || data.token;
      setSession(access, data.user, data.refreshToken);
      set({ user: data.user, loading: false });
      return data.user;
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  register: async ({ email, password, displayName }) => {
    set({ loading: true, error: null });
    try {
      await unwrap(
        api.post("/api/auth/register", {
          email,
          password,
          displayName: displayName?.trim() || undefined,
        })
      );
      set({ loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  logout: async () => {
    const token = getSessionToken();
    const refresh = getRefreshToken();
    if (token) {
      try {
        await api.post("/api/auth/logout", { refreshToken: refresh || undefined });
      } catch {
        /* ignore */
      }
    }
    clearSession();
    try {
      sessionStorage.removeItem(TWOFA_PENDING);
    } catch {
      /* ignore */
    }
    set({ user: null });
  },

  walletConnect: async ({ address, signature, message, chainType, nonce }) => {
    set({ loading: true, error: null });
    try {
      const data = await unwrap(
        api.post("/api/auth/wallet/connect", {
          address,
          signature,
          message,
          chainType,
          nonce,
        })
      );
      const access = data.accessToken || data.token;
      setSession(access, data.user, data.refreshToken);
      set({ user: data.user, loading: false });
      return data.user;
    } catch (e) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },
}));

export function getPendingTwoFactorToken() {
  try {
    return sessionStorage.getItem(TWOFA_PENDING);
  } catch {
    return null;
  }
}
