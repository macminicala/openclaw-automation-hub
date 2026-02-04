# ⚡ OpenClaw Automation Hub

<div align="center">

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Node](https://img.shields.io/badge/Node.js-18+-green.svg)
![OpenClaw](https://img.shields.io/badge/OpenClaw-Skill-blue.svg)

**AI-native automation engine for OpenClaw.** Transform your personal AI assistant from reactive to proactive.

[GitHub](https://github.com/macminicala/openclaw-automation-hub) • [Discord](https://discord.gg/clawd)

</div>

---

## 🚀 Quick Install

### Interactive Wizard (Recommended)

```bash
# Download and run the wizard
bash automation-hub-wizard.sh
```

Or for quick install:
```bash
bash automation-hub-wizard.sh --quick
```

### What the wizard does:
1. ✅ Checks Node.js
2. ✅ Clones/installs Automation Hub
3. ✅ Installs dependencies
4. ✅ Runs 31 tests
5. ✅ Creates demo automations

---

## 📦 Installation

### Method 1: Clone & Run Wizard

```bash
# Clone
git clone https://github.com/macminicala/openclaw-automation-hub.git
cd openclaw-automation-hub

# Run wizard
bash automation-hub-wizard.sh
```

### Method 2: Manual Install

```bash
# Clone to OpenClaw skills
git clone https://github.com/macminicala/openclaw-automation-hub.git ~/.openclaw/skills/automation-hub
cd ~/.openclaw/skills/automation-hub

# Install deps
npm install

# Run tests
npm test
```

---

## 🌐 Dashboard

Start the dashboard:
```bash
cd ~/.openclaw/skills/automation-hub
node dashboard/server.js
```

Open **http://localhost:18795**

```
┌─────────────────────────────────────────┐
│ ⚡ Automation Hub v0.4             [+ New] │
├─────────────────────────────────────────┤
│ [3 automations created]                 │
│ ☀️ Morning Briefing [❌]                │
│ 🔗 Webhook Test [❌]                   │
└─────────────────────────────────────────┘
```

---

## ✨ Features

| Trigger | Description |
|---------|-------------|
| `schedule` | Time-based (cron) |
| `webhook` | HTTP endpoint |
| `file_change` | File watching |
| `email` | IMAP monitoring |
| `calendar` | Event reminders |
| `system` | CPU/Memory alerts |

---

## 📖 Usage

### CLI Commands

```bash
# List automations
node cli/main.js list

# Create automation
node cli/main.js create --name "Morning" --cron "0 9 * * *"

# Enable/Disable
node cli/main.js enable morning-briefing
node cli/main.js disable morning-briefing

# Test
node cli/main.js test morning-briefing
```

### Webhook Example

```bash
# Enable webhook automation
node cli/main.js enable webhook-test

# Trigger it
curl -X POST http://localhost:18796/webhook-test \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## 🧪 Testing

```bash
npm test

✅ Passed: 31
✅ Failed: 0
🎉 All tests passed!
```

---

## 📁 Structure

```
automation-hub/
├── automation-hub-wizard.sh   # ⭐ Interactive setup wizard
├── automation-hub.sh         # Full-featured wizard with menu
├── src/
│   └── engine.js             # Core engine
├── cli/
│   └── main.js               # CLI commands
├── dashboard/
│   ├── server.js            # Dashboard server
│   ├── index.html           # Dashboard UI
│   ├── styles.css           # Styles
│   └── app.js              # Dashboard logic
├── test/
│   └── run.js              # 31 tests
├── examples/
│   └── *.json              # Example automations
├── SKILL.md                 # OpenClaw skill metadata
└── package.json
```

---

## 📋 Automation Example

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

## 🤝 Contributing

Issues and PRs welcome!

https://github.com/macminicala/openclaw-automation-hub/issues

---

## 📝 License

MIT

---

<div align="center">

**Built for the OpenClaw community** 🦞

[GitHub](https://github.com/macminicala/openclaw-automation-hub) • [Discord](https://discord.gg/clawd)

</div>
