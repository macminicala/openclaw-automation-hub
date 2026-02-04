#!/usr/bin/env node
/**
 * OpenClaw Automation Hub - CLI
 */

const path = require('path');
const fs = require('fs');
const Engine = require('../src/engine');

const STORAGE_PATH = '~/.openclaw/automations';

// Helper to load/create config
function getEngine() {
  const engine = new Engine({ storagePath: STORAGE_PATH });
  engine.loadAutomations();
  return engine;
}

// CLI Commands
const commands = {
  async list() {
    const engine = getEngine();
    const automations = Array.from(engine.automations.values());
    
    console.log('\n📋 Automations\n');
    console.log('ID'.padEnd(20) + 'NAME'.padEnd(30) + 'STATUS'.padEnd(10));
    console.log('-'.repeat(60));
    
    for (const a of automations) {
      const status = a.enabled ? '✅ enabled' : '❌ disabled';
      console.log(a.id.padEnd(20) + a.name.padEnd(30) + status);
    }
    
    console.log(`\nTotal: ${automations.length}\n`);
  },

  async create(args) {
    const engine = getEngine();
    
    const id = args.id || args.name.toLowerCase().replace(/\s+/g, '-');
    const automation = {
      id,
      name: args.name,
      enabled: true,
      trigger: {
        type: args.trigger || 'schedule',
        cron: args.cron || '0 9 * * *'
      },
      conditions: args.conditions || [],
      actions: args.actions || [
        {
          type: 'shell',
          command: args.command || 'echo "Automation triggered"'
        }
      ]
    };

    await engine.saveAutomation(automation);
    console.log(`✅ Created: ${id}`);
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
    const automation = engine.automations.get(args.id);
    
    if (!automation) {
      console.log(`❌ Automation not found: ${args.id}`);
      return;
    }

    console.log(`\n📜 Logs for: ${automation.name}\n`);
    console.log('No logs yet (coming in v0.2)');
  }
};

// Parse arguments
const [,, cmd, ...rest] = process.argv;
const args = {};

if (cmd === 'create') {
  // Parse --key value pairs
  let i = 0;
  while (i < rest.length) {
    const key = rest[i].replace(/^--/, '');
    const value = rest[i + 1];
    args[key] = value;
    i += 2;
  }
} else if (cmd && !commands[cmd]) {
  console.log(`Unknown command: ${cmd}`);
  console.log('\nUsage: automation-hub <command> [options]');
  console.log('\nCommands:');
  console.log('  list                  List all automations');
  console.log('  create --name X       Create new automation');
  console.log('  enable <id>           Enable automation');
  console.log('  disable <id>          Disable automation');
  console.log('  delete <id>           Delete automation');
  console.log('  test <id>             Test automation');
  console.log('  logs <id>             View logs');
  process.exit(1);
}

if (cmd && commands[cmd]) {
  commands[cmd](args).catch(err => {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  });
} else {
  // Default: list
  commands.list();
}
