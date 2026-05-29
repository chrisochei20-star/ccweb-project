/** UI guard: show an error instead of an indefinite loading state. */
export const CCWEB_UI_LOAD_TIMEOUT_MS = 12000;

/** Network bound for initial `/api/auth/me` hydration (split Vercel ↔ Railway). */
export const CCWEB_AUTH_HYDRATION_TIMEOUT_MS = 12000;
