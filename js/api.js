/* ============================================
   Mercurio Send - API Service
   ============================================ */
const API = (() => {
  let _apiKey = '';
  let _baseURL = 'https://whatsapp-api-fastapi.onrender.com';
  let _mockMode = false;

  const MOCK_CLIENTE = {
    id: 1,
    phone_number_id: '958444014023857',
    display_number: '+573052968034',
    api_key: 'sk_live_mock',
    estado: 'activo',
    plan: 'Plan Básico 200',
    requests_max: 200,
    requests_usadas: 47,
    periodo_inicio: '2026-01-01',
    periodo_fin: '2026-12-31',
  };

  const MOCK_VARIABLES = {
    META_TOKEN: 'EAAmxP99...',
    TEMPLATE_NAME: 'ofrecer_whatsapp2',
    LANGUAGE_CODE: 'es_CO',
    PARAM_IMG_HEAD: 'S',
    ADJ_IMAGEN: 'S',
    MENSAJE_IMG: 'Productos & Asesorías',
    CHATWOOT_ACCOUNT_ID: '152767',
    CHATWOOT_INBOX_ID: '96844',
  };

  let _online = true;

  function setApiKey(key) { _apiKey = key; }
  function getApiKey() { return _apiKey; }
  function setBaseURL(url) { _baseURL = url; }
  function getBaseURL() { return _baseURL; }
  function isMockMode() { return _mockMode; }
  function isOnline() { return _online; }

  function setMockMode(mock) {
    _mockMode = mock;
    _online = !mock;
  }

  async function request(endpoint, options = {}) {
    if (_mockMode) {
      return mockResponse(endpoint, options);
    }

    const url = `${_baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (_apiKey) {
      headers['X-API-Key'] = _apiKey;
    }

    let res;
    try {
      res = await fetch(url, {
        ...options,
        headers,
        signal: AbortSignal.timeout(5000),
      });
    } catch (e) {
      // API no disponible - activar modo demo automático
      console.warn('API no disponible, activando modo demo:', e.message);
      _mockMode = true;
      _online = false;
      return mockResponse(endpoint, options);
    }

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const err = new Error(data?.detail || data?.error || `Error ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function mockResponse(endpoint, options) {
    if (endpoint === '/cliente') {
      return { ...MOCK_CLIENTE };
    }
    if (endpoint === '/variables') {
      return { ...MOCK_VARIABLES };
    }
    if (endpoint === '/send-message' && options.method === 'POST') {
      return {
        messaging_product: 'whatsapp',
        contacts: [{ input: JSON.parse(options.body).to, wa_id: JSON.parse(options.body).to }],
        messages: [{ id: `wamid.mock.${Date.now()}` }],
      };
    }
    if (endpoint === '/send-media' && options.method === 'POST') {
      return {
        messaging_product: 'whatsapp',
        contacts: [{ input: JSON.parse(options.body).to, wa_id: JSON.parse(options.body).to }],
        messages: [{ id: `wamid.mock.${Date.now()}` }],
      };
    }
    return { status: 'ok' };
  }

  async function getCliente() {
    return request('/cliente');
  }

  async function getVariables() {
    return request('/variables');
  }

  async function sendMessage(payload) {
    return request('/send-message', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async function sendMedia(payload) {
    return request('/send-media', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async function getHistory() {
    return [];
  }

  return {
    setApiKey,
    getApiKey,
    setBaseURL,
    getBaseURL,
    isMockMode,
    isOnline,
    setMockMode,
    getCliente,
    getVariables,
    sendMessage,
    sendMedia,
    getHistory,
  };
})();
