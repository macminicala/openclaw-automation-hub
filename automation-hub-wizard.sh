#!/bin/bash
# OpenClaw Automation Hub - Interactive Setup Wizard
# Usage: bash automation-hub-wizard.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Config
SKILL_DIR="$HOME/.openclaw/skills/automation-hub"
AUTOMATIONS_DIR="$HOME/.openclaw/automations"
GITHUB_REPO="https://github.com/macminicala/openclaw-automation-hub.git"

# Banner
banner() {
    echo ""
    echo -e "${MAGENTA}    ╔════════════════════════════════════════════╗${NC}"
    echo -e "${MAGENTA}    ║   ⚡ Automation Hub Setup Wizard ⚡        ║${NC}"
    echo -e "${MAGENTA}    ║   Your AI assistant, now proactive       ║${NC}"
    echo -e "${MAGENTA}    ╚════════════════════════════════════════════╝${NC}"
    echo ""
}

# Welcome
welcome() {
    banner
    echo -e "${CYAN}This wizard will help you install and configure${NC}"
    echo -e "${CYAN}Automation Hub for OpenClaw.${NC}"
    echo ""
    echo -e "${YELLOW}What we'll do:${NC}"
    echo "  1. Check prerequisites (Node.js)"
    echo "  2. Clone/install Automation Hub"
    echo "  3. Install dependencies"
    echo "  4. Run tests"
    echo "  5. Create demo automations"
    echo ""
    echo -e "${GREEN}Let's get started!${NC}"
    echo ""
    read -p "Press Enter to continue..."
}

# Check Node.js
check_prereqs() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  1. Checking Prerequisites${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        echo -e "  ${GREEN}✅${NC} Node.js: $NODE_VERSION"
    else
        echo -e "  ${RED}❌${NC} Node.js not found"
        echo ""
        echo "  Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
    
    # Git
    if command -v git &> /dev/null; then
        echo -e "  ${GREEN}✅${NC} Git: available"
    else
        echo -e "  ${YELLOW}⚠️${NC} Git: not found (optional)"
    fi
    
    echo ""
}

# Clone/Install
install_hub() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  2. Installing Automation Hub${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if [ -d "$SKILL_DIR/.git" ]; then
        echo "  Automation Hub already installed at:"
        echo "    $SKILL_DIR"
        echo ""
        read -p "  Update to latest version? [Y/n]: " update
        if [ "$update" != "n" ] && [ "$update" != "N" ]; then
            cd "$SKILL_DIR"
            git pull origin main 2>/dev/null || echo "  Could not update (continuing)"
        fi
    else
        echo "  Cloning Automation Hub from GitHub..."
        mkdir -p "$HOME/.openclaw/skills"
        git clone "$GITHUB_REPO" "$SKILL_DIR" 2>/dev/null || {
            echo -e "  ${RED}❌ Clone failed. Check internet connection.${NC}"
            exit 1
        }
    fi
    
    echo -e "  ${GREEN}✅${NC} Automation Hub ready"
    echo ""
}

# Install dependencies
install_deps() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  3. Installing Dependencies${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    cd "$SKILL_DIR"
    echo "  Running: npm install"
    npm install 2>/dev/null || npm install
    
    echo ""
    echo -e "  ${GREEN}✅${NC} Dependencies installed"
    echo ""
}

# Run tests
run_tests() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  4. Running Tests${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    cd "$SKILL_DIR"
    npm test
    
    echo ""
}

# Create automations
create_automations() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  5. Creating Demo Automations${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    mkdir -p "$AUTOMATIONS_DIR"
    
    # Morning Briefing
    cat > "$AUTOMATIONS_DIR/morning-briefing.json" << 'EOF'
{
  "id": "morning-briefing",
  "name": "Morning Briefing",
  "enabled": false,
  "description": "Your daily morning summary",
  "trigger": { "type": "schedule", "cron": "0 8 * * 1-5" },
  "actions": [{ "type": "shell", "command": "echo '☀️ Good morning!'" }]
}
EOF
    echo -e "  ${GREEN}✅${NC} morning-briefing.json"
    
    # Webhook Test
    cat > "$AUTOMATIONS_DIR/webhook-test.json" << 'EOF'
{
  "id": "webhook-test",
  "name": "Webhook Test",
  "enabled": false,
  "description": "Test via HTTP webhook",
  "trigger": { "type": "webhook", "port": 18796, "endpoint": "/webhook-test" },
  "actions": [{ "type": "shell", "command": "echo '🔗 Webhook triggered'" }]
}
EOF
    echo -e "  ${GREEN}✅${NC} webhook-test.json"
    
    # System Monitor
    cat > "$AUTOMATIONS_DIR/system-monitor.json" << 'EOF'
{
  "id": "system-monitor",
  "name": "System Monitor",
  "enabled": false,
  "description": "Alert on high resource usage",
  "trigger": { "type": "system", "interval": 60, "cpuThreshold": 90 },
  "actions": [{ "type": "notify", "channel": "telegram", "message": "🔴 Alert" }]
}
EOF
    echo -e "  ${GREEN}✅${NC} system-monitor.json"
    
    echo ""
    echo "  Automations saved to: $AUTOMATIONS_DIR"
    echo ""
}

# Summary
summary() {
    echo ""
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}  ✅ Setup Complete!${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    echo -e "${CYAN}📁 Location:${NC} $SKILL_DIR"
    echo -e "${CYAN}📋 Automations:${NC} $AUTOMATIONS_DIR"
    echo ""
    
    echo -e "${YELLOW}🚀 To start the dashboard:${NC}"
    echo "   cd $SKILL_DIR"
    echo "   node dashboard/server.js"
    echo ""
    echo -e "${YELLOW}🌐 Then open:${NC}"
    echo "   http://localhost:18795"
    echo ""
    
    echo -e "${YELLOW}📖 Commands:${NC}"
    echo "   node $SKILL_DIR/cli/main.js list"
    echo "   node $SKILL_DIR/cli/main.js enable morning-briefing"
    echo "   node $SKILL_DIR/cli/main.js test webhook-test"
    echo ""
    
    echo -e "${GREEN}Happy automating! ⚡${NC}"
    echo ""
}

# Quick mode (non-interactive)
quick_mode() {
    banner
    check_prereqs
    install_hub
    install_deps
    run_tests
    create_automations
    summary
}

# Main
main() {
    if [ "$1" = "--quick" ] || [ "$1" = "-q" ]; then
        quick_mode
    else
        welcome
        check_prereqs
        install_hub
        install_deps
        run_tests
        create_automations
        summary
    fi
}

main "$@"
