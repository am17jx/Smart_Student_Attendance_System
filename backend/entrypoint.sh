#!/bin/sh
set -e

echo "⏳ Syncing database schema..."
npx prisma db push --accept-data-loss

echo "✅ Migrations done. Starting server..."
exec node dist/src/server.js
