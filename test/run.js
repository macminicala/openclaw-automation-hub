/**
 * Test Runner for Automation Hub MVP v0.1
 */

const assert = require('assert');

class TestRunner {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.tests = [];
  }

  async run() {
    console.log('\n🧪 Automation Hub - MVP v0.1 Tests\n');
    console.log('='.repeat(50));

    // Test 1: Engine loads
    await this.test('Engine loads correctly', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });
      assert.ok(engine instanceof Engine);
      assert.ok(engine.triggers.size > 0);
      assert.ok(engine.actions.size > 0);
    });

    // Test 2: Automation CRUD
    await this.test('Automation CRUD operations', async () => {
      const Engine = require('../src/engine');
      const testPath = '~/.openclaw/automations-test';
      
      // Cleanup first
      const { execSync } = require('child_process');
      try { execSync(`rm -rf ${testPath}`); } catch (e) {}

      const engine = new Engine({ storagePath: testPath });
      await engine.loadAutomations();

      const automation = {
        id: 'test-automation',
        name: 'Test Automation',
        enabled: true,
        trigger: { type: 'schedule', cron: '0 9 * * *' },
        actions: [{ type: 'shell', command: 'echo test' }]
      };

      await engine.saveAutomation(automation);
      assert.ok(engine.automations.has('test-automation'));

      await engine.deleteAutomation('test-automation');
      assert.ok(!engine.automations.has('test-automation'));
    });

    // Test 3: Conditions evaluation
    await this.test('Conditions evaluate correctly', async () => {
      const Engine = require('../src/engine');
      const engine = new Engine({ storagePath: '~/.openclaw/automations-test' });

      // Test keyword condition
      const keywordCond = engine.conditions.get('keyword');
      assert.ok(keywordCond);

      const context = { text: 'Hello world' };
      assert.strictEqual(await keywordCond({ type: 'keyword', match: 'contains', value: 'world' }, context), true);
      assert.strictEqual(await keywordCond({ type: 'keyword', match: 'contains', value: 'foo' }, context), false);
    });

    // Test 4: Shell action
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

    // Summary
    console.log('\n' + '='.repeat(50));
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

// Run tests
if (require.main === module) {
  const runner = new TestRunner();
  runner.run().catch(err => {
    console.error('Test runner error:', err);
    process.exit(1);
  });
}

module.exports = TestRunner;
