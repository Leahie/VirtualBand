#!/usr/bin/env bash
set -euo pipefail

echo "[entrypoint] AWS prestart…"

python - <<'PY'
import os, pathlib

bucket   = os.getenv("S3_BUCKET")
key      = os.getenv("S3_KEY")
out      = os.getenv("S3_OUT", "/app/data/seed.json")
endpoint = os.getenv("AWS_S3_ENDPOINT_URL")

if bucket and key:
    try:
        import boto3
        s3 = boto3.client("s3", endpoint_url=endpoint) if endpoint else boto3.client("s3")
        pathlib.Path(out).parent.mkdir(parents=True, exist_ok=True)
        s3.download_file(bucket, key, out)
        print(f"[entrypoint] downloaded s3://{bucket}/{key} -> {out}")
    except Exception as e:
        print("[entrypoint] S3 step skipped/failed:", e)
else:
    print("[entrypoint] no S3_BUCKET/S3_KEY provided; skipping")
PY

echo "[entrypoint] starting Flask (band.factory:create_app)…"
exec flask --app band.factory:create_app run --host 0.0.0.0 --port 5000
