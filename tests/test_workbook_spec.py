import contextlib
import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import requests
import yaml

import get_workbook_spec as cli
from sigma_as_code import get_workbook_spec


API_ROOT = "https://example.com"
WORKBOOK_ID = "test-workbook"
CONTENTS = {
    "schemaVersion": 1,
    "pages": [{"name": "Café Results", "elements": [{"type": "text", "text": "01"}]}],
}
GA_PAYLOAD = {
    "workbookId": WORKBOOK_ID,
    "documentVersion": 7,
    "contents": CONTENTS,
    "warnings": [],
}


class GetWorkbookSpecTests(unittest.TestCase):
    @patch("sigma_as_code.workbook.requests.get")
    def test_requests_ga_endpoint_and_returns_contents_only_as_yaml(self, get):
        get.return_value.json.return_value = GA_PAYLOAD

        spec = get_workbook_spec(WORKBOOK_ID, base_url=API_ROOT + "/", token="test-token")

        get.assert_called_once_with(
            f"{API_ROOT}/v2/workbooks/{WORKBOOK_ID}",
            params={"includeContents": "true"},
            headers={"Authorization": "Bearer test-token"},
        )
        get.return_value.raise_for_status.assert_called_once()
        self.assertIsInstance(spec, str)
        self.assertEqual(yaml.safe_load(spec), CONTENTS)

    @patch("sigma_as_code.workbook.requests.get")
    def test_missing_contents_errors_instead_of_exporting_metadata(self, get):
        get.return_value.json.return_value = {"workbookId": WORKBOOK_ID}

        with self.assertRaisesRegex(ValueError, "did not contain a workbook representation"):
            get_workbook_spec(WORKBOOK_ID, base_url=API_ROOT, token="test-token")

    @patch("sigma_as_code.workbook.requests.get")
    def test_http_failure_is_not_parsed_as_contents(self, get):
        get.return_value.raise_for_status.side_effect = requests.HTTPError("403")

        with self.assertRaises(requests.HTTPError):
            get_workbook_spec(WORKBOOK_ID, base_url=API_ROOT, token="test-token")

        get.return_value.json.assert_not_called()


class CommandLineTests(unittest.TestCase):
    def setUp(self):
        environment = patch.dict("os.environ", {"SIGMA_BASE_URL": API_ROOT})
        auth = patch("sigma_as_code.workbook.get_access_token_from_env", return_value="test-token")
        get = patch("sigma_as_code.workbook.requests.get")
        for mocked in (environment, auth, get):
            self.addCleanup(mocked.stop)
        environment.start()
        auth.start()
        get.start().return_value.json.return_value = GA_PAYLOAD

    def test_prints_raw_workbook_yaml_to_stdout(self):
        out = io.StringIO()
        with patch("sys.argv", ["get_workbook_spec.py", WORKBOOK_ID]), contextlib.redirect_stdout(out):
            cli.main()

        self.assertEqual(yaml.safe_load(out.getvalue()), CONTENTS)

    def test_writes_raw_workbook_yaml_to_requested_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            filename = Path(tmp) / "workbook.yaml"
            out = io.StringIO()
            args = ["get_workbook_spec.py", WORKBOOK_ID, str(filename)]
            with patch("sys.argv", args), contextlib.redirect_stdout(out):
                cli.main()

            self.assertEqual(yaml.safe_load(filename.read_text()), CONTENTS)
            self.assertEqual(out.getvalue(), f"Workbook spec written to {filename}\n")
