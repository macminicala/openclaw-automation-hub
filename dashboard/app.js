/**
 * Automation Hub Dashboard - Step-by-step Visual Builder
 * Refactored for Tailwind CSS
 */

const API_URL = '/api';
let automations = {};
let pendingDeleteId = null;

// Schedule presets with human-readable descriptions
const SCHEDULE_PRESETS = {
  'every-minute': { cron: '* * * * *', desc: 'Esecuzione ogni minuto (test)' },
  'every-hour': { cron: '0 * * * *', desc: 'Esecuzione all\'inizio di ogni ora (minuto 0)' },
  'every-day-9am': { cron: '0 9 * * *', desc: 'Esecuzione ogni giorno alle 9:00' },
  'every-day-6pm': { cron: '0 18 * * *', desc: 'Esecuzione ogni giorno alle 18:00' },
  'every-monday': { cron: '0 8 * * 1', desc: 'Esecuzione ogni Lunedì alle 8:00' },
  'every-weekday': { cron: '0 9 * * 1-5', desc: 'Esecuzione dal Lunedì al Venerdì alle 9:00' },
  'every-month': { cron: '0 9 1 * *', desc: 'Esecuzione il primo giorno di ogni mese alle 9:00' }
};

// Builder state
let builderState = {
  step: 1,
  trigger: null,
  action: null
};

const TRIGGER_META = {
  schedule: { icon: '⏰', label: 'Schedule', desc: 'Run at a specific time' },
  webhook: { icon: '🔗', label: 'HTTP Request', desc: 'Trigger via endpoint HTTP' },
  file_change: { icon: '📁', label: 'Monitora File', desc: 'When files change' },
  email: { icon: '📧', label: 'Email', desc: 'When emails arrive' },
  calendar: { icon: '📅', label: 'Calendario', desc: 'Calendar events' },
  system: { icon: '🖥️', label: 'Sistema', desc: 'Resource monitoring' }
};

const ACTION_META = {
  shell: { icon: '💻', label: 'Esegui Comando', desc: 'Execute a terminal command' },
  agent: { icon: '🤖', label: 'Assistente AI', desc: 'Run an AI task' },
  git: { icon: '🔀', label: 'Git', desc: 'Auto-commit & push' },
  notify: { icon: '📱', label: 'Notifica', desc: 'Send a notification' },
  email_reply: { icon: '📧', label: 'Risposta Email', desc: 'Send an email' }
};

// ============ TABS ============

function switchTab(tabName) {
  // Remove active class from all tabs and contents
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active', 'bg-accent-primary', 'text-white', 'border-accent-primary');
    tab.classList.add('bg-transparent', 'border-gray-600', 'text-text-secondary');
  });
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  // Add active class to selected tab and content
  const tab = document.querySelector(`.tab[onclick="switchTab('${tabName}')"]`);
  const content = document.getElementById(`tab-${tabName}`);

  if (tab) {
    tab.classList.add('active', 'bg-accent-primary', 'text-white', 'border-accent-primary');
    tab.classList.remove('bg-transparent', 'border-gray-600', 'text-text-secondary');
  }
  if (content) content.classList.add('active');

  if (tabName === 'automations') {
    loadAutomations();
  } else if (tabName === 'builder') {
    resetBuilder();
  }
}

// ============ BUILDER FLOW ============

