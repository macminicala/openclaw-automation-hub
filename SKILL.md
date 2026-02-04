---
name: automation-hub
description: AI-native automation engine for OpenClaw. Create triggers, conditions, and actions for proactive automation.
homepage: https://github.com/macminicala/openclaw-automation-hub
keywords: [automation, workflows, triggers, ai, local]
metadata:
  openclaw:
    emoji: ⚡
    requires:
      bins: ["node"]
      env: []
    install:
      [
        {
          id: "automation-hub-install",
          kind: "node",
          label: "Install Automation Hub",
        },
      ]
---

# ⚡ OpenClaw Automation Hub

AI-native automation engine for OpenClaw. Transform your personal AI assistant from reactive to proactive.

## Quick Start

### Install

```bash
# Clone and install dependencies
cd ~/.openclaw/skills/automation-hub
npm install

# Run tests
npm test
```

### Use

```bash
# Start dashboard
node dashboard/server.js

# Open browser
open http://localhost:18799
```

## Features

### Triggers
- **Schedule** - Time-based (cron)
- **Webhook** - HTTP endpoint
- **File Watch** - Monitor file changes
- **Email** - IMAP polling
- **Calendar** - Event monitoring
- **System** - CPU/Memory/Disk alerts

### Conditions
- **Keyword** - Text matching
- **Time Range** - Within time window
- **Sender** - From specific source
- **File Pattern** - Glob matching
- **Calendar Event** - Event filtering

### Actions
- **Shell** - Execute commands
- **Agent** - AI-powered automation
- **Git** - Auto-commit/push
- **Notify** - Send to channels
- **Email Reply** - Auto-respond

## Dashboard

The Automation Hub includes a beautiful web dashboard at **http://localhost:18799**

Features:
- Visual workflow builder
- Real-time updates (WebSocket)
- Execution logs
- Enable/disable automations

## CLI Commands

```bash
# List automations
node cli/main.js list

# Create automation
node cli/main.js create --name "My Auto" --cron "0 9 * * *"

# Enable/Disable
node cli/main.js enable my-automation
node cli/main.js disable my-automation

# Test
node cli/main.js test my-automation
```

## Directory Structure

```
~/.openclaw/skills/automation-hub/
├── src/
│   └── engine.js           # Core engine
├── cli/
│   └── main.js             # CLI commands
├── dashboard/
│   ├── server.js           # Dashboard HTTP + WebSocket
│   ├── index.html          # Dashboard UI
│   ├── styles.css          # Styles
│   └── app.js              # Dashboard logic
├── test/
│   └── run.js              # 31 tests
├── examples/
│   ├── morning-briefing.json
│   ├── webhook-test.json
│   ├── email-monitor.json
│   ├── calendar-reminder.json
│   └── system-monitor.json
├── SKILL.md                # This file
├── package.json
└── README.md
```

## Testing

```bash
# Run all tests (31 tests, full coverage)
npm test

Expected output:
✅ Passed: 31
✅ Failed: 0
🎉 All tests passed!
```

## Configuration

Automations are stored in `~/.openclaw/automations/`

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
      "command": "echo 'Good morning!'"
    }
  ]
}
```

## Support

- GitHub: https://github.com/macminicala/openclaw-automation-hub
- Discord: https://discord.gg/clawd

## License

MIT
