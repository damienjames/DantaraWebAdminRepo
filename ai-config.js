import { TARGET_LABELS, GUIDED_PROMPTS, VALID_TARGETS, API_ROUTES, GUIDE_CONTENT, TARGET_LABELS_TH, UI_STRINGS, VOUCHER_FILTERS, CLICKABLE_FIELDS } from './ai-config-constants.js';
import { escapeHtml, normalizeId, normalizeTarget, formatPrice, computeStableId, annotateList, getRenderableItems, describeItem, buildCardMarkup } from './ai-config-helpers.js';
import { createSpeechController } from './ai-config-speech.js';

(function(){
  if (window.__aiConfigAssistantInitialized) return;
  window.__aiConfigAssistantInitialized = true;

  const root = document.querySelector('.ai-layout');
  if (!root) return;

  const els = {
    chatLog: root.querySelector('#ai-chat-log'),
    input: root.querySelector('#ai-chat-input'),
    form: root.querySelector('#ai-chat-form'),
    sendBtn: root.querySelector('#ai-chat-send'),
    chipHost: root.querySelector('[data-chip-host]'),
    status: root.querySelector('#ai-chat-status'),
    targetLabel: root.querySelector('[data-target-label]'),
    itemLabel: root.querySelector('[data-item-label]'),
    previewPane: root.querySelector('#ai-config-preview'),
    listPane: root.querySelector('#ai-config-list'),
    detailPane: root.querySelector('#ai-config-detail'),
    metadataPane: root.querySelector('#ai-config-metadata'),
    metaTarget: root.querySelector('#ai-config-meta-target'),
    metaItem: root.querySelector('#ai-config-meta-item'),
    metaStatus: root.querySelector('#ai-config-meta-status'),
    metaSummary: root.querySelector('#ai-config-meta-summary'),
    publishBtn: root.querySelector('#ai-config-publish'),
    publishBtnSecondary: root.querySelector('#ai-config-publish-secondary'),
    resetBtn: root.querySelector('#ai-chat-reset'),
    downloadBtn: root.querySelector('#ai-chat-download'),
    shell: root,
    targetTabs: root.querySelectorAll('[data-target-tab]'),
    voucherFilter: root.querySelector('#ai-voucher-filter'),
    voucherFilterBtns: root.querySelectorAll('[data-filter-type]'),
    langButtons: root.querySelectorAll('[data-lang-choice]'),
    langBadge: root.querySelector('[data-lang-badge]'),
    sttBtn: root.querySelector('#ai-stt')
  };

  const state = {
    target: 'services',
    selectedId: null,
    draftJson: null,
    diff: '',
    history: [],
    isBusy: false,
    pendingAction: 'update',
    draftSection: null,
    langPreference: 'en',
    isListening: false,
    lastPublish: null,
    voucherFilter: 'all' // 'all', 'packages', or 'giftCards'
  };

  const STORAGE_KEYS = {
    history: 'aiConfigHistoryV1',
    lastPublish: 'aiConfigLastPublishV1'
  };

  // Per-target in-memory stores so we can swap datasets without refetching
  const draftStore = { services: null, giftVouchers: null, promotions: null };
  const previewStore = { services: '', giftVouchers: '', promotions: '' };
  const diffStore = { services: '', giftVouchers: '', promotions: '' };
  const actionStore = { services: 'update', giftVouchers: 'update', promotions: 'update' };
  const sectionStore = { services: null, giftVouchers: null, promotions: null };
  const selectionStore = { services: null, giftVouchers: null, promotions: null };

  let currentItems = [];
  let speechController = null;

  function syncStateFromStores(target){
    state.draftJson = draftStore[target] || null;
    state.diff = diffStore[target] || '';
    state.pendingAction = actionStore[target] || 'update';
    state.draftSection = sectionStore[target] || null;
    state.selectedId = selectionStore[target] || null;
  }

  function showPlaceholder(){
    if (!els.chatLog) return;
    if (els.chatLog.querySelector('[data-placeholder]')) return;
    const div = document.createElement('div');
    div.className = 'ai-chat-empty';
    div.dataset.placeholder = 'true';
    const lang = state.langPreference;
    const content = UI_STRINGS[lang] || UI_STRINGS.en;
    const placeholderHtml = content.placeholderText
      .split('\n')
      .map(line => `<p>${escapeHtml(line)}</p>`)
      .join('');
    div.innerHTML = placeholderHtml;
    els.chatLog.appendChild(div);
  }

  function clearPlaceholder(){
    const placeholder = els.chatLog?.querySelector('[data-placeholder]');
    if (placeholder) placeholder.remove();
  }

  function appendMessage(role, message){
    if (!els.chatLog) return;
    
    // Sanitize and validate message
    const cleanMessage = String(message || '').trim();
    
    // Skip empty messages
    if (!cleanMessage) {
      console.warn('Skipping empty message from', role);
      return;
    }
    
    // Skip if message looks like JSON or streaming chunk artifacts
    if (cleanMessage.startsWith('{') || cleanMessage.startsWith('[') || 
        cleanMessage.length < 3 || /^[\s\W]*$/.test(cleanMessage)) {
      console.warn('Skipping malformed/JSON message:', cleanMessage.substring(0, 50));
      return;
    }
    
    if (typeof clearPlaceholder === 'function') {
      clearPlaceholder();
    }
    const bubble = document.createElement('div');
    bubble.className = `ai-chat-bubble ${role === 'assistant' ? 'ai' : 'user'}`;
    bubble.innerHTML = `
      <div class="ai-chat-avatar">${role === 'assistant' ? 'AI' : 'You'}</div>
      <div class="ai-chat-message">${escapeHtml(cleanMessage)}</div>
    `;
    els.chatLog.appendChild(bubble);
    els.chatLog.scrollTop = els.chatLog.scrollHeight;
    state.history.push({ role, content: cleanMessage });
    if (state.history.length > 24) {
      state.history = state.history.slice(-24);
    }
    persistHistory();
  }

  function clearChat(){
    state.history = [];
    persistHistory();
    if (!els.chatLog) return;
    els.chatLog.innerHTML = '';
    if (typeof showPlaceholder === 'function') {
      showPlaceholder();
    }
  }

  function handleChipClick(btn){
    const prompt = btn?.dataset?.aiChip || '';
    if (!prompt || !els.input || state.isBusy) return;
    els.input.value = prompt;
    appendMessage('user', prompt);
    sendPrompt(prompt);
  }

  function persistHistory(){
    try {
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history.slice(-24)));
    } catch (err) {
      console.warn('Unable to persist chat history', err);
    }
  }

  function loadHistory(){
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.history);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        state.history = parsed.slice(-24).map(entry => ({
          role: entry.role === 'assistant' ? 'assistant' : 'user',
          content: String(entry.content || '')
        }));
      }
    } catch (err) {
      console.warn('Unable to load chat history', err);
    }
  }

  function loadLastPublish(){
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.lastPublish);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
        state.lastPublish = parsed;
        const container = root.querySelector('#ai-recent-actions');
        const undoBtn = root.querySelector('#ai-undo-btn');
        if (container && undoBtn) {
          root.querySelector('#ai-recent-action-text').textContent = `${parsed.action} "${parsed.itemLabel}" (within last hour)`;
          container.style.display = 'flex';
          undoBtn.disabled = false;
        }
      }
    } catch (err) {
      console.warn('Unable to load last publish', err);
    }
  }

  function renderHistoryLog(){
    if (!els.chatLog || !state.history.length) return;
    if (typeof clearPlaceholder === 'function') {
      clearPlaceholder();
    }
    state.history.forEach(entry => {
      const bubble = document.createElement('div');
      bubble.className = `ai-chat-bubble ${entry.role === 'assistant' ? 'ai' : 'user'}`;
      bubble.innerHTML = `
        <div class="ai-chat-avatar">${entry.role === 'assistant' ? 'AI' : 'You'}</div>
        <div class="ai-chat-message">${escapeHtml(entry.content)}</div>
      `;
      els.chatLog.appendChild(bubble);
    });
    els.chatLog.scrollTop = els.chatLog.scrollHeight;
  }

  async function fetchWithFallback(urls, options){
    const targets = Array.isArray(urls) ? urls : [urls];
    let lastError = null;
    for (const url of targets) {
      try {
        const res = await fetch(url, options);
        if (res.status === 404 && targets.length > 1) {
          // Try next candidate if available
          lastError = new Error(`404 on ${url}`);
          continue;
        }
        return res;
      } catch (err) {
        lastError = err;
      }
    }
    if (lastError) throw lastError;
    throw new Error('Request failed with no response');
  }
  function filterVouchersByGroup(items, filterType = 'all') {
    if (filterType === 'all') return items;
    
    if (filterType === 'packages') {
      return items.filter(item => item.group === 'packages' || item.group === 'package');
    }
    
    if (filterType === 'giftCards') {
      return items.filter(item => item.group === 'vouchers' || item.group === 'giftCard' || item.group === 'giftCards' || !item.group || item.group === '');
    }
    
    return items;
  }

  function renderConfigFrame(target){
    if (!els.listPane || !els.detailPane) return;
    let items = getRenderableItems(draftStore[target], target);
    
    // Apply voucher filter if viewing giftVouchers
    if (target === 'giftVouchers' && state.voucherFilter !== 'all') {
      items = filterVouchersByGroup(items, state.voucherFilter);
    }
    
    currentItems = items;
    if (!items.length) {
      els.listPane.innerHTML = '';
      if (state.pendingAction === 'delete' && state.selectedId) {
        renderDetail(null, target, true);
      } else {
        renderDetail(null, target, false);
      }
      return;
    }
    els.listPane.innerHTML = items.map(item => buildCardMarkup(target, item, state.selectedId)).join('');
    if (!state.selectedId || !items.some(item => item.__metaId === state.selectedId)) {
      state.selectedId = items[0].__metaId;
      selectionStore[target] = state.selectedId;
      updateTargetLabels();
    }
    highlightActiveCard(target);
  }

  function highlightActiveCard(target = state.target){
    if (!els.listPane) return;
    const cards = els.listPane.querySelectorAll('[data-item-id]');
    cards.forEach(card => {
      const isActive = card.dataset.itemId === state.selectedId;
      card.classList.toggle('is-active', isActive);
      card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    const activeItem = currentItems.find(item => item.__metaId === state.selectedId) || null;
    renderDetail(activeItem, target);
    attachClickableFieldListeners(target);
  }

  function generateFieldEditPrompt(field, value, target){
    // Create context-aware prompt for editing a specific field
    const fieldMeta = CLICKABLE_FIELDS[target]?.find(f => f.field === field);
    const fieldLabel = fieldMeta?.label || field;
    
    let prompt = '';
    if (target === 'services') {
      if (field === 'base_price') {
        prompt = `Change the price from $${value} to:`;
      } else if (field === 'duration_minutes') {
        prompt = `Change the duration from ${value} minutes to:`;
      } else if (field === 'service') {
        prompt = `Rename this service from "${value}" to:`;
      } else if (field === 'description') {
        prompt = `Update the description to:`;
      } else if (field === 'modality') {
        prompt = `Change the modality from "${value}" to:`;
      }
    } else if (target === 'giftVouchers') {
      if (field === 'price') {
        prompt = `Change the price from ${value} to:`;
      } else if (field === 'title') {
        prompt = `Rename this gift card from "${value}" to:`;
      } else if (field === 'description') {
        prompt = `Update the description to:`;
      } else if (field === 'savings') {
        prompt = `Update the discount text to:`;
      }
    } else if (target === 'promotions') {
      if (field === 'title') {
        prompt = `Rename this promotion from "${value}" to:`;
      } else if (field === 'description') {
        prompt = `Update the promotion description to:`;
      } else if (field === 'ctaLabel') {
        prompt = `Change the button text from "${value}" to:`;
      }
    }
    
    return prompt || `Edit ${fieldLabel}:`;
  }

  function attachClickableFieldListeners(target){
    // Phase 1: Make preview elements clickable to auto-generate edit prompts
    if (!els.detailPane) return;
    
    const fields = CLICKABLE_FIELDS[target] || [];
    const selectedItem = state.draftJson || currentItems.find(item => item.__metaId === state.selectedId);
    if (!selectedItem) return;
    
    fields.forEach(fieldInfo => {
      const elements = els.detailPane.querySelectorAll(fieldInfo.selector);
      elements.forEach(el => {
        // Skip if already has listener attached
        if (el.dataset.clickableField === fieldInfo.field) return;
        
        el.dataset.clickableField = fieldInfo.field;
        el.style.cursor = 'pointer';
        el.style.position = 'relative';
        
        // Hover effect to show element is clickable
        el.addEventListener('mouseenter', () => {
          if (state.isBusy) return;
          el.style.opacity = '0.7';
          el.style.textDecoration = 'underline';
          el.title = `Click to edit ${fieldInfo.label}`;
        });
        
        el.addEventListener('mouseleave', () => {
          el.style.opacity = '1';
          el.style.textDecoration = 'none';
        });
        
        // Click: Generate context-aware edit prompt
        el.addEventListener('click', (evt) => {
          if (state.isBusy) return;
          evt.stopPropagation();
          
          const currentValue = selectedItem[fieldInfo.field];
          const prompt = generateFieldEditPrompt(fieldInfo.field, currentValue, target);
          
          if (els.input) {
            els.input.value = prompt;
            els.input.focus();
            setStatus(`Editing ${fieldInfo.label} - type your change and hit Send`, 'info');
          }
        });
      });
    });
  }

  function renderDetail(item, target = state.target, showEmptyMessage = false){
    if (!els.detailPane) return;
    if (!item) {
      if (showEmptyMessage && state.pendingAction === 'delete' && state.selectedId) {
        els.detailPane.innerHTML = `<div class="ai-config-empty-state">AI marked <strong>${escapeHtml(state.selectedId)}</strong> for deletion.</div>`;
      } else {
        els.detailPane.innerHTML = '';
      }
      if (els.metaSummary) {
        const lang = state.langPreference;
        const msgMap = {
          en: showEmptyMessage ? 'Record pending deletion.' : 'Awaiting AI draft.',
          th: showEmptyMessage ? 'รอการลบ' : 'รอการเลือกบริการหรือสินค้า'
        };
        els.metaSummary.textContent = msgMap[lang] || msgMap.en;
      }
      if (els.metaItem) {
        els.metaItem.textContent = state.selectedId || 'None';
      }
      return;
    }
    const info = describeItem(item, target);
    const tags = info.tags.length ? `<div class="detail-tags">${info.tags.map(tag => `<span class="detail-tag">${escapeHtml(tag)}</span>`).join('')}</div>` : '';
    const fields = info.fields.length ? `<dl class="detail-dl">${info.fields.map(field => `<dt>${escapeHtml(field.label)}</dt><dd>${escapeHtml(field.value)}</dd>`).join('')}</dl>` : '';
    const previewHtml = previewStore[target] ? `<div class="detail-preview-html">${previewStore[target]}</div>` : '';
    const langBadge = `<span class="detail-lang-badge">${state.langPreference === 'th' ? 'การใช้งาน: ภาษาไทย (ผลลัพธ์เป็นภาษาอังกฤษ)' : 'Instruction language: English'}</span>`;
    els.detailPane.innerHTML = `
      <div>
        <h4>${escapeHtml(info.title)}</h4>
        ${langBadge}
        ${info.subtitle ? `<div class="detail-sub">${escapeHtml(info.subtitle)}</div>` : ''}
        ${tags}
        <p>${escapeHtml(info.description)}</p>
      </div>
      ${fields}
      ${previewHtml}
    `;
    if (els.metaSummary) {
      els.metaSummary.textContent = info.summary || info.title;
    }
    if (els.metaItem) {
      els.metaItem.textContent = item.__metaId || 'Record';
    }
  }

  function selectAndLoadItem(itemId){
    // Load an item from search results into the detail pane
    if (!itemId) return;
    state.selectedId = normalizeId(itemId);
    selectionStore[state.target] = state.selectedId;
    updateTargetLabels();
    renderConfigFrame(state.target);
  }

  function handleListInteraction(evt){
    const card = evt.target.closest('[data-item-id]');
    if (!card) return;
    const id = card.dataset.itemId;
    if (!id) return;
    state.selectedId = id;
    selectionStore[state.target] = id;
    updateTargetLabels();
    highlightActiveCard();
  }
  function activateTargetTab(target){
    if (!els.targetTabs) return;
    els.targetTabs.forEach((btn) => {
      const isActive = btn.dataset.targetTab === target;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function updateTargetLabels(){
    if (els.targetLabel) {
      els.targetLabel.textContent = TARGET_LABELS[state.target] || 'Services';
    }
    if (els.itemLabel) {
      els.itemLabel.textContent = state.selectedId ? `Editing ${state.selectedId}` : 'Waiting for AI selection';
    }
    if (els.metaTarget) {
      const fileMap = { services: 'services.json', giftVouchers: 'packages.json', promotions: 'promotions.json' };
      els.metaTarget.textContent = fileMap[state.target] || 'services.json';
    }
    if (els.metaItem) {
      els.metaItem.textContent = state.selectedId || 'None';
    }
    activateTargetTab(state.target);
    renderChips(state.target);
    updateLangBadge();
  }

  function changeTarget(target, options = {}){
    const normalized = normalizeTarget(target) || 'services';
    const targetChanged = normalized !== state.target;
    const hasDraft = !!state.draftJson || state.pendingAction === 'delete';
    if (targetChanged && hasDraft) {
      setStatus('Unsubmitted draft exists. Publish or reset before switching datasets.', 'error');
    }
    state.target = normalized;
    syncStateFromStores(state.target);
    if (Object.prototype.hasOwnProperty.call(options, 'selectedId')) {
      state.selectedId = options.selectedId != null ? normalizeId(options.selectedId) : null;
      selectionStore[state.target] = state.selectedId;
    }
    updateTargetLabels();
    if (!options.quiet && targetChanged) {
      setStatus(`Switched to ${TARGET_LABELS[normalized]}.`);
    }
    updateVoucherFilterVisibility();
    renderConfigFrame(normalized);
  }

  function updateVoucherFilterVisibility(){
    if (!els.voucherFilter) return;
    // Show filter only when viewing giftVouchers
    const isGiftVouchersTab = state.target === 'giftVouchers';
    els.voucherFilter.style.display = isGiftVouchersTab ? 'flex' : 'none';
  }

  function setVoucherFilter(filterType = 'all'){
    const lang = state.langPreference;
    const filterLabel = VOUCHER_FILTERS[filterType]?.[lang === 'th' ? 'labelTh' : 'label'] || 'All';
    
    state.voucherFilter = filterType;
    
    // Update button states
    if (els.voucherFilterBtns) {
      els.voucherFilterBtns.forEach((btn) => {
        const isActive = btn.dataset.filterType === filterType;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }
    
    // Re-render the list with new filter
    renderConfigFrame(state.target);
    setStatus(`Showing ${filterLabel}`, 'success');
  }

  function setLanguagePreference(lang){
    const normalized = lang === 'th' ? 'th' : 'en';
    state.langPreference = normalized;
    if (els.langButtons) {
      els.langButtons.forEach((btn) => {
        const isActive = btn.dataset.langChoice === normalized;
        btn.classList.toggle('is-active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    }
    const note = normalized === 'th'
      ? 'Instructions will be shown in Thai; outputs stay in English.'
      : 'Instructions and outputs will be in English.';
    setStatus(note);
    updateLangBadge();
    updateUIStrings();
    updateGuideContent();
    updateHeaderSubtitle();
    updateTabLabels();
    updateVoucherFilterLabels();
    renderChips();
    highlightActiveCard();
  }

  function updateVoucherFilterLabels(){
    if (!els.voucherFilter) return;
    const lang = state.langPreference;
    const filterLabel = root.querySelector('[data-filter-label-text]');
    if (filterLabel) {
      filterLabel.textContent = lang === 'th' ? 'แสดง:' : 'Show:';
    }
    if (els.voucherFilterBtns) {
      els.voucherFilterBtns.forEach((btn) => {
        const filterType = btn.dataset.filterType;
        if (VOUCHER_FILTERS[filterType]) {
          btn.textContent = lang === 'th' 
            ? VOUCHER_FILTERS[filterType].labelTh 
            : VOUCHER_FILTERS[filterType].label;
        }
      });
    }
  }

  function updateHeaderSubtitle(){
    const lang = state.langPreference;
    const subtitle = root.querySelector('[data-header-subtitle]');
    if (subtitle) {
      const content = UI_STRINGS[lang] || UI_STRINGS.en;
      subtitle.textContent = content.headerSubtitle;
    }
  }

  function updateTabLabels(){
    if (!els.targetTabs) return;
    const lang = state.langPreference;
    const labels = lang === 'th' ? TARGET_LABELS_TH : TARGET_LABELS;
    els.targetTabs.forEach((btn) => {
      const target = btn.dataset.targetTab;
      if (target && labels[target]) {
        btn.textContent = labels[target];
      }
    });
  }

  function updateLangBadge(){
    if (!els.langBadge) return;
    const lang = state.langPreference;
    const content = UI_STRINGS[lang] || UI_STRINGS.en;
    els.langBadge.textContent = content.langBadge;
  }

  function updateGuideContent(){
    const lang = state.langPreference;
    const content = GUIDE_CONTENT[lang] || GUIDE_CONTENT.en;
    
    const guideSummary = root.querySelector('[data-guide-summary]');
    if (guideSummary) guideSummary.textContent = lang === 'th' ? 'วิธีใช้ (คลิกเพื่อยุบ)' : 'How to use (click to collapse)';
    
    const guideTitle = root.querySelector('[data-guide-title]');
    if (guideTitle) guideTitle.textContent = content.title;
    
    const guideAddLabel = root.querySelector('[data-guide-add-label]');
    if (guideAddLabel) guideAddLabel.textContent = lang === 'th' ? 'เพิ่ม:' : 'Add:';
    
    const guideAdd = root.querySelector('[data-guide-add]');
    if (guideAdd) guideAdd.textContent = content.add;
    
    const guideChangeLabel = root.querySelector('[data-guide-change-label]');
    if (guideChangeLabel) guideChangeLabel.textContent = lang === 'th' ? 'เปลี่ยน:' : 'Change:';
    
    const guideChange = root.querySelector('[data-guide-change]');
    if (guideChange) guideChange.textContent = content.change;
    
    const guideDeleteLabel = root.querySelector('[data-guide-delete-label]');
    if (guideDeleteLabel) guideDeleteLabel.textContent = lang === 'th' ? 'ลบ:' : 'Delete:';
    
    const guideDelete = root.querySelector('[data-guide-delete]');
    if (guideDelete) guideDelete.textContent = content.delete;
    
    const guideSelect = root.querySelector('[data-guide-select]');
    if (guideSelect) guideSelect.textContent = content.select;
    
    const guideReview = root.querySelector('[data-guide-review]');
    if (guideReview) guideReview.textContent = content.review;
  }

  function updateUIStrings(){
    const lang = state.langPreference;
    const content = UI_STRINGS[lang] || UI_STRINGS.en;
    
    // Update textarea placeholder
    const textarea = root.querySelector('[data-placeholder-text]');
    if (textarea) textarea.placeholder = content.textareaPlaceholder;
    
    // Update send button
    const sendBtn = root.querySelector('[data-send-button]');
    if (sendBtn) sendBtn.textContent = content.sendButton;
    
    // Update publish CTA text
    const publishCtaText = root.querySelector('[data-publish-cta-text]');
    if (publishCtaText) {
      const langBadge = publishCtaText.querySelector('[data-lang-badge]');
      publishCtaText.textContent = content.reviewCTA + ' ';
      publishCtaText.appendChild(langBadge);
    }
    
    // Update publish button
    const publishBtn = root.querySelector('[data-publish-button]');
    if (publishBtn) publishBtn.textContent = content.submitButton;
  }

  function renderChips(target = state.target){
    if (!els.chipHost) return;
    const prompts = GUIDED_PROMPTS[target] || GUIDED_PROMPTS.services;
    els.chipHost.innerHTML = prompts.map((entry) => {
      const dataTarget = target ? `data-ai-target="${target}"` : '';
      const displayLabel = state.langPreference === 'th' && entry.labelTh ? entry.labelTh : entry.label;
      return `<button type="button" class="ai-chip" data-ai-chip="${escapeHtml(entry.prompt)}" ${dataTarget}>${escapeHtml(displayLabel)}</button>`;
    }).join('');
  }

  function renderPreviewPlaceholder(){
    currentItems = [];
    if (els.listPane) {
      els.listPane.innerHTML = '';
    }
    if (els.detailPane) {
      els.detailPane.innerHTML = '';
    }
    if (els.metadataPane) {
      els.metadataPane.hidden = true;
    }
    if (els.metaSummary) {
      els.metaSummary.textContent = 'Awaiting AI draft.';
    }
    if (els.metaItem) {
      els.metaItem.textContent = 'None';
    }
  }

  function toggleDraftActions(){
    const draft = state.draftJson;
    const diffText = state.diff || '';
    const hasDraft = !!draft;
    const hasDiff = !!(diffText && diffText.trim().length);
    const canPublish = hasDraft || state.pendingAction === 'delete';
    if (els.publishBtn) {
      els.publishBtn.disabled = !canPublish;
      els.publishBtn.hidden = false;
    }
    if (els.publishBtnSecondary) {
      els.publishBtnSecondary.disabled = !canPublish;
      els.publishBtnSecondary.hidden = false;
    }
    if (els.downloadBtn) {
      els.downloadBtn.disabled = !hasDraft;
      els.downloadBtn.hidden = !hasDraft;
    }
    if (els.metadataPane) {
      els.metadataPane.hidden = !(canPublish || hasDiff);
    }
  }

  function updateCharCount(){
    if (!els.input) return;
    const current = els.input.value.length;
    const counter = root.querySelector('#ai-char-count');
    const currentSpan = root.querySelector('#ai-char-current');
    if (!counter || !currentSpan) return;
    currentSpan.textContent = current;
    counter.classList.remove('ai-char-warning', 'ai-char-error');
    if (current > 900) {
      counter.classList.add('ai-char-error');
    } else if (current > 750) {
      counter.classList.add('ai-char-warning');
    }
  }

  function showRecentAction(action, itemLabel){
    const container = root.querySelector('#ai-recent-actions');
    const text = root.querySelector('#ai-recent-action-text');
    if (!container || !text) return;
    text.textContent = `${action} "${itemLabel}"`;
    container.style.display = 'flex';
    setTimeout(() => {
      container.style.display = 'none';
    }, 8000);
  }

  function sanitizeReply(text){
    if (!text) return '';
    
    // Convert to string and trim
    const clean = String(text).trim();
    
    // Filter out JSON, streaming artifacts, and garbage
    if (!clean || clean.length < 3) return '';
    if (/^[\s\W]*$/.test(clean)) return ''; // Only whitespace/symbols
    if (clean.startsWith('{') || clean.startsWith('[')) return ''; // JSON objects/arrays
    if (/^data:|^chunk:|^\[CHUNK\]:|^```|^{|}$/.test(clean)) return ''; // Streaming markers
    
    return clean;
  }

  function saveLastPublish(target, action, itemLabel, draftData){
    const backup = {
      timestamp: Date.now(),
      target,
      action,
      itemLabel,
      draft: draftData
    };
    try {
      localStorage.setItem(STORAGE_KEYS.lastPublish, JSON.stringify(backup));
      state.lastPublish = backup;
    } catch (err) {
      console.warn('Unable to save publish backup', err);
    }
  }

  function handleUndo(){
    if (!state.lastPublish) {
      setStatus('No recent action to undo.', 'info');
      return;
    }
    const { target, action, itemLabel, draft } = state.lastPublish;
    appendMessage('assistant', `Restored previous state for "${itemLabel}". Revert this if needed.`);
    setStatus(`Undo: Restored ${action} on "${itemLabel}".`, 'success');
    state.lastPublish = null;
    try {
      localStorage.removeItem(STORAGE_KEYS.lastPublish);
    } catch (err) {
      console.warn('Unable to clear publish backup', err);
    }
  }

  function setStatus(message, variant = 'info'){
    if (!els.status) return;
    els.status.textContent = message || '';
    els.status.classList.remove('is-error', 'is-success');
    if (variant === 'error') els.status.classList.add('is-error');
    if (variant === 'success') els.status.classList.add('is-success');
  }

  function showTypingIndicator(){
    if (!els.chatLog || els.chatLog.querySelector('.ai-chat-typing')) return;
    clearPlaceholder();
    const typing = document.createElement('div');
    typing.className = 'ai-chat-typing ai-chat-bubble ai';
    typing.innerHTML = `
      <div class="ai-chat-avatar">AI</div>
      <div class="ai-chat-message">
        <span class="ai-chat-typing-dot"></span>
        <span class="ai-chat-typing-dot"></span>
        <span class="ai-chat-typing-dot"></span>
      </div>
    `;
    els.chatLog.appendChild(typing);
    els.chatLog.scrollTop = els.chatLog.scrollHeight;
  }

  function hideTypingIndicator(){
    const typing = els.chatLog?.querySelector('.ai-chat-typing');
    if (typing) typing.remove();
  }

  function setBusy(flag){
    state.isBusy = flag;
    if (els.input) els.input.disabled = flag;
    if (els.sendBtn) els.sendBtn.disabled = flag;
    if (els.chipHost) {
      els.chipHost.querySelectorAll('button').forEach(btn => {
        btn.disabled = flag;
      });
    }
    if (els.langButtons) {
      els.langButtons.forEach(btn => { btn.disabled = flag; });
    }
    if (els.sttBtn) {
      els.sttBtn.disabled = flag || state.isListening;
    }
    if (els.form) els.form.setAttribute('aria-busy', flag ? 'true' : 'false');
  }

  function getHistorySnapshot(){
    return state.history.slice(-12);
  }

  function augmentMessage(message){
    const text = (message || '').toLowerCase();
    const isServiceContext = state.target === 'services' || text.includes('massage') || text.includes('service');
    const isPackageContext = state.target === 'giftVouchers' || text.includes('package');
    const hasUpdateCue = /update|change|edit|modify|tweak|adjust/.test(text);
    const hasShowCue = /show|view|display|list|find|search|lookup|check|get/.test(text);
    let guidance = '';
    if (isServiceContext) {
      guidance += ' You are helping staff manage the service catalog. When they say show/view/find/check (e.g., "Show me prenatal massage"), SEARCH for existing catalog items first by matching against BOTH title AND description fields. Display all matching results. DO NOT create new unless they explicitly ask "add" or "create new" OR you confirm after searching that zero matches exist. If "prenatal massage" appears anywhere (title or description), show it; if not, ask "I don\'t find prenatal massage. Would you like me to create it?" Ask which duration (60/75/90) when editing. Always ask for confirmation on ambiguous requests.';
    }
    if (isPackageContext) {
      guidance += ' For packages, search existing catalog first on show/view requests by matching title and description. Only create if explicitly requested. Packages must use existing services.';
    }
    const langGuidance = state.langPreference === 'th'
      ? ' Respond in Thai for instructions, but keep all generated descriptions, JSON, and previews in English.'
      : ' Respond in English; generated descriptions, JSON, and previews stay in English.';
    if (hasUpdateCue) {
      guidance += ' This is an UPDATE request: find the existing item first, never assume create new.';
    }
    if (hasShowCue) {
      guidance += ' This is a LOOKUP/SHOW request: search catalog title AND description, display what you find, never propose creating unless they ask or you confirm nothing exists.';
    }
    return `${message.trim()} ${guidance} ${langGuidance}`.trim();
  }

  function renderListPage(pageNum, allItems, itemsPerPage){
    // Remove old pagination controls if they exist
    const oldControls = els.chatLog?.querySelector('.ai-list-pagination-controls');
    if (oldControls) oldControls.remove();
    
    const oldChips = els.chatLog?.querySelector('.ai-chat-chips-container');
    if (oldChips) oldChips.remove();
    
    const start = (pageNum - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = allItems.slice(start, end);
    const totalPages = Math.ceil(allItems.length / itemsPerPage);
    
    // Create chips for current page
    const chipsHtml = pageItems.map(item => 
      `<button class="ai-chat-chip" data-load-item="${escapeHtml(item.id)}" title="Click to load">${escapeHtml(item.title)}</button>`
    ).join('');
    const chipContainer = document.createElement('div');
    chipContainer.className = 'ai-chat-chips-container';
    chipContainer.innerHTML = chipsHtml;
    els.chatLog.appendChild(chipContainer);
    
    // Attach click handlers to chips
    chipContainer.querySelectorAll('.ai-chat-chip').forEach(chip => {
      chip.addEventListener('click', (evt) => {
        const itemId = evt.target.dataset.loadItem;
        if (!itemId) return;
        selectAndLoadItem(itemId);
      });
    });
    
    // Create pagination controls if needed
    if (totalPages > 1) {
      const controls = document.createElement('div');
      controls.className = 'ai-list-pagination-controls';
      
      let paginationHtml = '';
      if (pageNum > 1) {
        paginationHtml += `<button class="ai-pagination-btn" data-go-page="${pageNum - 1}">← Previous</button>`;
      }
      
      paginationHtml += `<span class="ai-pagination-info">Page ${pageNum} of ${totalPages}</span>`;
      
      if (pageNum < totalPages) {
        paginationHtml += `<button class="ai-pagination-btn" data-go-page="${pageNum + 1}">Next →</button>`;
      }
      
      controls.innerHTML = paginationHtml;
      els.chatLog.appendChild(controls);
      
      // Attach pagination handlers
      controls.querySelectorAll('[data-go-page]').forEach(btn => {
        btn.addEventListener('click', (evt) => {
          const nextPage = parseInt(evt.target.dataset.goPage, 10);
          state.listPaginationState.currentPage = nextPage;
          renderListPage(nextPage, allItems, itemsPerPage);
        });
      });
    }
    
    els.chatLog.scrollTop = els.chatLog.scrollHeight;
  }

  async function sendPrompt(message){
    setBusy(true);
    setStatus('Sending to AI assistant...');
    showTypingIndicator();
    try {
      const enriched = augmentMessage(message);
      const payload = {
        message: enriched,
        history: getHistorySnapshot(),
        target: state.target,
        selectedId: state.selectedId,
        languagePreference: state.langPreference
      };
      const res = await fetchWithFallback(API_ROUTES.intent, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        let detail = '';
        try { detail = await res.text(); } catch (_) { /* ignore */ }
        throw new Error(`Intent API failed: ${res.status}${detail ? ` - ${detail}` : ''}`);
      }
      
      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error(`Invalid JSON response from API: ${parseErr.message}`);
      }
      
      // Validate response has required fields
      if (!data || typeof data !== 'object') {
        throw new Error('API returned empty or invalid response');
      }
      
      hideTypingIndicator();
      
      // Handle list results (show all)
      if (data.isListResult && Array.isArray(data.items)) {
        const items = data.items;
        const itemsPerPage = 5;
        const totalPages = Math.ceil(items.length / itemsPerPage);
        
        if (items.length === 0) {
          const reply = sanitizeReply(data.message) || `No items found. Try searching for something different, or create a new one.`;
          appendMessage('assistant', reply);
          setStatus('No results found.', 'info');
          setBusy(false);
          return;
        }
        
        const reply = sanitizeReply(data.message) || `Found ${items.length} items. Click one to view:`;
        appendMessage('assistant', reply);
        
        // Store pagination state
        state.listPaginationState = {
          allItems: items,
          currentPage: 1,
          itemsPerPage,
          totalPages
        };
        
        renderListPage(1, items, itemsPerPage);
        setBusy(false);
        return;
      }
      
      const reply = sanitizeReply(data.message || data.reply || data.notes) || 'Draft updated.';
      appendMessage('assistant', reply);
      
      // Better error handling for LLM response
      if (data.error) {
        setStatus(`AI Error: ${data.error}`, 'error');
        appendMessage('assistant', `I couldn't process that. ${sanitizeReply(data.error) || 'Try: "Add a 60-minute massage for $120"'}`);
      } else {
        applyDraftPayload(data);
        if (data.action === 'create') {
          showRecentAction('Created', data.draftJson?.name || 'New Item');
          if (data.draftJson?.id) {
            saveLastPublish(state.target, 'create', data.draftJson.name, data.draftJson);
          }
        } else if (data.action === 'update') {
          showRecentAction('Updated', data.draftJson?.name || 'Item');
          if (data.draftJson?.id) {
            saveLastPublish(state.target, 'update', data.draftJson.name, data.draftJson);
          }
        } else if (data.action === 'delete') {
          showRecentAction('Deleted', data.draftJson?.name || 'Item');
          if (data.draftJson?.id) {
            saveLastPublish(state.target, 'delete', data.draftJson.name, data.draftJson);
          }
        }
      }
    } catch (err) {
      console.error('ai-config intent error', err);
      hideTypingIndicator();
      let userMessage = 'I ran into an error. Please try again.';
      
      if (err.message?.includes('400')) {
        userMessage = 'I couldn\'t understand that. Try: "Show Swedish massages" or "Add a 90-minute facial."';
      } else if (err.message?.includes('missing record')) {
        userMessage = 'I had trouble identifying the item. Try being more specific: "Add Swedish massage 60min for $120" or "Show all services".';
      } else if (err.message?.includes('500')) {
        userMessage = 'The AI had trouble processing that. Try a simpler request or check the item details.';
      }
      
      appendMessage('assistant', userMessage);
      setStatus(err.message || 'Unable to contact AI assistant.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function applyDraftPayload(payload = {}){
    const nextTarget = normalizeTarget(payload.target);
    const nextSelected = Object.prototype.hasOwnProperty.call(payload, 'id')
      ? normalizeId(payload.id)
      : state.selectedId;
    if (nextTarget && nextTarget !== state.target) {
      changeTarget(nextTarget, { selectedId: nextSelected, skipRefresh: true, quiet: true });
    } else if (nextSelected !== state.selectedId) {
      state.selectedId = nextSelected;
    }
    selectionStore[state.target] = state.selectedId;
    const target = state.target;
    if (Object.prototype.hasOwnProperty.call(payload, 'draftJson')) {
      state.draftJson = payload.draftJson || null;
      draftStore[target] = payload.draftJson || null;
      if (!payload.draftJson && !Object.prototype.hasOwnProperty.call(payload, 'previewHtml')) {
        previewStore[target] = '';
      }
    }
    if (!state.selectedId && state.draftJson && !Array.isArray(state.draftJson) && state.draftJson.id) {
      state.selectedId = normalizeId(state.draftJson.id);
    }
    const hasDiffUpdate = Object.prototype.hasOwnProperty.call(payload, 'diff');
    if (hasDiffUpdate) {
      state.diff = payload.diff || '';
      diffStore[target] = state.diff;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'previewHtml')) {
      previewStore[target] = payload.previewHtml || '';
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'action')) {
      state.pendingAction = payload.action || 'update';
      actionStore[target] = state.pendingAction;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'section')) {
      state.draftSection = payload.section || null;
      sectionStore[target] = state.draftSection;
    } else if (payload.action === 'delete') {
      state.draftSection = null;
      sectionStore[target] = null;
    }
    state.draftJson = draftStore[target];
    if (!hasDiffUpdate) {
      state.diff = diffStore[target] || '';
    }
    if (els.metaStatus) {
      if (state.pendingAction === 'delete') {
        els.metaStatus.textContent = 'Pending delete';
      } else {
        els.metaStatus.textContent = state.draftJson ? 'Draft ready' : 'Awaiting chat request';
      }
    }
    updateTargetLabels();
    toggleDraftActions();
    renderConfigFrame(target);
    if (payload.notes) {
      setStatus(payload.notes, 'success');
    } else if (state.pendingAction === 'delete') {
      setStatus('Record marked for deletion.', 'success');
    } else if (state.draftJson) {
      setStatus('Draft updated from AI.', 'success');
    }
  }

  function resetWorkspace(){
    clearChat();
    state.draftJson = null;
    state.selectedId = null;
    state.diff = '';
    Object.keys(draftStore).forEach(key => { draftStore[key] = null; });
    Object.keys(previewStore).forEach(key => { previewStore[key] = ''; });
    Object.keys(diffStore).forEach(key => { diffStore[key] = ''; });
    Object.keys(actionStore).forEach(key => { actionStore[key] = 'update'; });
    Object.keys(sectionStore).forEach(key => { sectionStore[key] = null; });
    Object.keys(selectionStore).forEach(key => { selectionStore[key] = null; });
    state.pendingAction = 'update';
    state.draftSection = null;
    renderPreviewPlaceholder();
    updateTargetLabels();
    toggleDraftActions();
    if (els.metaStatus) {
      els.metaStatus.textContent = 'Awaiting chat request';
    }
    setStatus('Conversation reset.');
  }

  function handleFormSubmit(evt){
    evt.preventDefault();
    if (!els.input || state.isBusy) return;
    const value = els.input.value.trim();
    if (!value) return;
    appendMessage('user', value);
    els.input.value = '';
    sendPrompt(value);
  }

  function handleDownload(){
    if (state.isBusy) return;
    const draft = state.draftJson;
    if (!draft) {
      setStatus('No draft to download yet.', 'error');
      return;
    }
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.target}-draft.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    setStatus('Draft downloaded.', 'success');
  }

  function attachEvents(){
    if (els.form) {
      els.form.addEventListener('submit', handleFormSubmit);
    }
    if (els.input) {
      els.input.addEventListener('input', updateCharCount);
      els.input.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter' && !evt.shiftKey && !evt.altKey && !evt.ctrlKey && !evt.metaKey) {
          evt.preventDefault();
          if (state.isBusy) return;
          if (els.form?.requestSubmit) {
            els.form.requestSubmit();
          } else if (els.form) {
            els.form.dispatchEvent(new Event('submit', { cancelable: true }));
          }
        }
      });
    }
    if (els.chipHost) {
      els.chipHost.addEventListener('click', (evt) => {
        const btn = evt.target.closest('[data-ai-chip]');
        if (!btn) return;
        handleChipClick(btn);
      });
    }
    if (els.langButtons) {
      els.langButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          if (state.isBusy) return;
          setLanguagePreference(btn.dataset.langChoice || 'en');
          appendMessage('assistant', state.langPreference === 'th'
            ? 'ฉันจะแจ้งคำแนะนำเป็นภาษาไทย แต่จะสร้างข้อมูลและร่างเป็นภาษาอังกฤษเสมอ.'
            : 'I will keep instructions and outputs in English.');
        });
      });
    }
    if (els.sttBtn) {
      els.sttBtn.addEventListener('click', () => {
        if (state.isBusy) return;
        if (speechController) speechController.toggle();
      });
    }
    if (els.resetBtn) {
      els.resetBtn.addEventListener('click', () => {
        if (state.isBusy) return;
        resetWorkspace();
      });
    }
    if (els.downloadBtn) {
      els.downloadBtn.addEventListener('click', handleDownload);
    }
    const undoBtn = root.querySelector('#ai-undo-btn');
    if (undoBtn) {
      undoBtn.addEventListener('click', handleUndo);
    }
    if (els.listPane) {
      els.listPane.addEventListener('click', handleListInteraction);
      els.listPane.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter' || evt.key === ' ') {
          evt.preventDefault();
          handleListInteraction(evt);
        }
      });
    }
    if (els.targetTabs) {
      els.targetTabs.forEach((btn) => {
        btn.addEventListener('click', () => {
          const nextTarget = btn.dataset.targetTab;
          if (!nextTarget || state.isBusy) return;
          if (nextTarget === state.target) return;
          changeTarget(nextTarget);
        });
      });
    }
    if (els.voucherFilterBtns) {
      els.voucherFilterBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const filterType = btn.dataset.filterType;
          if (!filterType || state.isBusy) return;
          if (filterType === state.voucherFilter) return;
          setVoucherFilter(filterType);
        });
      });
    }
    if (els.publishBtn) {
      els.publishBtn.addEventListener('click', handlePublish);
    }
    if (els.publishBtnSecondary) {
      els.publishBtnSecondary.addEventListener('click', handlePublish);
    }
  }

  async function handlePublish(){
    if (state.isBusy) return;
    const hasDraft = state.pendingAction === 'delete' || !!state.draftJson;
    if (!hasDraft) return;
    if (state.pendingAction === 'delete' && !state.selectedId) {
      setStatus('Select a record before publishing a delete.', 'error');
      return;
    }
    
    // Require explicit confirmation for create actions
    if (state.pendingAction === 'create') {
      const itemName = state.draftJson?.name || 'New Item';
      const confirmed = confirm(`Are you sure you want to CREATE "${itemName}"?\n\nThis will add it to your ${state.target} list.`);
      if (!confirmed) {
        setStatus('Create cancelled.', 'info');
        return;
      }
    }
    
    setBusy(true);
    setStatus('Publishing draft...');
    try {
      const payload = {
        target: state.target,
        action: state.pendingAction,
        draftJson: state.draftJson,
        selectedId: state.selectedId,
        section: state.draftSection
      };
      const res = await fetchWithFallback(API_ROUTES.publish, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Publish failed (${res.status})`);
      await res.json().catch(() => ({}));
      setStatus('Publish complete.', 'success');
      appendMessage('assistant', 'Changes committed and published.');
      draftStore[state.target] = null;
      diffStore[state.target] = '';
      previewStore[state.target] = '';
      actionStore[state.target] = 'update';
      sectionStore[state.target] = null;
      selectionStore[state.target] = null;
      state.draftJson = null;
      state.diff = '';
      state.pendingAction = 'update';
      state.draftSection = null;
      renderPreviewPlaceholder();
      updateTargetLabels();
      toggleDraftActions();
    } catch (err) {
      console.error('ai-config publish error', err);
      setStatus('Publish failed -- check logs.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function init(){
    // Reset to default state on page load
    resetWorkspace();
    loadHistory();
    loadLastPublish();
    if (state.history.length) {
      renderHistoryLog();
    } else if (typeof showPlaceholder === 'function') {
      showPlaceholder();
    }
    renderPreviewPlaceholder();
    updateTargetLabels();
    updateVoucherFilterLabels();
    updateVoucherFilterVisibility();
    updateUIStrings();
    renderChips(state.target);
    toggleDraftActions();
    setStatus('Ready to help. What would you like to change?');
    speechController = createSpeechController({ state, els, setLanguagePreference, setStatus });
    attachEvents();
    attachClickableFieldListeners(state.target);  // Enable clickable preview elements
    
    // Warm up the API on page load (sends a minimal ping to prevent cold start)
    warmUpApi().catch(() => {
      // Silently fail; this is just a warm-up
    });
  }

  async function warmUpApi(){
    try {
      const warmupTimeout = setTimeout(() => {}, 2000);
      await fetch(API_ROUTES.intent[0], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: 'ping',
          history: [],
          target: 'services',
          selectedId: null,
          languagePreference: 'en',
          isWarmup: true
        })
      }).then(() => clearTimeout(warmupTimeout)).catch(() => clearTimeout(warmupTimeout));
    } catch (err) {
      // Warm-up ping failed silently
    }
  }

  init();

  window.AIConfigAssistant = {
    setTarget(target, selectedId){
      if (target) {
        changeTarget(target, { selectedId, quiet: true });
      }
      state.draftJson = draftStore[state.target];
      state.diff = diffStore[state.target] || '';
      state.pendingAction = actionStore[state.target] || 'update';
      state.draftSection = sectionStore[state.target] || null;
      state.selectedId = selectionStore[state.target] || null;
      updateTargetLabels();
      renderConfigFrame(state.target);
      toggleDraftActions();
    },
    loadDraft(payload = {}){
      applyDraftPayload(payload);
    },
    get history(){
      return state.history;
    }
  };
})();
