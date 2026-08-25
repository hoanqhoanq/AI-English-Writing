#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="${PM2_APP_NAME:-ai-english-writing}"

cd "$ROOT_DIR"

echo "========================================"
echo "   DEPLOY AI ENGLISH WRITING"
echo "========================================"

echo "[1/5] Pulling latest code from GitHub..."
git pull origin main

echo "[2/5] Installing dependencies..."

if [[ -f package-lock.json ]]; then
    npm ci
else
    npm install
fi

echo "[3/5] Building client and server..."
npm run build

echo "[4/5] Starting/restarting application..."

if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$APP_NAME" --update-env
else
    pm2 start npm \
        --name "$APP_NAME" \
        --cwd "$ROOT_DIR" \
        -- start
fi

echo "[5/5] Saving PM2 process list..."
pm2 save

echo "========================================"
echo "   DEPLOYMENT COMPLETED SUCCESSFULLY"
echo "========================================"

pm2 status