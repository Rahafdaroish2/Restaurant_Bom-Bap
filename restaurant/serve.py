"""Serve this project locally without caching development files."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse


class PreviewHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        super().end_headers()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    directory = str(Path(__file__).resolve().parent)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), partial(PreviewHandler, directory=directory))
    print(f"Restaurant preview: http://127.0.0.1:{args.port}/index.html", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
