#!/usr/bin/env python3
"""Local editing server for the portfolio (development only).

Run from the project folder:

    python3 tools/edit-server.py            # http://127.0.0.1:8000
    python3 tools/edit-server.py 8080       # pick another port

Then open http://127.0.0.1:8000/index.html?edit (or any page with ?edit).

It serves the site like a normal static server. Pages opened with ?edit get
tools/edit-client.js added on the fly (the files on disk are not changed),
and the editor can then:

  POST /__edit/save    {"path": "work/dropbox.html", "html": "..."}
  POST /__edit/upload  {"name": "dropbox-hero", "data": "data:image/jpeg;base64,..."}

Safety rules:
  - listens on 127.0.0.1 only, and refuses other Host headers and origins
  - only writes .html files that already exist in the root, work/ or side/
  - only writes images (jpg, png, webp, gif, avif) into assets/
  - never touches anything outside this project folder
"""

import base64
import binascii
import http.server
import json
import os
import re
import sys
from urllib.parse import urlsplit, parse_qs, unquote

ROOT = os.path.realpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
ASSETS = os.path.join(ROOT, "assets")
HOST = "127.0.0.1"
MAX_BODY = 25 * 1024 * 1024  # 25 MB (images arrive base64-encoded)

PAGE_RE = re.compile(r"^(?:(?:work|side)/)?[A-Za-z0-9][A-Za-z0-9._-]*\.html$")
NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,80}$")
IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
}
CLIENT_TAG = '<script src="{prefix}tools/edit-client.js" defer></script>'


def inside(path, folder):
    """True when path (already resolved) is folder itself or inside it."""
    return path == folder or path.startswith(folder + os.sep)


def page_file(rel):
    """Resolve a page path like 'work/dropbox.html' or refuse with ValueError."""
    rel = rel.lstrip("/")
    if not PAGE_RE.match(rel):
        raise ValueError("Only .html pages in the root, work/ or side/ can be saved")
    full = os.path.realpath(os.path.join(ROOT, rel))
    if not inside(full, ROOT) or os.path.dirname(full) not in (
        ROOT, os.path.join(ROOT, "work"), os.path.join(ROOT, "side")
    ):
        raise ValueError("Path is outside the project")
    if not os.path.isfile(full):
        raise ValueError("That page does not exist")
    return full


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    # --- checks -------------------------------------------------------

    def host_ok(self):
        host = (self.headers.get("Host") or "").rsplit(":", 1)[0]
        return host in ("127.0.0.1", "localhost")

    def origin_ok(self):
        origin = self.headers.get("Origin")
        if origin is None:
            return True
        parts = urlsplit(origin)
        return parts.scheme == "http" and parts.hostname in ("127.0.0.1", "localhost")

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    # --- reading ------------------------------------------------------

    def do_GET(self):
        if not self.host_ok():
            self.send_error(403, "Use 127.0.0.1 or localhost")
            return
        parts = urlsplit(self.path)
        segments = [s for s in unquote(parts.path).split("/") if s]
        # Keep git data, editor settings and private references off the server
        if any(s.startswith(".") for s in segments) or (segments and segments[0] == "References"):
            self.send_error(404)
            return
        if parts.path == "/__edit/ping":
            self.send_json(200, {"ok": True})
            return
        if "edit" in parse_qs(parts.query, keep_blank_values=True):
            rel = unquote(parts.path).lstrip("/") or "index.html"
            if rel.endswith("/"):
                rel += "index.html"
            try:
                full = page_file(rel)
            except ValueError:
                full = None
            if full:
                self.serve_with_editor(full, rel)
                return
        super().do_GET()

    def do_HEAD(self):
        self.send_error(405)

    def serve_with_editor(self, full, rel):
        with open(full, "r", encoding="utf-8", newline="") as f:
            html = f.read()
        prefix = "../" if "/" in rel else ""
        tag = CLIENT_TAG.format(prefix=prefix)
        index = html.rfind("</body>")
        html = html[:index] + tag + "\n" + html[index:] if index != -1 else html + tag
        body = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    # --- writing ------------------------------------------------------

    def do_POST(self):
        if not self.host_ok() or not self.origin_ok():
            self.send_json(403, {"error": "Requests must come from this computer"})
            return
        if (self.headers.get("Content-Type") or "").split(";")[0] != "application/json":
            self.send_json(415, {"error": "Expected JSON"})
            return
        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY:
            self.send_json(413, {"error": "Request is empty or too large"})
            return
        try:
            data = json.loads(self.rfile.read(length).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            self.send_json(400, {"error": "Invalid JSON"})
            return

        try:
            route = urlsplit(self.path).path
            if route == "/__edit/save":
                self.send_json(200, self.save(data))
            elif route == "/__edit/upload":
                self.send_json(200, self.upload(data))
            else:
                self.send_json(404, {"error": "Unknown endpoint"})
        except ValueError as error:
            self.send_json(400, {"error": str(error)})

    def save(self, data):
        rel, html = data.get("path"), data.get("html")
        if not isinstance(rel, str) or not isinstance(html, str):
            raise ValueError("Need a path and html")
        full = page_file(rel)
        # Last line of defence: never write editor leftovers into the site
        for marker in ("contenteditable", "dialkit", "edit-client.js"):
            if marker in html.lower():
                raise ValueError("Refusing to save: the page still contains '%s'" % marker)
        with open(full, "r", encoding="utf-8", newline="") as f:
            changed = f.read() != html
        if changed:
            with open(full, "w", encoding="utf-8", newline="") as f:
                f.write(html)
        self.log_message("saved %s (%s)", rel, "changed" if changed else "no changes")
        return {"ok": True, "changed": changed}

    def upload(self, data):
        name, url = data.get("name"), data.get("data")
        if not isinstance(name, str) or not NAME_RE.match(name):
            raise ValueError("Image names use lowercase letters, numbers and dashes")
        if not isinstance(url, str):
            raise ValueError("Need image data")
        match = re.match(r"^data:([a-z/+-]+);base64,(.*)$", url, re.S)
        if not match or match.group(1) not in IMAGE_TYPES:
            raise ValueError("Use a JPG, PNG, WebP, GIF or AVIF image")
        try:
            raw = base64.b64decode(match.group(2), validate=True)
        except (binascii.Error, ValueError):
            raise ValueError("Image data is not valid base64")
        filename = name + "." + IMAGE_TYPES[match.group(1)]
        full = os.path.realpath(os.path.join(ASSETS, filename))
        if os.path.dirname(full) != os.path.realpath(ASSETS):
            raise ValueError("Images can only go in assets/")
        os.makedirs(ASSETS, exist_ok=True)
        with open(full, "wb") as f:
            f.write(raw)
        self.log_message("wrote assets/%s (%d KB)", filename, len(raw) // 1024)
        return {"ok": True, "file": filename}


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = http.server.ThreadingHTTPServer((HOST, port), Handler)
    print("Editing server for %s" % ROOT)
    print("Open http://%s:%d/index.html?edit  (Ctrl+C to stop)" % (HOST, port))
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
