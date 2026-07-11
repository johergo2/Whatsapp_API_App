# PROJECT CONTEXT — Mercurio Send

## Descripción General
Plataforma web para envío masivo de mensajes WhatsApp utilizando plantillas de Meta (WhatsApp Business API). Permite gestionar plantillas, prospectos y realizar envíos con imágenes y texto personalizado por prospecto.

## Stack Tecnológico
- **Frontend**: Next.js 14 (React, TypeScript)
- **Backend**: Vercel API Routes (serverless functions)
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: API Key via header `X-API-Key` (hash SHA256)
- **Hosting**: Vercel (producción)
- **API de WhatsApp**: Meta Cloud API

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
```

Todas las operaciones pasan por API Routes que validan la API Key. No hay llamadas directas del navegador a Supabase.

## Estructura del Proyecto
```
WhatsApp_API_App/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cliente/route.ts        # GET - validar API Key
│   │   │   ├── variables/route.ts      # GET - variables de configuración
│   │   │   ├── plantillas/route.ts     # GET/POST/PUT/DELETE
│   │   │   ├── prospectos/route.ts     # GET/POST/PUT/DELETE
│   │   │   ├── mensajes/route.ts       # GET - historial
│   │   │   ├── send-message/route.ts   # POST - enviar template
│   │   │   ├── send-media/route.ts     # POST - enviar imagen/video
│   │   │   ├── send-form-data/route.ts # GET/POST - persistir formulario
│   │   │   ├── webhook/route.ts        # GET/POST - webhook Meta
│   │   │   ├── outbound/route.ts       # POST - registrar salida manual
│   │   │   └── chatwoot/               # Webhook Chatwoot
│   │   ├── templates/page.tsx          # Gestión de plantillas (con nomb_mio)
│   │   ├── prospects/page.tsx          # Gestión de prospectos + envío
│   │   ├── send/page.tsx               # Envío de mensajes
│   │   ├── history/page.tsx            # Historial
│   │   └── login/page.tsx              # Login
│   ├── components/
│   │   ├── SessionBanner.tsx           # Banner de sesión (loading/expired)
│   │   ├── Dashboard.tsx               # Dashboard con info del plan y WhatsApp
│   │   ├── LoginForm.tsx               # Formulario de login
│   │   └── ui/
│   │       ├── Sidebar.tsx
│   │       ├── Card.tsx
│   │       └── Modal.tsx
│   ├── lib/
│   │   ├── services.ts                 # Llamadas a API Routes
│   │   ├── store.tsx                   # Estado global (React Context)
│   │   └── supabase.ts                 # Cliente Supabase (server-side)
│   └── types/index.ts                  # Interfaces TypeScript
├── docs/                               # Documentación
├── legacy/                             # Prototipo original
├── supabase_migration.sql              # Migración de esquema
└── .env.local                          # Variables de entorno locales
```

## Variables de Entorno (`.env.local` y Vercel)
- `SUPABASE_URL` — URL del proyecto Supabase
- `SUPABASE_ANON_KEY` — Publishable key de Supabase

## Estado Actual
- App migrada de prototipo vanilla a Next.js 14
- Base de datos con 7 tablas (5 del esquema original + 2 auxiliares) + `send_form_data`
- API Routes implementadas y funcionales (incluyendo GET/POST send-form-data)
- Desplegado en Vercel
- Autenticación via API Key con hash SHA256
- Sin modo demo — error real si la API Key es inválida
- `sendFormData` se carga automáticamente al iniciar sesión (loadAllClientData)
- `plantillas.id` cambiado de UUID a SERIAL
- `nomb_mio` agregado como campo en plantillas (nombre del remitente)
- `header_type` reemplazó a `has_header` (soporta: `none`, `image`, `document`, `video`)
- `adjunto_cabecera` reemplazó a `header_img` en prospectos
- Sesión se restaura automáticamente al refrescar la página (AppProvider)
- Prospectos se persisten en BD al importar CSV (reemplazo completo por cliente)
- Estado de envío visible completo y seleccionable en tabla de prospectos
- Dashboard muestra número de WhatsApp (display_number) y Phone ID

## Usuario Objetivo
- Administradores de negocio que envían mensajes masivos por WhatsApp
- Operación actual desde Colombia (código de área +57)
