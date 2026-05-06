#!/bin/bash
set -euo pipefail

echo "=== Wallet Connect Deployment ==="

# Check required env vars
for var in POSTGRES_PASSWORD REDIS_PASSWORD SESSION_SECRET WEBAUTHN_RP_ID WEBAUTHN_ORIGIN; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: Required environment variable $var is not set"
    exit 1
  fi
done

echo "Running database migrations..."
docker compose -f docker/docker-compose.yml run --rm api npx prisma migrate deploy

echo "Starting services..."
docker compose -f docker/docker-compose.yml up -d

echo "Waiting for health check..."
sleep 10

if curl -sf http://localhost:${WEB_PORT:-3000}/api/health/live > /dev/null 2>&1; then
  echo "=== Deployment successful ==="
else
  echo "WARNING: Health check failed. Check logs with: docker compose -f docker/docker-compose.yml logs"
fi
