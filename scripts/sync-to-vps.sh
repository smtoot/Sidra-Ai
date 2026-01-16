#!/bin/bash

# Configuration
CONFIG_FILE="$(dirname "$0")/deploy.config"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
else
    echo "Error: Configuration file not found at $CONFIG_FILE"
    echo "Please copy scripts/deploy.config.example to scripts/deploy.config and configure it."
    exit 1
fi

SSH_KEY="$SSH_KEY_PATH"

echo "🚀 Syncing code to VPS ($VPS_IP)..."

# Sync files using rsync
# Excludes: node_modules, .git, .next, dist, .env (local envs), and others to keep it clean
rsync -avz --progress \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.next' \
    --exclude 'dist' \
    --exclude '.DS_Store' \
    --exclude '.env*' \
    --include '.env.production' \
    --include '.env.staging' \
    ./ "$VPS_USER@$VPS_IP:$VPS_PATH/"

echo "✅ Sync complete!"
