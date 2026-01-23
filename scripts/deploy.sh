#!/bin/bash
set -euo pipefail

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."

IMAGE_BASE=inference-sh-shadcn-registry
BUILD_TAG=${IMAGE_BASE}:build-$(date +%s)

# Load environment file if provided or use default
ENV_FILE="${1:-.env.production}"
if [ -f "$PROJECT_DIR/$ENV_FILE" ]; then
    echo "[*] Loading environment from $ENV_FILE"
    export $(grep -v '^#' "$PROJECT_DIR/$ENV_FILE" | xargs)
fi

echo "[*] Initializing Swarm..."
docker swarm init 2>/dev/null || true

echo "[*] Building image from: $PROJECT_DIR"
docker build -t "$BUILD_TAG" "$PROJECT_DIR"
docker tag "$BUILD_TAG" "$IMAGE_BASE:latest"

echo "[*] Deploying stack..."
cd "$PROJECT_DIR"

# Deploy with env file if it exists
if [ -f "$PROJECT_DIR/$ENV_FILE" ]; then
    docker stack deploy -c docker-compose.yml --env-file "$ENV_FILE" inference-shadcn-registry 2>/dev/null || \
    docker stack deploy -c docker-compose.yml inference-shadcn-registry
else
    docker stack deploy -c docker-compose.yml inference-shadcn-registry
fi

echo "[*] Forcing service update..."
docker service update --force inference-shadcn-registry_web

echo "[*] Done."
echo "[*] Service: inference-shadcn-registry_web"
echo "[*] View logs: docker service logs inference-shadcn-registry_web"
