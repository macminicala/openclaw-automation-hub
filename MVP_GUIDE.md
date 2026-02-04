# Automation Hub v0.1 - MVP Guide

## Quick Install

```bash
cd ~/clawd/skills/automation-hub
chmod +x setup.sh
./setup.sh
```

## What's Included (v0.1)

### ✅ Working Features
- **Schedule Trigger**: Cron-based automation (time-based only)
- **Shell Action**: Execute any shell command
- **Notify Action**: Send messages via OpenClaw Gateway
- **Keyword Condition**: Filter by text content
- **Time Range Condition**: Execute within time windows
- **Enable/Disable**: Toggle automations on/off
- **Test Mode**: Dry-run automations before enabling

### ⏳ Coming in v0.2
- Webhook triggers
- File watching
- Email/calendar integration
- Agent action (AI-powered automation)

## Your First Automation

### 1. Create automation file

Create `~/.openclaw/automations/hello-world.json`:

```json
{
  "id": "hello-world",
  "name": "Hello World",
  "enabled": true,
  "description": "Your first automation",
  "trigger": {
    "type": "schedule",
    "cron": "* * * * *"
  },
  "actions": [
    {
      "type": "shell",
      "command": "echo 'Hello from Automation Hub!'"
    }
  ]
}
```

### 2. List automations

```bash
automation-hub list
```

### 3. Test it

```bash
automation-hub test hello-world
```

### 4. Enable it

```bash
automation-hub enable hello-world
```

## Cron Syntax Quick Reference

| Pattern | Meaning |
|---------|---------|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour |
| `0 9 * * *` | Every day at 9:00 |
| `0 9 * * 1` | Every Monday at 9:00 |
| `0 9 * * 1-5` | Weekdays at 9:00 |
| `*/5 * * * *` | Every 5 minutes |

## Directory Structure

```
~/.openclaw/
├── automations/          # Your automation files (.json)
│   ├── hello-world.json
│   └── daily-briefing.json
├── skills/
│   └── automation-hub/   # Skill installation
└── bin/
    └── automation-hub    # CLI command
```

## Troubleshooting

### "automation-hub: command not found"
```bash
export PATH="$HOME/.openclaw/bin:$PATH"
# Or restart your terminal
```

### "Node version too old"
Install Node.js 18+ from https://nodejs.org

### "Automation not triggering"
- Check it's enabled: `automation-hub list`
- Verify cron syntax: https://crontab.guru
- Check logs: `automation-hub logs <id>`

## Example Automations

### Morning Briefing (9AM weekdays)
See: `examples/daily-briefing.json`

### Auto Git Commit (6PM)
See: `examples/auto-git-commit.json`

### System Monitor (every 5 min)
See: `examples/system-monitor.json`

## Support

- GitHub: https://github.com/openclaw/openclaw
- Discord: https://discord.gg/clawd
- Docs: https://docs.openclaw.ai
