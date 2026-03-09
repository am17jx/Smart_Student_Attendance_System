#!/bin/sh
set -e

echo "⏳ Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Migrations done. Starting server..."
exec node dist/src/server.js
