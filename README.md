# ⚡ OpenClaw Automation Hub

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg)
![Version](https://img.shields.io/badge/Version-0.1.0-orange.svg)

**AI-native automation engine for OpenClaw.** Transform your personal AI assistant from reactive to proactive.

[Website](https://openclaw.ai) • [Docs](https://docs.openclaw.ai) • [Discord](https://discord.gg/clawd)

</div>

---

## 🎯 What is Automation Hub?

Automation Hub is a local-first, AI-native automation engine that transforms OpenClaw from a reactive assistant into a proactive automation powerhouse.

Unlike cloud-based tools (IFTTT, Zapier), Automation Hub runs **100% locally** on your machine, respecting your privacy while leveraging your existing OpenClaw agent context.

### ✨ Key Features

- 🏠 **100% Local** - Nothing leaves your device
- 🤖 **AI-Native** - Triggers and actions can involve AI reasoning
- ⚡ **Fast** - No cloud latency, instant execution
- 🔌 **Deep OpenClaw Integration** - Uses your existing agent context
- 💰 **Free** - Open source, no subscription required
- 🎨 **Beautiful Dashboard** - Web UI for easy management

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- OpenClaw (optional, for full features)
- macOS, Linux, or WSL2 on Windows

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/openclaw-automation-hub.git
cd openclaw-automation-hub

# Run setup script
chmod +x setup.sh
./setup.sh

# Start the dashboard
automation-dashboard
```

Then open **http://localhost:18795** in your browser.

### Usage

```bash
# List all automations
automation-hub list

# Create a new automation
automation-hub create --name "Morning Briefing" --cron "0 9 * * 1-5"

# Enable an automation
automation-hub enable morning-briefing

# Test an automation
automation-hub test morning-briefing

# Disable an automation
automation-hub disable morning-briefing
```

---

## 📖 Documentation

### Core Concepts

#### Triggers
Triggers start your automation:

| Trigger | Description |
|---------|-------------|
| `schedule` | Time-based (cron expression) |
| `webhook` | HTTP POST/GET received |
| `file_change` | File modified/deleted/created |
| `email` | Email received (IMAP) |
| `calendar` | Event starts/ends |

#### Conditions
Conditions filter before execution:

| Condition | Description |
|-----------|-------------|
| `keyword` | Text contains/doesn't contain |
| `sender` | From specific address/user |
| `time_range` | Within time window |
| `file_pattern` | Match glob patterns |
| `size` | File size comparison |

#### Actions
Actions execute when triggered:

| Action | Description |
|--------|-------------|
| `agent` | Run AI agent with custom prompt |
| `shell` | Execute shell command |
| `notify` | Send message to channel |
| `git` | Git operations (commit, push) |
| `webhook_out` | Call external API |
| `summarize` | Summarize content |

### Example Automation

```json
{
  "id": "morning-briefing",
  "name": "Morning Briefing",
  "enabled": true,
  "trigger": {
    "type": "schedule",
    "cron": "0 8 * * 1-5"
  },
  "conditions": [
    {
      "type": "time_range",
      "start": "07:00",
      "end": "10:00"
    }
  ],
  "actions": [
    {
      "type": "agent",
      "model": "claude-opus-4-5",
      "prompt": "Check my calendar for today, summarize meetings"
    },
    {
      "type": "notify",
      "channel": "telegram",
      "message": "☀️ Good morning! Your briefing is ready."
    }
  ]
}
```

### Cron Syntax Reference

| Pattern | Meaning |
|---------|---------|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour |
| `0 9 * * *` | Every day at 9:00 |
| `0 9 * * 1` | Every Monday at 9:00 |
| `0 9 * * 1-5` | Weekdays at 9:00 |
| `*/5 * * * *` | Every 5 minutes |

---

## 🎨 Dashboard

The Automation Hub includes a beautiful web dashboard for easy management.

### Features

- 📊 **Statistics** - Overview of all automations
- ⚡ **Quick Actions** - Enable/disable, create, run
- 📝 **Visual Editor** - Create automations without JSON
- 📜 **Activity Logs** - Track execution history
- 🔍 **Filtering** - Filter by status (all/enabled/disabled)

### Screenshots

```
┌─────────────────────────────┐
│ ⚡ Automation Hub [+ New]  │
├─────────────────────────────┤
│ [12 Total] [5 Enabled]     │
├─────────────────────────────┤
│ ☀️ Morning Briefing [✅]    │
│ 🔄 Auto Git Commit [✅]     │
│ 📰 Daily AI News [❌]      │
└─────────────────────────────┘
```

---

## 📂 Project Structure

```
openclaw-automation-hub/
├── src/
│   ├── engine.js              # Core automation engine
│   └── openclaw-integration.js # OpenClaw Gateway integration
├── cli/
│   └── main.js                # CLI commands
├── dashboard/
│   ├── server.js              # Dashboard HTTP server
│   ├── index.html             # Dashboard UI
│   ├── styles.css             # Dashboard styles
│   └── app.js                 # Dashboard JavaScript
├── test/
│   └── run.js                 # Test suite
├── examples/
│   ├── morning-briefing.json
│   ├── auto-git-commit.json
│   ├── daily-ai-news.json
│   └── system-monitor.json
├── setup.sh                   # Installation script
├── SKILL.md                   # OpenClaw skill documentation
├── package.json               # NPM package configuration
└── README.md                  # This file
```

---

## 🛠️ Development

### Running Tests

```bash
npm test
```

### Running the Dashboard in Development

```bash
npm run dashboard
```

### Creating a New Automation (CLI)

```bash
# Create automation file
cat > ~/.openclaw/automations/my-automation.json << 'EOF'
{
  "id": "my-automation",
  "name": "My Automation",
  "enabled": true,
  "trigger": {
    "type": "schedule",
    "cron": "0 9 * * *"
  },
  "actions": [
    {
      "type": "shell",
      "command": "echo 'Hello World'"
    }
  ]
}
EOF

# Enable it
automation-hub enable my-automation
```

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Ideas for Contributions

- [ ] Webhook trigger implementation
- [ ] File watching trigger
- [ ] Email/IMAP integration
- [ ] Calendar integration
- [ ] More condition types
- [ ] Mobile dashboard design
- [ ] Template marketplace
- [ ] AI-powered trigger suggestions

---

## 📈 Roadmap

### v0.1 (Current)
- ✅ Schedule trigger (cron-based)
- ✅ Shell action
- ✅ Notify action (OpenClaw channels)
- ✅ Basic conditions (keyword, time_range)
- ✅ Enable/Disable automation
- ✅ Test mode
- ✅ Web Dashboard

### v0.2 (Next)
- [ ] Webhook trigger
- [ ] File watching
- [ ] Email integration (IMAP)
- [ ] Calendar integration
- [ ] Agent action (AI-powered automation)
- [ ] Visual cron builder

### v1.0
- [ ] Drag & drop workflow builder
- [ ] AI suggestion engine
- [ ] Real-time execution viewer
- [ ] Mobile companion app
- [ ] Template marketplace

### v2.0
- [ ] Distributed execution (multi-device)
- [ ] Enterprise features (SSO, audit logs)
- [ ] White-label options

---

## 💰 Monetization Strategy

### Freemium Model

| Feature | Free | Pro ($9/mo) | Team ($29/mo) |
|---------|------|-------------|---------------|
| Automations | 5 | Unlimited | Unlimited |
| Triggers | Schedule only | + Webhook, Email | All |
| History | 7 days | 30 days | 90 days |
| Support | Community | Email | Priority |

### Marketplace
Pre-made automations sold for $5-20 each:
- "Morning Executive Briefing" - $9
- "Auto-Backup & Git Push" - $5
- "Email to Slack Summary" - $12

### Enterprise
Custom on-premise installations for businesses:
- $500-5000/month based on needs

---

## 🔒 Privacy & Security

- **100% Local Execution** - No data leaves your device
- **No Cloud Dependencies** - Works offline
- **Open Source** - Transparent code
- **Your Data, Your Control** - No tracking, no telemetry

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [OpenClaw](https://openclaw.ai) - The amazing personal AI assistant platform
- [Pi](https://github.com/badlogic/pi-mono) - The coding agent
- [Contributors](https://github.com/openclaw/openclaw/graphs/contributors)

---

<div align="center">

**Built with ❤️ for the OpenClaw community**

[Website](https://openclaw.ai) • [GitHub](https://github.com/openclaw/openclaw) • [Discord](https://discord.gg/clawd)

</div>
