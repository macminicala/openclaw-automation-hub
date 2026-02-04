/**
 * Automation Hub Dashboard - Simplified JavaScript
 */

const API_URL = '/api';
let automations = {};
let pendingDeleteId = null;

// Schedule presets with human-readable descriptions
const SCHEDULE_PRESETS = {
  'every-hour': { cron: '0 * * * *', desc: 'Runs at the start of every hour (minute 0)' },
  'every-day-9am': { cron: '0 9 * * *', desc: 'Runs every day at 9:00 AM' },
  'every-day-6pm': { cron: '0 18 * * *', desc: 'Runs every day at 6:00 PM' },
  'every-monday': { cron: '0 8 * * 1', desc: 'Runs every Monday at 8:00 AM' },
  'every-weekday': { cron: '0 9 * * 1-5', desc: 'Runs Monday through Friday at 9:00 AM' },
  'every-month': { cron: '0 9 1 * *', desc: 'Runs on the 1st day of every month at 9:00 AM' }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAutomations();
  setupEventListeners();
  logActivity('Ready! Create your first automation.', 'info');
});

// ============ API FUNCTIONS ============

async function loadAutomations() {
  document.getElementById('loading-indicator').style.display = 'flex';
  document.getElementById('automations-grid').style.display = 'none';
  document.getElementById('empty-state').style.display = 'none';
  
  try {
    const response = await fetch(`${API_URL}/automations`);
    const data = await response.json();
    automations = data.automations || {};
    updateStats(data.stats);
    renderAutomations();
    document.getElementById('loading-indicator').style.display = 'none';
    if (Object.keys(automations).length > 0) {
      document.getElementById('automations-grid').style.display = 'grid';
    } else {
      document.getElementById('empty-state').style.display = 'block';
    }
  } catch (error) {
    console.error('Failed to load automations:', error);
    document.getElementById('loading-indicator').style.display = 'none';
    logActivity('Could not load your automations. Please refresh the page.', 'error');
    showToast('Could not load automations. Please try refreshing the page.', 'error');
    document.getElementById('empty-state').style.display = 'block';
  }
}

async function toggleAutomation(id, enabled) {
  const automationName = automations[id]?.name || id;
  const btn = event?.target;
  if (btn) btn.classList.add('btn-loading');
  
  const endpoint = enabled ? 'enable' : 'disable';
  try {
    await fetch(`${API_URL}/automations/${id}/${endpoint}`, { method: 'POST' });
    await loadAutomations();
    logActivity(`${enabled ? 'Disabled' : 'Enabled'} "${automationName}"`, 'success');
    showToast(`${enabled ? 'Disabled' : 'Enabled'} successfully`, 'success');
  } catch (error) {
    showToast('Could not complete the action. Please try again.', 'error');
  } finally {
    if (btn) btn.classList.remove('btn-loading');
  }
}

async function runAutomation(id) {
  const automationName = automations[id]?.name || id;
  const btn = event?.target;
  if (btn) {
    btn.classList.add('btn-loading');
    btn.textContent = 'Running...';
  }
  
  try {
    await fetch(`${API_URL}/automations/${id}/run`, { method: 'POST' });
    logActivity(`Started running "${automationName}"`, 'info');
    showToast('Automation is now running!', 'success');
  } catch (error) {
    showToast('Could not run the automation. Please try again.', 'error');
  } finally {
    if (btn) {
      btn.classList.remove('btn-loading');
      btn.textContent = '▶ Run Now';
    }
  }
}

function confirmDelete(id) {
  const automationName = automations[id]?.name || id;
  pendingDeleteId = id;
  document.getElementById('delete-message').textContent = `Are you sure you want to delete "${automationName}"? This action cannot be undone.`;
  document.getElementById('delete-modal-overlay').classList.add('active');
  document.getElementById('delete-modal').classList.add('active');
}

function closeDeleteModal() {
  document.getElementById('delete-modal-overlay').classList.remove('active');
  document.getElementById('delete-modal').classList.remove('active');
  pendingDeleteId = null;
}

async function executeDelete() {
  if (!pendingDeleteId) return;
  
  const btn = document.getElementById('confirm-delete-btn');
  btn.classList.add('btn-loading');
  btn.textContent = 'Deleting...';
  
  try {
    await fetch(`${API_URL}/automations/${pendingDeleteId}`, { method: 'DELETE' });
    await loadAutomations();
    logActivity(`Deleted "${automations[pendingDeleteId]?.name || pendingDeleteId}"`, 'warning');
    showToast('Automation deleted successfully', 'success');
  } catch (error) {
    showToast('Could not delete the automation. Please try again.', 'error');
  } finally {
    btn.classList.remove('btn-loading');
    btn.textContent = 'Delete';
    closeDeleteModal();
  }
}

