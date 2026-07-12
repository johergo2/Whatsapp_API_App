# PROJECT CONTEXT — Mercurio Software

## Descripción General
Plataforma web para envío masivo de mensajes WhatsApp utilizando plantillas de Meta (WhatsApp Business API). Permite gestionar plantillas, prospectos y realizar envíos con imágenes y texto personalizado por prospecto. Incluye branding corporativo y recepción de mensajes entrantes vía webhook.

## Stack Tecnológico
- **Frontend**: Next.js 14 (React, TypeScript)
- **Backend**: Vercel API Routes (serverless functions)
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: API Key via header `X-API-Key` (hash SHA256)
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
│   │   │   ├── documento/route.ts      # GET - proxy PDFs (Supabase Storage)
│   │   │   ├── outbound/route.ts       # POST - registrar salida manual
│   │   │   └── chatwoot/               # Webhook Chatwoot
│   │   ├── templates/page.tsx          # Gestión de plantillas (con nomb_mio)
│   │   ├── prospects/page.tsx          # Gestión de prospectos + envío
│   │   ├── send/page.tsx               # Envío de mensajes
│   │   ├── history/page.tsx            # Historial
│   │   └── login/page.tsx              # Login
│   ├── components/
│   │   ├── SessionBanner.tsx           # Banner de sesión (loading/expired)
│   │   ├── Dashboard.tsx               # Dashboard con branding WhatsApp
│   │   ├── LoginForm.tsx               # Formulario de login con branding
│   │   └── ui/
│   │       ├── Sidebar.tsx             # Menú vertical con icono + logos
│   │       ├── Card.tsx
│   │       └── Modal.tsx
│   ├── lib/
│   │   ├── services.ts                 # Llamadas a API Routes
│   │   ├── store.tsx                   # Estado global (React Context)
│   │   └── supabase.ts                 # Cliente Supabase (server-side)
│   └── types/index.ts                  # Interfaces TypeScript
├── public/
│   ├── favicon.svg                     # Icono WhatsApp (branding)
│   ├── Productosasesorias_transp.png    # Logo decorativo top-right
│   └── Logo_P&A_transp.png             # Logo sidebar footer
├── docs/                               # Documentación
├── legacy/                             # Prototipo original
├── supabase_migration.sql              # Migración de esquema
└── .env.local                          # Variables de entorno locales
```

## Variables de Entorno (`.env.local` y Vercel)
- `SUPABASE_URL` — URL del proyecto Supabase
- `SUPABASE_ANON_KEY` — Publishable key de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key de Supabase
- `NEXT_PUBLIC_APP_URL` — URL pública de la app
- `META_TOKEN` — Token de Meta Cloud API (en `variables_whatsapp` por cliente)

## Branding
- **Nombre**: Mercurio Software
- **Icono**: WhatsApp SVG de Wikipedia Commons, círculo #075E54 con borde blanco grueso (strokeWidth: 16) en todas las pantallas principales, teléfono blanco
- **Color primario**: #075E54 (verde oscuro WhatsApp)
- **Logo P&A**: `Productosasesorias_transp.png` (esquina superior derecha, 180px, top: 24) y `Logo_P&A_transp.png` (sidebar footer, 40% width)
- **Favicon**: SVG WhatsApp verde

## Estado Actual
- App migrada de prototipo vanilla a Next.js 14
- Base de datos con 7 tablas (5 del esquema original + 2 auxiliares) + `send_form_data`
- API Routes implementadas y funcionales (incluyendo GET/POST send-form-data, GET /api/documento)
- Desplegado en Vercel
- Autenticación via API Key con hash SHA256
- Sin modo demo — error real si la API Key es inválida
- Webhook Meta funcional: recibe status updates (estado_mensajes_whatsapp) y mensajes entrantes (mensajes_whatsapp)
- `sendFormData` se carga automáticamente al iniciar sesión (loadAllClientData)
- `plantillas.id` cambiado de UUID a SERIAL
- `nomb_mio` agregado como campo en plantillas (nombre del remitente)
- `header_type` reemplazó a `has_header` (soporta: `none`, `image`, `document`, `video`)
- `adjunto_cabecera` reemplazó a `header_img` en prospectos
- Sesión se restaura automáticamente al refrescar la página (AppProvider)
- Prospectos se persisten en BD al importar CSV (reemplazo completo por cliente)
- Estado de envío visible completo y seleccionable en tabla de prospectos
- Dashboard muestra número de WhatsApp (display_number) y Phone ID
- Branding corporativo en todas las pantallas: icono WhatsApp, "Mercurio Software", logos P&A

## Pendientes / Próximos Pasos
- Chat multiagente para responder mensajes entrantes desde la misma app (reemplazo de Chatwoot)
- Asignación de conversaciones a agentes con persistencia de agente por contacto
- Notificaciones en tiempo real para nuevos mensajes entrantes

## Usuario Objetivo
- Administradores de negocio que envían mensajes masivos por WhatsApp
- Operación actual desde Colombia (código de área +57)
