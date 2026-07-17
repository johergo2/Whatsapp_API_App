# API SPEC — Mercurio Send

## Base URL
- **Local**: `http://localhost:3002/api`
- **Producción**: `https://whatsapp-api-app-silk.vercel.app/api`

## Autenticación
Todas las API Routes (excepto `/api/auth/*` y `/api/cliente`) requieren el header:
```
X-Cliente-Id: <cliente_id_numérico>
```
El cliente_id se obtiene tras login exitoso y se almacena en `localStorage` como parte del objeto `mercurio_user`.

### Flujo de Autenticación
1. **Login**: `POST /api/auth/login` con `{ nombre, password }` → retorna `{ id, nombre, email, rol, activo, cliente_id }`
2. **Registro**: `POST /api/auth/register` con `{ nombre, email?, password, api_key }` → crea usuario y lo vincula al cliente via `usuarios_clientes`
3. **Sesión**: Frontend guarda usuario en `localStorage.setItem('mercurio_user', JSON.stringify(user))`
4. **Restauración**: Al cargar la app, `AppProvider` lee `mercurio_user` y hace `GET /api/cliente?cliente_id=...` para validar sesión

### Header `X-Cliente-Id`
- Se envía automáticamente por `services.ts` en todas las peticiones
- API Routes lo leen via `getClienteId(req)` helper
- Valida que el usuario autenticado tenga acceso a ese `cliente_id` (via `usuarios_clientes`)

---

## Endpoints de Autenticación

### `POST /api/auth/login`
Login con usuario + contraseña.

**Request:**
```json
{
  "nombre": "usuario123",
  "password": "mipassword"
}
```

**Response (200):**
```json
{
  "id": 1,
  "nombre": "usuario123",
  "email": "user@ejemplo.com",
  "rol": "usuario",
  "activo": true,
  "cliente_id": 1
}
```

**Error (401):**
```json
{ "detail": "Usuario o contraseña inválidos" }
```

### `POST /api/auth/register`
Registro de nuevo usuario vinculado a un cliente existente (via API Key del cliente).

**Request:**
```json
{
  "nombre": "nuevo_usuario",
  "email": "user@ejemplo.com",
  "password": "password123",
  "api_key": "sk_live_..."
}
```

**Response (201):**
```json
{ "success": true }
```

**Errores:**
- `400`: Faltan campos requeridos
- `401`: API Key inválida
- `409`: Nombre de usuario ya existe

---

## Endpoints Principales

### `GET /api/cliente`
Obtiene datos del cliente. Acepta `X-Cliente-Id` header **o** query param `?cliente_id=1`.

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

**Error (401/404):**
```json
{ "detail": "Cliente no encontrado" }
```

---

### `GET /api/variables`
Retorna variables de configuración como `Record<string, string>`.

**Header:** `X-Cliente-Id: 1`

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

**Header:** `X-Cliente-Id: 1`

**GET** — Listar todas las plantillas del cliente autenticado. Cada plantilla incluye `header_type` (`none`, `image`, `document`, `video`).

**POST** — Crear plantilla.
```json
{
  "name": "Mi Plantilla",
  "template_name": "ofrecer_whatsapp2",
  "language_code": "es_CO",
  "num_textos": 4,
  "header_type": "image",
  "num_footer": 0,
  "footer_captions": [],
  "message_example": "Hola {{1}}, te escribo de {{2}}...",
  "descripcion": "Template con imagen de cabecera y 4 textos variables",
  "nomb_mio": "Jorge Hernán Gómez"
}
```

**PUT** — Actualizar plantilla (requiere `id` en body). Campos: mismos que POST más `id`.

**DELETE** — Eliminar plantilla (`?id=numero`).

---

### `GET|POST|PUT|DELETE /api/prospectos`
CRUD de prospectos (tabla `prospectos`).

**Header:** `X-Cliente-Id: 1`, `X-Usuario-Id: 1`

**GET** — Listar prospectos del cliente + usuario autenticados.
- `?plantilla_id=N` — filtra por plantilla

**POST** — Crear uno o varios prospectos. Si se envía un array, se crean en lote.
```json
{
  "nombre": "Juan Pérez",
  "telefono": "573001234567",
  "adjunto_cabecera": "https://...",
  "footer_imgs": ["https://..."],
  "captions": ["Texto opcional"],
  "estado": "",
  "plantilla_id": 1,
  "texto1": "Valor personalizado",
  "texto2": "Otro valor",
  "texto3": "",
  "texto4": "",
  "texto5": "",
  "texto6": ""
}
```

**PUT** — Actualizar prospecto (requiere `id` en body). Acepta los mismos campos que POST.

**DELETE** — Eliminar prospecto(s).
- `DELETE /api/prospectos?id=numero` — elimina un prospecto específico
- `DELETE /api/prospectos` (sin `?id=`) — elimina **todos** los prospectos del cliente + usuario autenticados
- `DELETE /api/prospectos?plantilla_id=N` — elimina todos los prospectos del cliente + usuario + plantilla específica (usado en importación CSV)

---

### `GET /api/mensajes`
Retorna historial de mensajes del cliente autenticado con paginación y filtros.

**Header:** `X-Cliente-Id: 1`

**Query Params:**
- `page` (number, default `0`) — número de página (0-indexed)
- `pageSize` (number, default `200`, max `200`) — registros por página
- `direction` (`inbound` | `outbound`, opcional) — filtrar por dirección
- `estado` (string, opcional) — búsqueda parcial en estado
- `search` (string, opcional) — búsqueda parcial en `from_number`, `to_number` o `mensaje`

**Response (200):**
```json
{
  "data": [
    {
      "id": 641,
      "cliente_id": 2,
      "from_number": "573136432748",
      "to_number": "573145650653",
      "direction": "inbound",
      "mensaje": "Hola",
      "wamid": "wamid.HBgM...",
      "estado": "pending",
      "timestamp_wa": "2026-07-17T13:15:37",
      "fecha_creacion": "2026-07-17T13:15:37"
    }
  ],
  "total": 474,
  "page": 0,
  "pageSize": 200
}
```

**Nota:** El frontend anterior esperaba un array plano; el store y `services.ts` ya extraen `.data` automáticamente.

---

### `POST /api/send-message`
Envía un template message a través de Meta Cloud API.

**Header:** `X-Cliente-Id: 1`

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

Para adjunto de tipo documento usar `header_document_url`, para video usar `header_video_url`.

**Proceso:**
1. Obtiene `phone_number_id` y `META_TOKEN` de la BD
2. Envía a `https://graph.facebook.com/v21.0/{phone_number_id}/messages`
3. Guarda en `mensajes_whatsapp`
4. Incrementa `requests_usadas` en `clientes_whatsapp`

---

### `POST /api/send-media`
Envía imagen/video con texto opcional.

**Header:** `X-Cliente-Id: 1`

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

**Header:** `X-Cliente-Id: 1`

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

**Header:** `X-Cliente-Id: 1`

---

### `POST /api/chatwoot/webhook`
Recibe webhooks de Chatwoot y reenvía la respuesta del agente a WhatsApp.

**Header:** `X-Cliente-Id: 1`