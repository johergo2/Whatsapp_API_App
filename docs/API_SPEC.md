# API SPEC — Mercurio Send

## Endpoints Actuales (FastAPI en Render)

### Base URL
```
https://whatsapp-api-fastapi.onrender.com
```

### Autenticación
API Key enviada vía header:
```
X-API-Key: sk_live_xxxxxxxx
```

### Endpoints

#### `GET /cliente`
Obtiene información del cliente autenticado.

**Response:**
```json
{
  "id": 1,
  "phone_number_id": "958444014023857",
  "display_number": "+573052968034",
  "api_key": "sk_live_...",
  "estado": "activo",
  "plan": "Plan Básico 200",
  "requests_max": 200,
  "requests_usadas": 47,
  "periodo_inicio": "2026-01-01",
  "periodo_fin": "2026-12-31"
}
```

#### `GET /variables`
Obtiene variables de configuración de la cuenta Meta.

#### `POST /send-message`
Envía un mensaje plantilla (template).

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

#### `POST /send-media`
Envía una imagen adjunta.

**Body:**
```json
{
  "cliente_id": 1,
  "to": "573001234567",
  "image_url": "https://...",
  "caption": "Texto opcional debajo de la imagen"
}
```

## Mock Data (Modo Demo)

Cuando la API no responde, `api.js` activa mock automático con datos de ejemplo.

### Mock Cliente
```json
{
  "id": 1,
  "phone_number_id": "958444014023857",
  "display_number": "+573052968034",
  "plan": "Plan Básico 200",
  "requests_max": 200,
  "requests_usadas": 47,
  "periodo_fin": "2026-12-31"
}
```

## Flujo de Envío
1. Validar template seleccionado
2. Validar campos de texto obligatorios
3. Validar URLs de imágenes (cabecera + footer) por prospecto o defaults
4. Enviar template message (`POST /send-message`)
5. Por cada imagen: esperar 3s, enviar media (`POST /send-media`), esperar 0.5s
6. Actualizar estado del prospecto (✅ Enviado / ❌ Error)
