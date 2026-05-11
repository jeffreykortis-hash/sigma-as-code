#!/usr/bin/env python3
"""Fetch the code representation of a Sigma workbook.

Usage:
    python get_workbook_spec.py <workbook_id> [output_file]

Environment variables:
    SIGMA_BASE_URL      Sigma API base URL (e.g. https://aws-api.sigmacomputing.com)
    SIGMA_CLIENT_ID     API client ID
    SIGMA_CLIENT_SECRET API client secret

If output_file is omitted the spec is printed to stdout.
"""
import sys

from sigma_as_code import get_workbook_spec


def main() -> None:
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <workbook_id> [output_file]", file=sys.stderr)
        sys.exit(1)

    workbook_id = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None

    spec = get_workbook_spec(workbook_id)

    if output_file:
        with open(output_file, "w") as fh:
            fh.write(spec)
        print(f"Workbook spec written to {output_file}")
    else:
        print(spec)


if __name__ == "__main__":
    main()
