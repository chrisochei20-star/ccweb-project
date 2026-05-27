import { create } from "zustand";
import { fetchNotificationSummary } from "../api/notificationsApi";

/**
 * Cross-route notification badge + realtime tick state (Socket.IO `notifications:update`).
 * List payloads still live in page components; this store only holds summary + invalidation generation.
 */
export const useNotificationsStore = create((set) => ({
  unreadCount: null,
  lastSummaryAt: null,
  /** Increments on every socket tick so subscribers can refetch lists. */
  socketGeneration: 0,

  setSummary: (unreadCount) =>
    set({
      unreadCount: typeof unreadCount === "number" ? unreadCount : Number(unreadCount) || 0,
      lastSummaryAt: Date.now(),
    }),

  /** Merge summary response object `{ unreadCount }` from API. */
  applySummaryPayload: (payload) => {
    const n = payload?.unreadCount;
    set({
      unreadCount: typeof n === "number" ? n : Number(n) || 0,
      lastSummaryAt: Date.now(),
    });
  },

  notifySocketTick: () =>
    set((s) => ({
      socketGeneration: s.socketGeneration + 1,
      lastSummaryAt: Date.now(),
    })),

  /** After mark-all-read or optimistic row update, caller sets exact count. */
  setUnread: (n) => set({ unreadCount: Math.max(0, Number(n) || 0) }),

  reset: () => set({ unreadCount: null, lastSummaryAt: null, socketGeneration: 0 }),
}));

export async function pullNotificationSummaryIntoStore() {
  const s = await fetchNotificationSummary();
  useNotificationsStore.getState().applySummaryPayload(s);
}
