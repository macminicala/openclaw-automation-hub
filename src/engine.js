/**
 * OpenClaw Automation Hub - Core Engine v0.2
 * Added: Webhook trigger, File watching, Agent action
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { EventEmitter } = require('events');
const cron = require('node-cron');

class AutomationHub extends EventEmitter {
  constructor(config = {}) {
    super();
    this.storagePath = config.storagePath || '~/.openclaw/automations';
    this.automations = new Map();
    this.triggers = new Map();
    this.conditions = new Map();
    this.actions = new Map();
    this.running = new Set();
    this.servers = []; // HTTP servers for webhooks
    this.watchers = new Map(); // File watchers
    this.logger = config.logger || console;
    
    this._loadTriggers();
    this._loadConditions();
    this._loadActions();
  }

  // ============ REGISTRATION ============

  registerTrigger(name, handler) {
    this.triggers.set(name, handler);
    this.logger.info(`[AutomationHub] Trigger registered: ${name}`);
  }

  registerCondition(name, handler) {
    this.conditions.set(name, handler);
    this.logger.info(`[AutomationHub] Condition registered: ${name}`);
  }

  registerAction(name, handler) {
    this.actions.set(name, handler);
    this.logger.info(`[AutomationHub] Action registered: ${name}`);
  }

  // ============ CORE OPERATIONS ============

  async loadAutomations() {
    let expandedPath = this.storagePath;
    if (expandedPath.startsWith('~')) {
      expandedPath = require('os').homedir() + expandedPath.slice(1);
    }
    
    if (!fs.existsSync(expandedPath)) {
      fs.mkdirSync(expandedPath, { recursive: true });
    }

    const files = fs.readdirSync(expandedPath).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(expandedPath, file), 'utf8');
        const automation = JSON.parse(content);
        this.automations.set(automation.id, automation);
        this.logger.info(`[AutomationHub] Loaded: ${automation.id}`);
      } catch (err) {
        this.logger.error(`[AutomationHub] Error loading ${file}: ${err.message}`);
      }
    }
  }

  async saveAutomation(automation) {
    let expandedPath = this.storagePath;
    if (expandedPath.startsWith('~')) {
      expandedPath = require('os').homedir() + expandedPath.slice(1);
    }
    const filePath = path.join(expandedPath, `${automation.id}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(automation, null, 2));
    this.automations.set(automation.id, automation);
    
    return automation;
  }

  async deleteAutomation(id) {
    let expandedPath = this.storagePath;
    if (expandedPath.startsWith('~')) {
      expandedPath = require('os').homedir() + expandedPath.slice(1);
    }
    const filePath = path.join(expandedPath, `${id}.json`);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Stop any watchers
    if (this.watchers.has(id)) {
      this.watchers.get(id).close();
      this.watchers.delete(id);
    }
    
    this.automations.delete(id);
    return { success: true };
  }

  async enableAutomation(id) {
    const automation = this.automations.get(id);
    if (!automation) throw new Error(`Automation ${id} not found`);
    
    automation.enabled = true;
    await this.saveAutomation(automation);
    
    // Start trigger handlers
    if (automation.trigger.type === 'schedule' && cron.validate(automation.trigger.cron)) {
      this._startScheduler(automation);
    } else if (automation.trigger.type === 'webhook') {
      this._startWebhookServer(automation);
    } else if (automation.trigger.type === 'file_change') {
      this._startFileWatcher(automation);
    }
    
    return automation;
  }

  async disableAutomation(id) {
    const automation = this.automations.get(id);
    if (!automation) throw new Error(`Automation ${id} not found`);
    
    automation.enabled = false;
    await this.saveAutomation(automation);
    
    // Stop trigger handlers
    if (automation._task) {
      automation._task.stop();
      delete automation._task;
    }
    
    // Close file watchers
    if (this.watchers.has(id)) {
      this.watchers.get(id).close();
      this.watchers.delete(id);
    }
    
    return automation;
  }

  // ============ EXECUTION ============

  async run(automationId, context = {}) {
    const automation = this.automations.get(automationId);
    if (!automation) throw new Error(`Automation ${automationId} not found`);
    
    if (!automation.enabled) {
      return { skipped: true, reason: 'disabled' };
    }

    if (this.running.has(automationId)) {
      return { skipped: true, reason: 'running' };
    }

    this.running.add(automationId);
    const startTime = Date.now();

    try {
      this.logger.info(`[AutomationHub] Starting: ${automationId}`);
      this.emit('start', { automationId, context });

      // Evaluate conditions
      if (automation.conditions && automation.conditions.length > 0) {
        const conditionsMet = await this._evaluateConditions(automation.conditions, context);
        if (!conditionsMet) {
          return { skipped: true, reason: 'conditions_not_met' };
        }
      }

      // Execute actions
      const results = [];
      for (const action of automation.actions) {
        const result = await this._executeAction(action, context);
        results.push(result);
      }

      const duration = Date.now() - startTime;
      const finalResult = { success: true, duration, results };
      
      this.emit('complete', { automationId, result: finalResult });
      this.logger.info(`[AutomationHub] Completed: ${automationId} in ${duration}ms`);
      
      return finalResult;
    } catch (err) {
      this.logger.error(`[AutomationHub] Error in ${automationId}: ${err.message}`);
      this.emit('error', { automationId, error: err });
      throw err;
    } finally {
      this.running.delete(automationId);
    }
  }

  async _executeAction(action, context) {
    const handler = this.actions.get(action.type);
    if (!handler) throw new Error(`Unknown action type: ${action.type}`);
    
    return await handler(action, context, this);
  }

  async _evaluateConditions(conditions, context) {
    for (const condition of conditions) {
      const handler = this.conditions.get(condition.type);
      if (!handler) continue;
      
      const met = await handler(condition, context, this);
      if (!met) return false;
    }
    return true;
  }

  // ============ SCHEDULE TRIGGER ============

  _startScheduler(automation) {
    if (cron.validate(automation.trigger.cron)) {
      const task = cron.schedule(automation.trigger.cron, async () => {
        await this.run(automation.id, { trigger: 'schedule', timestamp: new Date() });
      });
      
      automation._task = task;
      this.logger.info(`[AutomationHub] Scheduled: ${automation.id}`);
    }
  }

  // ============ WEBHOOK TRIGGER ============

  _startWebhookServer(automation) {
    const port = automation.trigger.port || 18796;
    const endpoint = automation.trigger.endpoint || `/${automation.id}`;
    
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${port}`);
      
      if (url.pathname === endpoint && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const data = body ? JSON.parse(body) : {};
            this.logger.info(`[AutomationHub] Webhook received for ${automation.id}`);
            
            await this.run(automation.id, { 
              trigger: 'webhook', 
              data,
              headers: req.headers 
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, automationId: automation.id }));
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(port, () => {
      this.logger.info(`[AutomationHub] Webhook server listening on port ${port}`);
      this.servers.push(server);
    });
  }

  // ============ FILE WATCH TRIGGER ============

  _startFileWatcher(automation) {
    const chokidar = require('chokidar');
    const watchPath = automation.trigger.path || '.';
    const events = automation.trigger.events || ['modify', 'add', 'delete'];
    
    const watcher = chokidar.watch(watchPath, {
      ignored: automation.trigger.ignored || /node_modules/,
      persistent: true
    });

    watcher.on(events, async (filePath) => {
      this.logger.info(`[AutomationHub] File change detected: ${filePath}`);
      await this.run(automation.id, { 
        trigger: 'file_change', 
        filePath,
        changedFile: filePath 
      });
    });

    this.watchers.set(automation.id, watcher);
    this.logger.info(`[AutomationHub] File watcher started for ${automation.id}`);
  }

  // ============ LOADERS ============

  _loadTriggers() {
    this.registerTrigger('schedule', (trigger, context) => ({
      type: 'schedule',
      cron: trigger.cron
    }));

    this.registerTrigger('webhook', (trigger, context) => ({
      type: 'webhook',
      port: trigger.port,
      endpoint: trigger.endpoint
    }));

    this.registerTrigger('file_change', (trigger, context) => ({
      type: 'file_change',
      path: trigger.path,
      events: trigger.events,
      ignored: trigger.ignored
    }));
  }

  _loadConditions() {
    this.registerCondition('keyword', (condition, context) => {
      const text = context.text || context.data?.text || '';
      return condition.match === 'contains' 
        ? text.includes(condition.value)
        : !text.includes(condition.value);
    });

    this.registerCondition('time_range', (condition, context) => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      return currentTime >= condition.start && currentTime <= condition.end;
    });

    this.registerCondition('sender', (condition, context) => {
      return context.sender === condition.value || context.data?.from === condition.value;
    });

    this.registerCondition('file_pattern', (condition, context) => {
      if (!context.filePath) return true;
      const glob = require('glob');
      const matches = glob.sync(condition.pattern, { cwd: condition.cwd || process.cwd() });
      return matches.some(f => f === context.filePath || context.filePath.includes(f));
    });
  }

  _loadActions() {
    // Shell action
    this.registerAction('shell', async (action, context, hub) => {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      let command = action.command;
      command = command.replace('${context}', JSON.stringify(context));
      command = command.replace('${timestamp}', Date.now());
      command = command.replace('${file}', context.filePath || '');
      command = command.replace('${data}', JSON.stringify(context.data || {}));
      
      const { stdout, stderr } = await execAsync(command);
      return { stdout, stderr };
    });

    // Notify action
    this.registerAction('notify', async (action, context, hub) => {
      return { 
        channel: action.channel, 
        message: action.message,
        note: 'Requires OpenClaw Gateway integration'
      };
    });

    // Agent action (AI-powered)
    this.registerAction('agent', async (action, context, hub) => {
      return { 
        type: 'agent',
        prompt: action.prompt,
        model: action.model || 'claude-opus-4-5',
        context: context.data || context,
        note: 'Requires OpenClaw agent integration'
      };
    });

    // Git action
    this.registerAction('git', async (action, context, hub) => {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      const results = {};
      
      if (action.add) {
        await execAsync('git add ' + (action.add === true ? '-A' : action.add));
        results.add = true;
      }
      
      if (action.commit) {
        const msg = action.commit.replace('${timestamp}', Date.now());
        await execAsync(`git commit -m "${msg}"`);
        results.commit = msg;
      }
      
      if (action.push) {
        await execAsync('git push');
        results.push = true;
      }
      
      return results;
    });

    // Webhook out action
    this.registerAction('webhook_out', async (action, context, hub) => {
      return {
        url: action.url,
        method: action.method || 'POST',
        data: action.data || context,
        note: 'HTTP request would be made here'
      };
    });
  }
}

module.exports = AutomationHub;
