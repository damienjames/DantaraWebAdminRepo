import { VALID_TARGETS } from './ai-config-constants.js';

export function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function normalizeId(value) {
  if (value === undefined || value === null) return null;
  return String(value);
}

export function normalizeTarget(value) {
  if (!value) return null;
  const key = String(value);
  return VALID_TARGETS.includes(key) ? key : null;
}

export function formatPrice(value) {
  if (value == null || value === '') return '';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
}

export function computeStableId(item, index, target) {
  const candidates = [item.__metaId, item.id, item.slug, item.code, item.name, item.title];
  for (const value of candidates) {
    if (value === 0 || value) {
      const str = String(value).trim();
      if (str) return str;
    }
  }
  return `${target}-${index}`;
}

export function annotateList(list, target, options = {}) {
  return list.map((item, index) => {
    const clone = typeof item === 'object' && item !== null ? { ...item } : { value: item };
    clone.__metaId = computeStableId(clone, index, target);
    clone.__isDraft = !!options.isDraft;
    clone.__isNew = !!options.isNew;
    return clone;
  });
}

export function getRenderableItems(draft, target) {
  if (!draft) return [];
  if (Array.isArray(draft)) {
    return annotateList(draft, target, { isDraft: true });
  }
  if (draft && typeof draft === 'object') {
    return annotateList([draft], target, { isDraft: true });
  }
  return [];
}

export function describeItem(item, target) {
  const summary = { title: 'Untitled', subtitle: '', meta: [], description: '', price: '', tags: [], fields: [], rawSnippet: '', summary: '' };
  if (target === 'services') {
    const price = item.base_price ?? item.price ?? item.amount;
    const duration = item.duration_minutes ?? item.duration ?? item.durationMinutes;
    const title = item.service || item.name || item.title || 'Service';
    summary.title = title;
    summary.subtitle = item.category || item.group || 'Service';
    summary.meta = [duration ? `${duration} min` : null, item.modality].filter(Boolean);
    summary.price = price != null ? formatPrice(price) : '';
    summary.description = item.description || 'No description available.';
    summary.tags = Array.isArray(item.tags) ? item.tags : [];
    summary.fields = [
      { label: 'Duration', value: duration ? `${duration} minutes` : '—' },
      { label: 'Price', value: summary.price || '—' },
      { label: 'Status', value: item.is_active === false ? 'Inactive' : 'Active' }
    ];
    summary.summary = summary.price ? `${title} • ${summary.price}` : title;
  } else if (target === 'giftVouchers') {
    const price = item.price ?? item.amount ?? item.value;
    summary.title = item.title || 'Package';
    summary.subtitle = item.featured ? 'Featured package' : (item.subtitle || 'Package');
    summary.meta = [item.featured ? 'Featured' : null, item.type || 'Package'].filter(Boolean);
    summary.price = price != null ? formatPrice(price) : '';
    summary.description = item.description || 'No description provided.';
    summary.tags = Array.isArray(item.tags) ? item.tags : [];
    summary.fields = [
      { label: 'Value', value: summary.price || '—' },
      { label: 'Image', value: item.image || '—' },
      { label: 'Code', value: item.id || '—' }
    ];
    summary.summary = summary.price ? `${summary.title} • ${summary.price}` : summary.title;
  } else {
    const windowText = [item.start, item.end].filter(Boolean).join(' → ');
    summary.title = item.title || 'Promotion';
    summary.subtitle = item.placement || 'Promotion';
    summary.meta = Array.isArray(item.chips) ? item.chips : [];
    summary.price = '';
    const descParts = [item.description, item.finePrint ? `Fine print: ${item.finePrint}` : ''].filter(Boolean);
    summary.description = descParts.join('\n\n') || 'No description provided.';
    summary.tags = summary.meta;
    summary.fields = [
      { label: 'Window', value: windowText || 'Flexible' },
      { label: 'Priority', value: item.priority != null ? String(item.priority) : '—' },
      { label: 'CTA', value: item.cta?.label || '—' }
    ];
    summary.summary = item.title || 'Promotion';
  }
  try {
    summary.rawSnippet = JSON.stringify(item, null, 2).slice(0, 1200);
  } catch {
    summary.rawSnippet = '';
  }
  return summary;
}

export function buildCardMarkup(target, item, selectedId) {
  const info = describeItem(item, target);
  const classes = ['ai-config-card'];
  if (item.__isDraft) classes.push('is-draft');
  if (item.__isNew) classes.push('is-new');
  if (item.__metaId === selectedId) classes.push('is-active');
  const metaHtml = info.meta.length ? `<div class="card-meta">${info.meta.map(meta => `<span>${escapeHtml(meta)}</span>`).join('')}</div>` : '';
  const subtitle = info.subtitle ? `<div class="card-meta">${escapeHtml(info.subtitle)}</div>` : '';
  const price = info.price ? `<div class="card-price">${escapeHtml(info.price)}</div>` : '';
  return `
    <div class="ai-config-card" role="button" aria-pressed="false" tabindex="0" data-item-id="${escapeHtml(item.__metaId)}">
      ${metaHtml}
      <h4>${escapeHtml(info.title)}</h4>
      ${subtitle}
      ${price}
      <p>${escapeHtml(info.description)}</p>
    </div>
  `;
}
