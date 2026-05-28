import { create } from "zustand";
import { fetchMyProfile } from "../api/profileApi";
import { setSession } from "../session";

/**
 * Central profile state — keeps session user, social counts, and monetization in sync across routes.
 */
export const useProfileStore = create((set, get) => ({
  user: null,
  betaSlug: null,
  betaPublicUrl: null,
  social: { followers: 0, following: 0 },
  creator: null,
  monetization: null,
  stats: { postCount: 0 },
  loading: false,
  error: null,
  lastFetchedAt: null,
  offline: false,

  /** Apply user from session shell without wiping extended bundle fields. */
  applySessionUser: (user) => {
    if (!user) {
      set({
        user: null,
        betaSlug: null,
        betaPublicUrl: null,
        social: { followers: 0, following: 0 },
        creator: null,
        monetization: null,
        stats: { postCount: 0 },
      });
      return;
    }
    set((s) => ({
      user: { ...(s.user || {}), ...user },
    }));
  },

  applyBundle: (bundle) => {
    if (!bundle?.user) return;
    set({
      user: bundle.user,
      betaSlug: bundle.betaSlug ?? null,
      betaPublicUrl: bundle.betaPublicUrl ?? null,
      social: bundle.social || { followers: 0, following: 0 },
      creator: bundle.creator ?? null,
      monetization: bundle.monetization ?? null,
      stats: bundle.stats || { postCount: 0 },
      error: null,
      offline: false,
      lastFetchedAt: Date.now(),
    });
  },

  patchUser: (patch) => {
    set((s) => {
      if (!s.user) return s;
      const next = { ...s.user, ...patch };
      return { user: next };
    });
  },

  syncUserEverywhere: (user, token) => {
    if (!user) return;
    get().applySessionUser(user);
    if (token) setSession(token, user);
  },

  hydrateMe: async () => {
    set({ loading: true, error: null, offline: false });
    try {
      const bundle = await fetchMyProfile();
      get().applyBundle(bundle);
      return bundle;
    } catch (e) {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      set({
        loading: false,
        error: e.message || "Could not load profile.",
        offline,
      });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  reset: () =>
    set({
      user: null,
      betaSlug: null,
      betaPublicUrl: null,
      social: { followers: 0, following: 0 },
      creator: null,
      monetization: null,
      stats: { postCount: 0 },
      loading: false,
      error: null,
      lastFetchedAt: null,
      offline: false,
    }),
}));

export function syncProfileFromUpload(token, data) {
  const user = data?.user;
  if (!user) return;
  useProfileStore.getState().syncUserEverywhere(user, token);
}
