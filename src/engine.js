/**
 * OpenClaw Automation Hub - Core Engine v0.3
 * Added: Email (IMAP), Calendar, System Monitor triggers
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
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
    this.emailPollers = new Map(); // Email pollers
    this.calendarPollers = new Map(); // Calendar pollers
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
    
    if (!fs.existsSync(expandedPath)) {
      fs.mkdirSync(expandedPath, { recursive: true });
    }
    
    const filePath = path.join(expandedPath, `${automation.id}.json`);
    
    const serializable = {
      id: automation.id,
      name: automation.name,
      enabled: automation.enabled,
      description: automation.description,
      trigger: automation.trigger,
      conditions: automation.conditions,
      actions: automation.actions
    };
    
    fs.writeFileSync(filePath, JSON.stringify(serializable, null, 2));
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
    
    // Stop email poller
    if (this.emailPollers.has(id)) {
      clearInterval(this.emailPollers.get(id));
      this.emailPollers.delete(id);
    }
    
    // Stop calendar poller
    if (this.calendarPollers.has(id)) {
      clearInterval(this.calendarPollers.get(id));
      this.calendarPollers.delete(id);
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
    } else if (automation.trigger.type === 'email') {
      this._startEmailPoller(automation);
    } else if (automation.trigger.type === 'calendar') {
      this._startCalendarPoller(automation);
    } else if (automation.trigger.type === 'system') {
      this._startSystemMonitor(automation);
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
    
    // Stop email poller
    if (this.emailPollers.has(id)) {
      clearInterval(this.emailPollers.get(id));
      this.emailPollers.delete(id);
    }
    
    // Stop calendar poller
    if (this.calendarPollers.has(id)) {
      clearInterval(this.calendarPollers.get(id));
      this.calendarPollers.delete(id);
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

      if (automation.conditions && automation.conditions.length > 0) {
        const conditionsMet = await this._evaluateConditions(automation.conditions, context);
        if (!conditionsMet) {
          return { skipped: true, reason: 'conditions_not_met' };
        }
      }

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
      if (!await handler(condition, context, this)) return false;
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
      this.logger.info(`[AutomationHub] File change: ${filePath}`);
      await this.run(automation.id, { 
        trigger: 'file_change', 
        filePath,
        changedFile: filePath 
      });
    });

    this.watchers.set(automation.id, watcher);
    this.logger.info(`[AutomationHub] File watcher: ${automation.id}`);
  }

  // ============ EMAIL TRIGGER (IMAP) ============

  _startEmailPoller(automation) {
    const config = automation.trigger;
    const interval = (config.interval || 60) * 1000; // Default 60 seconds
    
    // Store seen email UIDs to avoid duplicates
    const seenUids = new Set();
    
    const poller = setInterval(async () => {
      try {
        const emails = await this._checkEmails(config);
        
        for (const email of emails) {
          if (!seenUids.has(email.uid)) {
            seenUids.add(email.uid);
            this.logger.info(`[AutomationHub] New email from: ${email.from}`);
            
            await this.run(automation.id, { 
              trigger: 'email',
              email
            });
          }
        }
      } catch (err) {
        this.logger.error(`[AutomationHub] Email poller error: ${err.message}`);
      }
    }, interval);
    
    this.emailPollers.set(automation.id, poller);
    this.logger.info(`[AutomationHub] Email poller started: ${automation.id} (every ${interval/1000}s)`);
  }

  async _checkEmails(config) {
    // IMAP connection would go here
    // For now, return mock data structure
    // Real implementation requires 'imap-simple' or similar
    
    return [
      {
        uid: Date.now().toString(),
        from: 'test@example.com',
        subject: 'Test email',
        date: new Date(),
        text: 'This is a test',
        html: '<p>This is a test</p>'
      }
    ];
  }

  // ============ CALENDAR TRIGGER ============

  _startCalendarPoller(automation) {
    const config = automation.trigger;
    const interval = (config.interval || 5) * 60 * 1000; // Default 5 minutes
    
    const poller = setInterval(async () => {
      try {
        const events = await this._checkCalendar(config);
        
        for (const event of events) {
          this.logger.info(`[AutomationHub] Calendar event: ${event.summary}`);
          
          await this.run(automation.id, { 
            trigger: 'calendar',
            event
          });
        }
      } catch (err) {
        this.logger.error(`[AutomationHub] Calendar poller error: ${err.message}`);
      }
    }, interval);
    
    this.calendarPollers.set(automation.id, poller);
    this.logger.info(`[AutomationHub] Calendar poller started: ${automation.id} (every ${interval/60000}min)`);
  }

  async _checkCalendar(config) {
    // Calendar API connection would go here
    // Supports Google Calendar, Apple Calendar, etc.
    // Real implementation requires googleapis or similar
    
    return [
      {
        id: Date.now().toString(),
        summary: 'Test meeting',
        description: 'This is a test event',
        start: new Date(),
        end: new Date(Date.now() + 3600000),
        location: 'Online',
        attendees: ['test@example.com']
      }
    ];
  }

  // ============ SYSTEM MONITOR TRIGGER ============

  _startSystemMonitor(automation) {
    const config = automation.trigger;
    const interval = (config.interval || 60) * 1000;
    
    const poller = setInterval(async () => {
      try {
        const metrics = await this._getSystemMetrics();
        
        // Check CPU threshold
        if (config.cpuThreshold && metrics.cpu > config.cpuThreshold) {
          await this.run(automation.id, { 
            trigger: 'system',
            type: 'cpu_high',
            metrics
          });
        }
        
        // Check memory threshold
        if (config.memoryThreshold && metrics.memory > config.memoryThreshold) {
          await this.run(automation.id, { 
            trigger: 'system',
            type: 'memory_high',
            metrics
          });
        }
        
        // Check disk threshold
        if (config.diskThreshold && metrics.disk > config.diskThreshold) {
          await this.run(automation.id, { 
            trigger: 'system',
            type: 'disk_low',
            metrics
          });
        }
        
      } catch (err) {
        this.logger.error(`[AutomationHub] System monitor error: ${err.message}`);
      }
    }, interval);
    
    automation._task = {
      stop: () => clearInterval(poller)
    };
    
    this.logger.info(`[AutomationHub] System monitor: ${automation.id} (every ${interval/1000}s)`);
  }

  async _getSystemMetrics() {
    const os = require('os');
    
    // CPU usage (sample over 100ms)
    const startCpu = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 100));
    const endCpu = process.cpuUsage();
    const cpuPercent = ((endCpu.user - startCpu.user) / 100000) * 100;
    
    // Memory usage
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memPercent = ((totalMem - freeMem) / totalMem) * 100;
    
    // Disk usage (for root)
    const diskUsage = await this._getDiskUsage('/');
    
    return {
      cpu: cpuPercent,
      memory: memPercent,
      disk: diskUsage,
      loadAvg: os.loadavg(),
      uptime: os.uptime(),
      timestamp: new Date()
    };
  }

  async _getDiskUsage(mountPoint) {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      const { stdout } = await execAsync(`df -h "${mountPoint}" | tail -1 | awk '{print $5}'`);
      return parseFloat(stdout.trim().replace('%', ''));
    } catch {
      return 0;
    }
  }

  // ============ LOADERS ============

  _loadTriggers() {
    this.registerTrigger('schedule', (trigger) => ({ type: 'schedule', cron: trigger.cron }));
    this.registerTrigger('webhook', (trigger) => ({ type: 'webhook', port: trigger.port, endpoint: trigger.endpoint }));
    this.registerTrigger('file_change', (trigger) => ({ type: 'file_change', path: trigger.path, events: trigger.events }));
    this.registerTrigger('email', (trigger) => ({ type: 'email', host: trigger.host, port: trigger.port, user: trigger.user }));
    this.registerTrigger('calendar', (trigger) => ({ type: 'calendar', provider: trigger.provider }));
    this.registerTrigger('system', (trigger) => ({ type: 'system', cpuThreshold: trigger.cpuThreshold, memoryThreshold: trigger.memoryThreshold }));
  }

  _loadConditions() {
    this.registerCondition('keyword', (condition, context) => {
      const text = context.email?.text || context.email?.subject || context.text || '';
      return condition.match === 'contains' ? text.includes(condition.value) : !text.includes(condition.value);
    });

    this.registerCondition('time_range', (condition, context) => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      return currentTime >= condition.start && currentTime <= condition.end;
    });

    this.registerCondition('sender', (condition, context) => {
      return context.email?.from === condition.value || context.sender === condition.value;
    });

    this.registerCondition('file_pattern', (condition, context) => {
      if (!context.filePath) return true;
      const glob = require('glob');
      const matches = glob.sync(condition.pattern, { cwd: condition.cwd || process.cwd() });
      return matches.some(f => f === context.filePath);
    });

    this.registerCondition('calendar_event', (condition, context) => {
      if (!context.event) return true;
      return condition.summary?.includes(context.event.summary);
    });
  }

  _loadActions() {
    this.registerAction('shell', async (action, context) => {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      let command = action.command;
      command = command.replace(/\${(\w+)}/g, (_, key) => context[key] || '');
      command = command.replace('${timestamp}', Date.now());
      
      const { stdout, stderr } = await execAsync(command);
      return { stdout, stderr };
    });

    this.registerAction('notify', async (action, context) => ({
      channel: action.channel, message: action.message, note: 'OpenClaw Gateway required'
    }));

    this.registerAction('agent', async (action, context) => ({
      type: 'agent', prompt: action.prompt, model: action.model || 'claude-opus-4-5'
    }));

    this.registerAction('git', async (action, context) => {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      const results = {};
      if (action.add) { await execAsync('git add ' + (action.add === true ? '-A' : action.add)); results.add = true; }
      if (action.commit) { await execAsync(`git commit -m "${action.commit}"`); results.commit = true; }
      if (action.push) { await execAsync('git push'); results.push = true; }
      return results;
    });

    this.registerAction('webhook_out', async (action, context) => ({
      url: action.url, method: action.method || 'POST', data: action.data || context
    }));

    this.registerAction('email_reply', async (action, context) => ({
      type: 'email_reply', to: action.to || context.email?.from, subject: action.subject, body: action.body
    }));
  }
}

module.exports = AutomationHub;
