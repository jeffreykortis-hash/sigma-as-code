from __future__ import annotations

import os
import requests

from .auth import get_access_token_from_env


def get_workbook_spec(
    workbook_id: str,
    *,
    base_url: str | None = None,
    token: str | None = None,
) -> str:
    """Return the code representation (YAML) of a Sigma workbook.

    Calls GET /v2/workbooks/{workbookId}/spec and returns the raw spec text.

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
        f"{url}/v2/workbooks/{workbook_id}/spec",
        headers={"Authorization": f"Bearer {bearer}"},
    )
    resp.raise_for_status()
    return resp.text
