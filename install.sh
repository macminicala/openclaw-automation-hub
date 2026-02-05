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
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

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
    echo "  install              Install/update Automation Hub"
    echo "  start                Start API + Dashboard"
    echo "  stop                 Stop all servers"
    echo "  status               Show status of all servers"
    echo "  dashboard [start|stop|status]  Dashboard management"
    echo "  api [start|stop|status]        API server management"
    echo "  list                 List automations"
    echo "  help                 Show help"
    echo ""
}

check_skill_dir() {
    [ -d "$SKILL_DIR" ] || error "Automation Hub not found. Run: automationhub install"
}

# Check if process is running by exact PID file or pgrep
is_api_running() {
    pgrep -f "api-server.js" >/dev/null 2>&1
}

is_dashboard_running() {
    pgrep -f "next" >/dev/null 2>&1
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
    local action="${2:-status}"

    case "$action" in
        start)
            log "Starting Dashboard..."
            if is_dashboard_running; then
                warn "Dashboard already running"
            else
                log "Starting Next.js dev server..."
                cd "$SKILL_DIR/dashboard"
                nohup npm run dev > /tmp/automation-dashboard.log 2>&1 &
                echo $! > /tmp/automation-dashboard.pid
                sleep 3
                if is_dashboard_running; then
                    success "Dashboard started on port 3000"
                else
                    error "Failed to start Dashboard. Check: cat /tmp/automation-dashboard.log"
                fi
            fi
            ;;
        stop)
            log "Stopping Dashboard..."
            if is_dashboard_running; then
                PIDS=$(pgrep -f "next" 2>/dev/null)
                if [ -n "$PIDS" ]; then
                    echo "$PIDS" | xargs kill -9 2>/dev/null
                    rm -f /tmp/automation-dashboard.pid
                    success "Dashboard stopped"
                else
                    warn "Could not find Dashboard process"
                    rm -f /tmp/automation-dashboard.pid
                fi
            else
                warn "Dashboard not running"
                rm -f /tmp/automation-dashboard.pid
            fi
            ;;
        status|*)
            if is_dashboard_running; then
                PID=$(pgrep -f "next" 2>/dev/null | head -1)
                echo -e "🌐 Dashboard: ${GREEN}Running${NC} (port 3000)"
                [ -n "$PID" ] && echo "   PID: $PID"
            else
                echo -e "🌐 Dashboard: ${RED}Stopped${NC}"
            fi
            ;;
    esac
}

cmd_api() {
    check_skill_dir
    local action="${2:-status}"

    case "$action" in
        start)
            log "Starting API Server..."
            if is_api_running; then
                warn "API already running"
            else
                log "Starting Node API server..."
                cd "$SKILL_DIR"
                nohup node api-server.js > /tmp/automation-api.log 2>&1 &
                echo $! > /tmp/automation-api.pid
                sleep 2
                if is_api_running; then
                    success "API started on port 18799"
                else
                    error "Failed to start API. Check: cat /tmp/automation-api.log"
                fi
            fi
            ;;
        stop)
            log "Stopping API..."
            if is_api_running; then
                PIDS=$(pgrep -f "api-server.js" 2>/dev/null)
                if [ -n "$PIDS" ]; then
                    echo "$PIDS" | xargs kill -9 2>/dev/null
                    rm -f /tmp/automation-api.pid
                    success "API stopped"
                else
                    warn "Could not find API process"
                    rm -f /tmp/automation-api.pid
                fi
            else
                warn "API not running"
                rm -f /tmp/automation-api.pid
            fi
            ;;
        status|*)
            if is_api_running; then
                PID=$(pgrep -f "api-server.js" 2>/dev/null | head -1)
                echo -e "🔌 API: ${GREEN}Running${NC} (port 18799)"
                [ -n "$PID" ] && echo "   PID: $PID"
            else
                echo -e "🔌 API: ${RED}Stopped${NC}"
            fi
            ;;
    esac
}

cmd_start() {
    cmd_api start
    cmd_dashboard start
}

cmd_stop() {
    cmd_dashboard stop
    cmd_api stop
}

cmd_status() {
    cmd_api status
    cmd_dashboard status

    TOTAL=$(ls -1 ~/.openclaw/automations/*.json 2>/dev/null | wc -l || echo 0)
    echo ""
    echo "📊 Total automations: $TOTAL"
}

case "$1" in
    install|setup) cmd_install ;;
    start) cmd_start ;;
    stop) cmd_stop ;;
    dashboard) cmd_dashboard "${2:-status}" ;;
    api) cmd_api "${2:-status}" ;;
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
    echo ""
    echo "🌐 Run 'automationhub start' to begin!"
}

# Main
case "$1" in
    install|--install|-i|"")
        install
        echo ""
        echo -e "${GREEN}🚀 Quick start:${NC}"
        echo "   automationhub start"
        echo ""
        ;;
    help|--help|-h|"")
        echo ""
        echo -e "${MAGENTA}⚡ Automation Hub${NC}"
        echo ""
        echo "Usage: curl -fsSL https://raw.githubusercontent.com/macminicala/openclaw-automation-hub/main/install.sh | bash"
        echo ""
        echo "Commands:"
        echo "   install     Install"
        echo "   start       Start servers"
        echo "   status      Show status"
        echo ""
        ;;
esac
