---
name: automation-hub
description: Create and manage AI-native automations with triggers, conditions, and actions. Transform OpenClaw from reactive assistant to proactive automation engine.
homepage: https://github.com/openclaw/openclaw
author: MiniCala for Croccaroc
keywords: [automation, workflows, triggers, ifttt, zapier, local, privacy]
metadata:
  openclaw:
    emoji: ⚡
    requires:
      bins: []
      env: []
    permissions: []
---

# OpenClaw Automation Hub

Create intelligent automations that run locally, powered by your OpenClaw agent.

## Quick Start

```bash
# Create a time-based automation
openclaw automation create --name "Morning Briefing" \
  --trigger "schedule" --cron "0 8 * * 1-5" \
  --action "agent" --prompt "Check calendar, summarize today"

# List all automations
openclaw automation list

# Enable an automation
openclaw automation enable morning-briefing

# Test an automation
openclaw automation test morning-briefing
```

## Core Concepts

### Triggers
What starts an automation:
- `schedule` - Time-based (cron expression)
- `webhook` - HTTP POST/GET received
- `file_change` - File modified/deleted/created
- `email` - Email received (IMAP)
- `calendar` - Event starts/ends

### Conditions
Filters before execution:
- `keyword` - Text contains/doesn't contain
- `sender` - From specific address/user
- `time_range` - Within time window
- `file_pattern` - Match glob patterns
- `size` - File size comparison

### Actions
What happens when triggered:
- `agent` - Run agent with custom prompt
- `shell` - Execute shell command
- `notify` - Send message to channel
- `git` - Git operations (commit, push)
- `webhook_out` - Call external API
- `summarize` - Summarize content

## Automation Format

```yaml
id: my-automation
name: My Automation
enabled: true

trigger:
  type: schedule
  cron: "0 9 * * 1-5"

conditions:
  - type: time_range
    start: "08:00"
    end: "18:00"

actions:
  - type: agent
    model: claude-opus-4
    prompt: "Check calendar, summarize today's meetings"

  - type: notify
    channel: telegram
    message: "☀️ Day prep complete"
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `automation create` | Create new automation |
| `automation list` | List all automations |
| `automation enable <id>` | Enable automation |
| `automation disable <id>` | Disable automation |
| `automation test <id>` | Test automation dry-run |
| `automation logs <id>` | View execution logs |
| `automation delete <id>` | Delete automation |

## Configuration

Set storage path in `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "automation-hub": {
      "storagePath": "~/.openclaw/automations",
      "defaultCooldown": "5m",
      "maxConcurrent": 3,
      "logRetention": "7d"
    }
  }
}
```

## Privacy

All automations run locally. No data leaves your device.

- Storage: Local JSON/SQLite
- Webhooks: Local server only
- Execution: On your machine
