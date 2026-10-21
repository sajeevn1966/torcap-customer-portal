#!/bin/bash
# One-command update on the server:  bash deploy/update.sh
set -e
cd "$(dirname "$0")/.."
git pull
npm ci
npx prisma generate
rm -rf .next
npm run build
pm2 restart all --update-env
echo "Update finished."
