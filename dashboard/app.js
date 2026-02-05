/**
 * Automation Hub Dashboard - Step-by-step Visual Builder
 */

const API_URL = '/api';
let automations = {};
let pendingDeleteId = null;

// Schedule presets with human-readable descriptions
const SCHEDULE_PRESETS = {
  'every-minute': { cron: '* * * * *', desc: 'Runs every minute (testing)' },
  'every-hour': { cron: '0 * * * *', desc: 'Runs at the start of every hour (minute 0)' },
  'every-day-9am': { cron: '0 9 * * *', desc: 'Runs every day at 9:00 AM' },
  'every-day-6pm': { cron: '0 18 * * *', desc: 'Runs every day at 6:00 PM' },
  'every-monday': { cron: '0 8 * * 1', desc: 'Runs every Monday at 8:00 AM' },
  'every-weekday': { cron: '0 9 * * 1-5', desc: 'Runs Monday through Friday at 9:00 AM' },
  'every-month': { cron: '0 9 1 * *', desc: 'Runs on the 1st day of every month at 9:00 AM' }
};

// Builder state
let builderState = {
  step: 1,
  trigger: null,
  action: null
};

const TRIGGER_META = {
  schedule: { icon: '⏰', label: 'Schedule', desc: 'Run at a specific time' },
  webhook: { icon: '🔗', label: 'Webhook', desc: 'HTTP endpoint trigger' },
  file_change: { icon: '📁', label: 'File Watch', desc: 'When files change' },
  email: { icon: '📧', label: 'Email', desc: 'When emails arrive' },
  calendar: { icon: '📅', label: 'Calendar', desc: 'Calendar events' },
  system: { icon: '🖥️', label: 'System', desc: 'Resource monitoring' }
};

const ACTION_META = {
  shell: { icon: '💻', label: 'Run Command', desc: 'Execute a terminal command' },
  agent: { icon: '🤖', label: 'AI Agent', desc: 'Run an AI task' },
  git: { icon: '🔀', label: 'Git', desc: 'Auto-commit & push' },
  notify: { icon: '📱', label: 'Notify', desc: 'Send a notification' },
  email_reply: { icon: '📧', label: 'Email Reply', desc: 'Send an email' }
};

