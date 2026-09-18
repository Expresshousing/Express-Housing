#!/usr/bin/env python
"""Push a building's fixture gallery to a running Express Housing API.

The portfolio fixture is only read when a server starts, and a reseed deliberately
refuses to overwrite a listing whose photo_status is "verified" (see the guard in
backend/server.py). So on an environment where photography has been verified, the
only way to change a gallery is this admin call.

Usage:
    .venv/bin/python scripts/publish-listing-images.py the-hannah
    .venv/bin/python scripts/publish-listing-images.py the-hannah --api http://localhost:8000

Prompts for the admin email and password; nothing is stored or echoed.
"""
from __future__ import annotations

import argparse
import getpass
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.fixtures.portfolio import BUILDING_IMAGES, build_portfolio

DEFAULT_API = "https://express-housing.onrender.com"


def call(url, payload=None, token=None, method="GET"):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read() or "{}")
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {url} failed: {e.code} {e.read().decode()[:300]}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug", nargs="?", default="the-hannah", help="building slug, e.g. the-hannah")
    ap.add_argument("--api", default=DEFAULT_API, help=f"API base URL (default {DEFAULT_API})")
    ap.add_argument("--email", help="admin email (otherwise prompted)")
    ap.add_argument(
        "--password-file",
        help="file holding the admin password on its first line. Avoids the hidden prompt, "
             "which some terminals mishandle on paste, and keeps the password out of shell history.",
    )
    args = ap.parse_args()

    if args.slug not in BUILDING_IMAGES:
        sys.exit(f"unknown building {args.slug!r}; known: {', '.join(sorted(BUILDING_IMAGES))}")

    images = [i["url"] for i in BUILDING_IMAGES[args.slug]]
    buildings, _, listings = build_portfolio()
    name = next(b["name"] for b in buildings if b["slug"] == args.slug)
    targets = [l for l in listings if l["building_name"] == name]

    if not targets:
        sys.exit(f"no listings found for {args.slug}")

    print(f"API      : {args.api}")
    print(f"Building : {args.slug}")
    print(f"Images   : {len(images)}")
    for l in targets:
        print(f"  listing: {l['title']}  ({l['id']})")
    if input("\nApply? [y/N] ").strip().lower() != "y":
        sys.exit("aborted")

    email = (args.email or input("Admin email: ")).strip()
    if args.password_file:
        password = Path(args.password_file).read_text().splitlines()[0]
    else:
        password = getpass.getpass("Admin password: ")
    if not password.strip():
        sys.exit("No password received. Some terminals drop a paste into a hidden prompt — "
                 "use --password-file, or type the password by hand.")
    token = call(f"{args.api}/api/auth/login", {"email": email, "password": password}, method="POST")["access_token"]

    for l in targets:
        call(f"{args.api}/api/admin/listings/{l['id']}", {"images": images}, token=token, method="PATCH")
        got = call(f"{args.api}/api/apartments/{l['id']}")
        print(f"  {l['title']}: now {len(got.get('images', []))} images")

    print("\nDone. Hard-refresh the site (Cmd+Shift+R).")


if __name__ == "__main__":
    main()
