# ⚡ OpenClaw Automation Hub

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg)
![Version](https://img.shields.io/badge/Version-0.3.0-orange.svg)

**AI-native automation engine for OpenClaw.** Transform your personal AI assistant from reactive to proactive.

[Website](https://openclaw.ai) • [Docs](https://docs.openclaw.ai) • [Discord](https://discord.gg/clawd)

</div>

---

## 🎯 What is Automation Hub?

Automation Hub is a local-first, AI-native automation engine that transforms OpenClaw from a reactive assistant into a proactive automation powerhouse.

Unlike cloud-based tools (IFTTT, Zapier), Automation Hub runs **100% locally** on your machine, respecting your privacy while leveraging your existing OpenClaw agent context.

### ✨ Key Features (v0.3)

| Feature | Status | Description |
|---------|--------|-------------|
| Schedule Trigger | ✅ | Time-based (cron) automation |
| Webhook Trigger | ✅ | HTTP endpoint triggers |
| File Watch Trigger | ✅ | Execute on file changes |
| **Email Trigger** | ✅ NEW | IMAP email monitoring |
| **Calendar Trigger** | ✅ NEW | Calendar event monitoring |
| **System Monitor** | ✅ NEW | CPU/Memory/Disk alerts |
| AI Agent Action | ✅ | Run AI-powered automations |
| Git Action | ✅ | Auto-commit and push |
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

# Create an email monitor
automation-hub create --name "Email Monitor" --trigger email --host imap.gmail.com --user "you@gmail.com"

# Create a calendar reminder
automation-hub create --name "Meeting Reminder" --trigger calendar

# Create a system monitor
automation-hub create --name "System Health" --trigger system --cpu-threshold 90

# Enable an automation
automation-hub enable email-monitor

# Test an automation
automation-hub test email-monitor
```

---

## 📖 Documentation

### Available Triggers

| Trigger | Description | Example |
|---------|-------------|---------|
| `schedule` | Time-based via cron | `"0 9 * * *"` (9AM daily) |
| `webhook` | HTTP POST/GET endpoint | Port 18796, endpoint `/:id` |
| `file_change` | Watch files/dirs for changes | Watch `~/projects` |
| `email` | IMAP email monitoring | Gmail, Outlook, any IMAP |
| `calendar` | Calendar event monitoring | Google Calendar, Apple Calendar |
| `system` | CPU/Memory/Disk monitoring | Alert on thresholds |

### Trigger Examples

#### Email Trigger
```json
{
  "trigger": {
    "type": "email",
    "host": "imap.gmail.com",
    "port": 993,
    "user": "your-email@gmail.com",
    "folder": "INBOX",
    "interval": 60
  }
}
```

#### Calendar Trigger
```json
{
  "trigger": {
    "type": "calendar",
    "provider": "google",
    "interval": 5
  }
}
```

#### System Monitor Trigger
```json
{
  "trigger": {
    "type": "system",
    "interval": 60,
    "cpuThreshold": 90,
    "memoryThreshold": 90,
    "diskThreshold": 95
  }
}
```

### Available Conditions

| Condition | Description |
|-----------|-------------|
| `keyword` | Text contains/excludes value |
| `time_range` | Within time window |
| `sender` | From specific email address |
| `file_pattern` | Match glob patterns |
| `calendar_event` | Event summary contains text |

### Available Actions

| Action | Description |
|--------|-------------|
| `shell` | Execute shell command |
| `agent` | Run AI agent with prompt |
| `git` | Git operations (add/commit/push) |
| `notify` | Send to OpenClaw channel |
| `email_reply` | Send email reply |
| `webhook_out` | Call external API |

---

## 🤖 AI Agent Action

```json
{
  "id": "ai-meeting-prep",
  "name": "AI Meeting Prep",
  "enabled": true,
  "trigger": {
    "type": "calendar",
    "interval": 5
  },
  "actions": [
    {
      "type": "agent",
      "model": "claude-opus-4-5",
      "prompt": "Meeting '${event.summary}' starts at ${event.start}. Prepare talking points, check calendar for conflicts, and summarize what needs to be discussed."
    },
    {
      "type": "notify",
      "channel": "telegram",
      "message": "☀️ Meeting prep ready for '${event.summary}'"
    }
  ]
}
```

---

## 🎨 Dashboard

The Automation Hub includes a beautiful web dashboard.

```bash
automation-dashboard
```

Then open **http://localhost:18795**

---

## 📂 Project Structure

```
openclaw-automation-hub/
├── src/
│   └── engine.js              # Core engine (v0.3)
├── cli/
│   └── main.js                # CLI commands
├── dashboard/
│   ├── server.js              # Dashboard server
│   ├── index.html             # Dashboard UI
│   ├── styles.css             # Styles
│   └── app.js                 # Logic
├── test/
│   └── run.js                 # Tests (21 tests)
├── examples/
│   ├── morning-briefing.json
│   ├── webhook-test.json
│   ├── email-monitor.json     # NEW
│   ├── calendar-reminder.json # NEW
│   ├── system-monitor.json    # NEW
│   └── ai-news-briefing.json
├── setup.sh
├── package.json
└── README.md
```

---

## 🧪 Testing

```bash
npm test

✅ Passed: 21/21
Coverage: All core features
```

---

## 📈 Roadmap

| Version | Features | Status |
|---------|----------|--------|
| v0.1 | Schedule, Shell, Notify, Dashboard | ✅ |
| v0.2 | Webhook, File Watch, Agent, Git | ✅ |
| **v0.3** | **Email, Calendar, System Monitor** | ✅ |
| v0.4 | Visual Workflow Builder | ⏳ |
| v1.0 | AI-Powered Automation | 🔮 |

---

## 💰 Monetization

| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | 5 automations, basic triggers |
| Pro | $9/mo | Unlimited, email, calendar, system |
| Team | $29/mo | All + collaboration |

---

## 🤝 Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

### v0.4 Ideas

- [ ] Visual workflow builder (drag & drop)
- [ ] AI suggestions for automation
- [ ] Mobile dashboard
- [ ] Template marketplace
- [ ] Google Calendar API integration
- [ ] Outlook integration

---

## 📝 License

MIT - See [LICENSE](LICENSE)

---

<div align="center">

**Built with ❤️ for the OpenClaw community**

[GitHub](https://github.com/macminicala/openclaw-automation-hub) • [Discord](https://discord.gg/clawd)

</div>
