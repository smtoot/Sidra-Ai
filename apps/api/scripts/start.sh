#!/bin/sh
# Startup script with database connection retry logic

set -e

MAX_RETRIES=30
RETRY_INTERVAL=2

echo "=== Sidra API Startup ==="
echo "Waiting for database to be ready..."

# Wait for database to be reachable
retry_count=0
until echo "SELECT 1" | npx prisma db execute --schema=packages/database/prisma/schema.prisma --stdin 2>/dev/null; do
  retry_count=$((retry_count + 1))
  if [ $retry_count -ge $MAX_RETRIES ]; then
    echo "ERROR: Database not reachable after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Database not ready yet (attempt $retry_count/$MAX_RETRIES). Retrying in ${RETRY_INTERVAL}s..."
  sleep $RETRY_INTERVAL
done

echo "Database is ready!"

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

echo "Migrations complete. Starting API server..."

# Start the server
exec node apps/api/dist/src/main.js
