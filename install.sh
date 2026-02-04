#!/bin/bash
# Automation Hub - Quick Install
# Usage: bash install.sh

set -e

echo "⚡ Automation Hub - Installing..."
echo ""

# Install directory
SKILL_DIR="$HOME/.clawd/skills/automation-hub"

# Clone if not exists
if [ ! -d "$SKILL_DIR" ]; then
    echo "📦 Cloning Automation Hub..."
    mkdir -p "$HOME/.clawd/skills"
    git clone https://github.com/macminicala/openclaw-automation-hub.git "$SKILL_DIR"
fi

# Install deps
echo "📦 Installing dependencies..."
cd "$SKILL_DIR"
npm install 2>/dev/null || npm install

# Run tests
echo "🧪 Running tests..."
npm test

# Create demo automations
echo ""
echo "📁 Creating demo automations..."
mkdir -p "$HOME/.openclaw/automations"

# Morning briefing
cat > "$HOME/.openclaw/automations/morning-briefing.json" << 'EOF'
{
  "id": "morning-briefing",
  "name": "Morning Briefing",
  "enabled": false,
  "trigger": { "type": "schedule", "cron": "0 8 * * 1-5" },
  "actions": [{ "type": "shell", "command": "echo '☀️ Good morning!'" }]
}
EOF

# Webhook test
cat > "$HOME/.openclaw/automations/webhook-test.json" << 'EOF'
{
  "id": "webhook-test",
  "name": "Webhook Test",
  "enabled": false,
  "trigger": { "type": "webhook", "port": 18796, "endpoint": "/webhook-test" },
  "actions": [{ "type": "shell", "command": "echo '🔗 Webhook triggered'" }]
}
EOF

echo "✅ Created demo automations"

# Create automationhub command
echo ""
echo "📝 Creating automationhub command..."

# Check if ~/clawd/bin exists
if [ -d "$HOME/.clawd/bin" ]; then
    cp "$SKILL_DIR/automationhub" "$HOME/.clawd/bin/automationhub"
    chmod +x "$HOME/.clawd/bin/automationhub"
    
    echo "✅ Command created: ~/clawd/bin/automationhub"
    echo ""
    echo "🚀 To use automationhub, ensure ~/clawd/bin is in your PATH"
    echo ""
    echo "Add to PATH:"
    echo '  export PATH="$HOME/.clawd/bin:$PATH"'
else
    # Just make the script executable
    chmod +x "$SKILL_DIR/automationhub"
    echo "✅ Command ready: $SKILL_DIR/automationhub"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "📋 Usage:"
echo "  automationhub status      # Show status"
echo "  automationhub list       # List automations"
echo "  automationhub dashboard  # Start dashboard"
echo "  automationhub help      # Show help"
echo ""
echo "🌐 Dashboard: http://localhost:18795"
echo ""
