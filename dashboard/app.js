/**
 * Automation Hub Dashboard - Simplified JavaScript
 */

const API_URL = '/api';
let automations = {};

// Schedule presets with human-readable descriptions
const SCHEDULE_PRESETS = {
  'every-hour': { cron: '0 * * * *', desc: 'Runs at the start of every hour' },
  'every-day-9am': { cron: '0 9 * * *', desc: 'Runs every day at 9:00 AM' },
  'every-day-6pm': { cron: '0 18 * * *', desc: 'Runs every day at 6:00 PM' },
  'every-monday': { cron: '0 8 * * 1', desc: 'Runs every Monday at 8:00 AM' },
  'every-weekday': { cron: '0 9 * * 1-5', desc: 'Runs Monday-Friday at 9:00 AM' },
  'every-month': { cron: '0 9 1 * *', desc: 'Runs on the 1st of every month at 9:00 AM' }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAutomations();
  setupEventListeners();
  logActivity('Dashboard connected', 'info');
});

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
    logActivity(`Triggered: ${id}`, 'info');
    showToast('Automation executed!', 'success');
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
    logActivity(`Created: ${automation.name}`, 'success');
    showToast('Automation saved!', 'success');
  } catch (error) {
    showToast('Save failed: ' + error.message, 'error');
  }
}

// ============ RENDER FUNCTIONS ============

function updateStats(stats) {
  document.getElementById('stat-total').textContent = stats.total || 0;
  document.getElementById('stat-enabled').textContent = stats.enabled || 0;
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
  
  grid.innerHTML = list.map(automation => {
    const actionType = automation.actions?.[0]?.type || 'unknown';
    const actionDesc = getActionDescription(automation);
    
    return `
    <div class="automation-card">
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(automation.name)}</div>
          <div class="card-schedule">⏰ ${getScheduleDescription(automation.trigger?.cron)}</div>
        </div>
        <div class="card-status ${automation.enabled ? 'enabled' : 'disabled'}">
          <span class="status-dot"></span>
          ${automation.enabled ? 'Active' : 'Paused'}
        </div>
      </div>
      
      <div class="card-action">
        ${getActionIcon(actionType)} ${actionDesc}
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
  `}).join('');
}

function getActionDescription(automation) {
  const action = automation.actions?.[0];
  if (!action) return 'No action configured';
  
  switch (action.type) {
    case 'shell': return `Run: ${action.command || action.exec || 'command'}`;
    case 'notify': return `Notify: ${action.message || 'message'}`;
    case 'email': return `Email to: ${action.to || action.recipient || 'recipient'}`;
    case 'agent': return 'AI Agent task';
    default: return action.type;
  }
}

function getScheduleDescription(cron) {
  if (!cron) return 'No schedule';
  
  // Match common presets
  for (const [key, val] of Object.entries(SCHEDULE_PRESETS)) {
    if (val.cron === cron) return val.desc;
  }
  
  return `Cron: ${cron}`;
}

function getActionIcon(type) {
  const icons = {
    shell: '💻',
    notify: '📱',
    email: '📧',
    agent: '🤖',
    git: '🔀'
  };
  return icons[type] || '⚡';
}

// ============ EVENT LISTENERS ============

function setupEventListeners() {
  document.getElementById('automation-form').addEventListener('submit', handleFormSubmit);
}

// ============ FORM HANDLERS ============

function updateSchedulePreset() {
  const preset = document.getElementById('schedule-preset').value;
  const cronGroup = document.getElementById('cron-group');
  const helpText = document.getElementById('schedule-help');
  const cronInput = document.getElementById('cron');
  
  if (preset === 'custom') {
    cronGroup.style.display = 'block';
    helpText.textContent = 'Enter your custom schedule';
    cronInput.placeholder = '0 9 * * *';
  } else {
    cronGroup.style.display = 'none';
    cronInput.value = SCHEDULE_PRESETS[preset].cron;
    helpText.textContent = SCHEDULE_PRESETS[preset].desc;
  }
}

