# 🧪 OpenClaw Automation Hub - Testing Guide

## Quick Test (No chmod needed)

### 1. Run Installation
```bash
cd /Users/marcocalanchi/clawd/skills/automation-hub
bash install.sh
```

This will:
- Install dependencies
- Run all 31 tests
- Create demo automations

### 2. Start Dashboard
```bash
node dashboard/server.js
```

### 3. Open Browser
Navigate to: **http://localhost:18799**

---

## Manual Commands

### List Automations
```bash
node cli/main.js list
```

### Test an Automation
```bash
node cli/main.js test morning-briefing
```

### Create New Automation
```bash
node cli/main.js create --name "My Auto" --cron "0 9 * * *"
```

---

## What to Expect

### Test Results
```
🧪 Automation Hub v0.4 - Full Test Suite
==============================================================
✅ Passed: 31
❌ Failed: 0
📊 Total: 31
🎉 All tests passed!
```

### Dashboard
```
┌─────────────────────────────────────────┐
│ ⚡ Automation Hub v0.4             [+ New] │
├─────────────────────────────────────────┤
│ [3 automations created]                  │
│                                          │
│ ☀️ Morning Briefing [✅]                 │
│ 🔗 Webhook Test [✅]                     │
└─────────────────────────────────────────┘
```

---

## Troubleshooting

### Port in use?
```bash
# Kill port 18799
lsof -ti:18799 | xargs kill -9

# Or use different port
PORT=18799 node dashboard/server.js
```

### Node version too old?
```bash
node -v  # Should be 18+
```

---

## Files Used

```
~/clawd/skills/automation-hub/
├── dashboard/server.js     # Dashboard server
├── cli/main.js           # CLI commands
├── src/engine.js         # Core engine
└── install.sh           # Install script
```

---

## Success Criteria

✅ All 31 tests pass  
✅ Dashboard loads at http://localhost:18799  
✅ Can create new automation  
✅ CLI commands work  
