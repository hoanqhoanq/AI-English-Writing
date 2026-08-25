#!/usr/bin/env bash

set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="${PM2_APP_NAME:-ai-english-writing}"

cd "$ROOT_DIR"

command -v npm >/dev/null 2>&1 || {
    echo "Error: npm is required." >&2
    exit 1
}

command -v pm2 >/dev/null 2>&1 || {
    echo "Error: pm2 is required. Install it with: npm install -g pm2" >&2
    exit 1
}

echo "Installing dependencies..."
if [[ -f package-lock.json ]]; then
    npm ci
else
    npm install
fi

echo "Building client and server..."
npm run build

echo "Starting application with PM2..."
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    pm2 restart "$APP_NAME" --update-env
else
    pm2 start npm --name "$APP_NAME" --cwd "$ROOT_DIR" -- start
fi

pm2 save

echo "Deployment completed: $APP_NAME"