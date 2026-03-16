#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

cp package.base.json package.json
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('package.json repaired and valid ✅')"
