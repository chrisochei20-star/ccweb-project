import { create } from "zustand";

export const useLearningStore = create((set) => ({
  activeRoomId: null,
  joinedAt: null,
  watchMinutes: 0,
  isLiveJoined: false,
  sseUrl: null,
  lastQuote: null,
  setSessionState: (partial) => set(partial),
  resetSession: () =>
    set({
      activeRoomId: null,
      joinedAt: null,
      watchMinutes: 0,
      isLiveJoined: false,
      sseUrl: null,
    }),
}));
