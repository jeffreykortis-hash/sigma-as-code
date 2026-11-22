from __future__ import annotations

import os
import requests
import yaml

from .auth import get_access_token_from_env


def get_workbook_spec(
    workbook_id: str,
    *,
    base_url: str | None = None,
    token: str | None = None,
) -> str:
    """Return the code representation (YAML) of a Sigma workbook.

    Calls the GA workbook endpoint with includeContents=true and returns only
    the workbook representation, not the surrounding metadata.

    Args:
        workbook_id: The Sigma workbook ID.
        base_url: Sigma API base URL. Defaults to $SIGMA_BASE_URL env var.
        token: Bearer token. If omitted, one is fetched using env credentials.

    Returns:
        The workbook spec as a YAML string.
    """
    url = base_url or os.environ["SIGMA_BASE_URL"]
    bearer = token or get_access_token_from_env(url)

    resp = requests.get(
        f"{url.rstrip('/')}/v2/workbooks/{workbook_id}",
        params={"includeContents": "true"},
        headers={"Authorization": f"Bearer {bearer}"},
    )
    resp.raise_for_status()
    payload = resp.json()
    contents = payload.get("contents") if isinstance(payload, dict) else None
    if not isinstance(contents, dict):
        raise ValueError("Sigma API response did not contain a workbook representation")
    return yaml.safe_dump(contents, sort_keys=False, allow_unicode=True)
