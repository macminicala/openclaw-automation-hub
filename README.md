# ⚡ OpenClaw Automation Hub

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg)

**AI-native automation engine for OpenClaw.** Transform your personal AI assistant into proactive automation.

[GitHub](https://github.com/macminicala/openclaw-automation-hub)

</div>

---

## 🚀 One-Line Install

```bash
curl -fsSL https://raw.githubusercontent.com/macminicala/openclaw-automation-hub/main/install.sh | bash
```

That's it!

---

## 📦 Quick Commands

```bash
# Install (one-liner)
curl -fsSL https://raw.githubusercontent.com/macminicala/openclaw-automation-hub/main/install.sh | bash

# Status
automationhub status

# Dashboard
automationhub dashboard

# List automations
automationhub list

# Enable an automation
automationhub enable morning-briefing

# Run tests
automationhub test
```

---

## 🌐 Dashboard

```bash
automationhub dashboard
```

Then open **http://localhost:18799**

```
┌─────────────────────────────────────────┐
│ ⚡ Automation Hub v0.4                  │
├─────────────────────────────────────────┤
│ ☀️ Morning Briefing [❌]                │
│ 🔗 Webhook Test [❌]                   │
└─────────────────────────────────────────┘
```

---

## ✨ Features

### Triggers
| Trigger | Description |
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

## 📖 CLI Usage

```bash
automationhub help           # Show help
automationhub status        # Show status
automationhub install       # Install/update
automationhub test         # Run tests
automationhub list          # List automations
automationhub enable <id>   # Enable automation
automationhub disable <id>  # Disable automation
automationhub test <id>     # Test automation
automationhub dashboard     # Start dashboard
```

---

## 📁 Structure

```
~/.clawd/skills/automation-hub/
├── src/engine.js        # Core engine
├── cli/main.js          # CLI implementation
├── dashboard/           # Web dashboard
│   ├── server.js       # HTTP + WebSocket
│   └── index.html      # Dashboard UI
├── test/run.js         # 31 tests
└── examples/           # Example automations

~/.clawd/bin/
└── automationhub       # CLI command

~/.openclaw/automations/
└── *.json             # Your automations
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

**Built for the OpenClaw community** 🦞

</div>
