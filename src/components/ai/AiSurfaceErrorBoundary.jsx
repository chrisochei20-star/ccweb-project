import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { reportClientError } from "../../lib/clientAnalytics";
import { logAiClient } from "../../lib/aiDiagnostics";

/**
 * Error boundary scoped to AI surfaces (tutor, intelligence dashboards).
 */
export class AiSurfaceErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message || "AI view crashed." };
  }

  componentDidCatch(error, info) {
    logAiClient("surface_crash", { message: error?.message, stack: info?.componentStack?.slice(0, 200) });
    reportClientError(error, { componentStack: info?.componentStack?.slice(0, 400), surface: "ai" });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto max-w-lg px-4 py-10">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-5 text-center">
            <AlertTriangle className="mx-auto h-8 w-8 text-rose-300" aria-hidden />
            <h2 className="mt-3 text-base font-semibold text-white">AI panel error</h2>
            <p className="mt-2 text-sm text-rose-100/90">{this.state.message}</p>
            <button
              type="button"
              className="ccweb-gradient-btn mt-4 inline-flex min-h-[44px] items-center gap-2 px-5 text-sm"
              onClick={() => this.setState({ hasError: false, message: "" })}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Try again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
