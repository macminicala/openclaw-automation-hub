/**
 * OpenClaw Automation Hub - Comprehensive Test Suite v0.2
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async run() {
    console.log('\n🧪 Automation Hub v0.2 - Comprehensive Tests\n');
    console.log('='.repeat(60));

    // ============ ENGINE TESTS ============
    await this.test('Engine loads correctly', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      assert.ok(engine instanceof Engine);
      assert.ok(engine.triggers.size > 0);
      assert.ok(engine.actions.size > 0);
      assert.ok(engine.conditions.size > 0);
    });

    // ============ TRIGGER REGISTRATION ============
    await this.test('All triggers registered', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      assert.ok(engine.triggers.has('schedule'));
      assert.ok(engine.triggers.has('webhook'));
      assert.ok(engine.triggers.has('file_change'));
    });

    // ============ ACTION REGISTRATION ============
    await this.test('All actions registered', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      assert.ok(engine.actions.has('shell'));
      assert.ok(engine.actions.has('notify'));
      assert.ok(engine.actions.has('agent'));
      assert.ok(engine.actions.has('git'));
      assert.ok(engine.actions.has('webhook_out'));
    });

    // ============ CONDITION REGISTRATION ============
    await this.test('All conditions registered', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      assert.ok(engine.conditions.has('keyword'));
      assert.ok(engine.conditions.has('time_range'));
      assert.ok(engine.conditions.has('sender'));
      assert.ok(engine.conditions.has('file_pattern'));
    });

    // ============ AUTOMATION CRUD ============
    await this.test('Automation CRUD operations', async () => {
      const Engine = require('../src/engine');
      const testPath = '~/.openclaw/automations-test-crud';
      cleanup(testPath);
      
      const engine = new Engine({ storagePath: testPath });
      await engine.loadAutomations();

      // Create
      const automation = {
        id: 'test-crud',
        name: 'Test CRUD',
        enabled: false,
        trigger: { type: 'schedule', cron: '0 9 * * *' },
        actions: [{ type: 'shell', command: 'echo test' }],
        conditions: [{ type: 'keyword', match: 'contains', value: 'hello' }]
      };

      await engine.saveAutomation(automation);
      assert.ok(engine.automations.has('test-crud'));

      // Read
      const loaded = engine.automations.get('test-crud');
      assert.strictEqual(loaded.name, 'Test CRUD');
      assert.strictEqual(loaded.trigger.cron, '0 9 * * *');
      assert.strictEqual(loaded.conditions.length, 1);

      // Update
      loaded.enabled = true;
      await engine.saveAutomation(loaded);
      const updated = engine.automations.get('test-crud');
      assert.strictEqual(updated.enabled, true);

      // Delete
      await engine.deleteAutomation('test-crud');
      assert.ok(!engine.automations.has('test-crud'));
      
      cleanup(testPath);
    });

    // ============ ENABLE/DISABLE ============
    await this.test('Enable/Disable automation', async () => {
      const Engine = require('../src/engine');
      const testPath = '~/.openclaw/automations-test-toggle';
      cleanup(testPath);
      
      const engine = new Engine({ storagePath: testPath });
      const automation = {
        id: 'toggle-test',
        name: 'Toggle Test',
        enabled: false,
        trigger: { type: 'schedule', cron: '0 9 * * *' },
        actions: [{ type: 'shell', command: 'echo test' }]
      };

      await engine.saveAutomation(automation);
      assert.strictEqual(engine.automations.get('toggle-test').enabled, false);

      await engine.enableAutomation('toggle-test');
      assert.strictEqual(engine.automations.get('toggle-test').enabled, true);

      await engine.disableAutomation('toggle-test');
      assert.strictEqual(engine.automations.get('toggle-test').enabled, false);

      cleanup(testPath);
    });

    // ============ KEYWORD CONDITION ============
    await this.test('Keyword condition (contains)', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const cond = engine.conditions.get('keyword');
      assert.ok(cond);

      const context = { text: 'Hello world, this is a test' };
      assert.strictEqual(await cond({ type: 'keyword', match: 'contains', value: 'world' }, context), true);
      assert.strictEqual(await cond({ type: 'keyword', match: 'contains', value: 'foo' }, context), false);
    });

    await this.test('Keyword condition (not_contains)', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const cond = engine.conditions.get('keyword');
      const context = { text: 'Hello world' };
      
      assert.strictEqual(await cond({ type: 'keyword', match: 'not_contains', value: 'foo' }, context), true);
      assert.strictEqual(await cond({ type: 'keyword', match: 'not_contains', value: 'world' }, context), false);
    });

    // ============ TIME RANGE CONDITION ============
    await this.test('Time range condition', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const cond = engine.conditions.get('time_range');
      assert.ok(cond);
      
      // Test will pass if current time is within range
      const result = await cond({ type: 'time_range', start: '00:00', end: '23:59' }, {});
      assert.strictEqual(result, true);
    });

    // ============ SENDER CONDITION ============
    await this.test('Sender condition', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const cond = engine.conditions.get('sender');
      assert.ok(cond);
      
      assert.strictEqual(await cond({ type: 'sender', value: 'test@example.com' }, { sender: 'test@example.com' }), true);
      assert.strictEqual(await cond({ type: 'sender', value: 'test@example.com' }, { sender: 'other@example.com' }), false);
    });

    // ============ SHELL ACTION ============
    await this.test('Shell action executes', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const shellAction = engine.actions.get('shell');
      assert.ok(shellAction);

      const result = await shellAction(
        { type: 'shell', command: 'echo "test output"' },
        {}
      );
      assert.ok(result.stdout.includes('test output'));
    }, 10000);

    await this.test('Shell action with timestamp replacement', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const shellAction = engine.actions.get('shell');
      const result = await shellAction(
        { type: 'shell', command: 'echo "Time: ${timestamp}"' },
        { test: true }
      );
      assert.ok(result.stdout.includes('Time: '));
    }, 10000);

    // ============ GIT ACTION ============
    await this.test('Git action structure', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const gitAction = engine.actions.get('git');
      assert.ok(gitAction);
      
      // Action is registered, actual execution would require git repo
      assert.strictEqual(typeof gitAction, 'function');
    });

    // ============ AGENT ACTION ============
    await this.test('Agent action structure', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const agentAction = engine.actions.get('agent');
      assert.ok(agentAction);
      
      const result = await agentAction(
        { type: 'agent', prompt: 'Say hello', model: 'claude-opus-4-5' },
        { test: true }
      );
      
      assert.strictEqual(result.type, 'agent');
      assert.strictEqual(result.prompt, 'Say hello');
    });

    // ============ WEBHOOK OUT ACTION ============
    await this.test('Webhook out action structure', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const webhookAction = engine.actions.get('webhook_out');
      assert.ok(webhookAction);
      
      const result = await webhookAction(
        { type: 'webhook_out', url: 'https://api.example.com', method: 'POST' },
        { test: true }
      );
      
      assert.strictEqual(result.url, 'https://api.example.com');
      assert.strictEqual(result.method, 'POST');
    });

    // ============ NOTIFY ACTION ============
    await this.test('Notify action structure', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const notifyAction = engine.actions.get('notify');
      assert.ok(notifyAction);
      
      const result = await notifyAction(
        { type: 'notify', channel: 'telegram', message: 'Test' },
        { test: true }
      );
      
      assert.strictEqual(result.channel, 'telegram');
      assert.strictEqual(result.message, 'Test');
    });

    // ============ RUN WITH CONDITIONS ============
    await this.test('Run with conditions (met)', async () => {
      const Engine = require('../src/engine');
      const testPath = '~/.openclaw/automations-test-run';
      cleanup(testPath);
      
      const engine = new Engine({ storagePath: testPath });
      const automation = {
        id: 'run-test',
        name: 'Run Test',
        enabled: true,
        trigger: { type: 'schedule', cron: '* * * * *' },
        conditions: [{ type: 'keyword', match: 'contains', value: 'hello' }],
        actions: [{ type: 'shell', command: 'echo "condition met"' }]
      };

      await engine.saveAutomation(automation);
      const result = await engine.run('run-test', { text: 'hello world' });
      
      assert.strictEqual(result.success, true);
      cleanup(testPath);
    });

    await this.test('Run with conditions (not met)', async () => {
      const Engine = require('../src/engine');
      const testPath = '~/.openclaw/automations-test-run-fail';
      cleanup(testPath);
      
      const engine = new Engine({ storagePath: testPath });
      const automation = {
        id: 'run-test-fail',
        name: 'Run Test Fail',
        enabled: true,
        trigger: { type: 'schedule', cron: '* * * * *' },
        conditions: [{ type: 'keyword', match: 'contains', value: 'secret' }],
        actions: [{ type: 'shell', command: 'echo "never runs"' }]
      };

      await engine.saveAutomation(automation);
      const result = await engine.run('run-test-fail', { text: 'hello world' });
      
      assert.strictEqual(result.skipped, true);
      assert.strictEqual(result.reason, 'conditions_not_met');
      
      cleanup(testPath);
    });

    // ============ SKIP DISABLED ============
    await this.test('Skip disabled automation', async () => {
      const Engine = require('../src/engine');
      const testPath = '~/.openclaw/automations-test-disabled';
      cleanup(testPath);
      
      const engine = new Engine({ storagePath: testPath });
      const automation = {
        id: 'disabled-test',
        name: 'Disabled Test',
        enabled: false,
        trigger: { type: 'schedule', cron: '* * * * *' },
        actions: [{ type: 'shell', command: 'echo "skip"' }]
      };

      await engine.saveAutomation(automation);
      const result = await engine.run('disabled-test', {});
      
      assert.strictEqual(result.skipped, true);
      assert.strictEqual(result.reason, 'disabled');
      
      cleanup(testPath);
    });

    // ============ SKIP ALREADY RUNNING ============
    await this.test('Skip already running automation', async () => {
      const Engine = require('../src/engine');
      const testPath = '~/.openclaw/automations-test-running';
      cleanup(testPath);
      
      const engine = new Engine({ storagePath: testPath });
      const automation = {
        id: 'running-test',
        name: 'Running Test',
        enabled: true,
        trigger: { type: 'schedule', cron: '* * * * *' },
        conditions: [],
        actions: [{ type: 'shell', command: 'sleep 5' }]
      };

      await engine.saveAutomation(automation);
      
      // Start first run (will sleep)
      const run1 = engine.run('running-test', {});
      
      // Try second run immediately
      const result = await engine.run('running-test', {});
      
      assert.strictEqual(result.skipped, true);
      assert.strictEqual(result.reason, 'running');
      
      cleanup(testPath);
    }, 15000);

    // ============ JSON VALIDATION ============
    await this.test('Valid JSON automation files', async () => {
      const examplesDir = path.join(__dirname, '../examples');
      const files = fs.readdirSync(examplesDir).filter(f => f.endsWith('.json'));
      
      assert.ok(files.length > 0, 'No example files found');
      
      for (const file of files) {
        const content = fs.readFileSync(path.join(examplesDir, file), 'utf8');
        const data = JSON.parse(content);
        
        assert.ok(data.id, `Missing id in ${file}`);
        assert.ok(data.trigger, `Missing trigger in ${file}`);
        assert.ok(data.actions, `Missing actions in ${file}`);
        assert.ok(data.trigger.type, `Missing trigger type in ${file}`);
      }
    });

    // ============ SUMMARY ============
    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Total: ${this.passed + this.failed}\n`);

    if (this.failed > 0) {
      console.log('Some tests failed.');
      process.exit(1);
    } else {
      console.log('All tests passed! 🎉\n');
    }
  }

  async test(name, fn, timeout = 5000) {
    try {
      await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      console.log(`✅ ${name}`);
      this.passed++;
    } catch (err) {
      console.log(`❌ ${name}`);
      console.log(`   Error: ${err.message}`);
      this.failed++;
    }
  }
}

// Helper to cleanup test directories
function cleanup(testPath) {
  try {
    const expanded = testPath.startsWith('~') 
      ? os.homedir() + testPath.slice(1)
      : testPath;
    if (fs.existsSync(expanded)) {
      fs.rmSync(expanded, { recursive: true, force: true });
    }
  } catch (e) {}
}

// Run tests
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
  });
}

module.exports = TestRunner;