function showActionFields(type) {
  // Hide all action fields
  document.querySelectorAll('.action-field-group').forEach(el => {
    el.style.display = 'none';
  });
  
  // Show selected action fields
  const selected = document.getElementById(`action-${type}`);
  if (selected) {
    selected.style.display = 'block';
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('name').value.trim();
  const preset = document.getElementById('schedule-preset').value;
  const cron = preset === 'custom' 
    ? document.getElementById('cron').value 
    : SCHEDULE_PRESETS[preset].cron;
  const actionType = document.querySelector('input[name="action-type"]:checked').value;
  
  // Build automation object
  const automation = {
    id: document.getElementById('edit-id').value || generateId(name),
    name: name,
    enabled: true,
    trigger: {
      type: 'schedule',
      cron: cron
    },
    actions: []
  };
  
  // Add action based on type
  switch (actionType) {
    case 'command':
      const command = document.getElementById('command-input').value.trim();
      if (!command) {
        showToast('Please enter a command', 'error');
        return;
      }
      automation.actions.push({ type: 'shell', command: command });
      break;
      
    case 'notify':
      const message = document.getElementById('notify-message').value.trim();
      if (!message) {
        showToast('Please enter a message', 'error');
        return;
      }
      automation.actions.push({ type: 'notify', channel: 'telegram', message: message });
      break;
      
    case 'email':
      const to = document.getElementById('email-to').value.trim();
      const subject = document.getElementById('email-subject').value.trim();
      const body = document.getElementById('email-body').value.trim();
      
      if (!to || !subject || !body) {
        showToast('Please fill in all email fields', 'error');
        return;
      }
      automation.actions.push({ 
        type: 'email', 
        to: to, 
        subject: subject, 
        body: body 
      });
      break;
  }
  
  saveAutomation(automation);
  closeModal();
}

function generateId(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function editAutomation(id) {
  const a = automations[id];
  if (!a) return;
  
  const action = a.actions?.[0];
  
  document.getElementById('modal-title').textContent = 'Edit Automation';
  document.getElementById('edit-id').value = id;
  document.getElementById('name').value = a.name || id;
  
  // Set schedule preset
  let preset = 'custom';
  for (const [key, val] of Object.entries(SCHEDULE_PRESETS)) {
    if (val.cron === a.trigger?.cron) {
      preset = key;
      break;
    }
  }
  document.getElementById('schedule-preset').value = preset;
  document.getElementById('cron').value = a.trigger?.cron || '';
  updateSchedulePreset();
  
  // Set action type and fields
  if (action) {
    const radio = document.querySelector(`input[name="action-type"][value="${action.type === 'shell' ? 'command' : action.type}"]`);
    if (radio) {
      radio.checked = true;
      showActionFields(action.type === 'shell' ? 'command' : action.type);
    }
    
    // Fill action fields
    if (action.type === 'shell' || action.command) {
      document.getElementById('command-input').value = action.command || action.exec || '';
    } else if (action.type === 'notify') {
      document.getElementById('notify-message').value = action.message || '';
    } else if (action.type === 'email') {
      document.getElementById('email-to').value = action.to || '';
      document.getElementById('email-subject').value = action.subject || '';
      document.getElementById('email-body').value = action.body || '';
    }
  }
  
  openModal();
}

// ============ MODAL ============

function openNewAutomation() {
  document.getElementById('modal-title').textContent = 'Create Automation';
  document.getElementById('automation-form').reset();
  document.getElementById('edit-id').value = '';
  
  // Reset to defaults
  document.getElementById('schedule-preset').value = 'every-day-9am';
  updateSchedulePreset();
  
  // Reset action selection
  document.querySelector('input[name="action-type"][value="command"]').checked = true;
  showActionFields('command');
  
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('modal').classList.add('active');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  document.getElementById('modal').classList.remove('active');
}

// ============ UTILITY ============

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
