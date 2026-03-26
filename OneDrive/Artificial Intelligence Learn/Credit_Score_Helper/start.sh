#!/bin/bash
set -e

# Build frontend if dist doesn't exist
if [ ! -d "src/frontend/dist" ] && [ -f "src/frontend/package.json" ]; then
  echo "Building frontend..."
  cd src/frontend
  npm ci --prefer-offline 2>/dev/null || npm install
  npm run build
  cd ../..
  echo "Frontend built successfully"
fi

# Start the API server
exec uvicorn src.api.main:app --host 0.0.0.0 --port ${PORT:-8000}
