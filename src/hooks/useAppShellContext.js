import { useOutletContext } from "react-router-dom";

/**
 * Shell auth state from {@link MobileLayout} (user, authHydrated, refreshSession).
 * Nested layouts (e.g. ProtectedLayout) must forward the same object via `<Outlet context={…} />`.
 *
 * @returns {{ user?: object | null; setUser?: (u: object | null) => void; authHydrated?: boolean; refreshSession?: () => Promise<void> }}
 */
export function useAppShellContext() {
  return useOutletContext() || {};
}
