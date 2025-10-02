#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npm run migration:run 2>&1 || {
  echo "⚠️ Migrations failed or already applied - continuing anyway"
}

echo "🚀 Starting application..."
exec node dist/src/main.js
