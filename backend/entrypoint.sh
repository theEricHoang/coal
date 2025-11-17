#!/bin/bash
set -e

echo "Waiting for PostgreSQL..."
while ! pg_isready -h db -p 5432 -U ${POSTGRES_USER:-postgres} > /dev/null 2>&1; do
    sleep 1
done
echo "PostgreSQL is ready!"

echo "Running database migrations..."
PGPASSWORD=${POSTGRES_PASSWORD:-postgres} psql -h db -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-coal_db} -f /app/migrations/001_create_tables.sql || true

echo "Starting FastAPI application..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload
