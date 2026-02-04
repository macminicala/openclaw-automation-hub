# ⚡ OpenClaw Automation Hub

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg)
![Version](https://img.shields.io/badge/Version-0.2.0-orange.svg)

**AI-native automation engine for OpenClaw.** Transform your personal AI assistant from reactive to proactive.

[Website](https://openclaw.ai) • [Docs](https://docs.openclaw.ai) • [Discord](https://discord.gg/clawd)

</div>

---

## 🎯 What is Automation Hub?

Automation Hub is a local-first, AI-native automation engine that transforms OpenClaw from a reactive assistant into a proactive automation powerhouse.

Unlike cloud-based tools (IFTTT, Zapier), Automation Hub runs **100% locally** on your machine, respecting your privacy while leveraging your existing OpenClaw agent context.

### ✨ Key Features (v0.2)

| Feature | Status | Description |
|---------|--------|-------------|
| Schedule Trigger | ✅ | Time-based (cron) automation |
| Webhook Trigger | ✅ NEW | HTTP endpoint triggers |
| File Watch Trigger | ✅ NEW | Execute on file changes |
| AI Agent Action | ✅ NEW | Run AI-powered automations |
| Git Action | ✅ NEW | Auto-commit and push |
| Beautiful Dashboard | ✅ | Web UI for management |
| 100% Local | ✅ | Privacy-first, no cloud |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- OpenClaw (optional, for full features)
- macOS, Linux, or WSL2 on Windows

### Installation

```bash
git clone https://github.com/macminicala/openclaw-automation-hub.git
cd openclaw-automation-hub
npm install
./setup.sh
```

### Usage

```bash
# List all automations
automation-hub list

# Create a schedule-based automation
automation-hub create --name "Morning Briefing" --cron "0 9 * * 1-5"

# Create a webhook automation
automation-hub create --name "API Trigger" --trigger webhook --port 18800

# Create a file watcher automation
automation-hub create --name "File Watch" --trigger file_change --path ~/projects

# Enable an automation
automation-hub enable morning-briefing

# Test an automation
automation-hub test morning-briefing

# View webhook status
automation-hub webhook api-trigger
```

---

## 📖 Documentation

### Available Triggers

| Trigger | Description | Example |
|---------|-------------|---------|
| `schedule` | Time-based execution via cron | `"0 9 * * *"` (9AM daily) |
| `webhook` | HTTP POST/GET endpoint | Port 18796, endpoint `/:id` |
| `file_change` | Watch files/directories for changes | Watch `~/projects` for changes |

### Available Conditions

| Condition | Description | Example |
|-----------|-------------|---------|
| `keyword` | Text contains/excludes value | `{ "match": "contains", "value": "urgent" }` |
| `time_range` | Within time window | `{ "start": "08:00", "end": "18:00" }` |
| `sender` | From specific source | `{ "value": "client@company.com" }` |
| `file_pattern` | Match glob patterns | `{ "pattern": "**/*.json" }` |

### Available Actions

| Action | Description | Example |
|--------|-------------|---------|
| `shell` | Execute shell command | `{ "command": "echo 'Done'" }` |
| `agent` | Run AI agent with prompt | `{ "prompt": "Summarize this..." }` |
| `git` | Git operations | `{ "add": true, "commit": "...", "push": true }` |
| `notify` | Send to OpenClaw channel | `{ "channel": "telegram", "message": "Done" }` |
| `webhook_out` | Call external API | `{ "url": "https://api.example.com" }` |

---

## 🔗 Trigger Examples

### Schedule Trigger
```json
{
  "trigger": {
    "type": "schedule",
    "cron": "0 9 * * 1-5"
  }
}
```

### Webhook Trigger
```json
{
  "trigger": {
    "type": "webhook",
    "port": 18796,
    "endpoint": "/my-webhook"
  }
}
```
**Usage:** `curl -X POST http://localhost:18796/my-webhook -d '{"data":"value"}'`

### File Watch Trigger
```json
{
  "trigger": {
    "type": "file_change",
    "path": "~/Documents/Projects",
    "events": ["modify", "add", "delete"],
    "ignored": "node_modules/**"
  }
}
```

---

## 🤖 Agent Action (AI-Powered)

```json
{
  "id": "ai-summarizer",
  "name": "AI Content Summarizer",
  "enabled": true,
  "trigger": {
    "type": "schedule",
    "cron": "0 8 * * *"
  },
  "actions": [
    {
      "type": "agent",
      "model": "claude-opus-4-5",
      "prompt": "Check my calendar for today, summarize meetings and prepare talking points for each call."
    },
    {
      "type": "notify",
      "channel": "telegram",
      "message": "☀️ Your AI briefing is ready!"
    }
  ]
}
```

---

## 🎨 Dashboard

The Automation Hub includes a beautiful web dashboard.

### Features

- 📊 **Statistics** - Overview of all automations
- ⚡ **Quick Actions** - Enable/disable, create, run
- 📝 **Visual Editor** - Create automations without JSON
- 📜 **Activity Logs** - Track execution history
- 🔍 **Filtering** - Filter by status

### Screenshots

```
┌─────────────────────────────┐
│ ⚡ Automation Hub [+ New]  │
├─────────────────────────────┤
│ [12 Total] [5 Enabled]     │
├─────────────────────────────┤
│ ☀️ Morning Briefing [✅]   │
│ 🔗 Webhook API [✅]        │
│ 📁 File Watch [✅]          │
│ 🤖 AI Agent [❌]           │
└─────────────────────────────┘
```

### Start Dashboard

```bash
automation-dashboard
```

Then open **http://localhost:18795**

---

## 📂 Project Structure

```
openclaw-automation-hub/
├── src/
│   └── engine.js              # Core engine (v0.2)
├── cli/
│   └── main.js                # CLI commands
├── dashboard/
│   ├── server.js              # Dashboard server
│   ├── index.html             # Dashboard UI
│   ├── styles.css             # Styles
│   └── app.js                 # Logic
├── test/
│   └── run.js                 # Tests
├── examples/
│   ├── morning-briefing.json
│   ├── webhook-test.json      # NEW
│   ├── auto-git-commit.json   # NEW
│   ├── ai-news-briefing.json  # NEW
│   └── system-monitor.json
├── setup.sh                   # Installation
├── package.json
└── README.md
```

---

## 🧪 Testing

```bash
npm test
```

---

## 📈 Roadmap

| Version | Features |
|---------|----------|
| **v0.1** ✅ | Schedule, Shell, Notify, Dashboard |
| **v0.2** ✅ | Webhook, File Watch, Agent Action, Git |
| **v0.3** | Email (IMAP), Calendar, Webhook Out |
| **v1.0** | Visual Workflow Builder, AI Suggestions |

---

## 💰 Monetization

| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | 5 automations, basic triggers |
| Pro | $9/mo | Unlimited, webhooks, email |
| Team | $29/mo | All + collaboration |

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

### Ideas for v0.3

- [ ] Email/IMAP integration
- [ ] Calendar event triggers
- [ ] Better webhook authentication
- [ ] Mobile dashboard
- [ ] Template marketplace

---

## 📝 License

MIT - See [LICENSE](LICENSE)

---

<div align="center">

**Built with ❤️ for the OpenClaw community**

[GitHub](https://github.com/macminicala/openclaw-automation-hub) • [Discord](https://discord.gg/clawd)

</div>
