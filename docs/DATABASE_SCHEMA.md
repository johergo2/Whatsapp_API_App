# DATABASE SCHEMA — Mercurio Software (Supabase / PostgreSQL)

## Esquema Actual
El esquema completo está definido en `supabase_migration.sql` en la raíz del proyecto.

### Tablas Principales (esquema original FastAPI)

| Tabla | Descripción |
|-------|-------------|
| `clientes_whatsapp` | Clientes con API Key, plan, límites, phone_number_id, display_number |
| `contactos_whatsapp` | Contactos que han escrito al número |
| `mensajes_whatsapp` | Historial de mensajes enviados/recibidos |
| `estado_mensajes_whatsapp` | Actualizaciones de estado (entregado, leído, fallido) |
| `variables_whatsapp` | Configuración (tokens, IDs de Meta y Chatwoot) |

### Tablas Auxiliares (UI)

| Tabla | Descripción |
|-------|-------------|
| `plantillas` | Plantillas de mensaje (nombre interno, nombre Meta, textos, imágenes, `header_type`, `nomb_mio` del remitente) |
| `prospectos` | Destinatarios con `adjunto_cabecera` (URL del PDF/imagen/video), URLs personalizadas por plantilla, `estado` de envío, `usuario_id`, `plantilla_id`, y columnas `texto1`–`texto6` para texto personalizado por prospecto |

### Tablas Adicionales

| Tabla | Descripción |
|-------|-------------|
| `send_form_data` | Persistencia del formulario de envío (valores por plantilla) |

### Tablas de Autenticación (NUEVAS)

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Usuarios del sistema: `id`, `nombre` (username único), `email`, `password_hash` (SHA256), `rol` ('superadmin'|'usuario'|'envíos'), `activo`, `created_at` |
| `usuarios_clientes` | Relación N:M usuarios ↔ clientes: `usuario_id` FK, `cliente_id` FK, PK compuesta. Trigger `validate_usuario_cliente` valida integridad. |

### Seed Data
El cliente #1 "Productos & Asesorías" se inserta con:
- `nit`: 16780919
- `phone_number_id`: 9584440....
- `display_number`: 57305....
- `api_key`: hash SHA256 de `sk_live_1d640dd642836d168dead7..............`
- `plan`: MAX 200 MSG

## Función RPC
- `increment_requests_usadas(p_cliente_id)` — incrementa atómicamente el contador de requests usadas

## Triggers
- `set_fecha_actualizacion()` — actualiza automáticamente `fecha_actualizacion` en cada UPDATE
- `validate_usuario_cliente()` — valida que `usuario_id` existe en `usuarios` y `cliente_id` en `clientes_whatsapp` antes de insertar en `usuarios_clientes`

## Ejecución
```sql
-- Ejecutar en Supabase SQL Editor
\i supabase_migration.sql
```

## Notas
- **RLS no está habilitado** (la autenticación se maneja a nivel aplicación via header `X-Cliente-Id`)
- Desarrollo local y producción comparten la misma base de datos Supabase
- Relación usuario-cliente actual es 1:1 (un usuario = un cliente), tabla `usuarios_clientes` preparada para N:M futuro