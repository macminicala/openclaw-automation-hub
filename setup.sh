#!/bin/bash
# OpenClaw Automation Hub - Setup Script
set -e

echo "⚡ OpenClaw Automation Hub - Setup"
echo "=================================="

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Install from https://nodejs.org"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Create directories
mkdir -p ~/.openclaw/automations
mkdir -p ~/.openclaw/skills/automation-hub
mkdir -p ~/.openclaw/bin

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
cd ~/.openclaw/skills/automation-hub

npm install --silent 2>/dev/null || npm install
npm install node-cron --silent 2>/dev/null || npm install node-cron

# Copy skill files
echo ""
echo "📁 Setting up skill files..."
cp src/engine.js ~/.openclaw/skills/automation-hub/src/ 2>/dev/null || true
cp cli/main.js ~/.openclaw/skills/automation-hub/cli/ 2>/dev/null || true
cp SKILL.md ~/.openclaw/skills/automation-hub/ 2>/dev/null || true

# Copy dashboard files
echo ""
echo "🎨 Setting up dashboard..."
mkdir -p ~/.openclaw/skills/automation-hub/dashboard
cp dashboard/server.js ~/.openclaw/skills/automation-hub/dashboard/
cp dashboard/index.html ~/.openclaw/skills/automation-hub/dashboard/
cp dashboard/styles.css ~/.openclaw/skills/automation-hub/dashboard/
cp dashboard/app.js ~/.openclaw/skills/automation-hub/dashboard/

# Create default automations
if [ ! -f ~/.openclaw/automations/hello-world.json ]; then
    cat > ~/.openclaw/automations/hello-world.json << 'EOF'
{
  "id": "hello-world",
  "name": "Hello World",
  "enabled": true,
  "description": "Your first automation - runs every minute",
  "trigger": {
    "type": "schedule",
    "cron": "* * * * *"
  },
  "actions": [
    {
      "type": "shell",
      "command": "echo 'Automation triggered at $(date)'"
    }
  ]
}
EOF
    echo "✅ Created sample automation: hello-world"
fi

if [ ! -f ~/.openclaw/automations/dashboard-demo.json ]; then
    cp ~/.openclaw/skills/automation-hub/examples/dashboard-demo.json ~/.openclaw/automations/
    echo "✅ Created dashboard demo automation"
fi

# Create aliases
echo ""
echo "🔗 Creating CLI aliases..."

ALIAS_DIR=~/.openclaw/bin

# Automation Hub CLI
cat > "$ALIAS_DIR/automation-hub" << 'EOF'
#!/bin/bash
# OpenClaw Automation Hub CLI
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/../skills/automation-hub/cli/main.js" "$@"
EOF
chmod +x "$ALIAS_DIR/automation-hub"

# Dashboard CLI
cat > "$ALIAS_DIR/automation-dashboard" << 'EOF'
#!/bin/bash
# OpenClaw Automation Hub Dashboard
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/../skills/automation-hub/dashboard/server.js" "$@"
EOF
chmod +x "$ALIAS_DIR/automation-dashboard"

# Add to PATH if not already
PROFILE_FILE="$HOME/.zshrc"
if [ -f "$PROFILE_FILE" ]; then
    if ! grep -q "openclaw/bin" "$PROFILE_FILE"; then
        echo '' >> "$PROFILE_FILE"
        echo '# OpenClaw Automation Hub' >> "$PROFILE_FILE"
        echo 'export PATH="$HOME/.openclaw/bin:$PATH"' >> "$PROFILE_FILE"
        echo "✅ Added ~/.openclaw/bin to PATH"
    fi
fi

echo ""
echo "=================================="
echo "✅ Setup complete!"
echo ""
echo "📋 Available Commands:"
echo ""
echo "  automation-hub list              # List automations (CLI)"
echo "  automation-hub enable <id>       # Enable automation"
echo "  automation-hub test <id>        # Test automation"
echo ""
echo "  automation-dashboard             # Start dashboard server"
echo ""
echo "🌐 Dashboard URL:"
echo "  http://localhost:18795"
echo ""
echo "💡 To start the dashboard:"
echo "  automation-dashboard"
echo ""
