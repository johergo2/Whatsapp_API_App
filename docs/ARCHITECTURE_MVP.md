# ARCHITECTURE MVP — Mercurio Software

## Arquitectura Actual (Migración a Next.js + Supabase)

```
┌─────────────────────────────────────────────────────────────┐
│                    Navegador                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Next.js App (React/TypeScript)            │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌────────┐ │  │
│  │  │  Login   │ │Templates │ │ Prospects  │ │ Send   │ │  │
│  │  │  Page    │ │  Page    │ │   Page     │ │  Page  │ │  │
│  │  └──────────┘ └──────────┘ └────────────┘ └────────┘ │  │
│  │  ┌──────────┐ ┌──────────┐ ┌────────────┐            │  │
│  │  │ History  │ │Dashboard │ │ Session    │            │  │
│  │  │  Page    │ │  Page    │ │ Banner     │            │  │
│  │  └──────────┘ └──────────┘ └────────────┘            │  │
│  │                                                       │  │
│  │  services.ts (fetch → API Routes con X-Cliente-Id)   │  │
│  │         ↕                                             │  │
│  │  store.tsx (React Context - estado global)             │  │
│  │  AppProvider (restaura sesión al montar)              │  │
│  └───────────────────────────────────────────────────────┘  │
│                         ↕ HTTP (X-Cliente-Id header)        │
└─────────────────────────────────────────────────────────────┘
        ↕                      ↕                      ↕
   ┌──────────┐    ┌──────────────────┐    ┌──────────────┐
   │  Vercel  │    │   Vercel Edge    │    │   Vercel     │
   │  Static  │    │  API Routes      │    │  Webhook     │
   │  Assets  │    │  (serverless)    │    │  (POST only) │
   └──────────┘    └────────┬─────────┘    └──────┬───────┘
                             ↕                     ↕
                     ┌──────────────────────────────────┐
                     │          Supabase                 │
                     │  ┌──────────────────────────────┐ │
                     │  │        PostgreSQL DB         │ │
                     │  │  - clientes_whatsapp         │ │
                     │  │  - contactos_whatsapp        │ │
                     │  │  - mensajes_whatsapp         │ │
                     │  │  - estado_mensajes_whatsapp  │ │
                     │  │  - variables_whatsapp        │ │
                     │  │  - plantillas                │ │
                     │  │  - prospectos                │ │
                     │  │  - send_form_data            │ │
                     │  │  - usuarios                  │ │
                     │  │  - usuarios_clientes         │ │
                     │  └──────────────────────────────┘ │
                     └──────────────────────────────────┘
```

## Ambientes

### Desarrollo Local
```
npm run dev -p 3002
→ API Routes en http://localhost:3002/api/*
→ Se conecta a Supabase (misma DB que producción)
```

### Producción (Vercel)
```
https://whatsapp-api-app-silk.vercel.app
→ API Routes desplegadas en Vercel Edge
→ Misma base de datos Supabase
```

## Flujo de Datos

### Autenticación (Nueva)
```
POST /api/auth/login
  → Body: { nombre, password }
  → API Route: busca usuario en `usuarios` por nombre, verifica SHA256(password)
  → Consulta `usuarios_clientes` para obtener cliente_id
  → Respuesta: { id, nombre, email, rol, activo, cliente_id }

POST /api/auth/register
  → Body: { nombre, email, password, api_key }
  → Valida api_key en `clientes_whatsapp`
  → Crea usuario en `usuarios` (hash SHA256 password)
  → Crea relación en `usuarios_clientes`
  → Respuesta: { success: true }
```

### Session Restore (auto-login)
```
AppProvider (useEffect on mount)
  → localStorage.getItem('mercurio_user')
  → Si existe: parse JSON → dispatch SET_USER
  → GET /api/cliente?cliente_id=<user.cliente_id>
    → Si ok: SET_CLIENTE + loadAllClientData (templates, prospects, messages, sendFormData)
    → Si error: removeItem('mercurio_user'), SET_SESSION_EXPIRED
  → Si no existe: SET_SESSION_LOADING = false, muestra LoginForm
```

### Lectura
```
UI → services.ts → fetch('GET /api/...') con X-Cliente-Id
  → API Route lee header X-Cliente-Id → valida vs usuarios_clientes
  → Supabase SELECT filtrado por cliente_id
  → Respuesta JSON → store.tsx → UI
```

### Escritura
```
UI → services.ts → fetch('POST/PUT/DELETE /api/...') con X-Cliente-Id
  → API Route valida header X-Cliente-Id
  → Supabase INSERT/UPDATE/DELETE filtrado por cliente_id
  → Respuesta JSON → UI
```

### Envío de Mensajes
```
UI → services.ts → POST /api/send-message (o send-media) con cliente_id en body
  → API Route usa cliente_id del body (no header)
  → Obtiene META_TOKEN de variables_whatsapp
  → Envía a Meta Cloud API (graph.facebook.com)
  → Guarda en mensajes_whatsapp
  → Incrementa requests_usadas en clientes_whatsapp
```

### Webhook Meta
```
Meta → POST /api/webhook
  → Procesa actualizaciones de estado (entregado, leído, fallido)
  → Procesa mensajes entrantes
  → Guarda en estado_mensajes_whatsapp / mensajes_whatsapp
  → Sincroniza contactos en contactos_whatsapp
  → (Opcional) Reenvía a Chatwoot
```

## Principios de Diseño
1. **Todo pasa por API Routes** — el navegador nunca habla directo a Supabase
2. **Autenticación multi-usuario** — header `X-Cliente-Id` valida pertenencia via `usuarios_clientes`
3. **Sin modo demo** — error real si credenciales inválidas o usuario sin cliente
4. **Estado global** — React Context (`store.tsx`) mantiene estado UI + usuario + cliente
5. **Misma DB para desarrollo y producción** — los datos de prueba se borran manualmente
6. **Sesión persistente** — `AppProvider` restaura sesión desde `localStorage.mercurio_user`
7. **Prospectos en BD** — import CSV reemplaza todos los prospectos del cliente en Supabase
8. **Aislamiento por cliente** — cada request filtra por `cliente_id` del usuario autenticado