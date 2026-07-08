# DATABASE SCHEMA — Mercurio Send (Supabase / PostgreSQL)

## Esquema Propuesto

```sql
-- =============================================
-- Tabla: clientes
-- =============================================
-- Corresponde al endpoint GET /cliente de la API actual.
create table clientes (
  id          serial primary key,
  api_key     text not null unique,          -- X-API-Key para autenticación
  plan        text,                          -- Ej: "Plan Básico 200"
  requests_max      integer default 0,       -- Límite del plan
  requests_usadas   integer default 0,       -- Usados en el período
  periodo_inicio    date,
  periodo_fin       date,
  created_at  timestamptz default now()
);

-- =============================================
-- Tabla: variables
-- =============================================
-- Variables de configuración Meta (token, ids).
create table variables (
  id              serial primary key,
  cliente_id      integer references clientes(id),
  meta_token      text,
  template_name   text,
  language_code   text default 'es_CO',
  param_img_head  text,
  adj_imagen      text,
  mensaje_img     text,
  chatwoot_account_id text,
  chatwoot_inbox_id   text
);

-- =============================================
-- Tabla: plantillas
-- =============================================
-- Definición de plantillas de mensaje.
create table plantillas (
  id              uuid primary key default gen_random_uuid(),
  cliente_id      integer references clientes(id),
  name            text not null,              -- Nombre interno
  template_name   text not null,              -- Nombre en Meta
  language_code   text default 'es_CO',
  num_textos      integer default 4,          -- Variables de texto {{1..N}}
  has_header      boolean default false,      -- Tiene imagen de cabecera
  num_footer      integer default 0,          -- Cantidad de imágenes finales
  footer_captions text[],                     -- Texto por imagen (array)
  message_example text,                       -- Ejemplo de uso
  created_at      timestamptz default now()
);

-- =============================================
-- Tabla: prospectos
-- =============================================
-- Destinatarios de los mensajes.
create table prospectos (
  id            serial primary key,
  cliente_id    integer references clientes(id),
  nombre        text not null,
  telefono      text not null,
  header_img    text,                         -- URL específica para cabecera
  footer_imgs   text[],                       -- URLs específicas (1 por imagen)
  captions      text[],                       -- Textos específicos (1 por imagen)
  estado        text default '',              -- ✅ Enviado / ❌ Error: ...
  created_at    timestamptz default now()
);

-- =============================================
-- Tabla: mensajes (historial)
-- =============================================
-- Registro de envíos realizados.
create table mensajes (
  id            serial primary key,
  cliente_id    integer references clientes(id),
  prospecto_id  integer references prospectos(id),
  plantilla_id  uuid references plantillas(id),
  to_number     text not null,
  tipo          text,                         -- 'template' | 'media'
  mensaje       text,
  estado        text,                         -- 'success' | 'error'
  error         text,
  meta_msg_id   text,                         -- wamid de WhatsApp
  created_at    timestamptz default now()
);

-- =============================================
-- Tabla: send_form_data
-- =============================================
-- Configuración guardada para próximos envíos (por plantilla).
create table send_form_data (
  id            serial primary key,
  cliente_id    integer references clientes(id),
  plantilla_id  uuid references plantillas(id),
  values_json   jsonb,  -- { "texto1": "...", "header_img": "...", "footer_url1": "...", "caption1": "..." }
  updated_at    timestamptz default now()
);
```

## Índices Recomendados
```sql
create index idx_prospectos_cliente on prospectos(cliente_id);
create index idx_prospectos_estado on prospectos(estado);
create index idx_plantillas_cliente on plantillas(cliente_id);
create index idx_mensajes_cliente on mensajes(cliente_id);
create index idx_mensajes_fecha on mensajes(created_at desc);
```

## Equivalencia localStorage → Supabase

| localStorage key          | Tabla Supabase           |
|---------------------------|--------------------------|
| `cliente`                 | `clientes`               |
| `templates[]`             | `plantillas`             |
| `prospects[]`             | `prospectos`             |
| `messages[]`              | `mensajes`               |
| `sendFormData`            | `send_form_data`         |

## Row Level Security (RLS)
Cada tabla debe tener RLS habilitado con política `USING (cliente_id = auth.uid())` cuando se implemente autenticación Supabase.
