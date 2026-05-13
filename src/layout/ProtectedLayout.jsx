import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getSessionToken } from "../session";

/** Requires a JWT in session storage — pair with API Bearer auth. */
export function ProtectedLayout() {
  const location = useLocation();
  const token = getSessionToken();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
