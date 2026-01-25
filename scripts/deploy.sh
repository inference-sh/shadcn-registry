#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR/.."
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Source deploy library
source "$REPO_ROOT/scripts/deploy-lib.sh"

# Config
PROJECT_NAME="ui"
IMAGE_BASE="inference-sh-shadcn-registry"
STACK_NAME="inference-shadcn-registry"
SERVICE_NAME="inference-shadcn-registry_web"
ENV_FILE="${1:-.env.production}"

# Load environment
load_env "$PROJECT_DIR/$ENV_FILE" || true

# Get build version
BUILD_VERSION=$(get_build_version "$PROJECT_NAME")
echo "[*] Build version: $BUILD_VERSION"

# Deploy
init_swarm

build_image "$IMAGE_BASE" "$PROJECT_DIR" "Dockerfile" "$BUILD_VERSION"

cd "$PROJECT_DIR"
deploy_stack "$STACK_NAME" "docker-compose.yml" "$PROJECT_DIR/$ENV_FILE"
update_service "$SERVICE_NAME"
print_status "$SERVICE_NAME"