function goToStep(step) {
  // Guardrails
  if (step === 2 && !builderState.trigger) {
    showToast('Seleziona un trigger per continuare', 'error');
    return;
  }
  if (step === 3 && !builderState.action) {
    showToast('Seleziona un\'azione per continuare', 'error');
    return;
  }

  builderState.step = step;

  // Show/hide steps
  document.querySelectorAll('.builder-step').forEach(el => {
    el.classList.add('hidden');
    el.classList.remove('block');
  });
  const stepEl = document.getElementById(`step-${step}`);
  if (stepEl) {
    stepEl.classList.remove('hidden');
    stepEl.classList.add('block');
  }

  updateProgress();

  if (step === 3) updateSummary();

  // Scroll to top of builder
  const builder = document.querySelector('.step-builder');
  if (builder) builder.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function updateProgress() {
  const current = builderState.step;
  
  document.querySelectorAll('.flex.items-center.gap-2[data-step]').forEach((stepEl, idx) => {
    const n = idx + 1;
    const numberEl = stepEl.querySelector('.step-number');
    const isActive = n === current;
    const isDone = n < current;
    
    if (isActive) {
      stepEl.classList.remove('opacity-50');
      if (numberEl) {
        numberEl.classList.remove('bg-gray-600');
        numberEl.classList.add('bg-accent-primary', 'text-white');
      }
    } else if (isDone) {
      stepEl.classList.remove('opacity-50');
      if (numberEl) {
        numberEl.classList.remove('bg-accent-primary', 'text-white');
        numberEl.classList.add('bg-green-500', 'text-white');
      }
    } else {
      stepEl.classList.add('opacity-50');
      if (numberEl) {
        numberEl.classList.remove('bg-accent-primary', 'bg-green-500', 'text-white');
        numberEl.classList.add('bg-gray-600', 'text-white');
      }
    }
  });
}

function selectTrigger(triggerType) {
  builderState.trigger = triggerType;

  // Visual selection - remove selected from all, add to current
  document.querySelectorAll('[data-trigger]').forEach(card => {
    card.classList.remove('border-accent-primary', 'bg-bg-card', 'selected');
    card.classList.add('border-gray-600', 'bg-bg-elevated');
  });
  const selectedCard = document.querySelector(`[data-trigger="${triggerType}"]`);
  if (selectedCard) {
    selectedCard.classList.add('border-accent-primary', 'bg-bg-card', 'selected');
    selectedCard.classList.remove('border-gray-600', 'bg-bg-elevated');
  }

  // Show settings container
  const settings = document.getElementById('trigger-settings');
  if (settings) {
    settings.classList.remove('hidden');
    settings.classList.add('block');
  }

  // Show correct config block
  document.querySelectorAll('.trigger-config').forEach(cfg => {
    cfg.classList.add('hidden');
    cfg.classList.remove('block');
  });
  const configEl = document.querySelector(`.trigger-config[data-trigger="${triggerType}"]`);
  if (configEl) {
    configEl.classList.remove('hidden');
    configEl.classList.add('block');
  }

  // Enable next button
  const nextBtn = document.getElementById('btn-next-1');
  if (nextBtn) nextBtn.disabled = false;

  // Update dynamic helper text
  if (triggerType === 'schedule') updateSchedulePreset();
  if (triggerType === 'webhook') updateWebhookPreview();
}

function selectAction(actionType) {
  builderState.action = actionType;

  // Visual selection
  document.querySelectorAll('[data-action]').forEach(card => {
    card.classList.remove('border-accent-primary', 'bg-bg-card', 'selected');
    card.classList.add('border-gray-600', 'bg-bg-elevated');
  });
  const selectedCard = document.querySelector(`[data-action="${actionType}"]`);
  if (selectedCard) {
    selectedCard.classList.add('border-accent-primary', 'bg-bg-card', 'selected');
    selectedCard.classList.remove('border-gray-600', 'bg-bg-elevated');
  }

  // Show settings
  const settings = document.getElementById('action-settings');
  if (settings) {
    settings.classList.remove('hidden');
    settings.classList.add('block');
  }

  document.querySelectorAll('.action-config').forEach(cfg => {
    cfg.classList.add('hidden');
    cfg.classList.remove('block');
  });
  const configEl = document.querySelector(`.action-config[data-action="${actionType}"]`);
  if (configEl) {
    configEl.classList.remove('hidden');
    configEl.classList.add('block');
  }

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
    previewEl.textContent = `Esecuzione: ${meta.desc}`;
  } else {
    previewEl.textContent = 'Esecuzione: Schedule personalizzato';
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

  // Show step 1, hide others
  document.querySelectorAll('.builder-step').forEach(el => {
    el.classList.add('hidden');
    el.classList.remove('block');
  });
  const step1 = document.getElementById('step-1');
  if (step1) {
    step1.classList.remove('hidden');
    step1.classList.add('block');
  }

  // Reset progress
  updateProgress();

  // Clear selections
  document.querySelectorAll('.choice-card').forEach(el => {
    el.classList.remove('selected', 'border-accent-primary', 'bg-bg-card');
    el.classList.add('border-gray-600', 'bg-bg-elevated');
  });

  // Hide settings
  const triggerSettings = document.getElementById('trigger-settings');
  const actionSettings = document.getElementById('action-settings');
  if (triggerSettings) {
    triggerSettings.classList.add('hidden');
    triggerSettings.classList.remove('block');
  }
  if (actionSettings) {
    actionSettings.classList.add('hidden');
    actionSettings.classList.remove('block');
  }
  document.querySelectorAll('.trigger-config, .action-config').forEach(cfg => {
    cfg.classList.add('hidden');
    cfg.classList.remove('block');
  });

  // Reset buttons
  const next1 = document.getElementById('btn-next-1');
  const next2 = document.getElementById('btn-next-2');
  if (next1) next1.disabled = true;
  if (next2) next2.disabled = true;

  // Reset inputs to safe defaults
  const presetEl = document.getElementById('schedule-preset');
  if (presetEl) presetEl.value = 'every-day-9am';
  const cronEl = document.getElementById('cron');
  if (cronEl) cronEl.value = SCHEDULE_PRESETS['every-day-9am'].cron;
  const previewEl = document.getElementById('cron-preview');
  if (previewEl) previewEl.textContent = `Esecuzione: ${SCHEDULE_PRESETS['every-day-9am'].desc}`;

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
    showToast('Seleziona prima un trigger', 'error');
    goToStep(1);
    return;
  }
  if (!builderState.action) {
    showToast('Seleziona prima un\'azione', 'error');
    goToStep(2);
    return;
  }

  const name = (document.getElementById('automation-name')?.value || '').trim();
  if (!name) {
    showToast('Dai un nome alla tua automazione', 'error');
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
        showToast('Inserisci il comando da eseguire', 'error');
        goToStep(2);
        return;
      }
      automation.actions.push({ type: 'shell', command });
      break;
    }
    case 'agent': {
      const prompt = (document.getElementById('agent-prompt')?.value || '').trim();
      if (!prompt) {
        showToast('Descrivi cosa deve fare l\'AI', 'error');
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
        showToast('Inserisci il percorso del repository', 'error');
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
        showToast('Inserisci il messaggio di notifica', 'error');
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
        showToast('Compila oggetto e messaggio email', 'error');
        goToStep(2);
        return;
      }
      automation.actions.push({ type: 'email', subject, body });
      break;
    }
  }

  try {
    await saveAutomation(automation);
    showToast('Automazione salvata!', 'success');
    resetBuilder();
    switchTab('automations');
  } catch (e) {
    // saveAutomation handles toast
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
    if (!response.ok) throw new Error('Failed to fetch');
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
    showToast('Impossibile caricare le automazioni. Ricarica la pagina.', 'error');
  }
}

async function toggleAutomation(id, enabled) {
  const automationName = automations[id]?.name || id;
  const btn = event?.target;
  if (btn) {
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    btn.disabled = true;
  }

  const endpoint = enabled ? 'disable' : 'enable';
  try {
    await fetch(`${API_URL}/automations/${id}/${endpoint}`, { method: 'POST' });
    await loadAutomations();
    logActivity(`${enabled ? 'Disabilitato' : 'Abilitato'} "${automationName}"`, 'success');
  } catch (error) {
    showToast('Impossibile completare l\'azione. Riprova.', 'error');
  } finally {
    if (btn) {
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
      btn.disabled = false;
    }
  }
}

async function runAutomation(id) {
  const automationName = automations[id]?.name || id;
  const btn = event?.target;
  if (btn) {
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    btn.textContent = 'In esecuzione...';
    btn.disabled = true;
  }

  try {
    await fetch(`${API_URL}/automations/${id}/run`, { method: 'POST' });
    logActivity(`Avviata esecuzione di "${automationName}"`, 'info');
    showToast('Automazione in esecuzione!', 'success');
  } catch (error) {
    showToast('Impossibile eseguire l\'automazione. Riprova.', 'error');
  } finally {
    if (btn) {
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
      btn.textContent = '▶ Esegui';
      btn.disabled = false;
    }
  }
}

