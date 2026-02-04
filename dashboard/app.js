/**
 * Automation Hub Dashboard v0.4 - JavaScript
 * Enhanced with Real-time Updates and Visual Workflow Builder
 */

const API_URL = '/api';
let automations = {};
let ws = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAutomations();
  initWebSocket();
  setupEventListeners();
  logActivity('Dashboard connected', 'info');
});

// ============ WEBSOCKET ============

function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('[Dashboard] WebSocket connected');
    reconnectAttempts = 0;
    document.getElementById('realtime-badge').innerHTML = '<span class="pulse"></span> Connected';
    document.getElementById('realtime-badge').style.display = 'flex';
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    } catch (e) {
      console.error('[Dashboard] WS message error:', e);
    }
  };
  
  ws.onclose = () => {
    console.log('[Dashboard] WebSocket disconnected');
    document.getElementById('realtime-badge').innerHTML = '<span class="pulse" style="background:var(--warning)"></span> Reconnecting...';
    attemptReconnect();
  };
  
  ws.onerror = (error) => {
    console.error('[Dashboard] WebSocket error:', error);
  };
}

function handleWebSocketMessage(data) {
  switch (data.type) {
    case 'heartbeat':
      // Connection alive
      break;
    case 'updated':
      loadAutomations();
      logActivity(`Automations updated (${data.count} total)`, 'info');
      break;
    case 'executed':
      logActivity(`Automation "${data.id}" executed`, 'success');
      loadAutomations();
      showToast('Automation executed!', 'success');
      break;
    case 'error':
      logActivity(`Error: ${data.message}`, 'error');
      showToast(data.message, 'error');
      break;
  }
}

function attemptReconnect() {
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    reconnectAttempts++;
    setTimeout(initWebSocket, 2000 * reconnectAttempts);
  } else {
    document.getElementById('realtime-badge').innerHTML = '<span class="pulse" style="background:var(--error)"></span> Offline';
    logActivity('Real-time connection lost', 'warning');
  }
}

function sendWSMessage(data) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

// ============ API FUNCTIONS ============

async function loadAutomations() {
  try {
    const response = await fetch(`${API_URL}/automations`);
    const data = await response.json();
    automations = data.automations || {};
    updateStats(data.stats);
    renderAutomations();
  } catch (error) {
    console.error('Failed to load automations:', error);
    logActivity('Failed to load automations: ' + error.message, 'error');
  }
}

async function toggleAutomation(id, enabled) {
  const endpoint = enabled ? 'disable' : 'enable';
  try {
    await fetch(`${API_URL}/automations/${id}/${endpoint}`, { method: 'POST' });
    await loadAutomations();
    logActivity(`${enabled ? 'Disabled' : 'Enabled'}: ${id}`, 'success');
    showToast(`${enabled ? 'Disabled' : 'Enabled'} successfully`, 'success');
  } catch (error) {
    showToast('Operation failed', 'error');
  }
}

async function runAutomation(id) {
  try {
    await fetch(`${API_URL}/automations/${id}/run`, { method: 'POST' });
    sendWSMessage({ type: 'run', id });
    logActivity(`Triggered: ${id}`, 'info');
  } catch (error) {
    showToast('Run failed', 'error');
  }
}

async function deleteAutomation(id) {
  if (!confirm(`Delete "${id}"? This cannot be undone.`)) return;
  
  try {
    await fetch(`${API_URL}/automations/${id}`, { method: 'DELETE' });
    await loadAutomations();
    logActivity(`Deleted: ${id}`, 'warning');
    showToast('Automation deleted', 'success');
  } catch (error) {
    showToast('Delete failed', 'error');
  }
}

