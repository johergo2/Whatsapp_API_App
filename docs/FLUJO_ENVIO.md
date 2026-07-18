# Flujo de Envío de Mensajes — Mercurio Software

```mermaid
flowchart TB
  subgraph UI["Frontend (React / Next.js)"]
    CSV["Importar CSV\nprospects/page.tsx"]
    MANUAL["Seleccionar prospectos\n+ click Enviar"]
    SEND_PAGE["Página Enviar\nsend/page.tsx"]
    HISTORY["Historial\nhistory/page.tsx"]
  end

  subgraph API["API Routes (Next.js)"]
    POST_PROSPECTOS["POST /api/prospectos\n(bulk insert)"]
    SEND_MESSAGE["POST /api/send-message"]
    SEND_FORM["POST /api/send-form-data"]
    GET_MENSAJES["GET /api/mensajes"]
    WEBHOOK["GET|POST /api/webhook"]
  end

  subgraph META["Meta Cloud API"]
    GRAPH["graph.facebook.com/v18.0\n/{phone_number_id}/messages"]
    WEBHOOK_META["Webhook callback\n(status + inbound)"]
  end

  subgraph DB["Supabase (PostgreSQL)"]
    CLIENTES["clientes_whatsapp\n• id\n• phone_number_id\n• display_number\n• requests_max\n• requests_usadas"]
    VARIABLES["variables_whatsapp\n• variable (META_TOKEN)\n• valor"]
    PLANTILLAS["plantillas\n• id\n• template_name\n• num_textos\n• header_type\n• nomb_mio"]
    PROSPECTOS["prospectos\n• id\n• cliente_id\n• nombre\n• telefono\n• adjunto_cabecera\n• footer_imgs[]\n• captions[]\n• estado\n• plantilla_id\n• usuario_id\n• texto1..texto6"]
    MENSAJES["mensajes_whatsapp\n• id\n• cliente_id\n• from_number\n• to_number\n• direction\n• mensaje\n• wamid\n• estado\n• fecha_creacion"]
    ESTADOS["estado_mensajes_whatsapp\n• id\n• mensaje_id\n• wamid\n• estado\n• error_code\n• error_detail"]
    CONTACTOS["contactos_whatsapp\n• id\n• cliente_id\n• telefono\n• nombre\n• chatwoot_*"]
    SEND_DATA["send_form_data\n• id\n• cliente_id\n• plantilla_id\n• values_json"]
  end

  %% ─── FLUJO 1: IMPORTAR CSV ───
  CSV -->|POST /api/prospectos\n(array de prospectos)| POST_PROSPECTOS
  POST_PROSPECTOS -->|INSERT batch| PROSPECTOS

  %% ─── FLUJO 2: ENVIAR DESDE PROSPECTOS ───
  MANUAL -->|iterar prospectos\nfetch /api/send-message| SEND_MESSAGE
  SEND_MESSAGE -->|GET cliente| CLIENTES
  SEND_MESSAGE -->|GET META_TOKEN| VARIABLES
  SEND_MESSAGE -->|POST template| GRAPH
  GRAPH -->|response { wamid }| SEND_MESSAGE
  SEND_MESSAGE -->|INSERT (outbound)| MENSAJES
  SEND_MESSAGE -->|rpc increment_requests_usadas| CLIENTES

  %% ─── FLUJO 3: ENVIAR DESDE PÁGINA ENVIAR ───
  SEND_PAGE -->|Guardar defaults| SEND_FORM
  SEND_FORM -->|UPSERT| SEND_DATA
  SEND_PAGE -->|fetch /api/send-message| SEND_MESSAGE

  %% ─── FLUJO 4: WEBHOOK (INBOUND + STATUS) ───
  WEBHOOK_META -->|POST changes| WEBHOOK
  WEBHOOK -->|status update: UPDATE estado| MENSAJES
  WEBHOOK -->|status update: INSERT historial| ESTADOS
  WEBHOOK -->|inbound: INSERT (direction=inbound)| MENSAJES
  WEBHOOK -->|inbound: UPSERT contacto| CONTACTOS

  %% ─── FLUJO 5: HISTORIAL ───
  HISTORY -->|GET /api/mensajes\n?page&pageSize&direction&estado&search| GET_MENSAJES
  GET_MENSAJES -->|SELECT with filters| MENSAJES
  GET_MENSAJES -->|response { data, total }| HISTORY

  %% ─── ESTILOS ───
  classDef ui fill:#e3f2fd,stroke:#1565c0
  classDef api fill:#fff3e0,stroke:#e65100
  classDef meta fill:#e8f5e9,stroke:#2e7d32
  classDef db fill:#f3e5f5,stroke:#6a1b9a
  class CSV,MANUAL,SEND_PAGE,HISTORY ui
  class POST_PROSPECTOS,SEND_MESSAGE,SEND_FORM,GET_MENSAJES,WEBHOOK api
  class GRAPH,WEBHOOK_META meta
  class CLIENTES,VARIABLES,PLANTILLAS,PROSPECTOS,MENSAJES,ESTADOS,CONTACTOS,SEND_DATA db
```

