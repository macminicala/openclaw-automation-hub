#!/bin/bash
# Automation Hub - Simple Install Script
# Run with: bash install.sh

set -e

echo "⚡ Automation Hub - Installing..."
echo ""

# Navigate to skill directory (where this script is)
cd "$(dirname "$0")"

# Create symlink or copy to OpenClaw skills
TARGET="$HOME/.openclaw/skills/automation-hub"

if [ ! -d "$TARGET" ]; then
    echo "📦 Installing to ~/.openclaw/skills/..."
    mkdir -p "$HOME/.openclaw/skills"
    ln -sf "$(pwd)" "$TARGET" 2>/dev/null || cp -r "$(pwd)" "$TARGET"
    echo "✅ Installed to $TARGET"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install 2>/dev/null || npm install

# Run tests
echo ""
echo "🧪 Running tests..."
npm test

echo ""
echo "✅ Done!"
echo ""
echo "🚀 Start dashboard:"
echo "   cd $TARGET"
echo "   node dashboard/server.js"
echo ""
echo "🌐 Open: http://localhost:18795"
