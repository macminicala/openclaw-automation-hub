#!/bin/bash
# OpenClaw Automation Hub - Local Installation Script
# Run this to install and test locally

set -e

echo "⚡ OpenClaw Automation Hub - Local Installation"
echo "=============================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📍 Location: $(pwd)${NC}"
echo ""

# Step 1: Check Node.js
echo -e "${BLUE}1. Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}❌ Node.js not found. Install from https://nodejs.org${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js version: $NODE_VERSION${NC}"

# Step 2: Install dependencies
echo ""
echo -e "${BLUE}2. Installing dependencies...${NC}"
npm install 2>/dev/null || npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 3: Run tests
echo ""
echo -e "${BLUE}3. Running test suite...${NC}"
echo ""
npm test
echo ""

# Step 4: Create demo automations
echo -e "${BLUE}4. Creating demo automations...${NC}"
mkdir -p ~/.openclaw/automations

# Morning Briefing
cat > ~/.openclaw/automations/morning-briefing.json << 'EOF'
{
  "id": "morning-briefing",
  "name": "Morning Briefing",
  "enabled": true,
  "description": "Your daily morning summary at 8AM",
  "trigger": {
    "type": "schedule",
    "cron": "0 8 * * 1-5"
  },
  "conditions": [],
  "actions": [
    {
      "type": "shell",
      "command": "echo '☀️ Good morning! Automation Hub is running.'"
    }
  ]
}
EOF
echo -e "${GREEN}✅ Created: morning-briefing.json${NC}"

# Webhook Test
cat > ~/.openclaw/automations/webhook-test.json << 'EOF'
{
  "id": "webhook-test",
  "name": "Webhook Test",
  "enabled": true,
  "description": "Test webhook triggers",
  "trigger": {
    "type": "webhook",
    "port": 18800,
    "endpoint": "/webhook-test"
  },
  "conditions": [],
  "actions": [
    {
      "type": "shell",
      "command": "echo '🔗 Webhook triggered at $(date)'"
    },
    {
      "type": "notify",
      "channel": "telegram",
      "message": "⚡ Webhook automation executed!"
    }
  ]
}
EOF
echo -e "${GREEN}✅ Created: webhook-test.json${NC}"

# System Monitor
cat > ~/.openclaw/automations/system-monitor.json << 'EOF'
{
  "id": "system-monitor",
  "name": "System Monitor",
  "enabled": false,
  "description": "Alert when system resources are running low",
  "trigger": {
    "type": "system",
    "interval": 60,
    "cpuThreshold": 90,
    "memoryThreshold": 90,
    "diskThreshold": 95
  },
  "conditions": [],
  "actions": [
    {
      "type": "notify",
      "channel": "telegram",
      "message": "🔴 System Alert triggered"
    }
  ]
}
EOF
echo -e "${GREEN}✅ Created: system-monitor.json${NC}"

# Step 5: Create CLI aliases
echo ""
echo -e "${BLUE}5. Setting up CLI commands...${NC}"

# Create bin directory
mkdir -p ~/.openclaw/bin

# Automation Hub CLI
cat > ~/.openclaw/bin/automation-hub << 'EOF'
#!/bin/bash
# OpenClaw Automation Hub CLI
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/../skills/automation-hub/cli/main.js" "$@"
EOF
chmod +x ~/.openclaw/bin/automation-hub
echo -e "${GREEN}✅ CLI created: automation-hub${NC}"

# Dashboard CLI
cat > ~/.openclaw/bin/automation-dashboard << 'EOF'
#!/bin/bash
# OpenClaw Automation Hub Dashboard
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/../skills/automation-hub/dashboard/server.js" "$@"
EOF
chmod +x ~/.openclaw/bin/automation-dashboard
echo -e "${GREEN}✅ CLI created: automation-dashboard${NC}"

# Add to PATH
if ! grep -q "openclaw/bin" ~/.zshrc 2>/dev/null; then
    echo '' >> ~/.zshrc
    echo '# OpenClaw Automation Hub' >> ~/.zshrc
    echo 'export PATH="$HOME/.openclaw/bin:$PATH"' >> ~/.zshrc
    echo -e "${GREEN}✅ Added to PATH (restart terminal or source ~/.zshrc)${NC}"
fi

# Summary
echo ""
echo "=============================================="
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo -e "${BLUE}📋 Commands:${NC}"
echo ""
echo "  automation-hub list              # List automations"
echo "  automation-hub enable <id>     # Enable automation"
echo "  automation-hub disable <id>      # Disable automation"
echo "  automation-hub test <id>        # Test automation"
echo ""
echo "  automation-dashboard             # Start dashboard"
echo ""
echo -e "${BLUE}🌐 Dashboard URL:${NC}"
echo "  http://localhost:18799"
echo ""
echo -e "${BLUE}📊 Automations created:${NC}"
ls -la ~/.openclaw/automations/ 2>/dev/null || echo "  None"
echo ""
echo -e "${YELLOW}🚀 To start the dashboard:${NC}"
echo "  automation-dashboard"
echo ""
