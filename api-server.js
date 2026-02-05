/**
 * Automation Hub - API Server
 * Simple REST API for the Next.js Dashboard
 * Runs on port 18799
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const PORT = 18799;
const STORAGE_PATH = path.join(require('os').homedir(), '.openclaw/automations');

// CORS headers
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Parse URL
function parseUrl(req) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  return { pathname: url.pathname, search: url.search };
}

// Load automations
function loadAutomations() {
  const automations = {};
  if (!fs.existsSync(STORAGE_PATH)) {
    fs.mkdirSync(STORAGE_PATH, { recursive: true });
    return {};
  }
  fs.readdirSync(STORAGE_PATH).filter(f => f.endsWith('.json')).forEach(file => {
    try {
      const id = file.replace('.json', '');
      automations[id] = JSON.parse(fs.readFileSync(path.join(STORAGE_PATH, file), 'utf8'));
    } catch (e) {}
  });
  return automations;
}

// Save automation
function saveAutomation(automation) {
  const file = path.join(STORAGE_PATH, `${automation.id}.json`);
  fs.writeFileSync(file, JSON.stringify(automation, null, 2));
}

// Delete automation
function deleteAutomation(id) {
  const file = path.join(STORAGE_PATH, `${id}.json`);
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    return true;
  }
  return false;
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  setCors(res);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const { pathname } = parseUrl(req);

  try {
    // GET /api/automations - List all
    if (req.method === 'GET' && pathname === '/api/automations') {
      const automations = loadAutomations();
      const list = Object.values(automations);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ automations, stats: {
        total: list.length,
        enabled: list.filter(a => a.enabled).length
      }}));
      return;
    }

    // GET /api/automations/:id - Get one
    if (req.method === 'GET' && pathname.startsWith('/api/automations/')) {
      const id = pathname.split('/').pop();
      const automations = loadAutomations();
      if (automations[id]) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(automations[id]));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      return;
    }

    // POST /api/automations - Create/Update
    if (req.method === 'POST' && pathname === '/api/automations') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        try {
          const automation = JSON.parse(body);
          saveAutomation(automation);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (e) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }

    // POST /api/automations/:id/enable
    if (req.method === 'POST' && pathname.includes('/enable')) {
      const id = pathname.split('/')[3];
      const automations = loadAutomations();
      if (automations[id]) {
        automations[id].enabled = true;
        saveAutomation(automations[id]);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      return;
    }

    // POST /api/automations/:id/disable
    if (req.method === 'POST' && pathname.includes('/disable')) {
      const id = pathname.split('/')[3];
      const automations = loadAutomations();
      if (automations[id]) {
        automations[id].enabled = false;
        saveAutomation(automations[id]);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      return;
    }

    // POST /api/automations/:id/run
    if (req.method === 'POST' && pathname.includes('/run')) {
      const id = pathname.split('/')[3];
      const automations = loadAutomations();
      if (automations[id]) {
        console.log(`[API] Run requested for: ${id}`);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, message: 'Automation triggered' }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      return;
    }

    // DELETE /api/automations/:id
    if (req.method === 'DELETE' && pathname.startsWith('/api/automations/')) {
      const id = pathname.split('/').pop();
      if (deleteAutomation(id)) {
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      return;
    }

    // Health check
    if (pathname === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));

  } catch (err) {
    console.error('[API Error]', err);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Automation Hub API running on http://localhost:${PORT}`);
  console.log(`   Endpoints:`);
  console.log(`   GET    /api/automations       - List all`);
  console.log(`   POST   /api/automations       - Create/Update`);
  console.log(`   DELETE /api/automations/:id   - Delete`);
  console.log(`   POST   /api/automations/:id/enable`);
  console.log(`   POST   /api/automations/:id/disable`);
  console.log(`   POST   /api/automations/:id/run`);
  console.log(`   GET    /health                - Health check`);
});
