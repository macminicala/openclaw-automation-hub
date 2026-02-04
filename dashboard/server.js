/**
 * OpenClaw Automation Hub Dashboard - v0.4
 * Enhanced with Visual Workflow Builder
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { WebSocketServer } = require('ws');

const PORT = process.env.DASHBOARD_PORT || 18799;
const STORAGE_PATH = '~/.openclaw/automations';
const LOGS_PATH = '~/.openclaw/logs/automation';

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Helper functions
function getAutomationsDir() {
  let dir = STORAGE_PATH;
  if (dir.startsWith('~')) {
    dir = require('os').homedir() + dir.slice(1);
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getLogsDir() {
  let dir = LOGS_PATH;
  if (dir.startsWith('~')) {
    dir = require('os').homedir() + dir.slice(1);
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function loadAutomations() {
  const dir = getAutomationsDir();
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const automations = {};
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      automations[file.replace('.json', '')] = JSON.parse(content);
    } catch (e) {}
  }
  return automations;
}

function saveAutomation(data) {
  const dir = getAutomationsDir();
  const id = data.id || data.name.toLowerCase().replace(/\s+/g, '-');
  const filePath = path.join(dir, `${id}.json`);
  
  const automation = {
    id,
    name: data.name || id,
    enabled: data.enabled !== false,
    description: data.description || '',
    trigger: data.trigger || { type: 'schedule', cron: '0 9 * * *' },
    conditions: data.conditions || [],
    actions: data.actions || [{ type: 'shell', command: 'echo "Done"' }]
  };
  
  fs.writeFileSync(filePath, JSON.stringify(automation, null, 2));
  return automation;
}

function deleteAutomation(id) {
  const dir = getAutomationsDir();
  const filePath = path.join(dir, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

function logExecution(automationId, result) {
  const dir = getLogsDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logFile = path.join(dir, `${automationId}-${timestamp}.log`);
  
  fs.writeFileSync(logFile, JSON.stringify({
    automationId,
    timestamp: new Date().toISOString(),
    result
  }, null, 2));
}

function getLogs(automationId = null) {
  const dir = getLogsDir();
  if (!fs.existsSync(dir)) return [];
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.log'));
  const logs = [];
  
  for (const file of files.slice(-50).reverse()) {
    if (automationId && !file.includes(automationId)) continue;
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      const data = JSON.parse(content);
      data.file = file;
      logs.push(data);
    } catch (e) {}
  }
  return logs;
}

function calculateStats(automations) {
  const all = Object.values(automations);
  return {
    total: all.length,
    enabled: all.filter(a => a.enabled).length,
    disabled: all.filter(a => !a.enabled).length,
    byTrigger: {
      schedule: all.filter(a => a.trigger?.type === 'schedule').length,
      webhook: all.filter(a => a.trigger?.type === 'webhook').length,
      file_change: all.filter(a => a.trigger?.type === 'file_change').length,
      email: all.filter(a => a.trigger?.type === 'email').length,
      calendar: all.filter(a => a.trigger?.type === 'calendar').length,
      system: all.filter(a => a.trigger?.type === 'system').length
    }
  };
}

// HTTP Server
const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // API Routes
  if (pathname.startsWith('/api/')) {
    const apiPath = pathname.replace('/api/', '');
    
    if (req.method === 'GET' && apiPath === 'automations') {
      const automations = loadAutomations();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        automations, 
        stats: calculateStats(automations),
        logs: getLogs()
      }));
      return;
    }
    
    if (req.method === 'POST' && apiPath === 'automations') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          saveAutomation(data);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
    
    if (req.method === 'POST' && apiPath.startsWith('automations/') && apiPath.endsWith('/enable')) {
      const id = apiPath.split('/')[1];
      const automations = loadAutomations();
      if (automations[id]) {
        automations[id].enabled = true;
        saveAutomation(automations[id]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      return;
    }
    
    if (req.method === 'POST' && apiPath.startsWith('automations/') && apiPath.endsWith('/disable')) {
      const id = apiPath.split('/')[1];
      const automations = loadAutomations();
      if (automations[id]) {
        automations[id].enabled = false;
        saveAutomation(automations[id]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      return;
    }
    
    if (req.method === 'POST' && apiPath.startsWith('automations/') && apiPath.endsWith('/run')) {
      const id = apiPath.split('/')[1];
      const automations = loadAutomations();
      // Simulate run
      const result = { success: true, timestamp: new Date().toISOString() };
      logExecution(id, result);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      return;
    }
    
    if (req.method === 'DELETE' && apiPath.startsWith('automations/')) {
      const id = apiPath.split('/')[1];
      deleteAutomation(id);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
      return;
    }
    
    if (req.method === 'GET' && apiPath === 'logs') {
      const id = parsedUrl.query.id;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getLogs(id)));
      return;
    }
    
    if (req.method === 'GET' && apiPath === 'stats') {
      const automations = loadAutomations();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(calculateStats(automations)));
      return;
    }
    
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'API not found' }));
    return;
  }
  
  // Serve dashboard files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.join(__dirname, 'dashboard', filePath);
  
  if (!fullPath.startsWith(path.join(__dirname, 'dashboard'))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const ext = path.extname(fullPath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    res.end(fs.readFileSync(fullPath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// WebSocket for real-time updates
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('[Dashboard] Client connected');
  
  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
  }, 30000);
  
  ws.on('close', () => {
    clearInterval(heartbeat);
    console.log('[Dashboard] Client disconnected');
  });
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'run') {
        logExecution(data.id, { success: true, triggered: true, timestamp: new Date().toISOString() });
        ws.send(JSON.stringify({ 
          type: 'executed', 
          id: data.id, 
          timestamp: new Date().toISOString() 
        }));
      }
    } catch (e) {}
  });
});

// Broadcast to all connected clients
function broadcast(data) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(JSON.stringify(data));
    }
  });
}

// Log when automation runs
const originalLoad = loadAutomations;
loadAutomations = function() {
  const result = originalLoad();
  broadcast({ type: 'updated', count: Object.keys(result).length });
  return result;
};

// Start server
server.listen(PORT, () => {
  console.log(`\n⚡ Automation Hub Dashboard v0.4`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`\nFeatures:`);
  console.log(`   ✅ Visual Workflow Builder`);
  console.log(`   ✅ All Trigger Types`);
  console.log(`   ✅ Real-time Updates`);
  console.log(`   ✅ Execution Logs\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is busy. Try: PORT=18801 automation-dashboard`);
  }
  process.exit(1);
});
