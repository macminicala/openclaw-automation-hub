#!/usr/bin/env node
/**
 * Automation Hub Dashboard Server
 * Lightweight HTTP server for the dashboard UI
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.DASHBOARD_PORT || 18795;
const STORAGE_PATH = '~/.openclaw/automations';
const DASHBOARD_DIR = path.join(__dirname, 'dashboard');

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

// Helper: Get automations directory
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

// Helper: Load all automations
function loadAutomations() {
  const dir = getAutomationsDir();
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const automations = {};
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf8');
      automations[file.replace('.json', '')] = JSON.parse(content);
    } catch (e) {
      console.error(`Error loading ${file}: ${e.message}`);
    }
  }
  return automations;
}

// Helper: Save automation
function saveAutomation(id, data) {
  const dir = getAutomationsDir();
  const filePath = path.join(dir, `${id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return data;
}

// Helper: Delete automation
function deleteAutomation(id) {
  const dir = getAutomationsDir();
  const filePath = path.join(dir, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

// Helper: Calculate stats
function calculateStats(automations) {
  const all = Object.values(automations);
  return {
    total: all.length,
    enabled: all.filter(a => a.enabled).length,
    disabled: all.filter(a => !a.enabled).length
  };
}

// Request handler
function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // API Routes
  if (pathname.startsWith('/api/')) {
    const apiPath = pathname.replace('/api/', '');
    
    // GET /api/automations
    if (req.method === 'GET' && apiPath === 'automations') {
      const automations = loadAutomations();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ automations, stats: calculateStats(automations) }));
      return;
    }
    
    // POST /api/automations
    if (req.method === 'POST' && apiPath === 'automations') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          saveAutomation(data.id || data.name.toLowerCase().replace(/\s+/g, '-'), data);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, id: data.id }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      return;
    }
    
    // DELETE /api/automations/:id
    if (req.method === 'DELETE' && apiPath.startsWith('automations/')) {
      const id = apiPath.split('/')[1];
      const success = deleteAutomation(id);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success }));
      return;
    }
    
    // POST /api/automations/:id/enable
    if (req.method === 'POST' && apiPath.match(/automations\/.+\/enable$/)) {
      const id = apiPath.split('/')[1];
      const automations = loadAutomations();
      if (automations[id]) {
        automations[id].enabled = true;
        saveAutomation(id, automations[id]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      return;
    }
    
    // POST /api/automations/:id/disable
    if (req.method === 'POST' && apiPath.match(/automations\/.+\/disable$/)) {
      const id = apiPath.split('/')[1];
      const automations = loadAutomations();
      if (automations[id]) {
        automations[id].enabled = false;
        saveAutomation(id, automations[id]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      return;
    }
    
    // POST /api/automations/:id/run
    if (req.method === 'POST' && apiPath.match(/automations\/.+\/run$/)) {
      const id = apiPath.split('/')[1];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        message: `Triggered ${id}. Check CLI for execution details.`,
        note: 'Full execution requires the automation-hub CLI'
      }));
      return;
    }
    
    // GET /api/stats
    if (req.method === 'GET' && apiPath === 'stats') {
      const automations = loadAutomations();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(calculateStats(automations)));
      return;
    }
    
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'API not found' }));
    return;
  }
  
  // Serve dashboard files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.join(DASHBOARD_DIR, filePath);
  const ext = path.extname(fullPath);
  
  // Security: prevent directory traversal
  if (!fullPath.startsWith(DASHBOARD_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'text/plain' });
    res.end(fs.readFileSync(fullPath));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
}

// Start server
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`\n⚡ Automation Hub Dashboard`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   http://127.0.0.1:${PORT}\n`);
  console.log('Press Ctrl+C to stop\n');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is busy. Try: PORT=18796 automation-dashboard`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});
