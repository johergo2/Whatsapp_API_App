# PROJECT CONTEXT — Mercurio Software

## Descripción General
Plataforma web para envío masivo de mensajes WhatsApp utilizando plantillas de Meta (WhatsApp Business API). Permite gestionar plantillas, prospectos y realizar envíos con imágenes y texto personalizado por prospecto. Incluye branding corporativo y recepción de mensajes entrantes vía webhook. **Sistema multi-usuario con autenticación por usuario/contraseña.**

## Stack Tecnológico
- **Frontend**: Next.js 14 (React, TypeScript)
- **Backend**: Vercel API Routes (serverless functions)
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Usuario/contraseña (hash SHA256) + header `X-Cliente-Id` para autorización por cliente
- **Hosting**: Vercel (producción)
- **API de WhatsApp**: Meta Cloud API
- **Branding**: Icono WhatsApp (Wikipedia Commons), logo Productos & Asesorías

## Ambientes

### Desarrollo Local
- URL: `http://localhost:3002`
- Ejecución: `npm run dev -p 3002`
- Base de datos: Supabase (compartida con producción)

### Producción
- URL: `https://whatsapp-api-app-silk.vercel.app`
- Hosting: Vercel (importado desde GitHub)
- Base de datos: Supabase (compartida con desarrollo local)

Ambos ambientes comparten la misma base de datos en Supabase. Los registros de prueba creados localmente deben borrarse manualmente desde el dashboard de Supabase.

## Arquitectura de Comunicación
```
Navegador → API Routes (Vercel/localhost) → Supabase (PostgreSQL)
Meta Cloud API → Webhook (/api/webhook) → Supabase (inbound + status)
```

Todas las operaciones pasan por API Routes que validan el header `X-Cliente-Id`. No hay llamadas directas del navegador a Supabase.

## Estructura del Proyecto
```
WhatsApp_API_App/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── login/route.ts       # POST - login usuario/contraseña
│   │   │   │   └── register/route.ts    # POST - registro usuario + api_key
│   │   │   ├── cliente/route.ts         # GET - datos cliente (?cliente_id=)
│   │   │   ├── variables/route.ts       # GET - variables de configuración
│   │   │   ├── plantillas/route.ts      # GET/POST/PUT/DELETE
│   │   │   ├── prospectos/route.ts      # GET/POST/PUT/DELETE
│   │   │   ├── mensajes/route.ts        # GET - historial
│   │   │   ├── send-message/route.ts    # POST - enviar template
│   │   │   ├── send-media/route.ts      # POST - enviar imagen/video
│   │   │   ├── send-form-data/route.ts  # GET/POST - persistir formulario
│   │   │   ├── webhook/route.ts         # GET/POST - webhook Meta
│   │   │   ├── documento/route.ts       # GET - proxy PDFs (Supabase Storage)
│   │   │   ├── outbound/route.ts        # POST - registrar salida manual
│   │   │   └── chatwoot/                # Webhook Chatwoot
│   │   ├── templates/page.tsx           # Gestión de plantillas (con nomb_mio)
│   │   ├── prospects/page.tsx           # Gestión de prospectos + envío
│   │   ├── send/page.tsx                # Envío de mensajes
│   │   ├── history/page.tsx             # Historial
│   │   ├── register/page.tsx            # Registro de usuario
│   │   └── page.tsx                     # Home (login o dashboard)
│   ├── components/
│   │   ├── SessionBanner.tsx            # Banner sesión (loading/expired)
│   │   ├── Dashboard.tsx                # Dashboard con branding WhatsApp
│   │   ├── LoginForm.tsx                # Formulario login usuario/contraseña
│   │   └── ui/
│   │       ├── Sidebar.tsx              # Menú vertical con icono + logos
│   │       ├── Card.tsx
│   │       └── Modal.tsx
│   ├── lib/
│   │   ├── services.ts                  # Llamadas a API Routes (usa X-Cliente-Id)
│   │   ├── store.tsx                    # Estado global (React Context + usuario/cliente)
│   │   ├── auth-utils.ts                # Helper getClienteId(req)
│   │   └── supabase.ts                  # Cliente Supabase (server-side)
│   └── types/index.ts                   # Interfaces TypeScript (incluye Usuario)
├── public/
│   ├── favicon.svg                      # Icono WhatsApp (branding)
│   ├── Productosasesorias_transp.png    # Logo decorativo top-right
│   └── Logo_P&A_transp.png              # Logo sidebar footer
├── docs/                                # Documentación
├── legacy/                              # Prototipo original
├── supabase_migration.sql               # Migración de esquema (incluye auth tables)
└── .env.local                           # Variables de entorno locales
```

