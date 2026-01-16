#!/bin/bash
# Upload production configuration files to VPS
# Run this from your local machine

VPS_IP="148.135.136.4"
VPS_USER="sidra"
VPS_PATH="/home/sidra/Sidra-Ai"

echo "🚀 Uploading production configuration files to VPS..."
echo "VPS: $VPS_USER@$VPS_IP:$VPS_PATH"
echo ""

# Check if files exist
echo "✓ Checking files..."
FILES=(
    "docker-compose.production.yml"
    "Dockerfile.web"
    ".env.production"
    "nginx/nginx.conf"
    "nginx/conf.d/default.conf"
)

for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: File not found: $file"
        exit 1
    fi
    echo "  ✓ $file exists"
done

echo ""
echo "📤 Uploading files..."

# Upload main files
scp docker-compose.production.yml "$VPS_USER@$VPS_IP:$VPS_PATH/" || exit 1
echo "  ✓ Uploaded docker-compose.production.yml"

scp Dockerfile.web "$VPS_USER@$VPS_IP:$VPS_PATH/" || exit 1
echo "  ✓ Uploaded Dockerfile.web"

scp .env.production "$VPS_USER@$VPS_IP:$VPS_PATH/" || exit 1
echo "  ✓ Uploaded .env.production"

# Create nginx directories on VPS
ssh "$VPS_USER@$VPS_IP" "mkdir -p $VPS_PATH/nginx/conf.d" || exit 1

# Upload nginx configs
scp nginx/nginx.conf "$VPS_USER@$VPS_IP:$VPS_PATH/nginx/" || exit 1
echo "  ✓ Uploaded nginx/nginx.conf"

scp nginx/conf.d/default.conf "$VPS_USER@$VPS_IP:$VPS_PATH/nginx/conf.d/" || exit 1
echo "  ✓ Uploaded nginx/conf.d/default.conf"

echo ""
echo "🔒 Setting file permissions..."

# Set correct permissions
ssh "$VPS_USER@$VPS_IP" << 'EOF'
cd /home/sidra/Sidra-Ai
chmod 600 .env.production
chmod 644 docker-compose.production.yml Dockerfile.web
chmod 644 nginx/nginx.conf nginx/conf.d/default.conf
echo "  ✓ File permissions set"
EOF

echo ""
echo "✅ All files uploaded successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. SSH to VPS: ssh sidra@$VPS_IP"
echo "  2. Edit .env.production and add your Resend & R2 credentials"
echo "  3. Follow DEPLOYMENT_INSTRUCTIONS.md to continue setup"
echo ""
echo "Quick command to SSH:"
echo "  ssh sidra@$VPS_IP"
echo ""