async function saveAutomation(automation) {
  const btn = document.querySelector('#automation-form button[type="submit"]');
  btn.classList.add('btn-loading');
  btn.textContent = 'Saving...';
  
  try {
    await fetch(`${API_URL}/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(automation)
    });
    await loadAutomations();
    logActivity(`Created new automation "${automation.name}"`, 'success');
    showToast('Automation saved successfully!', 'success');
  } catch (error) {
    showToast('Could not save the automation. Please check your inputs and try again.', 'error');
  } finally {
    btn.classList.remove('btn-loading');
    btn.textContent = '✓ Save Automation';
  }
}

// ============ RENDER FUNCTIONS ============

function updateStats(stats) {
  document.getElementById('stat-total').textContent = stats.total || 0;
  document.getElementById('stat-enabled').textContent = stats.enabled || 0;
}

function renderAutomations(filterText = '') {
  const grid = document.getElementById('automations-grid');
  const emptyState = document.getElementById('empty-state');
  const filter = filterText.toLowerCase();
  
  let list = Object.values(automations);
  
  if (filter) {
    list = list.filter(a => (a.name || '').toLowerCase().includes(filter));
  }
  
  if (list.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'block';
    if (filter) {
      emptyState.querySelector('h3').textContent = 'No matching automations';
      emptyState.querySelector('p').textContent = 'Try a different search term';
    } else {
      emptyState.querySelector('h3').textContent = 'No automations yet';
      emptyState.querySelector('p').textContent = 'Create your first automation to get started';
    }
    return;
  }
  
  grid.style.display = 'grid';
  emptyState.style.display = 'none';
  
  const editId = document.getElementById('edit-id').value;
  
  grid.innerHTML = list.map(automation => {
    const actionType = automation.actions?.[0]?.type || 'unknown';
    const actionDesc = getActionDescription(automation);
    const lastRun = automation.lastRun ? formatRelativeTime(automation.lastRun) : 'Never run';
    const isEditing = automation.id === editId;
    
    return `
    <div class="automation-card ${isEditing ? 'editing' : ''}">
      ${isEditing ? '<div class="editing-indicator">Editing</div>' : ''}
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(automation.name)}</div>
          <div class="card-schedule">⏰ ${getScheduleDescription(automation.trigger?.cron)}</div>
          <div class="card-last-run">Last run: ${lastRun}</div>
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
          ${automation.enabled ? '⏸ Disable' : '▶ Enable'}
        </button>
        <button class="btn btn-secondary btn-small" onclick="runAutomation('${escapeHtml(automation.id)}')">
          ▶ Run Now
        </button>
        <button class="btn btn-secondary btn-small" onclick="editAutomation('${escapeHtml(automation.id)}')">
          ✏️ Edit
        </button>
        <button class="btn btn-danger btn-small" onclick="confirmDelete('${escapeHtml(automation.id)}')">
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
    case 'shell': 
      const cmd = action.command || action.exec || 'command';
      return `Runs: ${truncate(cmd, 30)}`;
    case 'notify': 
      const msg = action.message || 'message';
      return `Sends notification: ${truncate(msg, 30)}`;
    case 'email': 
      const to = action.to || action.recipient || 'recipient';
      return `Sends email to: ${truncate(to, 30)}`;
    case 'agent': return 'Runs AI Agent task';
    default: return 'Custom action: ' + action.type;
  }
}

function truncate(text, length) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

function getScheduleDescription(cron) {
  if (!cron) return 'No schedule set';
  
  // Match common presets
  for (const [key, val] of Object.entries(SCHEDULE_PRESETS)) {
    if (val.cron === cron) return val.desc;
  }
  
  return 'Custom schedule';
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

function formatRelativeTime(dateString) {
  if (!dateString) return 'Never';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}

// ============ SEARCH ============

function filterAutomations() {
  const filterText = document.getElementById('search-input').value;
  renderAutomations(filterText);
}

// ============ EVENT LISTENERS ============

function setupEventListeners() {
  document.getElementById('automation-form').addEventListener('submit', handleFormSubmit);
  document.getElementById('confirm-delete-btn').addEventListener('click', executeDelete);
}

// ============ FORM HANDLERS ============

function updateSchedulePreset() {
  const preset = document.getElementById('schedule-preset').value;
  const scheduleGroup = document.getElementById('schedule-group');
  const helpText = document.getElementById('schedule-help');
  const scheduleInput = document.getElementById('schedule');
  
  if (preset === 'custom') {
    scheduleGroup.style.display = 'block';
    helpText.textContent = 'Enter your custom schedule';
    scheduleInput.placeholder = '0 9 * * *';
  } else {
    scheduleGroup.style.display = 'none';
    scheduleInput.value = SCHEDULE_PRESETS[preset].cron;
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
    ? document.getElementById('schedule').value 
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
        showToast('Enter the command you want to run', 'error');
        return;
      }
      automation.actions.push({ type: 'shell', command: command });
      break;
      
    case 'notify':
      const message = document.getElementById('notify-message').value.trim();
      if (!message) {
        showToast('Enter the notification message', 'error');
        return;
      }
      automation.actions.push({ type: 'notify', channel: 'telegram', message: message });
      break;
      
    case 'email':
      const to = document.getElementById('email-to').value.trim();
      const subject = document.getElementById('email-subject').value.trim();
      const body = document.getElementById('email-body').value.trim();
      
      if (!to || !subject || !body) {
        showToast('Fill in all email fields (recipient, subject, and message)', 'error');
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
  
  document.getElementById('modal-title').textContent = `Edit: ${a.name}`;
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
  document.getElementById('schedule').value = a.trigger?.cron || '';
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
  document.getElementById('modal-title').textContent = 'Create New Automation';
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
  document.getElementById('edit-id').value = '';
  renderAutomations();
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
  const time = formatRelativeTime(new Date());
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
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  
  // Success animation
  if (type === 'success') {
    toast.style.animation = 'successPop 0.4s ease';
  }
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
