#!/bin/bash
# Automation Hub - One-line Install
# Usage: curl -fsSL https://raw.githubusercontent.com/macminicala/openclaw-automation-hub/main/install.sh | bash

set -e

# Configuration
SKILL_DIR="$HOME/.clawd/skills/automation-hub"
BIN_DIR="$HOME/.clawd/bin"
GITHUB_REPO="https://github.com/macminicala/openclaw-automation-hub.git"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Functions
log() { echo -e "${CYAN}[🤖]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# Install
install() {
    # Clone or update
    if [ ! -d "$SKILL_DIR" ]; then
        log "Installing Automation Hub..."
        mkdir -p "$HOME/.clawd/skills"
        git clone "$GITHUB_REPO" "$SKILL_DIR"
    else
        log "Updating Automation Hub..."
        cd "$SKILL_DIR"
        git pull origin main 2>/dev/null || warn "Could not update"
    fi
    
    # Install dependencies (once)
    log "Installing dependencies..."
    cd "$SKILL_DIR"
    npm install 2>/dev/null || npm install
    
    # Create demo automations
    mkdir -p "$HOME/.openclaw/automations"
    
    cat > "$HOME/.openclaw/automations/morning-briefing.json" << 'EOF'
{
  "id": "morning-briefing",
  "name": "Morning Briefing",
  "enabled": false,
  "trigger": { "type": "schedule", "cron": "0 8 * * 1-5" },
  "actions": [{ "type": "shell", "command": "echo '☀️ Good morning!'" }]
}
EOF
    
    cat > "$HOME/.openclaw/automations/webhook-test.json" << 'EOF'
{
  "id": "webhook-test",
  "name": "Webhook Test",
  "enabled": false,
  "trigger": { "type": "webhook", "port": 18800, "endpoint": "/webhook-test" },
  "actions": [{ "type": "shell", "command": "echo '🔗 Webhook triggered'" }]
}
EOF
    
    # Create command
    mkdir -p "$BIN_DIR"
    cat > "$BIN_DIR/automationhub" << 'CMDCAT'
#!/bin/bash
# Automation Hub CLI
SKILL_DIR="$HOME/.clawd/skills/automation-hub"
[ -d "$SKILL_DIR" ] && cd "$SKILL_DIR" && node cli/main.js "$@"
CMDCAT
    chmod +x "$BIN_DIR/automationhub"
    
    # Add to PATH in .zshrc if not already there
    if ! grep -q 'automationhub' ~/.zshrc 2>/dev/null; then
        echo 'export PATH="$HOME/.clawd/bin:$PATH"' >> ~/.zshrc
    fi
    
    success "Automation Hub installed!"
}

# Run tests
test() {
    cd "$SKILL_DIR"
    npm test
}

# Show status
status() {
    echo ""
    echo -e "${MAGENTA}⚡ Automation Hub Status${NC}"
    echo ""
    echo -e "📁 $SKILL_DIR"
    echo -e "📋 ~/.openclaw/automations/"
    
    TOTAL=$(ls -1 ~/.openclaw/automations/*.json 2>/dev/null | wc -l || echo 0)
    echo -e "📊 Total automations: $TOTAL"
    
    ENABLED=$(grep -l '"enabled": true' ~/.openclaw/automations/*.json 2>/dev/null | wc -l || echo 0)
    echo -e "🟢 Enabled: $ENABLED"
    
    echo ""
}

# Main
case "$1" in
    test|--test|-t)
        test
        ;;
    status|--status|-s)
        status
        ;;
    install|--install|-i|"")
        install
        echo ""
        echo -e "${GREEN}🚀 Quick start:${NC}"
        echo "   automationhub status"
        echo "   automationhub dashboard"
        echo ""
        ;;
    help|--help|-h|"")
        echo ""
        echo -e "${MAGENTA}⚡ Automation Hub${NC}"
        echo ""
        echo "Usage: curl -fsSL https://raw.githubusercontent.com/macminicala/openclaw-automation-hub/main/install.sh | bash"
        echo ""
        echo "Commands:"
        echo "   (none)     Install"
        echo "   test        Run tests"
        echo "   status      Show status"
        echo ""
        ;;
esac
