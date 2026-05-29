import { isCapacitorNative } from "./capacitorPlatform";

const MIGRATION_FLAG = "ccweb_auth_migrated_to_persistent";

function getWindow() {
  return typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null;
}

/**
 * Auth tokens in sessionStorage on web; localStorage on Capacitor so sessions survive app restarts.
 */
function primaryStore() {
  const w = getWindow();
  if (!w) return null;
  if (isCapacitorNative()) return w.localStorage ?? null;
  return w.sessionStorage ?? null;
}

function secondaryStore() {
  const w = getWindow();
  if (!w || !isCapacitorNative()) return null;
  return w.sessionStorage ?? null;
}

function migrateSessionToLocalIfNeeded() {
  const w = getWindow();
  if (!isCapacitorNative() || !w?.localStorage || !w?.sessionStorage) return;
  try {
    if (w.localStorage.getItem(MIGRATION_FLAG) === "1") return;
    const keys = ["ccweb_session_token", "ccweb_user", "ccweb_refresh_token"];
    for (const key of keys) {
      const fromSession = w.sessionStorage.getItem(key);
      const inLocal = w.localStorage.getItem(key);
      if (fromSession && !inLocal) {
        w.localStorage.setItem(key, fromSession);
      }
    }
    w.localStorage.setItem(MIGRATION_FLAG, "1");
  } catch {
    /* ignore quota / privacy mode */
  }
}

export function authStorageGetItem(key) {
  migrateSessionToLocalIfNeeded();
  const primary = primaryStore();
  if (!primary) return null;
  try {
    const v = primary.getItem(key);
    if (v != null) return v;
    const secondary = secondaryStore();
    return secondary ? secondary.getItem(key) : null;
  } catch {
    return null;
  }
}

export function authStorageSetItem(key, value) {
  migrateSessionToLocalIfNeeded();
  const primary = primaryStore();
  if (!primary) return;
  try {
    if (value == null || value === "") {
      primary.removeItem(key);
      secondaryStore()?.removeItem(key);
    } else {
      primary.setItem(key, value);
    }
  } catch {
    /* ignore */
  }
}

export function authStorageRemoveItem(key) {
  migrateSessionToLocalIfNeeded();
  try {
    primaryStore()?.removeItem(key);
    secondaryStore()?.removeItem(key);
  } catch {
    /* ignore */
  }
}
