/**
 * OpenClaw Automation Hub - Core Engine
 * v0.1.0
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class AutomationHub extends EventEmitter {
  constructor(config = {}) {
    super();
    this.storagePath = config.storagePath || '~/.openclaw/automations';
    this.automations = new Map();
    this.triggers = new Map();
    this.conditions = new Map();
    this.actions = new Map();
    this.running = new Set();
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
    // Expand ~ to home directory
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
    
    this.automations.delete(id);
    return { success: true };
  }

  async enableAutomation(id) {
    const automation = this.automations.get(id);
    if (!automation) throw new Error(`Automation ${id} not found`);
    
    automation.enabled = true;
    await this.saveAutomation(automation);
    
    if (automation.trigger.type === 'schedule') {
      this._startScheduler(automation);
    }
    
    return automation;
  }

  async disableAutomation(id) {
    const automation = this.automations.get(id);
    if (!automation) throw new Error(`Automation ${id} not found`);
    
    automation.enabled = false;
    await this.saveAutomation(automation);
    this._stopScheduler(automation);
    
    return automation;
  }

  // ============ EXECUTION ============

  async run(automationId, context = {}) {
    const automation = this.automations.get(automationId);
    if (!automation) throw new Error(`Automation ${id} not found`);
    
    if (!automation.enabled) {
      this.logger.info(`[AutomationHub] ${automationId} is disabled, skipping`);
      return { skipped: true, reason: 'disabled' };
    }

    // Check cooldown
    if (this.running.has(automationId)) {
      this.logger.warn(`[AutomationHub] ${automationId} already running`);
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
          this.logger.info(`[AutomationHub] Conditions not met for ${automationId}`);
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
      if (!handler) {
        this.logger.warn(`Unknown condition type: ${condition.type}`);
        continue;
      }
      
      const met = await handler(condition, context, this);
      if (!met) return false;
    }
    return true;
  }

  // ============ SCHEDULER ============

  _startScheduler(automation) {
    const cron = require('node-cron');
    
    if (cron.validate(automation.trigger.cron)) {
      const task = cron.schedule(automation.trigger.cron, async () => {
        await this.run(automation.id, { trigger: 'schedule' });
      });
      
      automation._task = task;
      this.logger.info(`[AutomationHub] Scheduled: ${automation.id}`);
    }
  }

  _stopScheduler(automation) {
    if (automation._task) {
      automation._task.stop();
      delete automation._task;
      this.logger.info(`[AutomationHub] Unscheduled: ${automation.id}`);
    }
  }

  // ============ LOADERS ============

  _loadTriggers() {
    this.registerTrigger('schedule', (trigger, context, hub) => ({
      type: 'schedule',
      cron: trigger.cron
    }));

    this.registerTrigger('webhook', (trigger, context, hub) => ({
      type: 'webhook',
      endpoint: trigger.endpoint
    }));

    this.registerTrigger('file_change', (trigger, context, hub) => ({
      type: 'file_change',
      path: trigger.path,
      events: trigger.events || ['modify', 'add', 'delete']
    }));
  }

  _loadConditions() {
    this.registerCondition('keyword', (condition, context) => {
      const text = context.text || '';
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
      return context.sender === condition.value;
    });
  }

  _loadActions() {
    this.registerAction('shell', async (action, context, hub) => {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      const command = action.command
        .replace('${context}', JSON.stringify(context))
        .replace('${timestamp}', Date.now());
      
      const { stdout, stderr } = await execAsync(command);
      return { stdout, stderr };
    });

    this.registerAction('notify', async (action, context, hub) => {
      // Will integrate with OpenClaw message system
      return { channel: action.channel, message: action.message };
    });

    this.registerAction('agent', async (action, context, hub) => {
      // Will integrate with OpenClaw agent system
      return { prompt: action.prompt, model: action.model };
    });
  }
}

module.exports = AutomationHub;
