#!/bin/bash
# Run migrations directly via docker compose exec
echo "Running Prisma migrations..."
docker compose -f docker-compose.production.yml exec -T postgres psql -U sidra_prod -d sidra_production -c "\dt"
echo ""
echo "Starting migration..."
docker compose -f docker-compose.production.yml run --rm --entrypoint="" api sh -c 'cd /app && npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma'
