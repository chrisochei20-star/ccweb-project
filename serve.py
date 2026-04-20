#!/usr/bin/env python3
"""Serve this SPA with History API fallback."""

from __future__ import annotations

import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent


class SPARequestHandler(SimpleHTTPRequestHandler):
    """Serve static files and fall back to /index.html for client routes."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PROJECT_ROOT), **kwargs)

    def _serve_with_fallback(self, method: str) -> None:
        requested_path = Path(super().translate_path(self.path))
        if requested_path.exists():
            getattr(super(), method)()
            return

        self.path = "/index.html"
        getattr(super(), method)()

    def do_GET(self) -> None:  # noqa: N802 (required http.server name)
        self._serve_with_fallback("do_GET")

    def do_HEAD(self) -> None:  # noqa: N802 (required http.server name)
        self._serve_with_fallback("do_HEAD")


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the static SPA locally.")
    parser.add_argument("--port", type=int, default=4173, help="Port to listen on.")
    args = parser.parse_args()

    server = ThreadingHTTPServer(("0.0.0.0", args.port), SPARequestHandler)
    print(f"Serving CCWeb app on http://localhost:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
