#!/bin/bash
# OpenClaw Automation Hub Wizard
# Usage: bash automation-hub.sh
# Or add to PATH as: automation-hub

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SKILL_DIR="$HOME/.openclaw/skills/automation-hub"
AUTOMATIONS_DIR="$HOME/.openclaw/automations"
GITHUB_REPO="https://github.com/macminicala/openclaw-automation-hub.git"

# Helper functions
log() { echo -e "${CYAN}[🤖]${NC} $1"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# ASCII Art
show_banner() {
    echo -e "${BLUE}"
    echo "  ╔════════════════════════════════════════════════════╗"
    echo "  ║      ⚡ OpenClaw Automation Hub Wizard ⚡        ║"
    echo "  ║     Transform your AI into a proactive agent     ║"
    echo "  ╚════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check Node.js
check_node() {
    log "Checking Node.js..."
    if ! command -v node &> /dev/null; then
        error "Node.js not found. Install from https://nodejs.org"
        exit 1
    fi
    NODE_VERSION=$(node -v)
    success "Node.js version: $NODE_VERSION"
}

# Check Git
check_git() {
    log "Checking Git..."
    if ! command -v git &> /dev/null; then
        warn "Git not found. Some features may not work."
    else
        success "Git available"
    fi
}

# Clone or update repository
clone_or_update() {
    log "Setting up Automation Hub..."
    
    if [ -d "$SKILL_DIR/.git" ]; then
        log "Updating existing installation..."
        cd "$SKILL_DIR"
        git pull origin main 2>/dev/null || warn "Could not update. Continuing with current version."
        success "Automation Hub updated"
    else
        log "Cloning Automation Hub..."
        mkdir -p "$HOME/.openclaw/skills"
        git clone "$GITHUB_REPO" "$SKILL_DIR" 2>/dev/null || {
            error "Failed to clone. Check your internet connection."
            exit 1
        }
        success "Automation Hub installed"
    fi
}

# Install dependencies
install_deps() {
    log "Installing dependencies..."
    cd "$SKILL_DIR"
    npm install 2>/dev/null || npm install
    success "Dependencies installed"
}

# Run tests
run_tests() {
    log "Running tests..."
    cd "$SKILL_DIR"
    if npm test 2>&1 | grep -q "All tests passed"; then
        success "All 31 tests passed!"
    else
        warn "Some tests failed. Run 'npm test' for details."
    fi
}

# Create automations directory
setup_automations() {
    log "Setting up automations directory..."
    mkdir -p "$AUTOMATIONS_DIR"
    
    # Create demo automations
    cat > "$AUTOMATIONS_DIR/morning-briefing.json" << 'EOF'
{
  "id": "morning-briefing",
  "name": "Morning Briefing",
  "enabled": false,
  "description": "Your daily morning summary at 8AM",
  "trigger": { "type": "schedule", "cron": "0 8 * * 1-5" },
  "conditions": [],
  "actions": [{ "type": "shell", "command": "echo '☀️ Good morning!'" }]
}
EOF

    cat > "$AUTOMATIONS_DIR/webhook-test.json" << 'EOF'
{
  "id": "webhook-test",
  "name": "Webhook Test",
  "enabled": false,
  "description": "Test automation via HTTP webhook",
  "trigger": { "type": "webhook", "port": 18796, "endpoint": "/webhook-test" },
  "conditions": [],
  "actions": [{ "type": "shell", "command": "echo '🔗 Webhook triggered at $(date)'" }]
}
EOF

    cat > "$AUTOMATIONS_DIR/system-monitor.json" << 'EOF'
{
  "id": "system-monitor",
  "name": "System Monitor",
  "enabled": false,
  "description": "Alert when system resources are running low",
  "trigger": { "type": "system", "interval": 60, "cpuThreshold": 90, "memoryThreshold": 90, "diskThreshold": 95 },
  "conditions": [],
  "actions": [{ "type": "notify", "channel": "telegram", "message": "🔴 System alert" }]
}
EOF

    success "Created demo automations in ~/.openclaw/automations/"
}

# Setup command aliases
setup_aliases() {
    log "Creating convenience commands..."
    
    mkdir -p "$HOME/.claw-commands"
    
    # Create automation-hub command
    cat > "$HOME/.claw-commands/automation-hub" << 'EOF'
#!/bin/bash
# Automation Hub CLI - Add to PATH or alias
cd "$HOME/.clawd/skills/automation-hub"
node cli/main.js "$@"
EOF
    chmod +x "$HOME/.claw-commands/automation-hub"
    
    # Create automation-dashboard command  
    cat > "$HOME/.claw-commands/automation-dashboard" << 'EOF'
#!/bin/bash
# Automation Hub Dashboard
cd "$HOME/.clawd/skills/automation-hub"
node dashboard/server.js
EOF
    chmod +x "$HOME/.claw-commands/automation-dashboard"
    
    success "Created commands in ~/.claw-commands/"
    echo ""
    echo -e "${YELLOW}To add commands to PATH, run:${NC}"
    echo '  export PATH="$HOME/.claw-commands:$PATH"'
    echo ""
}

# Health check
health_check() {
    log "Running health check..."
    cd "$SKILL_DIR"
    
    CHECKS=0
    PASS=0
    
    ((CHECKS++))
    if [ -f "package.json" ]; then ((PASS++)); else error "package.json missing"; fi
    
    ((CHECKS++))
    if [ -f "src/engine.js" ]; then ((PASS++)); else error "engine.js missing"; fi
    
    ((CHECKS++))
    if [ -d "dashboard" ]; then ((PASS++)); else error "dashboard missing"; fi
    
    ((CHECKS++))
    if [ -d "examples" ]; then ((PASS++)); else warn "examples missing"; fi
    
    echo ""
    success "Health check: $PASS/$CHECKS passed"
}

# Start dashboard
start_dashboard() {
    echo ""
    log "Starting Automation Hub Dashboard..."
    echo ""
    echo -e "${GREEN}🌐 Dashboard will be available at:${NC}"
    echo "   http://localhost:18795"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    
    cd "$SKILL_DIR"
    node dashboard/server.js
}

# Main menu
show_menu() {
    show_banner
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  1️⃣  Install Automation Hub"
    echo "  2️⃣  Run tests (31 tests)"
    echo "  3️⃣  Create demo automations"
    echo "  4️⃣  Health check"
    echo "  5️⃣  Start dashboard"
    echo "  6️⃣  Full setup (all of the above)"
    echo ""
    echo "  0️⃣  Exit"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    read -p "  Choose an option [0-6]: " choice
    
    case $choice in
        1) check_node; check_git; clone_or_update; install_deps; success "Installation complete!" ;;
        2) run_tests ;;
        3) setup_automations ;;
        4) health_check ;;
        5) start_dashboard ;;
        6) 
            check_node
            check_git
            clone_or_update
            install_deps
            run_tests
            setup_automations
            setup_aliases
            health_check
            echo ""
            success "Full setup complete!"
            echo ""
            echo "🚀 To start the dashboard:"
            echo "   bash $HOME/.claw-commands/automation-dashboard"
            ;;
        0) exit 0 ;;
        *) error "Invalid option"; show_menu ;;
    esac
}

# Check for --non-interactive flag
if [ "$1" = "--non-interactive" ] || [ "$1" = "-y" ]; then
    check_node
    check_git
    clone_or_update
    install_deps
    setup_automations
    setup_aliases
    health_check
    success "Automation Hub installed!"
    echo ""
    echo "🚀 Start dashboard: node $SKILL_DIR/dashboard/server.js"
else
    show_menu
fi
