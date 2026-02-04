# ⚡ OpenClaw Automation Hub

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg)

**AI-native automation engine for OpenClaw.** Transform your personal AI assistant from proactive automation.

[GitHub](https://github.com/macminicala/openclaw-automation-hub)

</div>

---

## 🚀 Quick Install

```bash
# Clone and install
git clone https://github.com/macminicala/openclaw-automation-hub.git ~/.clawd/skills/automation-hub
cd ~/.clawd/skills/automation-hub
bash install.sh

# Or use the installer
curl -fsSL https://raw.githubusercontent.com/macminicala/openclaw-automation-hub/main/install.sh | bash
```

---

## 📦 Commands

After installation, use the `automationhub` command:

```bash
automationhub help           # Show help
automationhub status        # Show status
automationhub install       # Install/update
automationhub test          # Run tests
automationhub list          # List automations
automationhub enable <id>   # Enable automation
automationhub disable <id>  # Disable automation
automationhub test <id>     # Test automation
automationhub dashboard     # Start dashboard
automationhub create       # Create automation
```

---

## 🌐 Dashboard

```bash
automationhub dashboard
```

Then open **http://localhost:18795**

```
┌─────────────────────────────────────────┐
│ ⚡ Automation Hub v0.4                  │
├─────────────────────────────────────────┤
│ [3 automations]                        │
│ ☀️ Morning Briefing [❌]                │
│ 🔗 Webhook Test [❌]                   │
└─────────────────────────────────────────┘
```

---

## ✨ Features

### Triggers
| Command | Description |
|---------|-------------|
| `schedule` | Time-based (cron) |
| `webhook` | HTTP endpoint |
| `file_change` | File watching |
| `email` | IMAP monitoring |
| `calendar` | Event reminders |
| `system` | CPU/Memory alerts |

### Actions
| Action | Description |
|--------|-------------|
| `shell` | Execute commands |
| `agent` | AI-powered automation |
| `git` | Auto-commit/push |
| `notify` | Send to channels |

---

## 📋 Examples

```bash
# List automations
automationhub list

# Enable an automation
automationhub enable morning-briefing

# Test an automation
automationhub test webhook-test

# Start dashboard
automationhub dashboard
```

---

## 📁 Structure

```
automation-hub/
├── automationhub         ⭐ CLI command
├── install.sh          ⭐ Install script
├── src/engine.js       # Core engine
├── cli/main.js         # CLI implementation
├── dashboard/          # Web dashboard
│   ├── server.js     # HTTP + WebSocket
│   └── index.html     # Dashboard UI
├── test/run.js        # 31 tests
└── examples/          # Example automations
```

---

## 🧪 Testing

```bash
automationhub test

✅ Passed: 31
✅ Failed: 0
```

---

## 📝 License

MIT

---

<div align="center">

**Built for the OpenClaw community**

</div>