// ============ TABS ============

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  const tab = document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`);
  const content = document.getElementById(`tab-${tabName}`);

  if (tab) tab.classList.add('active');
  if (content) content.classList.add('active');

  if (tabName === 'builder') {
    // Always start the builder in a clean, predictable state
    resetBuilder();
  }
}

// ============ BUILDER FLOW ============

function goToStep(step) {
  // Guardrails (so user always knows what to do next)
  if (step === 2 && !builderState.trigger) {
    showToast('Pick a trigger to continue', 'error');
    return;
  }
  if (step === 3 && !builderState.action) {
    showToast('Pick an action to continue', 'error');
    return;
  }

  builderState.step = step;

  document.querySelectorAll('.builder-step').forEach(el => el.classList.remove('active'));
  document.getElementById(`step-${step}`)?.classList.add('active');

  updateProgress();

  if (step === 3) updateSummary();

  // Scroll to top of builder on step change (nice on mobile)
  document.querySelector('.step-builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateProgress() {
  const current = builderState.step;
  document.querySelectorAll('.progress-step').forEach(stepEl => {
    const n = parseInt(stepEl.getAttribute('data-step'), 10);
    stepEl.classList.toggle('active', n === current);
    stepEl.classList.toggle('done', n < current);
  });
}

function selectTrigger(triggerType) {
  builderState.trigger = triggerType;

  // Visual selection
  document.querySelectorAll('[data-trigger]').forEach(card => card.classList.remove('selected'));
  document.querySelector(`[data-trigger="${triggerType}"]`)?.classList.add('selected');

  // Show settings container + correct config block
  const settings = document.getElementById('trigger-settings');
  if (settings) settings.style.display = 'block';

  document.querySelectorAll('.trigger-config').forEach(cfg => (cfg.style.display = 'none'));
  document.querySelector(`.trigger-config[data-trigger="${triggerType}"]`)?.style.setProperty('display', 'block');

  // Enable next
  const nextBtn = document.getElementById('btn-next-1');
  if (nextBtn) nextBtn.disabled = false;

  // Update any dynamic helper text
  if (triggerType === 'schedule') updateSchedulePreset();
  if (triggerType === 'webhook') updateWebhookPreview();

  // Auto-advance for speed (but only if no settings are needed)
  // Schedule/webhook/file/email/calendar/system all have optional settings; keep on same step.
}

function selectAction(actionType) {
  builderState.action = actionType;

  // Visual selection
  document.querySelectorAll('[data-action]').forEach(card => card.classList.remove('selected'));
  document.querySelector(`[data-action="${actionType}"]`)?.classList.add('selected');

  // Show settings
  const settings = document.getElementById('action-settings');
  if (settings) settings.style.display = 'block';

  document.querySelectorAll('.action-config').forEach(cfg => (cfg.style.display = 'none'));
  document.querySelector(`.action-config[data-action="${actionType}"]`)?.style.setProperty('display', 'block');

  // Enable next
  const nextBtn = document.getElementById('btn-next-2');
  if (nextBtn) nextBtn.disabled = false;
}

function updateSchedulePreset() {
  const presetEl = document.getElementById('schedule-preset');
  const cronEl = document.getElementById('cron');
  const previewEl = document.getElementById('cron-preview');
  if (!presetEl || !cronEl || !previewEl) return;

  const preset = presetEl.value;
  const meta = SCHEDULE_PRESETS[preset];

  if (meta) {
    cronEl.value = meta.cron;
    previewEl.textContent = `Runs: ${meta.desc}`;
  } else {
    previewEl.textContent = 'Runs: Custom schedule';
  }
}

function updateWebhookPreview() {
  const portEl = document.getElementById('webhook-port');
  const pathEl = document.getElementById('webhook-endpoint');
  const urlEl = document.getElementById('webhook-url');
  if (!portEl || !pathEl || !urlEl) return;

  const port = parseInt(portEl.value, 10) || 18800;
  let path = (pathEl.value || '/automation').trim();
  if (!path.startsWith('/')) path = '/' + path;

  urlEl.textContent = `http://localhost:${port}${path}`;
}

function updateSummary() {
  const t = builderState.trigger;
  const a = builderState.action;

  const triggerLabel = t ? `${TRIGGER_META[t]?.icon || '⚡'} ${TRIGGER_META[t]?.label || t}` : '-';
  const actionLabel = a ? `${ACTION_META[a]?.icon || '🎯'} ${ACTION_META[a]?.label || a}` : '-';

  const triggerEl = document.getElementById('summary-trigger');
  const actionEl = document.getElementById('summary-action');
  if (triggerEl) triggerEl.textContent = triggerLabel;
  if (actionEl) actionEl.textContent = actionLabel;

  // Friendly default name
  const nameEl = document.getElementById('automation-name');
  if (nameEl && !nameEl.value.trim()) {
    const base = `${TRIGGER_META[t]?.label || t} → ${ACTION_META[a]?.label || a}`;
    nameEl.value = base;
  }
}

