# DATABASE SCHEMA — Mercurio Send (Supabase / PostgreSQL)

## Esquema Actual

El esquema completo está definido en `supabase_migration.sql` en la raíz del proyecto.

### Tablas Principales (esquema original FastAPI)

| Tabla | Descripción |
|-------|-------------|
| `clientes_whatsapp` | Clientes con API Key, plan, límites |
| `contactos_whatsapp` | Contactos que han escrito al número |
| `mensajes_whatsapp` | Historial de mensajes enviados/recibidos |
| `estado_mensajes_whatsapp` | Actualizaciones de estado (entregado, leído, fallido) |
| `variables_whatsapp` | Configuración (tokens, IDs de Meta y Chatwoot) |

### Tablas Auxiliares (UI)

| Tabla | Descripción |
|-------|-------------|
| `plantillas` | Plantillas de mensaje (nombre interno, nombre Meta, textos, imágenes) |
| `prospectos` | Destinatarios con URLs personalizadas por plantilla |

### Tablas Eliminadas
- `send_form_data` — eliminada en la migración (la persistencia de formulario se maneja en el store)

### Seed Data
El cliente #1 "Productos & Asesorias" se inserta con:
- `nit`: 16780919
- `phone_number_id`: 9584440....
- `display_number`: 57305....
- `api_key`: hash SHA256 de `sk_live_1d640dd642836d168dead7..............`
- `plan`: MAX 200 MSG

## Función RPC
- `increment_requests_usadas(p_cliente_id)` — incrementa atómicamente el contador de requests usados

## Triggers
- `set_fecha_actualizacion()` — actualiza automáticamente `fecha_actualizacion` en cada UPDATE

## Ejecución
```sql
-- Ejecutar en Supabase SQL Editor
\i supabase_migration.sql
```

## Notas
- RLS no está habilitado (la autenticación se maneja via API Key en las API Routes)
- Desarrollo local y producción comparten la misma base de datos Supabase
