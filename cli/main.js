#!/usr/bin/env node
/**
 * OpenClaw Automation Hub - CLI v0.2
 * Added: webhook and file_change trigger support
 */

const path = require('path');
const fs = require('fs');
const Engine = require('../src/engine');

const STORAGE_PATH = '~/.openclaw/automations';

function getEngine() {
  const engine = new Engine({ storagePath: STORAGE_PATH });
  engine.loadAutomations();
  return engine;
}

// Helper to expand path
function expandPath(p) {
  if (p.startsWith('~')) {
    return require('os').homedir() + p.slice(1);
  }
  return p;
}

const commands = {
  async dashboard() {
    const { spawn } = require('child_process');
    console.log('\n🌐 Starting Automation Hub Dashboard...\n');
    console.log('   Dashboard: http://localhost:18799');
    console.log('   Press Ctrl+C to stop\n');
    
    const dashboard = spawn('node', ['dashboard/server.js'], {
      cwd: path.dirname(__dirname),
      stdio: 'inherit'
    });
    
    dashboard.on('error', (err) => {
      console.log(`❌ Error starting dashboard: ${err.message}`);
    });
  },

  async install() {
    const { spawn } = require('child_process');
    console.log('\n🔄 Running installation...\n');
    
    const install = spawn('bash', ['install.sh'], {
      cwd: path.dirname(__dirname),
      stdio: 'inherit'
    });
    
    install.on('error', (err) => {
      console.log(`❌ Error: ${err.message}`);
    });
  },

  async list() {
    const engine = getEngine();
    const automations = Array.from(engine.automations.values());
    
    console.log('\n📋 Automations\n');
    console.log('ID'.padEnd(20) + 'NAME'.padEnd(25) + 'TRIGGER'.padEnd(20) + 'STATUS'.padEnd(10));
    console.log('-'.repeat(75));
    
    for (const a of automations) {
      const status = a.enabled ? '✅ enabled' : '❌ disabled';
      const trigger = a.trigger?.type || 'unknown';
      console.log(a.id.padEnd(20) + (a.name || '').padEnd(25) + trigger.padEnd(20) + status);
    }
    
    console.log(`\nTotal: ${automations.length}\n`);
  },

  async create(args) {
    const engine = getEngine();
    
    const id = args.id || (args.name || 'untitled').toLowerCase().replace(/\s+/g, '-');
    const automation = {
      id,
      name: args.name || id,
      enabled: true,
      trigger: {
        type: args.trigger || 'schedule',
        cron: args.cron || '0 9 * * *',
        ...(args.trigger === 'webhook' && { port: parseInt(args.port) || 18800, endpoint: `/${id}` }),
        ...(args.trigger === 'file_change' && { path: args.path || '.', events: ['modify', 'add', 'delete'] })
      },
      conditions: args.conditions ? JSON.parse(args.conditions) : [],
      actions: args.action ? [{ type: args.actionType || 'shell', command: args.action }] : [
        { type: 'shell', command: args.command || 'echo "Automation triggered"' }
      ]
    };

    await engine.saveAutomation(automation);
    console.log(`✅ Created: ${id}`);
    console.log(`   Type: ${automation.trigger.type}`);
    if (automation.trigger.type === 'webhook') {
      console.log(`   URL: http://localhost:${automation.trigger.port}${automation.trigger.endpoint}`);
    }
  },

  async enable(args) {
    const engine = getEngine();
    await engine.enableAutomation(args.id);
    console.log(`✅ Enabled: ${args.id}`);
  },

  async disable(args) {
    const engine = getEngine();
    await engine.disableAutomation(args.id);
    console.log(`❌ Disabled: ${args.id}`);
  },

  async delete(args) {
    const engine = getEngine();
    await engine.deleteAutomation(args.id);
    console.log(`🗑️  Deleted: ${args.id}`);
  },

  async test(args) {
    const engine = getEngine();
    const result = await engine.run(args.id, { test: true });
    console.log(`\n🧪 Test result for: ${args.id}`);
    console.log(JSON.stringify(result, null, 2));
  },

  async logs(args) {
    const engine = getEngine();
    const logDir = expandPath('~/.openclaw/logs/automation');
    
    if (fs.existsSync(logDir)) {
      const files = fs.readdirSync(logDir).filter(f => f.includes(args.id)).slice(-5);
      for (const file of files.reverse()) {
        console.log(`\n📜 ${file}:`);
        console.log(fs.readFileSync(path.join(logDir, file), 'utf8'));
      }
    } else {
      console.log('\n📜 No logs yet (enable logging in config)');
    }
  },

  async webhook(args) {
    // Test webhook by sending a request
    const http = require('http');
    const data = JSON.stringify({ test: true, timestamp: Date.now() });
    
    const options = {
      hostname: 'localhost',
      port: 18800,
      path: `/${args.id}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`\n🌐 Webhook response: ${res.statusCode}`);
        console.log(body);
      });
    });

    req.on('error', (err) => {
      console.log(`\n❌ Error: ${err.message}`);
      console.log('   Make sure the automation hub server is running with webhook support');
    });

    req.write(data);
    req.end();
  },

  async status(args) {
    const engine = getEngine();
    const automation = engine.automations.get(args.id);
    
    if (!automation) {
      console.log(`❌ Automation not found: ${args.id}`);
      return;
    }

    console.log(`\n📊 Status for: ${automation.id}`);
    console.log(JSON.stringify({
      name: automation.name,
      enabled: automation.enabled,
      trigger: automation.trigger,
      actionsCount: automation.actions?.length || 0,
      conditionsCount: automation.conditions?.length || 0
    }, null, 2));
  }
};

// Parse arguments
const [,, cmd, ...rest] = process.argv;
const args = {};

if (cmd === 'create') {
  let i = 0;
  while (i < rest.length) {
    const key = rest[i].replace(/^--/, '');
    const value = rest[i + 1];
    args[key] = value;
    i += 2;
  }
} else if (cmd && !commands[cmd]) {
  console.log(`Unknown command: ${cmd}`);
  console.log('\nUsage: automationhub <command> [options]');
  console.log('\nCommands:');
  console.log('  dashboard           Start dashboard');
  console.log('  install            Install/update Automation Hub');
  console.log('  list               List all automations');
  console.log('  create --name X    Create new automation');
  console.log('  enable <id>         Enable automation');
  console.log('  disable <id>        Disable automation');
  console.log('  delete <id>         Delete automation');
  console.log('  test <id>           Test automation');
  console.log('  logs <id>           View logs');
  console.log('  webhook <id>        Test webhook trigger');
  console.log('  status <id>         View automation status');
  console.log('\nCreate Options:');
  console.log('  --name "My Auto"      Automation name');
  console.log('  --trigger schedule    Trigger type (schedule, webhook, file_change)');
  console.log('  --cron "0 9 * * *"    Cron expression');
  console.log('  --port 18800          Webhook port');
  console.log('  --path ~/projects     File watch path');
  console.log('  --command "echo hi"   Shell command');
  process.exit(1);
}

if (cmd && commands[cmd]) {
  commands[cmd](args).catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });
} else {
  commands.list();
}
