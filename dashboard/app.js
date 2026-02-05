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

// Current workflow state
let workflowState = {
  trigger: null,
  condition: null,
  action: null,
  activeStep: null
};

// Tab switching
function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  const tab = document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`);
  const content = document.getElementById(`tab-${tabName}`);
  
  if (tab) tab.classList.add('active');
  if (content) content.classList.add('active');
}

// Configure step - click on node to configure
function configureStep(step) {
  // Remove active state from all nodes
  document.querySelectorAll('.flow-node').forEach(node => {
    node.classList.remove('active', 'flow-trigger-active', 'flow-condition-active', 'flow-action-active');
  });
  
  // Set active state for clicked node
  const node = document.getElementById(`node-${step}`);
  if (node) {
    node.classList.add('active', `flow-${step}-active`);
  }
  
  workflowState.activeStep = step;
  
  // Show appropriate config section
  document.querySelectorAll('.config-section').forEach(section => {
    section.style.display = 'none';
  });
  
  const configSection = document.getElementById(`config-${step}`);
  if (configSection) {
    configSection.style.display = 'block';
  }
  
  updatePreview();
}

// Select trigger type
function selectTrigger(triggerType) {
  workflowState.trigger = triggerType;
  
  // Update node display
  const node = document.getElementById('node-trigger');
  const value = document.getElementById('trigger-value');
  const icon = document.getElementById('trigger-icon');
  
  const triggerLabels = {
    schedule: '⏰ Schedule',
    webhook: '🔗 Webhook',
    file_change: '📁 File Watch',
    email: '📧 Email',
    calendar: '📅 Calendar',
    system: '🖥️ System'
  };
  
  value.textContent = triggerLabels[triggerType] || triggerType;
  node.classList.add('configured');
  
  // Highlight selected option
  document.querySelectorAll('[data-trigger]').forEach(btn => {
    btn.classList.remove('selected');
  });
  document.querySelector(`[data-trigger="${triggerType}"]`)?.classList.add('selected');
  
  // Show trigger-specific settings
  document.querySelectorAll('.trigger-config').forEach(config => {
    config.style.display = 'none';
  });
  document.querySelector(`.trigger-config[data-trigger="${triggerType}"]`)?.style.setProperty('display', 'block', 'important');
  
  updatePreview();
}

// Select action type
function selectAction(actionType) {
  workflowState.action = actionType;
  
  // Update node display
  const node = document.getElementById('node-action');
  const value = document.getElementById('action-value');
  const icon = document.getElementById('action-icon');
  
  const actionLabels = {
    shell: '💻 Shell Command',
    agent: '🤖 AI Agent',
    git: '🔀 Git',
    notify: '📱 Notify',
    email_reply: '📧 Email Reply'
  };
  
  value.textContent = actionLabels[actionType] || actionType;
  node.classList.add('configured');
  
  // Highlight selected option
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.classList.remove('selected');
  });
  document.querySelector(`[data-action="${actionType}"]`)?.classList.add('selected');
  
  // Show action-specific settings
  document.querySelectorAll('.action-config').forEach(config => {
    config.style.display = 'none';
  });
  document.querySelector(`.action-config[data-action="${actionType}"]`)?.style.setProperty('display', 'block', 'important');
  
  updatePreview();
}

// Add condition
function addCondition() {
  workflowState.condition = 'active';
  
  const node = document.getElementById('node-condition');
  const value = document.getElementById('condition-value');
  
  value.textContent = '🔑 Keyword';
  node.classList.add('configured');
  
  document.getElementById('condition-settings').style.display = 'block';
  document.querySelector('.condition-buttons').style.display = 'none';
  
  updateConditionFields();
  updatePreview();
}

// Skip condition
function skipCondition() {
  workflowState.condition = null;
  
  const node = document.getElementById('node-condition');
  const value = document.getElementById('condition-value');
  
  value.textContent = 'Skipped';
  node.classList.add('skipped');
  
  // Hide condition config
  document.getElementById('config-condition').style.display = 'none';
  
  updatePreview();
}

// Update condition fields based on type
function updateConditionFields() {
  const type = document.getElementById('condition-type').value;
  
  workflowState.condition = type;
  
  const conditionLabels = {
    keyword: '🔑 Keyword',
    time_range: '⏰ Time Range',
    sender: '👤 Sender',
    file_pattern: '📄 File Pattern'
  };
  
  document.getElementById('condition-value').textContent = conditionLabels[type];
  
  document.querySelectorAll('.condition-config').forEach(config => {
    config.style.display = 'none';
  });
  document.querySelector(`.condition-config[data-condition="${type}"]`)?.style.setProperty('display', 'block', 'important');
  
  updatePreview();
}

// Update schedule preset
function updateSchedulePreset() {
  const preset = document.getElementById('schedule-preset').value;
  const cronInput = document.getElementById('cron');
  const preview = document.getElementById('cron-preview');
  
  if (preset === 'custom') {
    cronInput.value = '';
    preview.textContent = 'Enter a cron expression';
  } else if (SCHEDULE_PRESETS[preset]) {
    cronInput.value = SCHEDULE_PRESETS[preset].cron;
    preview.textContent = `Runs: ${SCHEDULE_PRESETS[preset].desc}`;
  }
  
  cronInput.addEventListener('input', updatePreview);
  updatePreview();
}

// Update preview panel
function updatePreview() {
  const preview = document.getElementById('preview-content');
  let html = '';
  
  if (workflowState.trigger) {
    const triggerLabels = {
      schedule: '⏰ Schedule',
      webhook: '🔗 Webhook',
      file_change: '📁 File Watch',
      email: '📧 Email',
      calendar: '📅 Calendar',
      system: '🖥️ System'
    };
    html += `<div class="preview-item preview-trigger">⚡ ${triggerLabels[workflowState.trigger] || workflowState.trigger}</div>`;
  }
  
  if (workflowState.condition && workflowState.condition !== 'skipped') {
    const conditionLabels = {
      keyword: '🔑 Keyword',
      time_range: '⏰ Time Range',
      sender: '👤 Sender',
      file_pattern: '📄 File Pattern'
    };
    html += `<div class="preview-item preview-condition">→ ${conditionLabels[workflowState.condition] || workflowState.condition}</div>`;
  }
  
  if (workflowState.action) {
    const actionLabels = {
      shell: '💻 Shell Command',
      agent: '🤖 AI Agent',
      git: '🔀 Git',
      notify: '📱 Notify',
      email_reply: '📧 Email Reply'
    };
    html += `<div class="preview-item preview-action">🎯 ${actionLabels[workflowState.action] || workflowState.action}</div>`;
  }
  
  if (!html) {
    html = '<p class="preview-empty">Configure your automation to see the preview</p>';
  }
  
  preview.innerHTML = html;
}

// Save workflow automation
async function saveWorkflowAutomation() {
  // Validate trigger
  if (!workflowState.trigger) {
    showToast('Please select a trigger', 'error');
    configureStep('trigger');
    return;
  }
  
  // Validate action
  if (!workflowState.action) {
    showToast('Please select an action', 'error');
    configureStep('action');
    return;
  }
  
  // Build automation object
  const automation = {
    id: generateId('automation'),
    name: `${workflowState.trigger} → ${workflowState.action}`,
    enabled: true,
    trigger: {
      type: workflowState.trigger
    },
    actions: []
  };
  
  // Add trigger-specific settings
  switch (workflowState.trigger) {
    case 'schedule':
      automation.trigger.cron = document.getElementById('cron').value || '0 9 * * *';
      break;
    case 'webhook':
      automation.trigger.port = parseInt(document.getElementById('webhook-port').value) || 18800;
      automation.trigger.endpoint = document.getElementById('webhook-endpoint').value;
      break;
    case 'file_change':
      automation.trigger.path = document.getElementById('watch-path').value;
      automation.trigger.events = [];
      if (document.getElementById('event-modify').checked) automation.trigger.events.push('modify');
      if (document.getElementById('event-add').checked) automation.trigger.events.push('add');
      if (document.getElementById('event-delete').checked) automation.trigger.events.push('delete');
      break;
    case 'email':
      automation.trigger.host = document.getElementById('email-host').value;
      automation.trigger.user = document.getElementById('email-user').value;
      automation.trigger.interval = parseInt(document.getElementById('email-interval').value) || 60;
      break;
    case 'calendar':
      automation.trigger.provider = document.getElementById('calendar-provider').value;
      automation.trigger.interval = parseInt(document.getElementById('calendar-interval').value) || 5;
      break;
    case 'system':
      automation.trigger.cpuThreshold = parseInt(document.getElementById('sys-cpu').value) || 90;
      automation.trigger.memoryThreshold = parseInt(document.getElementById('sys-mem').value) || 90;
      automation.trigger.diskThreshold = parseInt(document.getElementById('sys-disk').value) || 95;
      break;
  }
  
  // Add action
  switch (workflowState.action) {
    case 'shell':
      const command = document.getElementById('shell-command').value.trim();
      if (!command) {
        showToast('Please enter a command', 'error');
        return;
      }
      automation.actions.push({ type: 'shell', command: command });
      break;
    case 'agent':
      const prompt = document.getElementById('agent-prompt').value.trim();
      if (!prompt) {
        showToast('Please enter a task description', 'error');
        return;
      }
      automation.actions.push({ type: 'agent', prompt: prompt, model: document.getElementById('agent-model').value });
      break;
    case 'git':
      const path = document.getElementById('git-path').value.trim();
      if (!path) {
        showToast('Please enter a repository path', 'error');
        return;
      }
      automation.actions.push({
        type: 'git',
        path: path,
        add: document.getElementById('git-add').checked,
        commit: document.getElementById('git-commit').checked,
        push: document.getElementById('git-push').checked
      });
      break;
    case 'notify':
      const message = document.getElementById('notify-message').value.trim();
      if (!message) {
        showToast('Please enter a notification message', 'error');
        return;
      }
      automation.actions.push({ type: 'notify', channel: document.getElementById('notify-channel').value, message: message });
      break;
    case 'email_reply':
      const subject = document.getElementById('email-subject').value.trim();
      const body = document.getElementById('email-body').value.trim();
      if (!subject || !body) {
        showToast('Please fill in email subject and body', 'error');
        return;
      }
      automation.actions.push({ type: 'email', subject: subject, body: body });
      break;
  }
  
  try {
    await saveAutomation(automation);
    
    // Reset workflow state
    resetWorkflow();
    switchTab('automations');
  } catch (error) {
    showToast('Failed to save automation', 'error');
  }
}

// Reset workflow builder
function resetWorkflow() {
  workflowState = {
    trigger: null,
    condition: null,
    action: null,
    activeStep: null
  };
  
  // Reset nodes
  ['trigger', 'condition', 'action'].forEach(step => {
    const node = document.getElementById(`node-${step}`);
    const value = document.getElementById(`${step}-value`);
    
    node.classList.remove('active', 'configured', 'skipped');
    node.classList.remove(`flow-${step}-active`);
    
    if (step === 'trigger') value.textContent = 'Click to select';
    else if (step === 'condition') value.textContent = 'Optional';
    else value.textContent = 'Click to select';
  });
  
  // Reset config sections
  document.querySelectorAll('.config-section').forEach(section => {
    section.style.display = 'none';
  });
  document.getElementById('config-trigger').style.display = 'block';
  
  // Reset selected options
  document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
  
  // Reset trigger/action configs
  document.querySelectorAll('.trigger-config, .action-config, .condition-config').forEach(config => {
    config.style.display = 'none';
  });
  
  // Reset condition buttons
  document.querySelector('.condition-buttons').style.display = 'flex';
  document.getElementById('condition-settings').style.display = 'none';
  
  // Reset form inputs
  document.getElementById('schedule-preset').value = 'every-day-9am';
  document.getElementById('cron').value = '0 9 * * *';
  document.getElementById('cron-preview').textContent = 'Runs: Every day at 9:00 AM';
  
  // Reset preview
  updatePreview();
}

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
