# ⚡ OpenClaw Automation Hub Skill

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg)
![OpenClaw](https://img.shields.io/badge/OpenClaw-Skill-blue.svg)

**AI-native automation engine for OpenClaw.** Transform your personal AI assistant from reactive to proactive.

[GitHub](https://github.com/macminicala/openclaw-automation-hub) • [Docs](./SKILL.md) • [Discord](https://discord.gg/clawd)

</div>

---

## 🎯 What is Automation Hub?

Automation Hub is an **OpenClaw skill** that adds powerful automation capabilities to your personal AI assistant.

As an OpenClaw skill:
- Installs to `~/.openclaw/skills/automation-hub/`
- Integrates with OpenClaw's workflow system
- Uses OpenClaw's notification channels (Telegram, WhatsApp, etc.)
- Follows OpenClaw's skill conventions

---

## 🚀 Installation

### Method 1: Clone & Install

```bash
# Clone to skills directory
git clone https://github.com/macminicala/openclaw-automation-hub.git ~/.openclaw/skills/automation-hub

# Install
cd ~/.openclaw/skills/automation-hub
bash install-skill.sh
```

### Method 2: Manual Copy

```bash
# Copy skill files
cp -r automation-hub ~/.openclaw/skills/

# Install dependencies
cd ~/.openclaw/skills/automation-hub
npm install
npm test
```

---

## 📦 What's Included

```
~/.openclaw/skills/automation-hub/
├── src/
│   └── engine.js              # Core automation engine
├── cli/
│   └── main.js                # CLI commands
├── dashboard/
│   ├── server.js             # Dashboard (HTTP + WebSocket)
│   ├── index.html            # Dashboard UI
│   ├── styles.css           # Modern dark theme
│   └── app.js               # Dashboard logic
├── test/
│   └── run.js                # 31 comprehensive tests
├── examples/
│   ├── morning-briefing.json
│   ├── webhook-test.json
│   ├── email-monitor.json
│   ├── calendar-reminder.json
│   └── system-monitor.json
├── SKILL.md                  # OpenClaw skill metadata
├── package.json
└── README.md
```

---

## 🌐 Dashboard

Start the dashboard:
```bash
cd ~/.openclaw/skills/automation-hub
node dashboard/server.js
```

Open **http://localhost:18795**

Features:
- Visual workflow builder
- Real-time updates (WebSocket)
- Create/Edit/Delete automations
- Enable/Disable toggles
- Execution logs
- Statistics overview

---

## ✨ Features

### Triggers
| Trigger | Description |
|---------|-------------|
| `schedule` | Time-based (cron expression) |
| `webhook` | HTTP endpoint |
| `file_change` | File/directory watching |
| `email` | IMAP email monitoring |
| `calendar` | Calendar event reminders |
| `system` | CPU/Memory/Disk alerts |

### Conditions
| Condition | Description |
|-----------|-------------|
| `keyword` | Text matching |
| `time_range` | Time window |
| `sender` | From specific source |
| `file_pattern` | Glob matching |
| `calendar_event` | Event filtering |

### Actions
| Action | Description |
|--------|-------------|
| `shell` | Execute shell commands |
| `agent` | AI-powered automation |
| `git` | Auto-commit and push |
| `notify` | Send to OpenClaw channels |
| `email_reply` | Auto-reply to emails |

---

## 📖 Usage

### CLI Commands

```bash
cd ~/.openclaw/skills/automation-hub

# List all automations
node cli/main.js list

# Create automation
node cli/main.js create --name "Morning Briefing" --cron "0 9 * * 1-5"

# Enable/Disable
node cli/main.js enable morning-briefing
node cli/main.js disable morning-briefing

# Test
node cli/main.js test morning-briefing
```

### Webhook Example

Create a webhook automation:
```bash
node cli/main.js create --name "API Trigger" --trigger webhook --port 18800
```

Trigger it:
```bash
curl -X POST http://localhost:18800/api-trigger -d '{"test":true}'
```

---

## 🧪 Testing

```bash
cd ~/.openclaw/skills/automation-hub
npm test

# Output:
# ✅ Passed: 31
# ✅ Failed: 0
# 🎉 All tests passed!
```

---

## 📁 Automation Storage

Automations are stored as JSON files:

```
~/.openclaw/automations/
├── morning-briefing.json
├── webhook-test.json
└── system-monitor.json
```

Example automation:
```json
{
  "id": "morning-briefing",
  "name": "Morning Briefing",
  "enabled": true,
  "trigger": {
    "type": "schedule",
    "cron": "0 8 * * 1-5"
  },
  "actions": [
    {
      "type": "shell",
      "command": "echo '☀️ Good morning!'"
    }
  ]
}
```

---

## 🔧 Configuration

No additional configuration required. The skill works out of the box.

For custom settings, edit `~/.openclaw/automations/<automation>.json`

---

## 📈 Roadmap

| Version | Features |
|---------|----------|
| v0.4 | ✅ Dashboard, All triggers, All actions |
| v1.0 | AI Workflow Generator, Natural language creation |

---

## 🤝 Contributing

Issues and PRs welcome!

https://github.com/macminicala/openclaw-automation-hub/issues

---

## 📝 License

MIT - See [LICENSE](LICENSE)

---

<div align="center">

**Built for the OpenClaw community** 🦞

[GitHub](https://github.com/macminicala/openclaw-automation-hub) • [Discord](https://discord.gg/clawd)

</div>
