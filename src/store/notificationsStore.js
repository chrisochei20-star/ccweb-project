import { create } from "zustand";
import {
  fetchNotificationSummary,
  fetchNotifications,
  fetchNotificationPreferences,
  markNotificationsRead,
  updateNotificationPreferences,
} from "../api/notificationsApi";
import { broadcastNotificationsCrossTab } from "../lib/realtimeSocket";
import { realtimeLog } from "../lib/realtimeLog";

const DEFAULT_PREFS = {
  inApp: { chat: true, community: true, learn: true, earn: true, follow: true },
  browserPush: { enabled: false, subscribedAt: null },
  nativePush: { enabled: false },
  quietHours: null,
};

let refreshTimer = null;
let summaryTimer = null;

async function fetchSummaryWithRetry(retries = 2) {
  let lastErr;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await fetchNotificationSummary();
    } catch (e) {
      lastErr = e;
      if (i < retries) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw lastErr;
}

/**
 * Central notification state — badge, lists, prefs, cross-tab sync, debounced socket refresh.
 */
export const useNotificationsStore = create((set, get) => ({
  unreadCount: null,
  lastSummaryAt: null,
  socketGeneration: 0,
  items: [],
  previewItems: [],
  grouped: [],
  nextCursor: null,
  loading: false,
  loadingMore: false,
  error: null,
  prefs: DEFAULT_PREFS,
  offline: false,

  setSummary: (unreadCount) =>
    set({
      unreadCount: typeof unreadCount === "number" ? unreadCount : Number(unreadCount) || 0,
      lastSummaryAt: Date.now(),
      error: null,
    }),

  applySummaryPayload: (payload) => {
    const n = payload?.unreadCount;
    set({
      unreadCount: typeof n === "number" ? n : Number(n) || 0,
      lastSummaryAt: Date.now(),
      error: null,
      offline: false,
    });
  },

  notifySocketTick: () => {
    set((s) => ({
      socketGeneration: s.socketGeneration + 1,
      lastSummaryAt: Date.now(),
    }));
    get().scheduleRefresh();
  },

  scheduleRefresh: () => {
    if (refreshTimer) window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => {
      void get().refreshSummary();
    }, 320);
  },

  scheduleListRefresh: () => {
    if (summaryTimer) window.clearTimeout(summaryTimer);
    summaryTimer = window.setTimeout(() => {
      void get().refreshPreview();
    }, 380);
  },

  setUnread: (n) => set({ unreadCount: Math.max(0, Number(n) || 0) }),

  setItems: (items, { append = false, grouped = [], nextCursor = null } = {}) =>
    set((s) => ({
      items: append ? dedupeNotifications([...s.items, ...items]) : dedupeNotifications(items),
      grouped: grouped.length ? grouped : s.grouped,
      nextCursor: nextCursor !== undefined ? nextCursor : s.nextCursor,
      error: null,
    })),

  setPreviewItems: (items) => set({ previewItems: dedupeNotifications(items) }),

  applyCrossTabSync: (payload) => {
    if (!payload || typeof payload !== "object") return;
    if (typeof payload.unreadCount === "number") {
      set({ unreadCount: Math.max(0, payload.unreadCount), lastSummaryAt: Date.now() });
    }
    if (payload.markAllRead) {
      set((s) => ({
        unreadCount: 0,
        items: s.items.map((x) => ({ ...x, read: true, readAt: x.readAt || new Date().toISOString() })),
        previewItems: s.previewItems.map((x) => ({ ...x, read: true })),
      }));
    }
    if (Array.isArray(payload.readIds) && payload.readIds.length) {
      const ids = new Set(payload.readIds);
      set((s) => ({
        items: s.items.map((x) => (ids.has(x.id) ? { ...x, read: true, readAt: new Date().toISOString() } : x)),
        previewItems: s.previewItems.map((x) => (ids.has(x.id) ? { ...x, read: true } : x)),
        unreadCount:
          typeof payload.unreadCount === "number"
            ? Math.max(0, payload.unreadCount)
            : Math.max(0, (s.unreadCount ?? 0) - payload.readIds.length),
      }));
    }
    if (payload.prefs && typeof payload.prefs === "object") {
      set((s) => ({
        prefs: { ...DEFAULT_PREFS, ...s.prefs, ...payload.prefs },
      }));
    }
  },

  refreshSummary: async () => {
    try {
      const s = await fetchSummaryWithRetry();
      get().applySummaryPayload(s);
      realtimeLog("notifications_summary_ok", { unread: s.unreadCount });
      return s;
    } catch (e) {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      set({ error: e.message || "Summary failed", offline });
      realtimeLog("notifications_summary_failed", { err: e.message, offline });
      throw e;
    }
  },

  refreshPreview: async () => {
    set({ loading: true, error: null });
    try {
      await get().refreshSummary();
      const data = await fetchNotifications({ limit: 8 });
      get().setPreviewItems(data.items || []);
      return data;
    } catch (e) {
      set({ error: e.message || "Could not load notifications" });
      throw e;
    } finally {
      set({ loading: false });
    }
  },

  loadPage: async ({ cursor = null, append = false, grouped = false } = {}) => {
    if (append) set({ loadingMore: true });
    else set({ loading: true, error: null });
    try {
      const data = await fetchNotifications({ limit: 25, cursor, grouped });
      get().setItems(data.items || [], {
        append,
        grouped: data.grouped || [],
        nextCursor: data.nextCursor || null,
      });
      await get().refreshSummary();
      return data;
    } catch (e) {
      set({ error: e.message || "Could not load notifications" });
      throw e;
    } finally {
      set({ loading: false, loadingMore: false });
    }
  },

  markReadOptimistic: async ({ markAll = false, ids = [] } = {}) => {
    const prevUnread = get().unreadCount ?? 0;
    if (markAll) {
      set((s) => ({
        unreadCount: 0,
        items: s.items.map((x) => ({ ...x, read: true, readAt: x.readAt || new Date().toISOString() })),
        previewItems: s.previewItems.map((x) => ({ ...x, read: true })),
      }));
      broadcastNotificationsCrossTab({ markAllRead: true, unreadCount: 0 });
    } else if (ids.length) {
      const idSet = new Set(ids);
      set((s) => ({
        unreadCount: Math.max(0, (s.unreadCount ?? 0) - ids.length),
        items: s.items.map((x) => (idSet.has(x.id) ? { ...x, read: true, readAt: new Date().toISOString() } : x)),
        previewItems: s.previewItems.map((x) => (idSet.has(x.id) ? { ...x, read: true } : x)),
      }));
      broadcastNotificationsCrossTab({ readIds: ids, unreadCount: Math.max(0, prevUnread - ids.length) });
    }
    try {
      const result = await markNotificationsRead({ markAll, ids });
      await get().refreshSummary();
      return result;
    } catch (e) {
      await get().refreshPreview();
      throw e;
    }
  },

  loadPreferences: async () => {
    try {
      const data = await fetchNotificationPreferences();
      set({ prefs: { ...DEFAULT_PREFS, ...(data.preferences || {}) } });
      return data;
    } catch (e) {
      realtimeLog("notification_prefs_load_failed", { err: e.message });
      return { preferences: DEFAULT_PREFS };
    }
  },

  savePreferences: async (patch) => {
    const data = await updateNotificationPreferences(patch);
    set({ prefs: { ...DEFAULT_PREFS, ...(data.preferences || {}) } });
    broadcastNotificationsCrossTab({ prefs: data.preferences });
    return data;
  },

  reset: () =>
    set({
      unreadCount: null,
      lastSummaryAt: null,
      socketGeneration: 0,
      items: [],
      previewItems: [],
      grouped: [],
      nextCursor: null,
      loading: false,
      loadingMore: false,
      error: null,
      prefs: DEFAULT_PREFS,
      offline: false,
    }),
}));

function dedupeNotifications(items) {
  if (!Array.isArray(items)) return [];
  const seen = new Set();
  return items.filter((n) => {
    if (!n?.id || seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });
}

export async function pullNotificationSummaryIntoStore() {
  return useNotificationsStore.getState().refreshSummary();
}

export async function initNotificationsRealtime() {
  const store = useNotificationsStore.getState();
  try {
    await store.refreshSummary();
  } catch {
    /* shell can retry */
  }
}
