#!/usr/bin/env bash
# One-shot dev helper: align the DB "postgres" role password with backend/.env default (postgres).
# Requires: sudo without password for -u postgres, OR you run: sudo bash scripts/setPostgresDevPassword.sh
set -euo pipefail
PORT="${PGPORT:-5432}"
sudo -u postgres psql -p "$PORT" -v ON_ERROR_STOP=1 -c "ALTER ROLE postgres WITH PASSWORD 'postgres';"
echo "OK: postgres role password set to 'postgres' on port $PORT (matches README / .env default)."
