# sigma-as-code

Manage Sigma Computing workbooks as code — fetch, version, and diff workbook specifications via the Sigma API.

## Setup

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure credentials

Copy `.env.example` to `.env` and fill in your Sigma API credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```
SIGMA_BASE_URL=https://aws-api.sigmacomputing.com
SIGMA_CLIENT_ID=<your client id>
SIGMA_CLIENT_SECRET=<your client secret>
```

Credentials are obtained from the Sigma Admin Portal under **Administration → Developer Access**.

> **Note:** `.env` is git-ignored. Never commit credentials.

### 3. Load environment variables

```bash
export $(grep -v '^#' .env | xargs)
```

### 4. Verify the connection

```bash
python verify_connection.py
```

A successful run prints:

```
Connecting to Sigma API at https://aws-api.sigmacomputing.com ...
Authentication successful. Token starts with: eyJhbGci...
Sigma API connection verified.
```

## Usage

### Fetch a workbook spec

Print to stdout:

```bash
python get_workbook_spec.py <workbook_id>
```

Save to a file:

```bash
python get_workbook_spec.py <workbook_id> workbook_spec.yaml
```

The `workbook_id` is the identifier found in the Sigma workbook URL, e.g.:

```
https://app.sigmacomputing.com/workbook/My-Workbook-<workbook_id>
```

### Python API

```python
from sigma_as_code import get_workbook_spec

spec = get_workbook_spec("Cold-Provisions-Storefront-HMKejrba5skgSksfrFKAL")
print(spec)
```

## Environment variables

| Variable             | Description                                      |
|----------------------|--------------------------------------------------|
| `SIGMA_BASE_URL`     | Sigma API base URL (region-specific)             |
| `SIGMA_CLIENT_ID`    | OAuth2 client ID from Admin Portal               |
| `SIGMA_CLIENT_SECRET`| OAuth2 client secret from Admin Portal           |
