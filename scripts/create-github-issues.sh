#!/bin/bash

# Script to create GitHub issues, milestones, and labels
# Usage: ./scripts/create-github-issues.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Creating GitHub Issues for Booking System Improvements${NC}\n"

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ Error: GITHUB_TOKEN environment variable is not set${NC}"
    echo "Please set it with: export GITHUB_TOKEN=your_token_here"
    exit 1
fi

# Check if GITHUB_REPOSITORY is set
if [ -z "$GITHUB_REPOSITORY" ]; then
    echo -e "${YELLOW}⚠️  Warning: GITHUB_REPOSITORY not set, trying to detect from git${NC}"
    GITHUB_REPOSITORY=$(git config --get remote.origin.url | sed -E 's/.*github.com[:/]([^/]+\/[^/]+)(\.git)?$/\1/')
    if [ -z "$GITHUB_REPOSITORY" ]; then
        echo -e "${RED}❌ Error: Could not detect GITHUB_REPOSITORY${NC}"
        echo "Please set it with: export GITHUB_REPOSITORY=owner/repo"
        exit 1
    fi
    echo -e "${GREEN}✓ Detected repository: $GITHUB_REPOSITORY${NC}\n"
fi

# Check if issues file exists
if [ ! -f "GITHUB_ISSUES_BOOKING_IMPROVEMENTS.md" ]; then
    echo -e "${RED}❌ Error: GITHUB_ISSUES_BOOKING_IMPROVEMENTS.md not found${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d ".github/scripts/node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    cd .github/scripts
    npm install
    cd ../..
fi

# Run scripts
echo -e "${GREEN}📋 Step 1: Creating milestones...${NC}"
cd .github/scripts
node create-milestones.js
cd ../..

echo -e "\n${GREEN}🏷️  Step 2: Creating labels...${NC}"
cd .github/scripts
node create-labels.js
cd ../..

echo -e "\n${GREEN}📝 Step 3: Creating issues...${NC}"
cd .github/scripts
node create-issues.js
cd ../..

echo -e "\n${GREEN}✨ All done!${NC}"
echo -e "Check your GitHub repository to see the created issues, milestones, and labels."
