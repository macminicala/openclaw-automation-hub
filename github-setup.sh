#!/bin/bash
# OpenClaw Automation Hub - GitHub Repository Setup
# This script helps you create and push to GitHub

set -e

echo "⚡ OpenClaw Automation Hub - GitHub Setup"
echo "=========================================="

# Configuration
REPO_NAME="openclaw-automation-hub"
DESCRIPTION="AI-native automation engine for OpenClaw. Transform your personal AI assistant from reactive to proactive."
GITHUB_ORG="${GITHUB_ORG:-openclaw}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "📋 Configuration:"
echo "   Repository name: $REPO_NAME"
echo "   Organization: $GITHUB_ORG"
echo "   Description: $DESCRIPTION"
echo ""

# Check for GitHub CLI
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI (gh) not found.${NC}"
    echo "   Install from: https://cli.github.com/"
    echo ""
    echo "   Manual setup instructions:"
    echo "   1. Create repository on GitHub.com"
    echo "   2. Run: git remote add origin https://github.com/$GITHUB_ORG/$REPO_NAME.git"
    echo "   3. Run: git push -u origin main"
    exit 1
fi

# Check if already a git repo
if [ ! -d ".git" ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Check GitHub authentication
echo ""
echo "🔐 Checking GitHub authentication..."
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with GitHub${NC}"
    echo "   Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated with GitHub${NC}"

# Create repository
echo ""
echo "🏗️  Creating GitHub repository..."

# Check if repo already exists
if gh repo view "$GITHUB_ORG/$REPO_NAME" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Repository $GITHUB_ORG/$REPO_NAME already exists${NC}"
    echo "   Using existing repository"
else
    # Create the repository
    gh repo create "$REPO_NAME" \
        --org "$GITHUB_ORG" \
        --description "$DESCRIPTION" \
        --public \
        --push
    
    echo -e "${GREEN}✅ Repository created: $GITHUB_ORG/$REPO_NAME${NC}"
fi

# Add remote if not exists
if ! git remote get-url origin &> /dev/null 2>&1; then
    git remote add origin "https://github.com/$GITHUB_ORG/$REPO_NAME.git"
    echo -e "${GREEN}✅ Added remote 'origin'${NC}"
fi

# Update README
echo ""
echo "📝 Updating README with repository info..."
sed -i "s|yourusername|$GITHUB_ORG|g" README.md

# Commit all files
echo ""
echo "📦 Committing files..."
git add -A

COMMIT_MESSAGE="Initial commit: OpenClaw Automation Hub v0.1

- Core automation engine
- CLI commands
- Web Dashboard
- Test suite
- Documentation

🤖 Built for the OpenClaw community"

git commit -m "$COMMIT_MESSAGE"

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
git push -u origin main

echo ""
echo "=========================================="
echo -e "${GREEN}✅ GitHub repository setup complete!${NC}"
echo ""
echo "📋 Repository URL:"
echo "   https://github.com/$GITHUB_ORG/$REPO_NAME"
echo ""
echo "🔗 Useful links:"
echo "   Issues: https://github.com/$GITHUB_ORG/$REPO_NAME/issues"
echo "   Discussions: https://github.com/$GITHUB_ORG/$REPO_NAME/discussions"
echo "   Actions: https://github.com/$GITHUB_ORG/$REPO_NAME/actions"
echo ""
echo "📣 Next steps:"
echo "   1. Star the repository ⭐"
echo "   2. Create your first release"
echo "   3. Share on social media!"
echo ""