function confirmDelete(id) {
  const automationName = automations[id]?.name || id;
  pendingDeleteId = id;
  document.getElementById('delete-message').textContent = `Sei sicuro di voler eliminare "${automationName}"? L'azione non può essere annullata.`;
  
  const overlay = document.getElementById('delete-modal-overlay');
  const modal = document.getElementById('delete-modal');
  if (overlay) {
    overlay.classList.remove('opacity-0', 'invisible');
    overlay.classList.add('opacity-100', 'visible');
  }
  if (modal) {
    modal.classList.remove('opacity-0', 'invisible');
    modal.classList.add('opacity-100', 'visible');
  }
}

function closeDeleteModal() {
  const overlay = document.getElementById('delete-modal-overlay');
  const modal = document.getElementById('delete-modal');
  if (overlay) {
    overlay.classList.add('opacity-0', 'invisible');
    overlay.classList.remove('opacity-100', 'visible');
  }
  if (modal) {
    modal.classList.add('opacity-0', 'invisible');
    modal.classList.remove('opacity-100', 'visible');
  }
  pendingDeleteId = null;
}

async function executeDelete() {
  if (!pendingDeleteId) return;

  const btn = document.getElementById('confirm-delete-btn');
  if (btn) {
    btn.classList.add('opacity-50', 'cursor-not-allowed');
    btn.textContent = 'Eliminando...';
    btn.disabled = true;
  }

  try {
    await fetch(`${API_URL}/automations/${pendingDeleteId}`, { method: 'DELETE' });
    await loadAutomations();
    logActivity(`Eliminato "${automations[pendingDeleteId]?.name || pendingDeleteId}"`, 'warning');
    showToast('Automazione eliminata', 'success');
  } catch (error) {
    showToast('Impossibile eliminare l\'automazione. Riprova.', 'error');
  } finally {
    if (btn) {
      btn.classList.remove('opacity-50', 'cursor-not-allowed');
      btn.textContent = 'Elimina';
      btn.disabled = false;
    }
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
    logActivity(`Creata nuova automazione "${automation.name}"`, 'success');
  } catch (error) {
    showToast('Impossibile salvare l\'automazione. Controlla i dati e riprova.', 'error');
    throw error;
  }
}

// ============ RENDER FUNCTIONS ============

function updateStats(stats) {
  const totalEl = document.getElementById('stat-total');
  const enabledEl = document.getElementById('stat-enabled');
  if (totalEl) totalEl.textContent = stats.total || 0;
  if (enabledEl) enabledEl.textContent = stats.enabled || 0;
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
      emptyState.querySelector('h3').textContent = 'Nessuna automazione trovata';
      emptyState.querySelector('p').textContent = 'Prova con un altro termine di ricerca';
    } else {
      emptyState.querySelector('h3').textContent = 'Nessuna automazione ancora';
      emptyState.querySelector('p').textContent = 'Crea la tua prima automazione per iniziare';
    }
    return;
  }

  grid.style.display = 'grid';
  emptyState.style.display = 'none';

  grid.innerHTML = list.map(automation => {
    const actionType = automation.actions?.[0]?.type || 'unknown';
    const actionDesc = getActionDescription(automation);
    const lastRun = automation.lastRun ? formatRelativeTime(automation.lastRun) : 'Mai eseguita';

    return `
    <div class="bg-bg-card border border-gray-700 rounded-xl p-5 hover:border-accent-primary hover:shadow-lg transition-all cursor-pointer">
      <div class="flex justify-between items-start mb-3">
        <div>
          <div class="font-semibold text-lg">${escapeHtml(automation.name)}</div>
          <div class="text-sm text-text-secondary">⚡ ${escapeHtml(getTriggerDescription(automation.trigger))}</div>
          <div class="text-sm text-text-secondary opacity-70">Ultima esecuzione: ${escapeHtml(lastRun)}</div>
        </div>
        <div class="flex items-center gap-2 text-sm font-medium px-3 py-1 rounded-full ${automation.enabled ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-text-secondary'}">
          <span class="w-2 h-2 rounded-full ${automation.enabled ? 'bg-green-400' : 'bg-gray-400'}"></span>
          ${automation.enabled ? 'Attiva' : 'In pausa'}
        </div>
      </div>

      <div class="bg-bg-elevated rounded-lg px-4 py-2 mb-4 text-sm">
        ${getActionIcon(actionType)} ${escapeHtml(actionDesc)}
      </div>

      <div class="flex gap-2 pt-4 border-t border-gray-700">
        <button class="flex-1 bg-transparent border border-gray-600 hover:border-gray-500 px-3 py-2 rounded-lg text-sm font-medium transition-all" onclick="toggleAutomation('${escapeHtml(automation.id)}', ${automation.enabled})">
          ${automation.enabled ? '⏸ Disabilita' : '▶ Abilita'}
        </button>
        <button class="flex-1 bg-transparent border border-gray-600 hover:border-gray-500 px-3 py-2 rounded-lg text-sm font-medium transition-all" onclick="runAutomation('${escapeHtml(automation.id)}')">
          ▶ Esegui
        </button>
        <button class="bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm transition-all" onclick="confirmDelete('${escapeHtml(automation.id)}')">
          🗑️
        </button>
      </div>
    </div>
  `;
  }).join('');
}

