const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { WebSocketServer } = require('ws');

const SCRIPT_DIR = __dirname;
const PORT = process.env.DASHBOARD_PORT || 18799;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const STORAGE_PATH = path.join(require('os').homedir(), '.openclaw/automations');
const LOGS_PATH = path.join(require('os').homedir(), '.openclaw/logs/automation');
[STORAGE_PATH, LOGS_PATH].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function loadAutomations() {
  const automations = {};
  fs.readdirSync(STORAGE_PATH).filter(f => f.endsWith('.json')).forEach(file => {
    try {
      automations[file.replace('.json', '')] = JSON.parse(fs.readFileSync(path.join(STORAGE_PATH, file), 'utf8'));
    } catch (e) {}
  });
  return automations;
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

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const pathname = url.parse(req.url).pathname;
  
  if (pathname.startsWith('/api/')) {
    const apiPath = pathname.replace('/api/', '');
    
    if (req.method === 'GET' && apiPath === 'automations') {
      const automations = loadAutomations();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ automations, stats: calculateStats(automations) }));
      return;
    }
    
    if (req.method === 'GET' && apiPath === 'stats') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(calculateStats(loadAutomations())));
      return;
    }
    
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'API not found' }));
    return;
  }
  
  let filePath = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.join(SCRIPT_DIR, filePath);
  
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const ext = path.extname(fullPath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    res.end(fs.readFileSync(fullPath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('[Dashboard] Client connected');
  
  const heartbeat = setInterval(() => {
    ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
  }, 30000);
  
  ws.on('close', () => {
    clearInterval(heartbeat);
    console.log('[Dashboard] Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Automation Hub Dashboard`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log('');
});
