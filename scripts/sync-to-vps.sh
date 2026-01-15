#!/bin/bash

# Configuration
VPS_IP="148.135.136.4"
VPS_USER="sidra"
VPS_PATH="/home/sidra/Sidra-Ai"
SSH_KEY="/Users/omerheathrow/.ssh/id_ed25519"

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