## Variables de Entorno (`.env.local` y Vercel)
- `SUPABASE_URL` — URL del proyecto Supabase
- `SUPABASE_ANON_KEY` — Publishable key de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key de Supabase
- `NEXT_PUBLIC_APP_URL` — URL pública de la app
- `META_TOKEN` — Token de Meta Cloud API (en `variables_whatsapp` por cliente)

## Base de Datos — Tablas Principales

### Autenticación (nuevo)
| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Usuarios del sistema: `id`, `nombre` (username único), `email` (opcional), `password_hash` (SHA256), `rol` (`superadmin`/`usuario`), `activo` (bool) |
| `usuarios_clientes` | Relación N:M usuario-cliente: `usuario_id`, `cliente_id`, trigger para validar pertenencia |

### Core (original)
| Tabla | Descripción |
|-------|-------------|
| `clientes_whatsapp` | Clientes con `phone_number_id`, `display_number`, `api_key` (legacy, para registro), plan, límites |
| `contactos_whatsapp` | Contactos que han escrito al número |
| `mensajes_whatsapp` | Historial de mensajes enviados/recibidos |
| `estado_mensajes_whatsapp` | Actualizaciones de estado (entregado, leído, fallido) |
| `variables_whatsapp` | Configuración (tokens, IDs de Meta y Chatwoot) |
| `plantillas` | Plantillas de mensaje (nombre interno, nombre Meta, textos, imágenes, `header_type`, `nomb_mio`) |
| `prospectos` | Destinatarios con `adjunto_cabecera`, URLs personalizadas por plantilla y `estado` de envío |
| `send_form_data` | Persistencia del formulario de envío (valores por plantilla) |

## Branding
- **Nombre**: Mercurio Software
- **Icono**: WhatsApp SVG de Wikipedia Commons, círculo #075E54 con borde blanco grueso (strokeWidth: 16) en todas las pantallas principales, teléfono blanco
- **Color primario**: #075E54 (verde oscuro WhatsApp)
- **Logo P&A**: `Productosasesorias_transp.png` (esquina superior derecha, 180px, top: 24) y `Logo_P&A_transp.png` (sidebar footer, 40% width)
- **Favicon**: SVG WhatsApp verde

## Estado Actual
- App migrada de prototipo vanilla a Next.js 14
- Base de datos con 9 tablas (7 del esquema original + 2 auth) + `send_form_data`
- API Routes implementadas y funcionales (incluyendo auth: login/register, GET/POST send-form-data, GET /api/documento)
- Desplegada en Vercel
- **Autenticación migrada**: de API Key a usuario/contraseña + `X-Cliente-Id`
- Webhook Meta funcional: recibe status updates y mensajes entrantes
- `sendFormData` se carga automáticamente al iniciar sesión (`loadAllClientData`)
- `plantillas.id` cambiado de UUID a SERIAL
- `nomb_mio` agregado como campo en plantillas (nombre del remitente)
- `header_type` reemplazó a `has_header` (soporta: `none`, `image`, `document`, `video`)
- `adjunto_cabecera` reemplazó a `header_img` en prospectos
- Sesión se restaura automáticamente al refrescar la página (`AppProvider` + `localStorage.mercurio_user`)
- Prospectos se persisten en BD al importar CSV (reemplazo completo por cliente)
- Estado de envío visible completo y seleccionable en tabla de prospectos
- Dashboard muestra número de WhatsApp (`display_number`) y Phone ID
- Branding corporativo en todas las pantallas: icono WhatsApp, "Mercurio Software", logos P&A

## Pendientes / Próximos Pasos
- Chat multiagente para responder mensajes entrantes desde la misma app (reemplazo de Chatwoot)
- Asignación de conversaciones a agentes con persistencia de agente por contacto
- Notificaciones en tiempo real para nuevos mensajes entrantes

## Usuario Objetivo
- Administradores de negocio que envían mensajes masivos por WhatsApp
- Operación actual desde Colombia (código de área +57)