function getTriggerDescription(trigger) {
  if (!trigger?.type) return 'Nessun trigger';
  const t = trigger.type;
  if (t === 'schedule') return `Schedule (${trigger.cron || 'cron'})`;
  if (t === 'webhook') return `HTTP Request (${trigger.endpoint || '/'} su ${trigger.port || 18800})`;
  if (t === 'file_change') return `Monitora File (${trigger.path || ''})`;
  if (t === 'email') return `Email (${trigger.user || 'casella'})`;
  if (t === 'calendar') return `Calendario (${trigger.provider || 'provider'})`;
  if (t === 'system') return 'Soglie sistema';
  return t;
}

function getActionDescription(automation) {
  const action = automation.actions?.[0];
  if (!action) return 'Nessuna azione configurata';

  switch (action.type) {
    case 'shell':
      return `Esegue: ${truncate(action.command || action.exec || 'comando', 42)}`;
    case 'notify':
      return `Notifica: ${truncate(action.message || 'messaggio', 42)}`;
    case 'email':
      return `Invia email${action.to ? ` a ${truncate(action.to, 28)}` : ''}`;
    case 'agent':
      return 'Esegue task AI';
    case 'git':
      return `Git su ${truncate(action.path || 'repo', 36)}`;
    default:
      return 'Azione: ' + action.type;
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
  if (!dateString) return 'Mai';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Adesso';
  if (diffMins < 60) return `${diffMins} minuto${diffMins > 1 ? 'i' : ''} fa`;
  if (diffHours < 24) return `${diffHours} ora${diffHours > 1 ? '' : ''} fa`;
  if (diffDays < 7) return `${diffDays} giorno${diffDays > 1 ? 'i' : ''} fa`;

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
  item.className = `log-item px-3 py-1.5 rounded mb-1 animate-fade-in flex justify-between`;
  
  const typeClasses = {
    info: 'bg-blue-500/10 text-blue-400',
    success: 'bg-green-500/10 text-green-400',
    warning: 'bg-yellow-500/10 text-yellow-400',
    error: 'bg-red-500/10 text-red-400'
  };
  
  item.className += ` ${typeClasses[type] || typeClasses.info}`;
  item.innerHTML = `<span>${escapeHtml(message)}</span><span class="opacity-70">${escapeHtml(time)}</span>`;
  feed.insertBefore(item, feed.firstChild);

  while (feed.children.length > 20) {
    feed.removeChild(feed.lastChild);
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `bg-bg-card border border-gray-700 rounded-lg px-5 py-3 flex items-center gap-3 shadow-lg animate-fade-in`;
  if (type === 'success') {
    toast.classList.add('border-l-4', 'border-l-green-500');
  } else {
    toast.classList.add('border-l-4', 'border-l-red-500');
  }
  
  toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span><span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s ease reverse';
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
  resetBuilder();
});
