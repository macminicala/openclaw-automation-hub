#!/bin/bash
# OpenClaw Automation Hub - Installation Script
# Run with: bash install.sh

set -e

echo "⚡ OpenClaw Automation Hub - Installation"
echo "========================================"

# Step 1: Install dependencies
echo ""
echo "📦 Installing dependencies..."
cd "$(dirname "$0")"
npm install 2>/dev/null || npm install

# Step 2: Run tests
echo ""
echo "🧪 Running tests..."
npm test

# Step 3: Create demo automations
echo ""
echo "📁 Creating demo automations..."
mkdir -p ~/.openclaw/automations

cat > ~/.openclaw/automations/morning-briefing.json << 'EOF'
{
  "id": "morning-briefing",
  "name": "Morning Briefing",
  "enabled": true,
  "description": "Your daily morning summary",
  "trigger": { "type": "schedule", "cron": "0 8 * * 1-5" },
  "conditions": [],
  "actions": [{ "type": "shell", "command": "echo '☀️ Morning!'" }]
}
EOF

cat > ~/.openclaw/automations/webhook-test.json << 'EOF'
{
  "id": "webhook-test",
  "name": "Webhook Test",
  "enabled": true,
  "description": "Test webhook triggers",
  "trigger": { "type": "webhook", "port": 18796, "endpoint": "/webhook-test" },
  "conditions": [],
  "actions": [{ "type": "shell", "command": "echo '🔗 Webhook triggered'" }]
}
EOF

echo "✅ Created: morning-briefing.json"
echo "✅ Created: webhook-test.json"

# Step 4: Create convenience scripts (no chmod needed)
mkdir -p ~/.openclaw/bin

# Dashboard launcher
cat > ~/.openclaw/bin/run-dashboard << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/../../skills/automation-hub"
node dashboard/server.js
EOF

# CLI launcher
cat > ~/.openclaw/bin/run-automation << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/../../skills/automation-hub"
node cli/main.js "$@"
EOF

echo ""
echo "✅ Created convenience scripts"
echo ""
echo "========================================"
echo "✅ Installation complete!"
echo ""
echo "📋 Commands:"
echo ""
echo "  # Run dashboard"
echo "  bash ~/.openclaw/bin/run-dashboard"
echo ""
echo "  # List automations"
echo "  bash ~/.openclaw/bin/run-automation list"
echo ""
echo "  # Start dashboard (direct)"
echo "  node ~/clawd/skills/automation-hub/dashboard/server.js"
echo ""
echo "🌐 Dashboard: http://localhost:18795"
echo ""
