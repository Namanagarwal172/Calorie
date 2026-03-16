#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))" >/dev/null 2>&1; then
  echo "package.json is valid ✅"
else
  echo "package.json is invalid. Repairing..."
  bash scripts/fix-package-json.sh
fi

npm install
npm start
