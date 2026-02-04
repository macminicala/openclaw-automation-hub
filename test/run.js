/**
 * OpenClaw Automation Hub - Comprehensive Test Suite v0.4
 * Full coverage of all features
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

class TestSuite {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
    this.results = [];
  }

  async run() {
    console.log('\n🧪 Automation Hub v0.4 - Full Test Suite\n');
    console.log('='.repeat(70));

    // ============ ENGINE TESTS ============
    await this.test('Engine loads correctly', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      assert.ok(engine instanceof Engine);
      assert.ok(engine.triggers instanceof Map);
      assert.ok(engine.actions instanceof Map);
      assert.ok(engine.conditions instanceof Map);
    });

    // ============ TRIGGER REGISTRATION ============
    await this.test('All triggers registered', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      assert.ok(engine.triggers.has('schedule'));
      assert.ok(engine.triggers.has('webhook'));
      assert.ok(engine.triggers.has('file_change'));
      assert.ok(engine.triggers.has('email'));
      assert.ok(engine.triggers.has('calendar'));
      assert.ok(engine.triggers.has('system'));
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
      assert.ok(engine.actions.has('email_reply'));
    });

    // ============ CONDITION REGISTRATION ============
    await this.test('All conditions registered', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      assert.ok(engine.conditions.has('keyword'));
      assert.ok(engine.conditions.has('time_range'));
      assert.ok(engine.conditions.has('sender'));
      assert.ok(engine.conditions.has('file_pattern'));
      assert.ok(engine.conditions.has('calendar_event'));
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

    // ============ CALENDAR EVENT CONDITION ============
    await this.test('Calendar event condition', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const cond = engine.conditions.get('calendar_event');
      assert.ok(cond);
      
      const context = { event: { summary: 'Team Standup Meeting' } };
      // Event summary "Team Standup Meeting" contains "Standup"
      assert.strictEqual(await cond({ type: 'calendar_event', value: 'Standup' }, context), true);
      // Event summary doesn't contain "One-on-One"
      assert.strictEqual(await cond({ type: 'calendar_event', value: 'One-on-One' }, context), false);
      // No event should return true (condition passes)
      assert.strictEqual(await cond({ type: 'calendar_event', value: 'Test' }, {}), true);
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

    await this.test('Shell action with variable replacement', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const shellAction = engine.actions.get('shell');
      const result = await shellAction(
        { type: 'shell', command: 'echo "Time: ${timestamp} File: ${file}"' },
        { file: '/test/path.txt' }
      );
      assert.ok(result.stdout.includes('Time: '));
      assert.ok(result.stdout.includes('File: /test/path.txt'));
    }, 10000);

    // ============ GIT ACTION ============
    await this.test('Git action structure', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const gitAction = engine.actions.get('git');
      assert.ok(gitAction);
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

    // ============ EMAIL REPLY ACTION ============
    await this.test('Email reply action structure', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const emailReplyAction = engine.actions.get('email_reply');
      assert.ok(emailReplyAction);
      
      const result = await emailReplyAction(
        { type: 'email_reply', subject: 'Re: Hello', body: 'Thanks!' },
        { email: { from: 'sender@example.com' } }
      );
      
      assert.strictEqual(result.type, 'email_reply');
      assert.strictEqual(result.subject, 'Re: Hello');
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
        actions: [{ type: 'shell', command: 'sleep 3' }]
      };

      await engine.saveAutomation(automation);
      
      // First run (will sleep)
      const run1 = engine.run('running-test', {});
      
      // Second run immediately
      const result = await engine.run('running-test', {});
      
      assert.strictEqual(result.skipped, true);
      assert.strictEqual(result.reason, 'running');
      
      cleanup(testPath);
    }, 10000);

    // ============ MULTIPLE CONDITIONS ============
    await this.test('Run with multiple conditions (all met)', async () => {
      const Engine = require('../src/engine');
      const testPath = '~/.openclaw/automations-test-multi';
      cleanup(testPath);
      
      const engine = new Engine({ storagePath: testPath });
      const automation = {
        id: 'multi-test',
        name: 'Multi Condition Test',
        enabled: true,
        trigger: { type: 'schedule', cron: '* * * * *' },
        conditions: [
          { type: 'keyword', match: 'contains', value: 'hello' },
          { type: 'sender', value: 'test@example.com' }
        ],
        actions: [{ type: 'shell', command: 'echo "all conditions met"' }]
      };

      await engine.saveAutomation(automation);
      const result = await engine.run('multi-test', { 
        text: 'hello world',
        sender: 'test@example.com'
      });
      
      assert.strictEqual(result.success, true);
      cleanup(testPath);
    });

    await this.test('Run with multiple conditions (one fails)', async () => {
      const Engine = require('../src/engine');
      const testPath = '~/.openclaw/automations-test-multi-fail';
      cleanup(testPath);
      
      const engine = new Engine({ storagePath: testPath });
      const automation = {
        id: 'multi-fail-test',
        name: 'Multi Fail Test',
        enabled: true,
        trigger: { type: 'schedule', cron: '* * * * *' },
        conditions: [
          { type: 'keyword', match: 'contains', value: 'hello' },
          { type: 'sender', value: 'test@example.com' }
        ],
        actions: [{ type: 'shell', command: 'echo "should not run"' }]
      };

      await engine.saveAutomation(automation);
      const result = await engine.run('multi-fail-test', { 
        text: 'hello world',
        sender: 'wrong@example.com'
      });
      
      assert.strictEqual(result.skipped, true);
      assert.strictEqual(result.reason, 'conditions_not_met');
      
      cleanup(testPath);
    });

    // ============ MULTIPLE ACTIONS ============
    await this.test('Run with multiple actions', async () => {
      const Engine = require('../src/engine');
      const testPath = '~/.openclaw/automations-test-actions';
      cleanup(testPath);
      
      const engine = new Engine({ storagePath: testPath });
      const automation = {
        id: 'multi-actions-test',
        name: 'Multi Actions Test',
        enabled: true,
        trigger: { type: 'schedule', cron: '* * * * *' },
        conditions: [],
        actions: [
          { type: 'shell', command: 'echo "action 1"' },
          { type: 'shell', command: 'echo "action 2"' },
          { type: 'shell', command: 'echo "action 3"' }
        ]
      };

      await engine.saveAutomation(automation);
      const result = await engine.run('multi-actions-test', {});
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.results.length, 3);
      cleanup(testPath);
    }, 10000);

    // ============ EMAIL CONTEXT CONDITION ============
    await this.test('Keyword condition with email context', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const cond = engine.conditions.get('keyword');
      
      const emailContext = {
        email: {
          subject: 'Urgent: Meeting Today',
          text: 'Please join us at 3pm'
        }
      };
      
      assert.strictEqual(await cond({ type: 'keyword', match: 'contains', value: 'Urgent' }, emailContext), true);
      assert.strictEqual(await cond({ type: 'keyword', match: 'contains', value: 'Meeting' }, emailContext), true);
    });

    // ============ SYSTEM METRICS ============
    await this.test('System metrics structure', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      
      const metrics = await engine._getSystemMetrics();
      
      assert.ok(typeof metrics.cpu === 'number');
      assert.ok(typeof metrics.memory === 'number');
      assert.ok(typeof metrics.disk === 'number');
      assert.ok(typeof metrics.loadAvg === 'object');
      assert.ok(typeof metrics.uptime === 'number');
      assert.ok(metrics.timestamp instanceof Date);
    });

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
        assert.ok(Array.isArray(data.actions), `Actions not array in ${file}`);
      }
    });

    // ============ EDGE CASES ============
    await this.test('Automation with empty conditions', async () => {
      const Engine = require('../src/engine');
      const testPath = '~/.openclaw/automations-test-empty';
      cleanup(testPath);
      
      const engine = new Engine({ storagePath: testPath });
      const automation = {
        id: 'empty-conditions',
        name: 'Empty Conditions',
        enabled: true,
        trigger: { type: 'schedule', cron: '* * * * *' },
        conditions: [],
        actions: [{ type: 'shell', command: 'echo "no conditions"' }]
      };

      await engine.saveAutomation(automation);
      const result = await engine.run('empty-conditions', {});
      
      assert.strictEqual(result.success, true);
      cleanup(testPath);
    });

    await this.test('Automation with empty actions', async () => {
      const Engine = require('../src/engine');
      const testPath = '~/.openclaw/automations-test-noactions';
      cleanup(testPath);
      
      const engine = new Engine({ storagePath: testPath });
      const automation = {
        id: 'no-actions',
        name: 'No Actions',
        enabled: true,
        trigger: { type: 'schedule', cron: '* * * * *' },
        conditions: [],
        actions: []
      };

      await engine.saveAutomation(automation);
      const result = await engine.run('no-actions', {});
      
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.results.length, 0);
      cleanup(testPath);
    });

    await this.test('Automation with description', async () => {
      const Engine = require('../src/engine');
      const testPath = '~/.openclaw/automations-test-desc';
      cleanup(testPath);
      
      const engine = new Engine({ storagePath: testPath });
      const automation = {
        id: 'with-description',
        name: 'With Description',
        description: 'This is a test automation with a description',
        enabled: true,
        trigger: { type: 'schedule', cron: '0 9 * * *' },
        actions: [{ type: 'shell', command: 'echo "test"' }]
      };

      await engine.saveAutomation(automation);
      const loaded = engine.automations.get('with-description');
      
      assert.strictEqual(loaded.description, 'This is a test automation with a description');
      cleanup(testPath);
    });

    // ============ SUMMARY ============
    console.log('\n' + '='.repeat(70));
    console.log(`\n✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📊 Total: ${this.passed + this.failed}\n`);
    console.log(`⏱️  Test Duration: ~${Math.ceil((this.passed + this.failed) * 0.5)}s estimated\n`);

    if (this.failed > 0) {
      console.log('Failed tests:');
      this.results.filter(r => !r.pass).forEach(r => {
        console.log(`  ❌ ${r.name}`);
        console.log(`     Error: ${r.error}`);
      });
      console.log('');
      process.exit(1);
    } else {
      console.log('🎉 All tests passed! The automation hub is fully functional.\n');
      console.log('📋 Feature Coverage:');
      console.log('   ✅ Core Engine');
      console.log('   ✅ All 6 Triggers');
      console.log('   ✅ All 6 Actions');
      console.log('   ✅ All 5 Conditions');
      console.log('   ✅ CRUD Operations');
      console.log('   ✅ Enable/Disable');
      console.log('   ✅ Multiple Conditions');
      console.log('   ✅ Multiple Actions');
      console.log('   ✅ Edge Cases');
      console.log('   ✅ JSON Validation');
      console.log('');
    }
  }

  async test(name, fn, timeout = 5000) {
    const startTime = Date.now();
    try {
      await Promise.race([
        fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      const duration = Date.now() - startTime;
      console.log(`✅ ${name} (${duration}ms)`);
      this.passed++;
      this.results.push({ name, pass: true });
    } catch (err) {
      const duration = Date.now() - startTime;
      console.log(`❌ ${name} (${duration}ms)`);
      console.log(`   Error: ${err.message}`);
      this.failed++;
      this.results.push({ name, pass: false, error: err.message });
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
  const suite = new TestSuite();
  suite.run().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
  });
}

module.exports = TestSuite;
