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
# Automation Hub CLI - Usage: automationhub <command>

SKILL_DIR="$HOME/.clawd/skills/automation-hub"
AUTOMATIONS_DIR="$HOME/.openclaw/automations"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

log() { echo -e "${CYAN}[🤖]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

show_help() {
    echo ""
    echo -e "${MAGENTA}⚡ Automation Hub CLI${NC}"
    echo ""
    echo "Usage: automationhub <command>"
    echo ""
    echo "Commands:"
    echo "  install      Install/update Automation Hub"
    echo "  test         Run tests"
    echo "  list         List automations"
    echo "  enable <id>  Enable automation"
    echo "  disable <id> Disable automation"
    echo "  test <id>    Test automation"
    echo "  dashboard    Start dashboard"
    echo "  status       Show status"
    echo "  help         Show help"
    echo ""
}

check_skill_dir() {
    [ -d "$SKILL_DIR" ] || error "Automation Hub not found. Run: automationhub install"
}

cmd_install() {
    log "Installing Automation Hub..."
    if [ ! -d "$SKILL_DIR" ]; then
        mkdir -p "$HOME/.clawd/skills"
        git clone https://github.com/macminicala/openclaw-automation-hub.git "$SKILL_DIR"
    else
        cd "$SKILL_DIR" && git pull origin main 2>/dev/null || warn "Could not update"
    fi
    cd "$SKILL_DIR"
    npm install 2>/dev/null || npm install
    success "Automation Hub ready!"
}

cmd_list() {
    check_skill_dir
    node "$SKILL_DIR/cli/main.js" list
}

cmd_dashboard() {
    check_skill_dir
    log "Starting API Server (port 18799)..."
    cd "$SKILL_DIR"
    node api-server.js &
    API_PID=$!
    sleep 1
    
    log "Starting Next.js Dashboard (port 3000)..."
    cd "$SKILL_DIR/dashboard"
    npm run dev &
    DASH_PID=$!
    
    echo ""
    echo -e "${GREEN}🌐 Dashboard: http://localhost:3000${NC}"
    echo -e "${YELLOW}🔌 API:       http://localhost:18799${NC}"
    echo ""
    echo "Press Ctrl+C to stop all servers"
    
    # Wait for Ctrl+C
    trap "kill $API_PID $DASH_PID 2>/dev/null; exit" INT
    wait
}

cmd_start() {
    check_skill_dir
    log "Starting Automation Hub..."
    cd "$SKILL_DIR"
    
    # Start API in background
    if lsof -i :18799 >/dev/null 2>&1; then
        warn "API already running on port 18799"
    else
        nohup node api-server.js > /tmp/automation-api.log 2>&1 &
        sleep 1
        if lsof -i :18799 >/dev/null 2>&1; then
            success "API started (port 18799)"
        else
            error "Failed to start API"
        fi
    fi
    
    # Start Dashboard in background
    if lsof -i :3000 >/dev/null 2>&1; then
        warn "Dashboard already running on port 3000"
    else
        cd "$SKILL_DIR/dashboard"
        nohup npm run dev > /tmp/automation-dashboard.log 2>&1 &
        sleep 3
        if lsof -i :3000 >/dev/null 2>&1; then
            success "Dashboard started (port 3000)"
        else
            error "Failed to start Dashboard"
        fi
    fi
    
    echo ""
    echo -e "${GREEN}✅ Automation Hub is running!${NC}"
    echo ""
    echo "   🌐 http://localhost:3000 - Dashboard"
    echo "   🔌 http://localhost:18799 - API"
    echo ""
    echo "To stop: automationhub stop"
}

cmd_stop() {
    log "Stopping Automation Hub..."
    
    # Kill API
    if lsof -i :18799 >/dev/null 2>&1; then
        kill $(lsof -ti :18799) 2>/dev/null
        sleep 1
        success "API stopped"
    else
        warn "API not running"
    fi
    
    # Kill Dashboard
    if lsof -i :3000 >/dev/null 2>&1; then
        kill $(lsof -ti :3000) 2>/dev/null
        sleep 1
        success "Dashboard stopped"
    else
        warn "Dashboard not running"
    fi
}

cmd_status() {
    echo ""
    echo -e "${MAGENTA}⚡ Automation Hub Status${NC}"
    echo ""
    
    API_RUNNING=false
    DASH_RUNNING=false
    
    if lsof -i :18799 >/dev/null 2>&1; then
        API_RUNNING=true
        echo -e "🔌 API:       ${GREEN}Running${NC} (port 18799)"
    else
        echo -e "🔌 API:       ${RED}Stopped${NC}"
    fi
    
    if lsof -i :3000 >/dev/null 2>&1; then
        DASH_RUNNING=true
        echo -e "🌐 Dashboard: ${GREEN}Running${NC} (port 3000)"
    else
        echo -e "🌐 Dashboard: ${RED}Stopped${NC}"
    fi
    
    echo ""
    
    TOTAL=$(ls -1 ~/.openclaw/automations/*.json 2>/dev/null | wc -l || echo 0)
    echo -e "📊 Total automations: $TOTAL"
    
    if [ "$API_RUNNING" = true ]; then
        echo ""
        echo "Quick links:"
        echo "   🌐 http://localhost:3000 - Dashboard"
        echo "   🔌 http://localhost:18799/api/automations - API"
    fi
}

cmd_status() {
    TOTAL=$(ls -1 ~/.openclaw/automations/*.json 2>/dev/null | wc -l || echo 0)
    echo ""
    echo -e "${MAGENTA}⚡ Automation Hub${NC}"
    echo ""
    echo "Total automations: $TOTAL"
    echo ""
}

case "$1" in
    install|setup) cmd_install ;;
    start) cmd_start ;;
    stop) cmd_stop ;;
    dashboard) cmd_dashboard ;;
    status) cmd_status ;;
    list|ls) cmd_list ;;
    help|--help|-h|"") show_help ;;
    *) cmd_list ;;
esac
CMDCAT
    chmod +x "$BIN_DIR/automationhub"
    
    # Add to PATH
    if ! grep -q 'automationhub' ~/.zshrc 2>/dev/null; then
        echo 'export PATH="$HOME/.clawd/bin:$PATH"' >> ~/.zshrc
    fi
    
    source ~/.zshrc 2>/dev/null || true
    
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
