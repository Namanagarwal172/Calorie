#!/usr/bin/env bash
set -euo pipefail

echo "== GitHub Connectivity Diagnose =="
echo "Date: $(date)"
echo

check_cmd() {
  local cmd="$1"
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "[OK] found command: $cmd"
  else
    echo "[WARN] missing command: $cmd"
  fi
}

check_cmd git
check_cmd curl
check_cmd ssh
check_cmd ping

echo

echo "== Git remotes =="
git remote -v || true

echo

echo "== DNS lookup for github.com =="
(getent hosts github.com || nslookup github.com || true) 2>/dev/null

echo

echo "== HTTPS probe (port 443) =="
if curl -I --connect-timeout 8 https://github.com >/tmp/github_https_probe.txt 2>&1; then
  echo "[PASS] HTTPS reachable"
  head -n 5 /tmp/github_https_probe.txt
else
  echo "[FAIL] HTTPS probe failed"
  cat /tmp/github_https_probe.txt
fi

echo

echo "== SSH probe (port 22) =="
if ssh -T -o ConnectTimeout=8 git@github.com >/tmp/github_ssh_probe.txt 2>&1; then
  echo "[PASS] SSH reachable and authenticated"
  cat /tmp/github_ssh_probe.txt
else
  echo "[INFO] SSH probe output (may fail without keys even if reachable):"
  cat /tmp/github_ssh_probe.txt
fi

echo

echo "== Git proxy configuration =="
for key in http.proxy https.proxy; do
  val=$(git config --global --get "$key" || true)
  if [[ -n "$val" ]]; then
    echo "[SET] $key=$val"
  else
    echo "[EMPTY] $key"
  fi
done
if [[ -n "${ALL_PROXY:-}" ]]; then
  echo "[SET] ALL_PROXY=$ALL_PROXY"
else
  echo "[EMPTY] ALL_PROXY"
fi

echo
cat <<'EOF'
== Next steps ==
1) If HTTPS probe failed:
   - check firewall/proxy/VPN
   - verify outbound 443 is allowed
   - unset bad git proxy:
       git config --global --unset http.proxy
       git config --global --unset https.proxy

2) If password prompt appears during push/clone:
   - GitHub password auth is disabled.
   - Use SSH key OR Personal Access Token (PAT).

3) Switch to SSH remote:
   git remote set-url origin git@github.com:<user>/<repo>.git
   ssh -T git@github.com
   git push -u origin main
EOF
