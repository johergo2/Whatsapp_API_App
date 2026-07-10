# API SPEC — Mercurio Send

## Base URL
- **Local**: `http://localhost:3002/api`
- **Producción**: `https://whatsapp-api-app-silk.vercel.app/api`

## Autenticación
Todas las API Routes requieren el header:
```
X-API-Key: sk_live_revisar archivos locales aquí no se publica API Key por seguridad
```
La API Route hashea la key con SHA256 y la compara con el campo `api_key` en `clientes_whatsapp`.

---

## Endpoints

### `GET /api/cliente`
Valida la API Key y retorna los datos del cliente.

**Response (200):**
```json
{
  "id": 1,
  "nit": "16780919",
  "nombre_comercial": "Productos & Asesorias",
  "phone_number_id": "9584440......",
  "display_number": "5730529.....",
  "api_key": "bf21276...",
  "plan": "MAX 200 MSG",
  "requests_max": 200,
  "requests_usadas": 148,
  "periodo_inicio": "2026-02-01",
  "periodo_fin": "2026-04-15",
  "estado": "ACT"
}
```

**Error (401):**
```json
{ "detail": "API Key inválida" }
```

---

### `GET /api/variables`
Retorna variables de configuración como `Record<string, string>`.

**Response (200):**
```json
{
  "phoneNumberID": "95844....",
  "META_TOKEN": "EAA...",
  "VERIFY_TOKEN": "johergo21970090.......",
  "CHATWOOT_API_TOKEN": "EgyYSsqVMbe1w......",
  "CHATWOOT_INBOX_ID": "96....",
  "CHATWOOT_ACCOUNT_ID": "15....."
}
```

---

### `GET|POST|PUT|DELETE /api/plantillas`
CRUD de plantillas (tabla `plantillas`).

**GET** — Listar todas las plantillas del cliente autenticado.

**POST** — Crear plantilla.
```json
{
  "name": "Mi Plantilla",
  "template_name": "ofrecer_whatsapp2",
  "language_code": "es_CO",
  "num_textos": 4,
  "has_header": true,
  "num_footer": 0,
  "footer_captions": [],
  "message_example": "Hola {{1}}, te escribo de {{2}}...",
  "descripcion": "Template con imagen de cabecera y 4 textos variables"
}
```

**PUT** — Actualizar plantilla (requiere `id` en body).

**DELETE** — Eliminar plantilla (`?id=uuid`).

---

### `GET|POST|PUT|DELETE /api/prospectos`
CRUD de prospectos (tabla `prospectos`).

**GET** — Listar todos los prospectos.

**POST** — Crear prospecto.
```json
{
  "nombre": "Juan Pérez",
  "telefono": "573001234567",
  "header_img": "https://...",
  "footer_imgs": ["https://..."],
  "captions": ["Texto opcional"],
  "estado": ""
}
```

**PUT** — Actualizar prospecto (requiere `id` en body).

**DELETE** — Eliminar prospecto (`?id=numero`).

---

### `GET /api/mensajes`
Retorna historial de mensajes del cliente autenticado (últimos 200).

---

### `POST /api/send-message`
Envía un template message a través de Meta Cloud API.

**Body:**
```json
{
  "cliente_id": 1,
  "to": "573001234567",
  "template_name": "ofrecer_whatsapp2",
  "language_code": "es_CO",
  "nombre_clie": "Juan Pérez",
  "nomb_mio": "Jorge Hernán Gómez",
  "header_image_url": "https://...",
  "texto1": "valor",
  "texto2": "valor",
  "texto3": "valor",
  "texto4": "valor"
}
```

**Proceso:**
1. Obtiene `phone_number_id` y `META_TOKEN` de la BD
2. Envía a `https://graph.facebook.com/v21.0/{phone_number_id}/messages`
3. Guarda en `mensajes_whatsapp`
4. Incrementa `requests_usadas` en `clientes_whatsapp`

---

### `POST /api/send-media`
Envía imagen/video con texto opcional.

**Body:**
```json
{
  "cliente_id": 1,
  "to": "573001234567",
  "image_url": "https://...",
  "video_url": "https://...",
  "mensaje": "Texto del mensaje",
  "caption": "Texto debajo de la imagen"
}
```

---

### `GET|POST /api/webhook`
Webhook de Meta para recibir eventos de WhatsApp.

**GET** — Verificación del webhook (Meta envía `hub.challenge`).
```
?hub.mode=subscribe&hub.verify_token=johergo219700.....&hub.challenge=12345
```

**POST** — Recibe actualizaciones de estado y mensajes entrantes.
- Actualiza `estado_mensajes_whatsapp`
- Guarda mensajes entrantes en `mensajes_whatsapp`
- Sincroniza contactos en `contactos_whatsapp`
- (Opcional) Reenvía a Chatwoot

---

### `GET|POST /api/send-form-data`
Persiste y recupera los valores del formulario de envío (`send_form_data`).

**GET** — Retorna todos los registros del cliente autenticado.
```json
[
  {
    "cliente_id": 1,
    "plantilla_id": 3,
    "values_json": {
      "texto1": "Hola",
      "texto2": "Mundo",
      "header_img": "https://..."
    },
    "updated_at": "2026-07-09T12:00:00.000Z"
  }
]
```

**POST** — Upsert de valores del formulario para una plantilla.
```json
{
  "plantilla_id": 3,
  "values": {
    "texto1": "Nuevo valor",
    "header_img": "https://..."
  }
}
```

Se carga automáticamente al iniciar sesión y se guarda al cambiar de plantilla o al hacer clic en "Guardar".

---

### `POST /api/outbound`
Registra manualmente un mensaje saliente en `mensajes_whatsapp`.

---

### `POST /api/chatwoot/webhook`
Recibe webhooks de Chatwoot y reenvía la respuesta del agente a WhatsApp.
