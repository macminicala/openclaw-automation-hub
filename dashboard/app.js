/**
 * Automation Hub Dashboard - JavaScript
 */

// API Base URL
const API_URL = '/api';

// State
let automations = {};
let currentFilter = 'all';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAutomations();
  setupEventListeners();
  addLog('Dashboard loaded - Ready', 'info');
});

// Event Listeners
function setupEventListeners() {
  // Form submission
  document.getElementById('automation-form').addEventListener('submit', handleFormSubmit);
  
  // Filter tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      renderAutomations();
    });
  });
}

// API Functions
async function loadAutomations() {
  try {
    const response = await fetch(`${API_URL}/automations`);
    const data = await response.json();
    automations = data.automations || {};
    updateStats(data.stats);
    renderAutomations();
  } catch (error) {
    console.error('Failed to load automations:', error);
    addLog('Failed to load automations: ' + error.message, 'error');
    showToast('Failed to load automations', 'error');
  }
}

async function toggleAutomation(id, enabled) {
  const endpoint = enabled ? 'disable' : 'enable';
  try {
    await fetch(`${API_URL}/automations/${id}/${endpoint}`, { method: 'POST' });
    await loadAutomations();
    addLog(`${enabled ? 'Disabled' : 'Enabled'} automation: ${id}`, 'success');
    showToast(`${enabled ? 'Disabled' : 'Enabled'} successfully`, 'success');
  } catch (error) {
    console.error('Failed to toggle automation:', error);
    addLog(`Failed to toggle ${id}: ${error.message}`, 'error');
    showToast('Operation failed', 'error');
  }
}

async function deleteAutomation(id) {
  if (!confirm(`Delete "${id}"? This cannot be undone.`)) return;
  
  try {
    await fetch(`${API_URL}/automations/${id}`, { method: 'DELETE' });
    await loadAutomations();
    addLog(`Deleted automation: ${id}`, 'warning');
    showToast('Automation deleted', 'success');
  } catch (error) {
    console.error('Failed to delete automation:', error);
    addLog(`Failed to delete ${id}: ${error.message}`, 'error');
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
    addLog(`Created automation: ${automation.id}`, 'success');
    showToast('Automation saved!', 'success');
  } catch (error) {
    console.error('Failed to save automation:', error);
    addLog(`Failed to save ${automation.id}: ${error.message}`, 'error');
    showToast('Save failed', 'error');
  }
}

// Render Functions
function updateStats(stats) {
  document.getElementById('stat-total').textContent = stats.total || 0;
  document.getElementById('stat-enabled').textContent = stats.enabled || 0;
  document.getElementById('stat-disabled').textContent = stats.disabled || 0;
}

function renderAutomations() {
  const grid = document.getElementById('automations-grid');
  const emptyState = document.getElementById('empty-state');
  
  // Filter automations
  let filtered = Object.values(automations);
  if (currentFilter === 'enabled') {
    filtered = filtered.filter(a => a.enabled);
  } else if (currentFilter === 'disabled') {
    filtered = filtered.filter(a => !a.enabled);
  }
  
  // Show/hide empty state
  if (filtered.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  
  grid.style.display = 'grid';
  emptyState.style.display = 'none';
  
  // Render cards
  grid.innerHTML = filtered.map(automation => `
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
      <div class="card-details">
        <div class="card-detail">
          <span class="icon">⏰</span>
          <span>${escapeHtml(automation.trigger?.cron || '* * * * *')}</span>
        </div>
        <div class="card-detail">
          <span class="icon">💻</span>
          <span>${escapeHtml(automation.actions?.[0]?.command || 'No command')}</span>
        </div>
        ${automation.description ? `
        <div class="card-detail">
          <span class="icon">📝</span>
          <span>${escapeHtml(automation.description)}</span>
        </div>
        ` : ''}
      </div>
      <div class="card-actions">
        <button class="btn btn-secondary btn-small" onclick="toggleAutomation('${escapeHtml(automation.id)}', ${automation.enabled})">
          ${automation.enabled ? '⏸ Disable' : '▶ Enable'}
        </button>
        <button class="btn btn-secondary btn-small" onclick="editAutomation('${escapeHtml(automation.id)}')">
          ✏️ Edit
        </button>
        <button class="btn btn-danger btn-small" onclick="deleteAutomation('${escapeHtml(automation.id)}')">
          � Delete
        </button>
      </div>
    </div>
  `).join('');
}

// Form Handlers
function openModal(automationId = null) {
  const overlay = document.getElementById('modal-overlay');
  const modal = document.getElementById('modal');
  const title = document.getElementById('modal-title');
  const form = document.getElementById('automation-form');
  
  if (automationId && automations[automationId]) {
    const a = automations[automationId];
    title.textContent = 'Edit Automation';
    document.getElementById('edit-id').value = automationId;
    document.getElementById('name').value = a.name || automationId;
    document.getElementById('cron').value = a.trigger?.cron || '* * * * *';
    document.getElementById('command').value = a.actions?.[0]?.command || '';
    document.getElementById('notify-channel').value = a.actions?.find(a => a.type === 'notify')?.channel || '';
    document.getElementById('notify-message').value = a.actions?.find(a => a.type === 'notify')?.message || '';
  } else {
    title.textContent = 'New Automation';
    form.reset();
    document.getElementById('edit-id').value = '';
  }
  
  overlay.classList.add('active');
  modal.classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('modal').classList.remove('active');
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  const id = document.getElementById('edit-id').value || 
             document.getElementById('name').value.toLowerCase().replace(/\s+/g, '-');
  
  const automation = {
    id,
    name: document.getElementById('name').value,
    enabled: true,
    trigger: {
      type: 'schedule',
      cron: document.getElementById('cron').value
    },
    actions: []
  };
  
  // Add shell command
  const command = document.getElementById('command').value;
  if (command) {
    automation.actions.push({
      type: 'shell',
      command: command
    });
  }
  
  // Add notification
  const notifyChannel = document.getElementById('notify-channel').value;
  const notifyMessage = document.getElementById('notify-message').value;
  if (notifyChannel && notifyMessage) {
    automation.actions.push({
      type: 'notify',
      channel: notifyChannel,
      message: notifyMessage
    });
  }
  
  saveAutomation(automation);
  closeModal();
}

function editAutomation(id) {
  openModal(id);
}

// Utility Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

function addLog(message, type = 'info') {
  const logsList = document.getElementById('logs-list');
  const time = new Date().toLocaleTimeString();
  const logItem = document.createElement('div');
  logItem.className = `log-item log-${type}`;
  logItem.innerHTML = `[${time}] ${escapeHtml(message)}`;
  logsList.insertBefore(logItem, logsList.firstChild);
  
  // Keep only last 50 logs
  while (logsList.children.length > 50) {
    logsList.removeChild(logsList.lastChild);
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</span>
    <span>${escapeHtml(message)}</span>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function refreshLogs() {
  addLog('Logs refreshed', 'info');
}
