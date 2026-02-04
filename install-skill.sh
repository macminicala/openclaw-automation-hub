#!/bin/bash
# Automation Hub - Skill Installation for OpenClaw
# This script installs the skill to ~/.openclaw/skills/

set -e

echo "⚡ Automation Hub - OpenClaw Skill Installation"
echo "=============================================="

# Skill directory
SKILL_DIR="$HOME/.openclaw/skills/automation-hub"
SKILL_SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "📍 Source: $SKILL_SOURCE"
echo "📍 Target: $SKILL_DIR"
echo ""

# Check if this is the right location
if [ "$SKILL_SOURCE" = "$SKILL_DIR" ]; then
    echo "✅ Already installed at correct location"
else
    echo "📦 Installing to ~/.openclaw/skills/..."
    
    # Create parent directory
    mkdir -p "$HOME/.openclaw/skills"
    
    # Copy skill files (if not already there)
    if [ -d "$SKILL_DIR" ]; then
        echo "⚠️  Skill already exists. Overwrite? (y/n)"
        read -r answer
        if [ "$answer" != "y" ]; then
            echo "❌ Installation cancelled"
            exit 0
        fi
        rm -rf "$SKILL_DIR"
    fi
    
    cp -r "$SKILL_SOURCE" "$SKILL_DIR"
    echo "✅ Installed to $SKILL_DIR"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
cd "$SKILL_DIR"
npm install 2>/dev/null || npm install

# Run tests
echo ""
echo "🧪 Running tests..."
npm test

# Create demo automations
echo ""
echo "📁 Creating demo automations..."
mkdir -p "$HOME/.openclaw/automations"

cat > "$HOME/.openclaw/automations/morning-briefing.json << 'EOF'
{
  "id": "morning-briefing",
  "name": "Morning Briefing",
  "enabled": true,
  "description": "Your daily morning summary",
  "trigger": { "type": "schedule", "cron": "0 8 * * 1-5" },
  "actions": [{ "type": "shell", "command": "echo '☀️ Good morning!'" }]
}
EOF

cat > "$HOME/.openclaw/automations/webhook-test.json << 'EOF'
{
  "id": "webhook-test",
  "name": "Webhook Test",
  "enabled": true,
  "description": "Test webhook triggers",
  "trigger": { "type": "webhook", "port": 18796, "endpoint": "/webhook-test" },
  "actions": [{ "type": "shell", "command": "echo '🔗 Webhook triggered'" }]
}
EOF

echo "✅ Created demo automations"

# Summary
echo ""
echo "=============================================="
echo "✅ Installation complete!"
echo ""
echo "📋 Skill location: $SKILL_DIR"
echo "📋 Automations: ~/.openclaw/automations/"
echo ""
echo "🚀 To start the dashboard:"
echo "   cd $SKILL_DIR"
echo "   node dashboard/server.js"
echo ""
echo "🌐 Dashboard: http://localhost:18795"
echo ""
echo "📖 Documentation: $SKILL_DIR/SKILL.md"
echo ""