## Tablas y Campos Involucrados

### clientes_whatsapp
| Campo | Uso |
|-------|-----|
| `id` | FK en todas las tablas |
| `phone_number_id` | ID del número WhatsApp Business |
| `display_number` | Número que aparece como remitente |
| `requests_max` | Límite del plan |
| `requests_usadas` | Contador (se incrementa vía RPC) |

### variables_whatsapp
| Campo | Uso |
|-------|-----|
| `variable = 'META_TOKEN'` | Token de acceso a Meta Cloud API |
| `valor` | El token |

### plantillas
| Campo | Uso |
|-------|-----|
| `template_name` | Nombre registrado en Meta |
| `num_textos` | Cantidad de campos de texto variables |
| `header_type` | `none`, `image`, `document`, `video` |
| `nomb_mio` | Nombre del remitente |

### prospectos
| Campo | Uso |
|-------|-----|
| `nombre` | Nombre del destinatario |
| `telefono` | Número (con código país) |
| `adjunto_cabecera` | URL del header image/document/video |
| `footer_imgs[]` | URLs de imágenes de pie |
| `captions[]` | Textos de las imágenes de pie |
| `estado` | Último resultado del envío |
| `texto1..texto6` | Texto personalizado por prospecto (fallback a defaults de send_form_data) |
| `plantilla_id` | Plantilla asociada |
| `usuario_id` | Usuario que creó/importó el prospecto |

### mensajes_whatsapp
| Campo | Uso |
|-------|-----|
| `cliente_id` | Cliente al que pertenece |
| `from_number` | Remitente (display_number para outbound, número externo para inbound) |
| `to_number` | Destinatario |
| `direction` | `outbound` (enviado) o `inbound` (recibido) |
| `mensaje` | Contenido o `template: {name}` |
| `wamid` | ID del mensaje en WhatsApp Cloud |
| `estado` | `pending`, `sent`, `delivered`, `read`, `failed` |
| `fecha_creacion` | Timestamp del registro |

### estado_mensajes_whatsapp
| Campo | Uso |
|-------|-----|
| `mensaje_id` | FK a mensajes_whatsapp |
| `wamid` | ID del mensaje en Meta |
| `estado` | Estado reportado por Meta |
| `error_code` / `error_detail` | Código y detalle si falló |

### contactos_whatsapp
| Campo | Uso |
|-------|-----|
| `telefono` | Número del contacto |
| `nombre` | Nombre si está disponible |
| `chatwoot_conversation_id` | ID de conversación en Chatwoot (para reenvío) |

### send_form_data
| Campo | Uso |
|-------|-----|
| `plantilla_id` | FK a plantillas |
| `values_json` | JSON con `texto1..texto6`, `header_img`, etc. |

## Orden de Resolución de Textos

Al enviar, el valor final de cada `textoN` se resuelve así:

1. `prospecto.textoN` — si el prospecto tiene un valor personalizado (desde CSV)
2. `send_form_data.values_json.textoN` — si no, se usa el valor por defecto guardado
3. `''` — si ninguno tiene valor, se envía vacío