async function saveAutomation(automation) {
  try {
    await fetch(`${API_URL}/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(automation)
    });
    await loadAutomations();
    logActivity(`Created: ${automation.name || automation.id}`, 'success');
    showToast('Automation saved!', 'success');
  } catch (error) {
    showToast('Save failed: ' + error.message, 'error');
  }
}

async function refreshLogs() {
  try {
    const response = await fetch(`${API_URL}/logs`);
    const logs = await response.json();
    renderLogs(logs);
    logActivity('Logs refreshed', 'info');
  } catch (error) {
    showToast('Failed to load logs', 'error');
  }
}

// ============ RENDER FUNCTIONS ============

function updateStats(stats) {
  document.getElementById('stat-total').textContent = stats.total || 0;
  document.getElementById('stat-enabled').textContent = stats.enabled || 0;
  document.getElementById('stat-disabled').textContent = stats.disabled || 0;
  document.getElementById('stat-schedule').textContent = stats.byTrigger?.schedule || 0;
  document.getElementById('stat-webhook').textContent = stats.byTrigger?.webhook || 0;
  document.getElementById('stat-event').textContent = 
    (stats.byTrigger?.email || 0) + (stats.byTrigger?.calendar || 0) + (stats.byTrigger?.system || 0);
}

function renderAutomations() {
  const grid = document.getElementById('automations-grid');
  const emptyState = document.getElementById('empty-state');
  
  const list = Object.values(automations);
  
  if (list.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  grid.style.display = 'grid';
  emptyState.style.display = 'none';
  
  grid.innerHTML = list.map(automation => `
    <div class="automation-card" onclick="event.stopPropagation()">
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(automation.name || automation.id)}</div>
          <div class="card-status ${automation.enabled ? 'enabled' : 'disabled'}">
            <span class="status-dot"></span>
            ${automation.enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>
      
      <div class="card-trigger trigger-${automation.trigger?.type || 'schedule'}">
        ${getTriggerIcon(automation.trigger?.type)} ${getTriggerName(automation.trigger?.type)}
        ${automation.trigger?.cron ? `· ${automation.trigger.cron}` : ''}
        ${automation.trigger?.port ? `· :${automation.trigger.port}` : ''}
      </div>
      
      <div class="card-actions-list">
        ${(automation.actions || []).map(a => `
          <span class="action-badge">${getActionIcon(a.type)} ${a.type}</span>
        `).join('')}
      </div>
      
      <div class="card-actions">
        <button class="btn btn-secondary btn-small" onclick="toggleAutomation('${escapeHtml(automation.id)}', ${automation.enabled})">
          ${automation.enabled ? '⏸ Pause' : '▶ Start'}
        </button>
        <button class="btn btn-secondary btn-small" onclick="runAutomation('${escapeHtml(automation.id)}')">
          ⚡ Run
        </button>
        <button class="btn btn-secondary btn-small" onclick="editAutomation('${escapeHtml(automation.id)}')">
          ✏️ Edit
        </button>
        <button class="btn btn-danger btn-small" onclick="deleteAutomation('${escapeHtml(automation.id)}')">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
}

function renderLogs(logs) {
  const list = document.getElementById('logs-list');
  
  if (logs.length === 0) {
    list.innerHTML = '<div class="log-item log-info">No execution logs yet</div>';
    return;
  }
  
  list.innerHTML = logs.map(log => {
    const type = log.result?.success ? 'success' : 'error';
    const time = new Date(log.timestamp).toLocaleString();
    return `
      <div class="log-item log-${type}">
        <span>${escapeHtml(log.automationId || 'unknown')}</span>
        <span>${time}</span>
      </div>
    `;
  }).join('');
}

// ============ EVENT LISTENERS ============

function setupEventListeners() {
  document.getElementById('automation-form').addEventListener('submit', handleFormSubmit);
  
  // Workflow builder drag and drop
  setupDragAndDrop();
}

// ============ FORM HANDLERS ============

function updateTriggerFields() {
  const type = document.getElementById('trigger-type').value;
  document.querySelectorAll('.trigger-config').forEach(el => {
    el.style.display = 'none';
  });
  document.querySelector(`.trigger-config[data-trigger="${type}"]`).style.display = 'block';
}

function addAction() {
  const list = document.getElementById('actions-list');
  const div = document.createElement('div');
  div.className = 'action-item';
  div.innerHTML = `
    <select class="action-type">
      <option value="shell">💻 Shell Command</option>
      <option value="agent">🤖 AI Agent</option>
      <option value="git">🔀 Git</option>
      <option value="notify">📱 Notify</option>
      <option value="email_reply">📧 Email Reply</option>
    </select>
    <input type="text" class="action-value" placeholder="Enter command or message">
    <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>
  `;
  list.appendChild(div);
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  const triggerType = document.getElementById('trigger-type').value;
  const automation = {
    id: document.getElementById('edit-id').value || 
        document.getElementById('name').value.toLowerCase().replace(/\s+/g, '-'),
    name: document.getElementById('name').value,
    enabled: true,
    trigger: { type: triggerType },
    actions: []
  };
  
  // Build trigger config
  switch (triggerType) {
    case 'schedule':
      automation.trigger.cron = document.getElementById('cron').value;
      break;
    case 'webhook':
      automation.trigger.port = parseInt(document.getElementById('webhook-port').value);
      automation.trigger.endpoint = document.getElementById('webhook-endpoint').value;
      break;
    case 'file_change':
      automation.trigger.path = document.getElementById('watch-path').value;
      automation.trigger.events = [
        document.getElementById('event-modify').checked ? 'modify' : null,
        document.getElementById('event-add').checked ? 'add' : null,
        document.getElementById('event-delete').checked ? 'delete' : null
      ].filter(Boolean);
      break;
    case 'email':
      automation.trigger.host = document.getElementById('email-host').value;
      automation.trigger.user = document.getElementById('email-user').value;
      automation.trigger.interval = parseInt(document.getElementById('email-interval').value);
      break;
    case 'calendar':
      automation.trigger.provider = document.getElementById('calendar-provider').value;
      automation.trigger.interval = parseInt(document.getElementById('calendar-interval').value);
      break;
    case 'system':
      automation.trigger.cpuThreshold = parseInt(document.getElementById('sys-cpu').value);
      automation.trigger.memoryThreshold = parseInt(document.getElementById('sys-mem').value);
      automation.trigger.diskThreshold = parseInt(document.getElementById('sys-disk').value);
      break;
  }
  
  // Build actions
  document.querySelectorAll('.action-item').forEach(item => {
    const type = item.querySelector('.action-type').value;
    const value = item.querySelector('.action-value').value;
    
    if (type === 'shell') {
      automation.actions.push({ type: 'shell', command: value });
    } else if (type === 'agent') {
      automation.actions.push({ type: 'agent', prompt: value, model: 'claude-opus-4-5' });
    } else if (type === 'git') {
      automation.actions.push({ type: 'git', add: true, commit: 'Auto-commit: ${timestamp}', push: true });
    } else if (type === 'notify') {
      automation.actions.push({ type: 'notify', channel: 'telegram', message: value });
    } else if (type === 'email_reply') {
      automation.actions.push({ type: 'email_reply', subject: 'Re: ' + value, body: value });
    }
  });
  
  saveAutomation(automation);
  closeModal();
}

function editAutomation(id) {
  const a = automations[id];
  if (!a) return;
  
  document.getElementById('modal-title').textContent = 'Edit Automation';
  document.getElementById('edit-id').value = id;
  document.getElementById('name').value = a.name || id;
  document.getElementById('trigger-type').value = a.trigger?.type || 'schedule';
  
  // Show correct trigger fields
  updateTriggerFields();
  
  // Populate trigger fields
  const t = a.trigger;
  if (t) {
    if (t.cron) document.getElementById('cron').value = t.cron;
    if (t.port) document.getElementById('webhook-port').value = t.port;
    if (t.endpoint) document.getElementById('webhook-endpoint').value = t.endpoint;
    if (t.path) document.getElementById('watch-path').value = t.path;
    if (t.host) document.getElementById('email-host').value = t.host;
    if (t.user) document.getElementById('email-user').value = t.user;
  }
  
  // Clear and populate actions
  const list = document.getElementById('actions-list');
  list.innerHTML = '';
  if (a.actions && a.actions.length > 0) {
    a.actions.forEach(action => {
      const div = document.createElement('div');
      div.className = 'action-item';
      let value = '';
      if (action.command) value = action.command;
      else if (action.prompt) value = action.prompt;
      else if (action.message) value = action.message;
      
      div.innerHTML = `
        <select class="action-type">
          <option value="shell" ${action.type === 'shell' ? 'selected' : ''}>💻 Shell Command</option>
          <option value="agent" ${action.type === 'agent' ? 'selected' : ''}>🤖 AI Agent</option>
          <option value="git" ${action.type === 'git' ? 'selected' : ''}>🔀 Git</option>
          <option value="notify" ${action.type === 'notify' ? 'selected' : ''}>📱 Notify</option>
          <option value="email_reply" ${action.type === 'email_reply' ? 'selected' : ''}>📧 Email Reply</option>
        </select>
        <input type="text" class="action-value" value="${escapeHtml(value)}">
        <button type="button" class="btn-remove" onclick="this.parentElement.remove()">×</button>
      `;
      list.appendChild(div);
    });
  } else {
    addAction();
  }
  
  openModal();
}

// ============ MODAL ============

function openModal() {
  document.getElementById('modal-title').textContent = 'New Automation';
  document.getElementById('automation-form').reset();
  document.getElementById('edit-id').value = '';
  document.getElementById('trigger-type').value = 'schedule';
  updateTriggerFields();
  document.getElementById('actions-list').innerHTML = '';
  addAction();
  
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('modal').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('modal').classList.remove('active');
}

// ============ TABS ============

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  
  document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
  
  if (tab === 'logs') {
    refreshLogs();
  }
}

// ============ WORKFLOW BUILDER ============

function openWorkflowBuilder() {
  switchTab('builder');
}

function setupDragAndDrop() {
  document.querySelectorAll('.palette-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('type', e.target.dataset.trigger || e.target.dataset.condition || e.target.dataset.action);
      e.dataTransfer.setData('category', e.target.parentElement.previousElementSibling?.textContent?.trim() || 'Item');
    });
  });
}

// ============ UTILITY ============

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function getTriggerIcon(type) {
  const icons = {
    schedule: '⏰',
    webhook: '🔗',
    file_change: '📁',
    email: '📧',
    calendar: '📅',
    system: '🖥️'
  };
  return icons[type] || '⚡';
}

function getTriggerName(type) {
  const names = {
    schedule: 'Schedule',
    webhook: 'Webhook',
    file_change: 'File Watch',
    email: 'Email',
    calendar: 'Calendar',
    system: 'System'
  };
  return names[type] || type;
}

function getActionIcon(type) {
  const icons = {
    shell: '💻',
    agent: '🤖',
    git: '🔀',
    notify: '📱',
    email_reply: '📧',
    webhook_out: '🌐'
  };
  return icons[type] || '🎯';
}

function logActivity(message, type = 'info') {
  const feed = document.getElementById('activity-feed');
  const time = new Date().toLocaleTimeString();
  const item = document.createElement('div');
  item.className = `log-item log-${type}`;
  item.innerHTML = `<span>${escapeHtml(message)}</span><span>${time}</span>`;
  feed.insertBefore(item, feed.firstChild);
  
  while (feed.children.length > 20) {
    feed.removeChild(feed.lastChild);
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
