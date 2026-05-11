#!/usr/bin/env python3
"""Verify that Sigma API credentials are valid and the connection works.

Usage:
    python verify_connection.py

Reads credentials from environment variables:
    SIGMA_BASE_URL      e.g. https://aws-api.sigmacomputing.com
    SIGMA_CLIENT_ID     OAuth2 client ID
    SIGMA_CLIENT_SECRET OAuth2 client secret
"""
import os
import sys

from sigma_as_code.auth import get_access_token_from_env


def main() -> None:
    missing = [v for v in ("SIGMA_BASE_URL", "SIGMA_CLIENT_ID", "SIGMA_CLIENT_SECRET") if not os.environ.get(v)]
    if missing:
        print(f"Error: missing environment variables: {', '.join(missing)}", file=sys.stderr)
        print("Copy .env.example to .env and fill in your credentials.", file=sys.stderr)
        sys.exit(1)

    base_url = os.environ["SIGMA_BASE_URL"]
    print(f"Connecting to Sigma API at {base_url} ...")

    try:
        token = get_access_token_from_env()
        print(f"Authentication successful. Token starts with: {token[:12]}...")
        print("Sigma API connection verified.")
    except Exception as exc:
        print(f"Authentication failed: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
