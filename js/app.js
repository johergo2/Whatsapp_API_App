/* ============================================
   Mercurio Send - Main Application
   ============================================ */
const MAX_STATUS_LEN = 40;

const App = (() => {
  let state = {
    cliente: null,
    variables: null,
    templates: [],
    prospects: [],
    messages: [],
    currentSection: 'dashboard',
    sending: false,
    editingTemplateId: null,
    editingProspectIdx: -1,
    selectedTemplateId: null,
    sendFormData: {},
    prosTemplateId: null,
  };

  function $(id) { return document.getElementById(id); }

  // --- Init ---
  function init() {
    loadState();
    bindEvents();
    checkLogin();
  }

  function bindEvents() {
    $('login-form').addEventListener('submit', handleLogin);
    $('template-form').addEventListener('submit', saveTemplate);
    $('prospect-form').addEventListener('submit', saveProspect);
    $('tpl-num-footer').addEventListener('change', updateFooterCaptions);
    const importInput = $('import-csv');
    if (importInput) importInput.addEventListener('change', importCSV);
  }

  // --- Persistencia ---
  function saveState() {
    try {
      localStorage.setItem('mercurio_state', JSON.stringify({
        templates: state.templates,
        prospects: state.prospects,
        messages: state.messages,
        sendFormData: state.sendFormData,
      }));
    } catch (e) { /* ignore */ }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem('mercurio_state');
      if (raw) {
        const data = JSON.parse(raw);
        state.templates = (data.templates || []).map(migrateTemplate);
        state.prospects = data.prospects || [];
        state.messages = data.messages || [];
        state.sendFormData = data.sendFormData || {};
      }
    } catch (e) { /* ignore */ }
  }

  function migrateTemplate(t) {
    // Migrar captions antiguos (caption_text único → footer_captions array)
    let footerCaptions = t.footer_captions || [];
    if (footerCaptions.length === 0 && (t.has_caption || t.caption || t.caption_text)) {
      const oldText = t.caption_text || t.caption || '';
      const num = t.has_footer !== undefined ? (t.has_footer ? (t.num_footer || 4) : 0) : (t.num_footer || 0);
      footerCaptions = Array(num).fill(oldText);
    }
    return {
      id: t.id,
      name: t.name || '',
      template_name: t.template_name || '',
      language_code: t.language_code || 'es_CO',
      num_textos: t.num_textos || 4,
      has_header: t.has_header || false,
      num_footer: t.has_footer !== undefined ? (t.has_footer ? (t.num_footer || 4) : 0) : (t.num_footer || 0),
      footer_captions: footerCaptions,
      message_example: t.message_example || '',
    };
  }

  // --- Login ---
  function checkLogin() {
    const savedKey = localStorage.getItem('mercurio_api_key');
    if (savedKey) {
      API.setApiKey(savedKey);
      $('api-key').value = savedKey;
      validateAndEnter();
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    const key = $('api-key').value.trim();
    if (!key) return;
    API.setApiKey(key);
    await validateAndEnter();
  }

  async function validateAndEnter() {
    const btn = $('login-form').querySelector('.btn-primary');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    const errEl = $('login-error');
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-flex';
    errEl.textContent = '';
    try {
      state.cliente = await API.getCliente();
      state.variables = await API.getVariables();
      localStorage.setItem('mercurio_api_key', API.getApiKey());
      enterApp();
    } catch (e) {
      if (API.isMockMode()) {
        state.cliente = await API.getCliente();
        state.variables = await API.getVariables();
        localStorage.setItem('mercurio_api_key', API.getApiKey());
        enterApp();
      } else {
        errEl.textContent = 'Error: ' + (e.message || 'API Key inválida');
        API.setApiKey('');
      }
    } finally {
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
  }

  function updateFooterCaptions() {
    const num = parseInt($('tpl-num-footer').value) || 0;
    const container = $('tpl-footer-captions');
    if (num === 0) { container.innerHTML = ''; return; }
    let html = '<h4>Texto para cada imagen</h4><div class="form-row" style="grid-template-columns:1fr">';
    for (let i = 1; i <= num; i++) {
      const val = container.dataset[`caption${i}`] || '';
      html += `<div class="form-group">
        <label for="tpl-caption-${i}">Texto para imagen ${i}</label>
        <input type="text" id="tpl-caption-${i}" value="${escapeHtml(val)}" placeholder="Texto opcional que aparecerá debajo de la imagen ${i}">
      </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
  }

  function togglePassword(id, btn) {
    const input = $(id);
    if (input.type === 'password') {
      input.type = 'text';
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    } else {
      input.type = 'password';
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    }
  }

  function logout() {
    localStorage.removeItem('mercurio_api_key');
    state.cliente = null;
    state.variables = null;
    $('main-app').classList.remove('active');
    $('login-screen').classList.add('active');
  }

  function enterApp() {
    $('login-screen').classList.remove('active');
    $('main-app').classList.add('active');
    if (API.isMockMode()) {
      $('demo-banner').style.display = 'flex';
      $('main-content').style.marginTop = '46px';
    } else {
      $('demo-banner').style.display = 'none';
    }
    renderDashboard();
    renderTemplates();
    renderProspects();
    renderSendTemplateSelect();
    updateBadge();
  }

  // --- Navegación ---
  function navigateTo(section) {
    state.currentSection = section;
    document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    $(`section-${section}`).classList.add('active');
    document.querySelector(`.nav-item[data-section="${section}"]`).classList.add('active');
    if (section === 'dashboard') renderDashboard();
    if (section === 'config') renderTemplates();
    if (section === 'prospects') renderProspects();
    if (section === 'send') resetSendForm();
    if (section === 'history') renderHistory();
    const sidebar = $('sidebar');
    if (sidebar.classList.contains('open')) sidebar.classList.remove('open');
  }

  function toggleSidebar() {
    $('sidebar').classList.toggle('open');
  }

  // ===========================================
  //  TEMPLATE MANAGER
  // ===========================================
  function renderTemplates() {
    $('template-counter').textContent = state.templates.length + ' plantillas';
    const list = $('template-list');

    if (state.templates.length === 0) {
      list.innerHTML = '<div class="empty-state" style="padding:40px;text-align:center;color:var(--text-secondary)">No hay plantillas definidas. Cree una nueva.</div>';
      return;
    }

    list.innerHTML = state.templates.map(t => {
      const headerLabel = t.has_header ? 'Cabecera Sí' : 'Cabecera No';
      const footerLabel = t.num_footer > 0 ? `${t.num_footer} imág. final` : 'Sin imág. final';
      const textosLabel = `${t.num_textos} textos`;
      const captionsList = (t.footer_captions || []).filter(c => c);
      return `
        <div class="template-card">
          <h4>${escapeHtml(t.name)}</h4>
          <div class="tpl-meta">${escapeHtml(t.template_name)} · ${t.language_code}</div>
          <div class="tpl-features">
            <span class="tpl-feature ${t.has_header ? 'active' : 'inactive'}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              ${headerLabel}
            </span>
            <span class="tpl-feature active">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              ${textosLabel}
            </span>
            <span class="tpl-feature ${t.num_footer > 0 ? 'active' : 'inactive'}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              ${footerLabel}
            </span>
          </div>
          ${captionsList.length > 0 ? `<div class="tpl-meta">✏️ ${captionsList.map((c, i) => `Img${i + 1}: ${escapeHtml(c)}`).join(' | ')}</div>` : ''}
          ${t.message_example ? `<div class="tpl-meta" style="margin-top:8px;padding:8px;background:#F9F9F9;border-radius:6px;font-style:italic;font-size:12px;line-height:1.4;white-space:pre-wrap">${escapeHtml(t.message_example)}</div>` : ''}
          <div class="tpl-actions">
            <button class="btn btn-outline btn-sm" onclick="App.editTemplate('${t.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar
            </button>
            <button class="btn btn-outline btn-sm btn-danger" onclick="App.deleteTemplate('${t.id}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              Eliminar
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function showTemplateModal(id) {
    state.editingTemplateId = id || null;
    const modal = $('template-modal');
    const title = $('template-modal-title');
    const form = $('template-form');

    if (id) {
      const t = state.templates.find(t => t.id === id);
      if (!t) return;
      title.textContent = 'Editar plantilla';
      $('template-id').value = id;
      $('tpl-name').value = t.name;
      $('tpl-template-name').value = t.template_name;
      $('tpl-language').value = t.language_code;
      $('tpl-num-textos').value = t.num_textos;
      $('tpl-has-header').checked = t.has_header;
      $('tpl-num-footer').value = t.num_footer;
      $('tpl-num-footer').value = t.num_footer;
      const container = $('tpl-footer-captions');
      const captions = t.footer_captions || [];
      for (let i = 1; i <= t.num_footer; i++) {
        container.dataset[`caption${i}`] = captions[i - 1] || '';
      }
      $('tpl-example').value = t.message_example || '';
      updateFooterCaptions();
    } else {
      title.textContent = 'Nueva plantilla';
      form.reset();
      $('template-id').value = '';
      $('tpl-has-header').checked = false;
      $('tpl-num-textos').value = 4;
      $('tpl-num-footer').value = 0;
      $('tpl-example').value = '';
      $('tpl-footer-captions').innerHTML = '';
    }
    modal.style.display = 'flex';
  }

  function hideTemplateModal() {
    $('template-modal').style.display = 'none';
  }

  function saveTemplate(e) {
    e.preventDefault();
    const id = $('template-id').value;
    const numFooter = parseInt($('tpl-num-footer').value) || 0;
    const footerCaptions = [];
    for (let i = 1; i <= numFooter; i++) {
      const el = $(`tpl-caption-${i}`);
      footerCaptions.push(el ? el.value.trim() : '');
    }
    const data = {
      id: id || crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: $('tpl-name').value.trim(),
      template_name: $('tpl-template-name').value.trim(),
      language_code: $('tpl-language').value,
      num_textos: parseInt($('tpl-num-textos').value) || 4,
      has_header: $('tpl-has-header').checked,
      num_footer: numFooter,
      footer_captions: footerCaptions,
      message_example: $('tpl-example').value.trim(),
    };

    if (!data.name || !data.template_name) {
      showToast('Nombre y nombre en Meta son obligatorios', 'error');
      return;
    }

    if (id) {
      const idx = state.templates.findIndex(t => t.id === id);
      if (idx >= 0) state.templates[idx] = data;
    } else {
      state.templates.push(data);
    }

    saveState();
    renderTemplates();
    renderSendTemplateSelect();
    hideTemplateModal();
    showToast(id ? 'Plantilla actualizada' : 'Plantilla creada', 'success');
  }

  function editTemplate(id) {
    showTemplateModal(id);
  }

  function deleteTemplate(id) {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    state.templates = state.templates.filter(t => t.id !== id);
    if (state.selectedTemplateId === id) state.selectedTemplateId = null;
    saveState();
    renderTemplates();
    renderSendTemplateSelect();
    showToast('Plantilla eliminada', 'success');
  }

  // ===========================================
  //  SEND - FORMULARIOS DINÁMICOS
  // ===========================================
  function renderSendTemplateSelect() {
    const sel = $('send-template-select');
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">-- Seleccione una plantilla --</option>' +
      state.templates.map(t => `<option value="${t.id}">${escapeHtml(t.name)} (${escapeHtml(t.template_name)})</option>`).join('');
    if (currentVal && state.templates.find(t => t.id === currentVal)) sel.value = currentVal;
  }

  function resetSendForm() {
    if (state.selectedTemplateId) saveSendFormData();
    state.selectedTemplateId = null;
    $('send-step-values').style.display = 'none';
    $('send-step-send').style.display = 'none';
    $('send-progress-card').style.display = 'none';
    $('send-template-preview').style.display = 'none';
    renderSendTemplateSelect();
    $('send-template-select').value = '';
  }

  function onTemplateChange() {
    const id = $('send-template-select').value;
    // Guardar datos del formulario anterior antes de cambiar
    if (state.selectedTemplateId) saveSendFormData();
    if (!id) {
      $('send-step-values').style.display = 'none';
      $('send-step-send').style.display = 'none';
      $('send-template-preview').style.display = 'none';
      state.selectedTemplateId = null;
      return;
    }

    const t = state.templates.find(t => t.id === id);
    if (!t) return;

    state.selectedTemplateId = id;

    // Preview
    $('send-template-preview').style.display = 'block';
    $('send-preview-name').textContent = t.template_name;
    $('send-preview-lang').textContent = t.language_code;
    $('send-preview-header').textContent = t.has_header ? 'Sí' : 'No';
    $('send-preview-textos').textContent = t.num_textos;
    $('send-preview-footer').textContent = t.num_footer > 0 ? `${t.num_footer} imágenes` : 'No';
    const exampleEl = $('send-preview-example');
    if (t.message_example) {
      exampleEl.textContent = t.message_example;
      exampleEl.style.display = 'block';
    } else {
      exampleEl.style.display = 'none';
    }

    // Generar campos dinámicos
    renderDynamicFields(t);
    $('send-step-values').style.display = 'block';
    $('send-step-send').style.display = 'block';
    updateSendSummary();
  }

  function renderDynamicFields(t) {
    const container = $('send-dynamic-fields');
    const saved = state.sendFormData[t.id] || {};
    let html = '<div class="dynamic-fields">';

    // Campos de texto
    if (t.num_textos > 0) {
      html += '<div class="dynamic-section field-required">';
      html += `<h4>Variables de texto (${t.num_textos})</h4>`;
      html += '<div class="form-row" style="grid-template-columns: repeat(2,1fr)">';
      for (let i = 1; i <= t.num_textos; i++) {
        const val = saved[`texto${i}`] !== undefined ? saved[`texto${i}`] : '';
        html += `<div class="form-group">
          <label for="send-texto${i}">Texto ${i}</label>
          <input type="text" id="send-texto${i}" value="${escapeHtml(val)}" placeholder="Valor para texto${i}" required>
        </div>`;
        if (i % 2 === 0 && i < t.num_textos) html += '</div><div class="form-row" style="grid-template-columns: repeat(2,1fr)">';
      }
      html += '</div></div>';
    }

    // Imagen de cabecera
    if (t.has_header) {
      const val = saved.header_img !== undefined ? saved.header_img : '';
      html += '<div class="dynamic-section field-required">';
      html += '<h4>Imagen de cabecera</h4>';
      html += `<div class="form-group">
          <label for="send-header-img">URL por defecto</label>
          <input type="url" id="send-header-img" value="${escapeHtml(val)}" placeholder="https://...">
        </div>`;
      html += '</div>';
    }

    // Imágenes al final con su texto asociado
    if (t.num_footer > 0) {
      html += '<div class="dynamic-section field-required">';
      html += `<h4>Imágenes al final del mensaje (${t.num_footer})</h4>`;
      html += '<p class="field-hint">URLs por defecto. Luego en Prospectos puede sobreescribir la URL para cada prospecto.</p>';
      for (let i = 1; i <= t.num_footer; i++) {
        const urlVal = saved[`footer_url${i}`] !== undefined ? saved[`footer_url${i}`] : '';
        const captionVal = saved[`caption${i}`] !== undefined ? saved[`caption${i}`] : (t.footer_captions?.[i - 1] || '');
        html += `<div style="display:flex;gap:12px;align-items:flex-end;margin-bottom:12px">
          <div class="form-group" style="flex:2">
            <label for="send-footer-url-${i}">URL imagen ${i}</label>
            <input type="url" id="send-footer-url-${i}" value="${escapeHtml(urlVal)}" placeholder="https://...">
          </div>
          <div class="form-group" style="flex:1">
            <label for="send-footer-caption-${i}">Texto imagen ${i} (opcional)</label>
            <input type="text" id="send-footer-caption-${i}" value="${escapeHtml(captionVal)}" placeholder="Texto debajo de la imagen ${i}">
          </div>
        </div>`;
      }
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  function saveSendFormData() {
    const tplId = state.selectedTemplateId;
    if (!tplId) return;
    const tpl = state.templates.find(t => t.id === tplId);
    if (!tpl) return;
    const data = {};
    for (let i = 1; i <= tpl.num_textos; i++) {
      const el = $(`send-texto${i}`);
      if (el) data[`texto${i}`] = el.value;
    }
    if (tpl.has_header) {
      const el = $('send-header-img');
      if (el) data.header_img = el.value;
    }
    for (let i = 1; i <= tpl.num_footer; i++) {
      const elUrl = $(`send-footer-url-${i}`);
      const elCap = $(`send-footer-caption-${i}`);
      if (elUrl) data[`footer_url${i}`] = elUrl.value;
      if (elCap) data[`caption${i}`] = elCap.value;
    }
    state.sendFormData[tplId] = data;
    saveState();
  }

  function clearSendForm() {
    const tplId = state.selectedTemplateId;
    if (!tplId) return;
    delete state.sendFormData[tplId];
    saveState();
    const tpl = state.templates.find(t => t.id === tplId);
    if (tpl) renderDynamicFields(tpl);
    showToast('Campos del formulario limpiados', 'success');
  }

  function updateSendSummary() {
    const c = state.cliente;
    const max = c ? (parseInt(c.requests_max) || 0) : 0;
    const usadas = c ? (parseInt(c.requests_usadas) || 0) : 0;
    const disponibles = max - usadas;
    $('send-summary-count').textContent = state.prospects.filter(p => !p.estado).length;
    $('send-summary-plan').textContent = c?.plan || '-';
    $('send-summary-total').textContent = max;
    $('send-summary-available').textContent = disponibles;
    const cutoff = c?.periodo_fin ? formatDate(c.periodo_fin) : '';
    $('send-summary-cutoff').textContent = cutoff ? `Corte: ${cutoff}` : '';
  }

  // ===========================================
  //  PROSPECTOS - PÁGINA UNIFICADA
  // ===========================================
  function renderProspects() {
    renderProsTemplateSelect();
    const tpl = getProsTemplate();
    renderProsColumns(tpl);
    renderProsTable(tpl);
    updateProsSummary();
  }

  function getProsTemplate() {
    if (!state.prosTemplateId) return null;
    return state.templates.find(t => t.id === state.prosTemplateId) || null;
  }

  function renderProsTemplateSelect() {
    const sel = $('pros-template-select');
    const cur = sel.value;
    sel.innerHTML = '<option value="">-- Seleccione una plantilla --</option>' +
      state.templates.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
    if (cur && state.templates.find(t => t.id === cur)) sel.value = cur;
  }

  function onProsTemplateChange() {
    const id = $('pros-template-select').value;
    state.prosTemplateId = id || null;
    const tpl = getProsTemplate();
    renderProsColumns(tpl);
    renderProsTable(tpl);
    updateProsSummary();
    saveState();
  }

  function renderProsColumns(tpl) {
    const tr = $('prospects-header-row');
    // Remove all previously inserted dynamic <th> (those with class th-dyn)
    tr.querySelectorAll('.th-dyn').forEach(el => el.remove());

    if (tpl && tpl.has_header) {
      const th = document.createElement('th');
      th.className = 'th-dyn';
      th.textContent = 'URL Cabecera';
      tr.insertBefore(th, tr.children[2]); // before Estado
    }

    if (tpl && tpl.num_footer > 0) {
      for (let j = 1; j <= tpl.num_footer; j++) {
        const thUrl = document.createElement('th');
        thUrl.className = 'th-dyn';
        thUrl.textContent = `URL img ${j}`;
        tr.insertBefore(thUrl, tr.children[tr.children.length - 2]); // before Estado

        const thCap = document.createElement('th');
        thCap.className = 'th-dyn';
        thCap.style.width = '44px';
        thCap.style.textAlign = 'center';
        thCap.textContent = '✏️';
        tr.insertBefore(thCap, tr.children[tr.children.length - 2]); // before Estado
      }
    }
  }

  function renderProsTable(tpl) {
    const tbody = $('prospects-table-body');
    $('prospect-counter').textContent = state.prospects.length + ' prospectos';

    if (state.prospects.length === 0) {
      const cols = 2 + (tpl?.has_header ? 1 : 0) + (tpl?.num_footer || 0) * 2 + 2;
      tbody.innerHTML = `<tr><td colspan="${cols}" class="empty-state">No hay prospectos. Agregue uno o importe un archivo CSV.</td></tr>`;
      return;
    }

    const defaults = (tpl && state.sendFormData[tpl.id]) || {};

    tbody.innerHTML = state.prospects.map((p, i) => {
      if (!p.captions) p.captions = [];
      let cells = `<td><strong>${escapeHtml(p.nombre)}</strong></td>
        <td>${escapeHtml(p.telefono)}</td>`;

      if (tpl?.has_header) {
        const val = p.header_img || defaults.header_img || '';
        cells += `<td><input type="url" class="cell-input" value="${escapeHtml(val)}"
          onchange="App.updateProspectField(${i},'header_img',this.value)"
          placeholder="URL cabecera"></td>`;
      }

      for (let j = 0; j < (tpl?.num_footer || 0); j++) {
        const urlVal = (p.footer_imgs && p.footer_imgs[j]) || defaults[`footer_url${j + 1}`] || '';
        cells += `<td><input type="url" class="cell-input" value="${escapeHtml(urlVal)}"
          onchange="App.updateProspectField(${i},'footer_${j}',this.value)"
          placeholder="URL img ${j + 1}"></td>`;
        cells += `<td class="caption-cell">
          <button class="btn-icon" onclick="App.openCaptionEditor(${i},${j})" title="Editar texto de imagen ${j + 1}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </td>`;
      }

      cells += `<td class="status-cell">${renderStatus(p.estado)}</td>
        <td class="actions-cell">
          <button class="btn btn-icon" onclick="App.editProspect(${i})" title="Editar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="btn btn-icon btn-danger" onclick="App.deleteProspect(${i})" title="Eliminar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </td>`;

      return `<tr>${cells}</tr>`;
    }).join('');
  }

  function updateProspectField(idx, field, value) {
    const p = state.prospects[idx];
    if (!p) return;
    if (field === 'header_img') {
      p.header_img = value;
    } else if (field.startsWith('footer_')) {
      const imgIdx = parseInt(field.split('_')[1]);
      if (!p.footer_imgs) p.footer_imgs = [];
      p.footer_imgs[imgIdx] = value;
    }
    saveState();
  }

  function openCaptionEditor(prospectIdx, imgIdx) {
    const p = state.prospects[prospectIdx];
    if (!p) return;
    if (!p.captions) p.captions = [];
    const tpl = getProsTemplate();
    // Valor efectivo: prospect override > sendFormData default > template default
    const effective = p.captions[imgIdx] || 
      (state.sendFormData[tpl?.id] ? state.sendFormData[tpl.id][`caption${imgIdx + 1}`] : '') ||
      (tpl?.footer_captions?.[imgIdx] || '');
    $('caption-prospect-idx').value = prospectIdx;
    $('caption-img-idx').value = imgIdx;
    $('caption-text').value = effective;
    $('caption-modal-title').textContent = `Texto para imagen ${imgIdx + 1} — ${p.nombre}`;
    $('caption-modal').style.display = 'flex';
  }

  function hideCaptionEditor() {
    $('caption-modal').style.display = 'none';
  }

  function saveCaption(e) {
    e.preventDefault();
    const prospectIdx = parseInt($('caption-prospect-idx').value);
    const imgIdx = parseInt($('caption-img-idx').value);
    const text = $('caption-text').value.trim();
    const p = state.prospects[prospectIdx];
    if (!p) return;
    if (!p.captions) p.captions = [];
    p.captions[imgIdx] = text;
    saveState();
    hideCaptionEditor();
    showToast('Texto de imagen actualizado', 'success');
  }

  function updateProsSummary() {
    const c = state.cliente;
    const max = c ? (parseInt(c.requests_max) || 0) : 0;
    const usadas = c ? (parseInt(c.requests_usadas) || 0) : 0;
    const disponibles = max - usadas;
    $('pros-summary-plan').textContent = c?.plan || '-';
    $('pros-summary-available').textContent = disponibles;
    const cutoff = c?.periodo_fin ? formatDate(c.periodo_fin) : '';
    $('pros-summary-cutoff').textContent = cutoff ? `(corte: ${cutoff})` : '';
  }

  function showProspectModal(index) {
    state.editingProspectIdx = index !== undefined ? index : -1;
    const modal = $('prospect-modal');
    const title = $('prospect-modal-title');

    if (state.editingProspectIdx >= 0) {
      title.textContent = 'Editar prospecto';
      const p = state.prospects[state.editingProspectIdx];
      $('prospect-id').value = state.editingProspectIdx;
      $('prospect-name').value = p.nombre;
      $('prospect-phone').value = p.telefono;
      renderProspectModalFields(p);
    } else {
      title.textContent = 'Nuevo prospecto';
      $('prospect-form').reset();
      $('prospect-id').value = '';
      renderProspectModalFields(null);
    }
    modal.style.display = 'flex';
  }

  function renderProspectModalFields(existing) {
    const tpl = getProsTemplate();
    const container = $('prospect-dynamic-fields');
    let html = '';

    if (tpl?.has_header) {
      const val = existing?.header_img || '';
      html += `<div class="form-group"><label for="prospect-header-img">URL imagen de cabecera</label>
        <input type="url" id="prospect-header-img" value="${escapeHtml(val)}" placeholder="https://..."></div>`;
    }

    if (tpl?.num_footer > 0) {
      html += '<h4>Imágenes al final del mensaje</h4>';
      for (let i = 1; i <= tpl.num_footer; i++) {
        const val = (existing?.footer_imgs && existing.footer_imgs[i - 1]) || '';
        html += `<div class="form-group"><label for="prospect-img${i}">URL imagen ${i}</label>
          <input type="url" id="prospect-img${i}" value="${escapeHtml(val)}" placeholder="https://..."></div>`;
      }
    }

    container.innerHTML = html;
  }

  function hideProspectModal() {
    $('prospect-modal').style.display = 'none';
  }

  function saveProspect(e) {
    e.preventDefault();
    const tpl = getProsTemplate();
    const data = {
      nombre: $('prospect-name').value.trim(),
      telefono: $('prospect-phone').value.trim(),
      header_img: '',
      footer_imgs: [],
      captions: [],
      estado: '',
    };

    if (!data.nombre || !data.telefono) {
      showToast('Nombre y teléfono son obligatorios', 'error');
      return;
    }

    if (tpl?.has_header) {
      data.header_img = ($('prospect-header-img')?.value || '').trim();
    }

    for (let i = 1; i <= (tpl?.num_footer || 0); i++) {
      const val = ($(`prospect-img${i}`)?.value || '').trim();
      if (val) data.footer_imgs.push(val);
    }

    if (state.editingProspectIdx >= 0) {
      const old = state.prospects[state.editingProspectIdx];
      data.estado = old.estado || '';
      data.captions = old.captions || [];
      state.prospects[state.editingProspectIdx] = data;
    } else {
      state.prospects.push(data);
    }

    saveState();
    renderProsTable(getProsTemplate());
    hideProspectModal();
    showToast(state.editingProspectIdx >= 0 ? 'Prospecto actualizado' : 'Prospecto agregado', 'success');
  }

  function editProspect(index) {
    showProspectModal(index);
  }

  function deleteProspect(index) {
    if (!confirm('¿Eliminar este prospecto?')) return;
    state.prospects.splice(index, 1);
    saveState();
    renderProsTable(getProsTemplate());
    showToast('Prospecto eliminado', 'success');
  }

  function importCSV(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const text = e.target.result;
      const lines = text.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) {
        showToast('El archivo está vacío', 'error');
        return;
      }
      // Detectar si la primera línea es un encabezado
      const first = lines[0].toLowerCase();
      const hasHeader = first.includes('nombre') || first.includes('name') || first.includes('nomb');
      const dataLines = hasHeader ? lines.slice(1) : lines;
      let added = 0;
      dataLines.forEach(line => {
        const parts = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 2 && parts[0] && parts[1]) {
          state.prospects.push({
            nombre: parts[0],
            telefono: parts[1],
            header_img: '',
            footer_imgs: [],
            captions: [],
            estado: '',
          });
          added++;
        }
      });
      saveState();
      renderProsTable(getProsTemplate());
      showToast(`${added} prospectos importados de ${dataLines.length} líneas`, 'success');
      event.target.value = '';
    };
    reader.onerror = function() {
      showToast('Error al leer el archivo', 'error');
    };
    reader.readAsText(file, 'UTF-8');
  }

  function downloadSampleCSV() {
    const csv = 'nombre,telefono\nJuan Pérez,573001234567\nMaría Gómez,573009876543\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'prospectos_ejemplo.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ===========================================
  //  ENVÍO DESDE PROSPECTOS
  // ===========================================
  async function startSendingFromProspects() {
    if (state.sending) return;

    const tpl = getProsTemplate();
    if (!tpl) { showToast('Seleccione una plantilla primero', 'error'); return; }

    // Tomar valores de texto desde sendFormData (configurados en "Enviar mensajes")
    if (!state.sendFormData[tpl.id]) {
      showToast('Configure el mensaje en "Enviar mensajes" primero', 'error');
      return;
    }
    const saved = state.sendFormData[tpl.id] || {};
    let textValues = {};
    for (let i = 1; i <= tpl.num_textos; i++) {
      const val = saved[`texto${i}`];
      if (!val) {
        showToast(`Texto ${i} es obligatorio. Vaya a "Enviar mensajes"`, 'error');
        return;
      }
      textValues[`texto${i}`] = val;
    }

    const onlyPending = $('pros-only-pending').checked;
    let prospectsToSend = onlyPending
      ? state.prospects.filter(p => !p.estado)
      : state.prospects;

    if (prospectsToSend.length === 0) {
      showToast('No hay prospectos pendientes por enviar', 'warning');
      return;
    }

    // Validar prospectos contra la plantilla
    let validationErrors = [];
    prospectsToSend.forEach((p, idx) => {
      if (tpl.has_header && !p.header_img && !saved.header_img) {
        validationErrors.push(`${p.nombre}: falta imagen de cabecera`);
      }
      if (tpl.num_footer > 0) {
        for (let i = 1; i <= tpl.num_footer; i++) {
          if (!(p.footer_imgs && p.footer_imgs[i - 1]) && !saved[`footer_url${i}`]) {
            validationErrors.push(`${p.nombre}: falta imagen ${i}`);
          }
        }
      }
    });

    if (validationErrors.length > 0) {
      showToast('Prospectos con datos incompletos', 'error');
      $('pros-progress-card').style.display = 'block';
      $('pros-log').innerHTML = '<div class="log-error">ERRORES DE VALIDACIÓN:</div>' +
        validationErrors.map(e => `<div class="log-error">✗ ${escapeHtml(e)}</div>`).join('');
      return;
    }

    // Validar límite
    const cliente = state.cliente;
    const disponibles = (parseInt(cliente.requests_max) || 0) - (parseInt(cliente.requests_usadas) || 0);
    if (disponibles <= 0) { showToast('Límite de mensajes alcanzado', 'error'); return; }
    if (prospectsToSend.length > disponibles) {
      if (!confirm(`Solo tiene ${disponibles} mensajes. ¿Enviar solo los primeros ${disponibles}?`)) return;
      prospectsToSend = prospectsToSend.slice(0, disponibles);
    }

    // Iniciar envío
    state.sending = true;
    const btn = $('btn-pros-send');
    const btnText = $('btn-pros-send-text');
    btn.disabled = true;
    btnText.textContent = 'Enviando...';

    $('pros-progress-card').style.display = 'block';
    const progressFill = $('pros-progress-fill');
    const progressText = $('pros-progress-text');
    const logEl = $('pros-log');
    logEl.innerHTML = '';

    let sent = 0;
    const total = prospectsToSend.length;

    function log(msg, type) {
      const line = document.createElement('div');
      line.className = `log-${type}`;
      line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      logEl.appendChild(line);
      logEl.scrollTop = logEl.scrollHeight;
    }

    for (let i = 0; i < total; i++) {
      const prospect = prospectsToSend[i];
      const idx = state.prospects.indexOf(prospect);

      try {
        log(`Enviando a ${prospect.nombre} (${prospect.telefono})...`, 'info');

        // URL de cabecera: usa la del prospecto o la default
        const headerUrl = tpl.has_header ? (prospect.header_img || saved.header_img || '') : '';

        const templatePayload = {
          cliente_id: cliente.id || 1,
          to: prospect.telefono,
          template_name: tpl.template_name,
          language_code: tpl.language_code,
          nombre_clie: prospect.nombre,
          nomb_mio: 'Jorge Hernán Gómez',
          header_image_url: headerUrl,
          ...textValues,
        };

        await API.sendMessage(templatePayload);
        log('  ✓ Plantilla enviada', 'success');

        // Imágenes
        if (tpl.num_footer > 0) {
          for (let m = 0; m < tpl.num_footer; m++) {
            const imgUrl = (prospect.footer_imgs && prospect.footer_imgs[m]) || saved[`footer_url${m + 1}`] || '';
            if (!imgUrl) continue;
            const imgCaption = (prospect.captions && prospect.captions[m]) || saved[`caption${m + 1}`] || '';
            await new Promise(r => setTimeout(r, 3000));
            const mediaPayload = { cliente_id: cliente.id || 1, to: prospect.telefono, image_url: imgUrl };
            if (imgCaption) mediaPayload.caption = imgCaption;
            try {
              await API.sendMedia(mediaPayload);
              log(`  ✓ Imagen ${m + 1} enviada`, 'success');
            } catch (e) {
              log(`  ✗ Error imagen ${m + 1}: ${e.message}`, 'error');
            }
            await new Promise(r => setTimeout(r, 500));
          }
        }

        if (idx >= 0) state.prospects[idx].estado = '✅ Enviado';
        sent++;
      } catch (e) {
        const errMsg = typeof e.data?.detail === 'object' ? JSON.stringify(e.data.detail) : (e.data?.detail || e.message);
        log(`  ✗ Error: ${errMsg}`, 'error');
        if (idx >= 0) state.prospects[idx].estado = `❌ Error: ${errMsg}`;
      }

      const pct = Math.round(((i + 1) / total) * 100);
      progressFill.style.width = pct + '%';
      progressText.textContent = `${i + 1} / ${total}`;
      updateBadge();

      if (i < total - 1) await new Promise(r => setTimeout(r, 1000));
    }

    log(`=== Envío completado: ${sent} de ${total} ===`, sent === total ? 'success' : 'warning');
    saveState();
    renderProsTable(getProsTemplate());
    renderDashboard();
    state.sending = false;
    btn.disabled = false;
    btnText.textContent = 'Iniciar envío';
    showToast(`Completado: ${sent} de ${total}`, sent === total ? 'success' : 'warning');
  }

  // ===========================================
  //  ENVÍO DE MENSAJES
  // ===========================================
  async function startSending() {
    if (state.sending) return;

    const tplId = state.selectedTemplateId;
    if (!tplId) { showToast('Seleccione una plantilla primero', 'error'); return; }
    saveSendFormData();
    const tpl = state.templates.find(t => t.id === tplId);
    if (!tpl) { showToast('Plantilla no encontrada', 'error'); return; }

    // Validar campos de texto
    let textValues = {};
    for (let i = 1; i <= tpl.num_textos; i++) {
      const val = $(`send-texto${i}`)?.value?.trim();
      if (!val) {
        showToast(`Texto ${i} es obligatorio para esta plantilla`, 'error');
        $(`send-texto${i}`)?.focus();
        return;
      }
      textValues[`texto${i}`] = val;
    }

    // Leer captions por imagen desde los campos dinámicos
    const imageCaptions = [];
    for (let i = 1; i <= tpl.num_footer; i++) {
      const el = $(`send-footer-caption-${i}`);
      imageCaptions.push(el ? el.value.trim() : (tpl.footer_captions?.[i - 1] || ''));
    }

    const onlyPending = $('send-only-pending').checked;
    let prospectsToSend = onlyPending
      ? state.prospects.filter(p => !p.estado)
      : state.prospects;

    if (prospectsToSend.length === 0) {
      showToast('No hay prospectos pendientes por enviar', 'warning');
      return;
    }

    // Validar prospectos contra la plantilla
    let validationErrors = [];
    prospectsToSend.forEach((p, idx) => {
      if (tpl.has_header && !p.header_img) {
        validationErrors.push(`Fila ${idx + 1}: ${p.nombre} no tiene imagen de cabecera`);
      }
      if (tpl.num_footer > 0) {
        const count = (p.footer_imgs || []).length;
        if (count < tpl.num_footer) {
          validationErrors.push(`Fila ${idx + 1}: ${p.nombre} tiene ${count} de ${tpl.num_footer} imágenes`);
        }
      }
    });

    if (validationErrors.length > 0) {
      showToast('Hay prospectos con datos incompletos para esta plantilla', 'error');
      $('send-log').style.display = 'block';
      $('send-progress-card').style.display = 'block';
      const logEl = $('send-log');
      logEl.innerHTML = '<div class="log-error">ERRORES DE VALIDACIÓN:</div>' +
        validationErrors.map(e => `<div class="log-error">✗ ${escapeHtml(e)}</div>`).join('');
      return;
    }

    // Validar límite de mensajes
    const cliente = state.cliente;
    const disponibles = (parseInt(cliente.requests_max) || 0) - (parseInt(cliente.requests_usadas) || 0);
    if (disponibles <= 0) { showToast('Límite de mensajes alcanzado', 'error'); return; }
    if (prospectsToSend.length > disponibles) {
      if (!confirm(`Solo tiene ${disponibles} mensajes, pero hay ${prospectsToSend.length} prospectos. ¿Enviar solo ${disponibles}?`)) return;
      prospectsToSend = prospectsToSend.slice(0, disponibles);
    }

    // Iniciar envío
    state.sending = true;
    const btn = $('btn-send');
    const btnText = $('btn-send-text');
    btn.disabled = true;
    btnText.textContent = 'Enviando...';

    const progressCard = $('send-progress-card');
    progressCard.style.display = 'block';
    const progressFill = $('send-progress-fill');
    const progressText = $('send-progress-text');
    const logEl = $('send-log');
    logEl.innerHTML = '';

    let sent = 0;
    const total = prospectsToSend.length;

    function log(msg, type = 'info') {
      const line = document.createElement('div');
      line.className = `log-${type}`;
      line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      logEl.appendChild(line);
      logEl.scrollTop = logEl.scrollHeight;
    }

    for (let i = 0; i < total; i++) {
      const prospect = prospectsToSend[i];
      const idx = state.prospects.indexOf(prospect);

      try {
        log(`Enviando a ${prospect.nombre} (${prospect.telefono})...`, 'info');

        // Enviar plantilla
        const templatePayload = {
          cliente_id: cliente.id || 1,
          to: prospect.telefono,
          template_name: tpl.template_name,
          language_code: tpl.language_code,
          nombre_clie: prospect.nombre,
          nomb_mio: 'Jorge Hernán Gómez',
          header_image_url: tpl.has_header ? prospect.header_img : '',
          ...textValues,
        };

        await API.sendMessage(templatePayload);
        log('  ✓ Plantilla enviada', 'success');

        // Enviar imágenes si la plantilla las requiere
        if (tpl.num_footer > 0) {
          const images = (prospect.footer_imgs || []).slice(0, tpl.num_footer);
          for (let m = 0; m < images.length; m++) {
            const url = images[m];
            const imgCaption = imageCaptions[m] || '';
            await new Promise(r => setTimeout(r, 3000));
            const mediaPayload = { cliente_id: cliente.id || 1, to: prospect.telefono, image_url: url };
            if (imgCaption) mediaPayload.caption = imgCaption;
            try {
              await API.sendMedia(mediaPayload);
              log(`  ✓ Imagen ${m + 1} enviada`, 'success');
            } catch (e) {
              log(`  ✗ Error imagen ${m + 1}: ${e.message}`, 'error');
            }
            await new Promise(r => setTimeout(r, 500));
          }
        }

        if (idx >= 0) state.prospects[idx].estado = '✅ Enviado';
        sent++;
      } catch (e) {
        const errMsg = typeof e.data?.detail === 'object' ? JSON.stringify(e.data.detail) : (e.data?.detail || e.message);
        log(`  ✗ Error: ${errMsg}`, 'error');
        if (idx >= 0) state.prospects[idx].estado = `❌ Error: ${errMsg}`;
      }

      const pct = Math.round(((i + 1) / total) * 100);
      progressFill.style.width = pct + '%';
      progressText.textContent = `${i + 1} / ${total}`;
      updateBadge();

      if (i < total - 1) await new Promise(r => setTimeout(r, 1000));
    }

    log('=== Envío completado ===', 'success');
    log(`Enviados: ${sent} de ${total}`, sent === total ? 'success' : 'warning');
    saveState();
    renderProspects();
    renderDashboard();
    state.sending = false;
    btn.disabled = false;
    btnText.textContent = 'Iniciar envío masivo';
    showToast(`Completado: ${sent} de ${total}`, sent === total ? 'success' : 'warning');
  }

  // ===========================================
  //  DASHBOARD
  // ===========================================
  function renderDashboard() {
    const c = state.cliente;
    if (!c) return;
    const usadas = parseInt(c.requests_usadas) || 0;
    const max = parseInt(c.requests_max) || 1;
    const disponibles = max - usadas;
    $('stat-plan').textContent = c.plan || 'Sin plan';
    $('stat-usadas').textContent = usadas;
    $('stat-max').textContent = `${max} / ${disponibles}`;
    $('stat-vigencia').textContent = c.periodo_fin ? formatDate(c.periodo_fin) : '-';
    const cutoff = c?.periodo_fin ? formatDate(c.periodo_fin) : '';
    $('dash-cutoff').textContent = cutoff ? `Corte: ${cutoff}` : '';
    const pct = Math.min(100, Math.round((usadas / max) * 100));
    $('progress-fill').style.width = pct + '%';
    $('progress-text').textContent = pct + '%';
  }

  // ===========================================
  //  HISTORIAL
  // ===========================================
  function renderHistory() {
    const tbody = $('history-table-body');
    $('history-counter').textContent = state.messages.length + ' registros';
    if (state.messages.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay registros de mensajes</td></tr>';
      return;
    }
    tbody.innerHTML = state.messages.map(msg => `
      <tr>
        <td>${msg.id || '-'}</td>
        <td>${escapeHtml(msg.to || '-')}</td>
        <td>${escapeHtml(msg.tipo || '-')}</td>
        <td>${escapeHtml(msg.mensaje || '-')}</td>
        <td>${renderStatus(msg.estado)}</td>
        <td>${escapeHtml(msg.error || '-')}</td>
        <td>${msg.fecha ? formatDate(msg.fecha) : '-'}</td>
      </tr>
    `).join('');
  }

  function loadHistory() {
    renderHistory();
    showToast('Historial actualizado', 'success');
  }

  function renderStatus(estado) {
    if (!estado) return '<span class="status-badge pending">Pendiente</span>';
    const display = estado.length > MAX_STATUS_LEN ? estado.slice(0, MAX_STATUS_LEN) + '…' : estado;
    const full = escapeHtml(estado);
    if (estado.includes('✅')) return `<span class="status-badge success" title="${full}">${escapeHtml(display)}</span>`;
    if (estado.includes('❌') || estado.includes('Error')) return `<span class="status-badge error" title="${full}">${escapeHtml(display)}</span>`;
    return `<span class="status-badge pending" title="${full}">${escapeHtml(display)}</span>`;
  }

  // ===========================================
  //  BADGE
  // ===========================================
  function updateBadge() {
    const enviados = state.prospects.filter(p => p.estado).length;
    const total = state.prospects.length;
    $('badge-msg-count').textContent = `${enviados} / ${total} mensajes`;
  }

  // ===========================================
  //  TOAST & HELPERS
  // ===========================================
  function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px;
      padding: 14px 20px; border-radius: 10px;
      font-size: 14px; font-weight: 500;
      background: ${type === 'success' ? '#E8F5E9' : type === 'error' ? '#FFEBEE' : type === 'warning' ? '#FFF3E0' : '#E3F2FD'};
      color: ${type === 'success' ? '#2E7D32' : type === 'error' ? '#C62828' : type === 'warning' ? '#E65100' : '#1565C0'};
      border: 1px solid ${type === 'success' ? '#A5D6A7' : type === 'error' ? '#EF9A9A' : type === 'warning' ? '#FFCC80' : '#90CAF9'};
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999; animation: fadeIn 0.3s; max-width: 400px;
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; }, 3000);
    setTimeout(() => toast.remove(), 3400);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch { return dateStr; }
  }

  // --- API pública ---
  return {
    init, navigateTo, toggleSidebar, togglePassword, updateFooterCaptions, logout,
    showTemplateModal, hideTemplateModal, saveTemplate, editTemplate, deleteTemplate,
    onTemplateChange,
    onProsTemplateChange, showProspectModal, hideProspectModal, saveProspect,
    editProspect, deleteProspect, importCSV, downloadSampleCSV, updateProspectField,
    openCaptionEditor, hideCaptionEditor, saveCaption,
    startSendingFromProspects, startSending, clearSendForm,
    loadHistory,
  };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
window.App = App;