function resetBuilder() {
  builderState = { step: 1, trigger: null, action: null };

  // Steps
  document.querySelectorAll('.builder-step').forEach(el => el.classList.remove('active'));
  document.getElementById('step-1')?.classList.add('active');

  // Progress
  updateProgress();

  // Selections
  document.querySelectorAll('.choice-card.selected').forEach(el => el.classList.remove('selected'));

  // Settings
  document.getElementById('trigger-settings')?.style.setProperty('display', 'none');
  document.getElementById('action-settings')?.style.setProperty('display', 'none');
  document.querySelectorAll('.trigger-config').forEach(cfg => (cfg.style.display = 'none'));
  document.querySelectorAll('.action-config').forEach(cfg => (cfg.style.display = 'none'));

  // Buttons
  const next1 = document.getElementById('btn-next-1');
  const next2 = document.getElementById('btn-next-2');
  if (next1) next1.disabled = true;
  if (next2) next2.disabled = true;

  // Inputs (safe defaults)
  const presetEl = document.getElementById('schedule-preset');
  if (presetEl) presetEl.value = 'every-day-9am';
  const cronEl = document.getElementById('cron');
  if (cronEl) cronEl.value = SCHEDULE_PRESETS['every-day-9am'].cron;
  const previewEl = document.getElementById('cron-preview');
  if (previewEl) previewEl.textContent = `Runs: ${SCHEDULE_PRESETS['every-day-9am'].desc}`;

  const portEl = document.getElementById('webhook-port');
  if (portEl) portEl.value = 18800;
  const pathEl = document.getElementById('webhook-endpoint');
  if (pathEl) pathEl.value = '/automation';
  updateWebhookPreview();

  const nameEl = document.getElementById('automation-name');
  if (nameEl) nameEl.value = '';

  // Clear action-specific fields
  ['shell-command', 'agent-prompt', 'git-path', 'notify-message', 'email-subject', 'email-body'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

async function saveAutomationFromBuilder() {
  if (!builderState.trigger) {
    showToast('Pick a trigger first', 'error');
    goToStep(1);
    return;
  }
  if (!builderState.action) {
    showToast('Pick an action first', 'error');
    goToStep(2);
    return;
  }

  const name = (document.getElementById('automation-name')?.value || '').trim();
  if (!name) {
    showToast('Give your automation a name', 'error');
    return;
  }

  const automation = {
    id: generateId(name) || generateId('automation'),
    name,
    enabled: true,
    trigger: { type: builderState.trigger },
    actions: []
  };

  // Trigger settings
  switch (builderState.trigger) {
    case 'schedule': {
      const cron = (document.getElementById('cron')?.value || '').trim();
      automation.trigger.cron = cron || SCHEDULE_PRESETS['every-day-9am'].cron;
      break;
    }
    case 'webhook': {
      automation.trigger.port = parseInt(document.getElementById('webhook-port')?.value, 10) || 18800;
      automation.trigger.endpoint = (document.getElementById('webhook-endpoint')?.value || '/automation').trim();
      break;
    }
    case 'file_change': {
      automation.trigger.path = (document.getElementById('watch-path')?.value || '~/').trim();
      automation.trigger.events = [];
      if (document.getElementById('event-modify')?.checked) automation.trigger.events.push('modify');
      if (document.getElementById('event-add')?.checked) automation.trigger.events.push('add');
      if (document.getElementById('event-delete')?.checked) automation.trigger.events.push('delete');
      if (automation.trigger.events.length === 0) automation.trigger.events = ['modify'];
      break;
    }
    case 'email': {
      automation.trigger.host = (document.getElementById('email-host')?.value || 'imap.gmail.com').trim();
      automation.trigger.user = (document.getElementById('email-user')?.value || '').trim();
      automation.trigger.interval = parseInt(document.getElementById('email-interval')?.value, 10) || 60;
      break;
    }
    case 'calendar': {
      automation.trigger.provider = (document.getElementById('calendar-provider')?.value || 'google').trim();
      automation.trigger.interval = parseInt(document.getElementById('calendar-interval')?.value, 10) || 5;
      break;
    }
    case 'system': {
      automation.trigger.cpuThreshold = parseInt(document.getElementById('sys-cpu')?.value, 10) || 90;
      automation.trigger.memoryThreshold = parseInt(document.getElementById('sys-mem')?.value, 10) || 90;
      automation.trigger.diskThreshold = parseInt(document.getElementById('sys-disk')?.value, 10) || 95;
      break;
    }
  }

  // Action settings
  switch (builderState.action) {
    case 'shell': {
      const command = (document.getElementById('shell-command')?.value || '').trim();
      if (!command) {
        showToast('Enter the command to run', 'error');
        goToStep(2);
        return;
      }
      automation.actions.push({ type: 'shell', command });
      break;
    }
    case 'agent': {
      const prompt = (document.getElementById('agent-prompt')?.value || '').trim();
      if (!prompt) {
        showToast('Describe what the AI should do', 'error');
        goToStep(2);
        return;
      }
      const model = document.getElementById('agent-model')?.value || 'gpt-4';
      automation.actions.push({ type: 'agent', prompt, model });
      break;
    }
    case 'git': {
      const path = (document.getElementById('git-path')?.value || '').trim();
      if (!path) {
        showToast('Enter the repository path', 'error');
        goToStep(2);
        return;
      }
      automation.actions.push({
        type: 'git',
        path,
        add: !!document.getElementById('git-add')?.checked,
        commit: !!document.getElementById('git-commit')?.checked,
        push: !!document.getElementById('git-push')?.checked
      });
      break;
    }
    case 'notify': {
      const channel = document.getElementById('notify-channel')?.value || 'telegram';
      const message = (document.getElementById('notify-message')?.value || '').trim();
      if (!message) {
        showToast('Enter the notification message', 'error');
        goToStep(2);
        return;
      }
      automation.actions.push({ type: 'notify', channel, message });
      break;
    }
    case 'email_reply': {
      const subject = (document.getElementById('email-subject')?.value || '').trim();
      const body = (document.getElementById('email-body')?.value || '').trim();
      if (!subject || !body) {
        showToast('Fill in the email subject and message', 'error');
        goToStep(2);
        return;
      }
      automation.actions.push({ type: 'email', subject, body });
      break;
    }
  }

  try {
    await saveAutomation(automation);
    showToast('Automation saved!', 'success');
    resetBuilder();
    switchTab('automations');
  } catch (e) {
    // saveAutomation already handles toast
  }
}

// ============ API FUNCTIONS ============

async function loadAutomations() {
  const loading = document.getElementById('loading-indicator');
  const grid = document.getElementById('automations-grid');
  const empty = document.getElementById('empty-state');

  if (loading) loading.style.display = 'flex';
  if (grid) grid.style.display = 'none';
  if (empty) empty.style.display = 'none';

  try {
    const response = await fetch(`${API_URL}/automations`);
    const data = await response.json();
    automations = data.automations || {};
    updateStats(data.stats || {});
    renderAutomations();

    if (loading) loading.style.display = 'none';
    if (Object.keys(automations).length > 0) {
      if (grid) grid.style.display = 'grid';
    } else {
      if (empty) empty.style.display = 'block';
    }
  } catch (error) {
    console.error('Failed to load automations:', error);
    if (loading) loading.style.display = 'none';
    if (empty) empty.style.display = 'block';
    showToast('Could not load automations. Please refresh.', 'error');
  }
}

async function toggleAutomation(id, enabled) {
  const automationName = automations[id]?.name || id;
  const btn = event?.target;
  if (btn) btn.classList.add('btn-loading');

  const endpoint = enabled ? 'disable' : 'enable';
  try {
    await fetch(`${API_URL}/automations/${id}/${endpoint}`, { method: 'POST' });
    await loadAutomations();
    logActivity(`${enabled ? 'Disabled' : 'Enabled'} "${automationName}"`, 'success');
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
  try {
    await fetch(`${API_URL}/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(automation)
    });
    await loadAutomations();
    logActivity(`Created new automation "${automation.name}"`, 'success');
  } catch (error) {
    showToast('Could not save the automation. Please check your inputs and try again.', 'error');
    throw error;
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
  const filter = (filterText || '').toLowerCase();

  let list = Object.values(automations);

  if (filter) {
    list = list.filter(a => (a.name || '').toLowerCase().includes(filter));
  }

  if (!grid || !emptyState) return;

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

  grid.innerHTML = list.map(automation => {
    const actionType = automation.actions?.[0]?.type || 'unknown';
    const actionDesc = getActionDescription(automation);
    const lastRun = automation.lastRun ? formatRelativeTime(automation.lastRun) : 'Never run';

    return `
    <div class="automation-card">
      <div class="card-header">
        <div>
          <div class="card-title">${escapeHtml(automation.name)}</div>
          <div class="card-schedule">⚡ ${escapeHtml(getTriggerDescription(automation.trigger))}</div>
          <div class="card-last-run">Last run: ${escapeHtml(lastRun)}</div>
        </div>
        <div class="card-status ${automation.enabled ? 'enabled' : 'disabled'}">
          <span class="status-dot"></span>
          ${automation.enabled ? 'Active' : 'Paused'}
        </div>
      </div>

      <div class="card-action">
        ${getActionIcon(actionType)} ${escapeHtml(actionDesc)}
      </div>

      <div class="card-actions">
        <button class="btn btn-secondary btn-small" onclick="toggleAutomation('${escapeHtml(automation.id)}', ${automation.enabled})">
          ${automation.enabled ? '⏸ Disable' : '▶ Enable'}
        </button>
        <button class="btn btn-secondary btn-small" onclick="runAutomation('${escapeHtml(automation.id)}')">
          ▶ Run Now
        </button>
        <button class="btn btn-danger btn-small" onclick="confirmDelete('${escapeHtml(automation.id)}')">
          🗑️
        </button>
      </div>
    </div>
  `;
  }).join('');
}

function getTriggerDescription(trigger) {
  if (!trigger?.type) return 'No trigger';
  const t = trigger.type;
  if (t === 'schedule') return `Schedule (${trigger.cron || 'cron'})`;
  if (t === 'webhook') return `Webhook (${trigger.endpoint || '/'} on ${trigger.port || 18800})`;
  if (t === 'file_change') return `File Watch (${trigger.path || ''})`;
  if (t === 'email') return `Email (${trigger.user || 'inbox'})`;
  if (t === 'calendar') return `Calendar (${trigger.provider || 'provider'})`;
  if (t === 'system') return 'System thresholds';
  return t;
}

function getActionDescription(automation) {
  const action = automation.actions?.[0];
  if (!action) return 'No action configured';

  switch (action.type) {
    case 'shell':
      return `Runs: ${truncate(action.command || action.exec || 'command', 42)}`;
    case 'notify':
      return `Notifies: ${truncate(action.message || 'message', 42)}`;
    case 'email':
      return `Sends email${action.to ? ` to ${truncate(action.to, 28)}` : ''}`;
    case 'agent':
      return 'Runs AI Agent task';
    case 'git':
      return `Git on ${truncate(action.path || 'repo', 36)}`;
    default:
      return 'Action: ' + action.type;
  }
}

function truncate(text, length) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '…' : text;
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
  const filterText = document.getElementById('search-automations')?.value || '';
  renderAutomations(filterText);
}

// ============ EVENT LISTENERS ============

function setupEventListeners() {
  document.getElementById('confirm-delete-btn')?.addEventListener('click', executeDelete);

  // Builder dynamic previews
  document.getElementById('schedule-preset')?.addEventListener('change', updateSchedulePreset);
  document.getElementById('webhook-port')?.addEventListener('input', updateWebhookPreview);
  document.getElementById('webhook-endpoint')?.addEventListener('input', updateWebhookPreview);
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
  if (!feed) return;

  const time = formatRelativeTime(new Date());
  const item = document.createElement('div');
  item.className = `log-item log-${type}`;
  item.innerHTML = `<span>${escapeHtml(message)}</span><span>${escapeHtml(time)}</span>`;
  feed.insertBefore(item, feed.firstChild);

  while (feed.children.length > 20) {
    feed.removeChild(feed.lastChild);
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function generateId(name) {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 64);
}

// ============ INIT ============

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadAutomations();

  // Make builder step UI consistent on first load
  resetBuilder();
});
