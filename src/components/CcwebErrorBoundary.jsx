import { Component } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { reportClientError } from "../lib/clientAnalytics";

export class CcwebErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(err) {
    return { hasError: true, message: err?.message || "Something went wrong." };
  }

  componentDidCatch(error, info) {
    reportClientError(error, { componentStack: info?.componentStack?.slice(0, 400) });
  }

  handleGoHome = () => {
    this.setState({ hasError: false, message: "" });
    window.location.assign("/");
  };

  handleSoftRecover = () => {
    this.setState({ hasError: false, message: "" });
    document.dispatchEvent(new CustomEvent("ccweb:soft-resume"));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <div className="ccweb-card-premium flex w-full max-w-md flex-col items-center rounded-3xl border border-rose-500/30 p-8">
            <AlertTriangle className="h-10 w-10 text-rose-300" strokeWidth={1.75} aria-hidden />
            <h1 className="mt-4 text-lg font-semibold text-white">This view crashed</h1>
            <p className="mt-2 text-sm text-ccweb-muted">{this.state.message}</p>
            <p className="mt-2 text-xs text-ccweb-muted">
              Your session is preserved. Try recovering without a full reload, or return home.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                className="ccweb-gradient-btn inline-flex min-h-[44px] items-center gap-2 px-5 py-2 text-sm font-semibold"
                onClick={this.handleSoftRecover}
              >
                <RefreshCw className="h-4 w-4" aria-hidden />
                Recover
              </button>
              <button
                type="button"
                className="ccweb-outline-btn inline-flex min-h-[44px] items-center gap-2 px-5 py-2 text-sm"
                onClick={this.handleGoHome}
              >
                <Home className="h-4 w-4" aria-hidden />
                Home
              </button>
              <button
                type="button"
                className="ccweb-outline-btn min-h-[44px] px-5 py-2 text-sm"
                onClick={() => window.location.reload()}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
