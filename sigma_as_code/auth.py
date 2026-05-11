import os
import time
import requests

_token_cache: dict = {}


def get_access_token(base_url: str, client_id: str, client_secret: str) -> str:
    cache_key = (base_url, client_id)
    cached = _token_cache.get(cache_key)
    if cached and cached["expires_at"] > time.time() + 60:
        return cached["token"]

    resp = requests.post(
        f"{base_url}/v2/auth/token",
        data={
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
        },
    )
    resp.raise_for_status()
    data = resp.json()

    token = data["access_token"]
    expires_in = data.get("expires_in", 3600)
    _token_cache[cache_key] = {"token": token, "expires_at": time.time() + expires_in}
    return token


def get_access_token_from_env(base_url: str | None = None) -> str:
    url = base_url or os.environ["SIGMA_BASE_URL"]
    client_id = os.environ["SIGMA_CLIENT_ID"]
    client_secret = os.environ["SIGMA_CLIENT_SECRET"]
    return get_access_token(url, client_id, client_secret)
