# ⚡ OpenClaw Automation Hub

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg)
![Version](https://img.shields.io/badge/Version-0.4.0-orange.svg)

**AI-native automation engine with Visual Workflow Builder.** Transform your personal AI assistant from reactive to proactive.

[Website](https://openclaw.ai) • [Docs](https://docs.openclaw.ai) • [Discord](https://discord.gg/clawd)

</div>

---

## 🎯 What is Automation Hub?

Automation Hub is a local-first, AI-native automation engine with a beautiful visual dashboard. Unlike cloud tools (IFTTT, Zapier), everything runs **100% locally** on your machine.

### ✨ Key Features (v0.4)

| Feature | Description |
|---------|-------------|
| 🎨 **Visual Workflow Builder** | Drag & drop to create automations |
| 📡 **Real-time Dashboard** | WebSocket-powered live updates |
| ⏰ Schedule Trigger | Time-based (cron) automation |
| 🔗 Webhook Trigger | HTTP endpoint triggers |
| 📁 File Watch | Execute on file changes |
| 📧 Email Monitor | IMAP email monitoring |
| 📅 Calendar | Event reminders |
| 🖥️ System Monitor | CPU/Memory/Disk alerts |
| 🤖 AI Agent Action | Run AI-powered automations |
| 🔀 Git Action | Auto-commit and push |
| 🔒 **100% Local** | Privacy-first, no cloud |

---

## 🚀 Quick Start

### Installation

```bash
git clone https://github.com/macminicala/openclaw-automation-hub.git
cd openclaw-automation-hub
npm install
./setup.sh
```

### Start Dashboard

```bash
automation-dashboard
```

Then open **http://localhost:18795**

---

## 📊 Dashboard Features

```
┌─────────────────────────────────────────────┐
│ ⚡ Automation Hub v0.4          [+ New]    │
├─────────────────────────────────────────────┤
│ [12] [5 enabled] [7 disabled]              │
│ [8 schedule] [2 webhook] [2 events]         │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐   │
│ │ ☀️ Morning Briefing [✅]            │   │
│ │ ⏰ 0 9 * * 1-5                     │   │
│ │ [Run] [Edit] [Delete]              │   │
│ └─────────────────────────────────────┘   │
│ ┌─────────────────────────────────────┐   │
│ │ 🔗 Webhook API [✅]                │   │
│ │ 🔗 :18796/my-api                  │   │
│ │ [Run] [Edit] [Delete]              │   │
│ └─────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│ 📜 Recent Executions                       │
│ • 14:24 ☀️ Morning Briefing - Success    │
│ • 14:20 🔗 Webhook - Triggered            │
└─────────────────────────────────────────────┘
```

### Visual Workflow Builder

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  TRIGGER │ → │ CONDITION│ → │  ACTION  │
│    ⚡    │    │    🔍    │    │    🎯    │
│ Start    │    │ Filter   │    │ Execute  │
└──────────┘    └──────────┘    └──────────┘
    │               │               │
    ▼               ▼               ▼
 ⏰ Schedule   🔑 Keyword      💻 Shell
 🔗 Webhook   ⏰ Time Range    🤖 AI Agent
 📁 File      👤 Sender        🔀 Git
 📧 Email                      📱 Notify
 📅 Calendar
 🖥️ System
```

---

## 📖 Available Triggers

| Trigger | Description | Example |
|---------|-------------|---------|
| `schedule` | Time-based cron | `"0 9 * * 1-5"` |
| `webhook` | HTTP POST/GET | Port 18796, endpoint `/id` |
| `file_change` | Watch files/dirs | Watch `~/Projects` |
| `email` | IMAP monitoring | Gmail, Outlook |
| `calendar` | Event monitoring | Google Calendar |
| `system` | Resource alerts | CPU > 90% |

## 📋 Available Actions

| Action | Description |
|--------|-------------|
| `shell` | Execute command |
| `agent` | AI-powered automation |
| `git` | Add → Commit → Push |
| `notify` | Send to Telegram/WhatsApp |
| `email_reply` | Auto-reply to emails |

---

## 💻 CLI Usage

```bash
# List all automations
automation-hub list

# Create automation
automation-hub create --name "Morning Briefing" --cron "0 9 * * *"

# Create email monitor
automation-hub create --name "Email Watch" --trigger email --host imap.gmail.com

# Create webhook
automation-hub create --name "API" --trigger webhook --port 18800

# Enable/Disable
automation-hub enable my-automation
automation-hub disable my-automation

# Test
automation-hub test my-automation
```

---

## 📂 Project Structure

```
openclaw-automation-hub/
├── src/
│   └── engine.js              # Core engine (v0.3)
├── cli/
│   └── main.js                # CLI commands
├── dashboard/                  # 🌟 v0.4 Dashboard
│   ├── server.js              # HTTP + WebSocket server
│   ├── index.html             # Dashboard UI
│   ├── styles.css             # Modern dark theme
│   └── app.js                 # Dashboard logic
├── test/
│   └── run.js                 # 21 tests
├── examples/
│   ├── morning-briefing.json
│   ├── webhook-test.json
│   ├── email-monitor.json
│   ├── calendar-reminder.json
│   └── system-monitor.json
├── setup.sh
├── package.json
└── README.md
```

---

## 🧪 Testing

```bash
npm test

✅ Passed: 21/21
```

---

## 📈 Roadmap

| Version | Features | Status |
|---------|----------|--------|
| v0.1 | Schedule, Shell, Notify | ✅ |
| v0.2 | Webhook, File Watch, Agent | ✅ |
| v0.3 | Email, Calendar, System | ✅ |
| **v0.4** | **Visual Builder, Real-time** | ✅ |
| v1.0 | AI Workflow Generator | 🔮 |

---

## 💰 Monetization

| Plan | Price | Features |
|------|-------|----------|
| Free | $0 | 5 automations |
| Pro | $9/mo | Unlimited + Email/Calendar |
| Team | $29/mo | All + Collaboration |

---

## 🤝 Contributing

Contributions welcome! Ideas for v1.0:
- AI-powered workflow generation
- Natural language automation
- Mobile companion app
- Template marketplace

---

## 📝 License

MIT - See [LICENSE](LICENSE)

---

<div align="center">

**Built with ❤️ for the OpenClaw community**

[GitHub](https://github.com/macminicala/openclaw-automation-hub) • [Discord](https://discord.gg/clawd)

</div>
