# ARCHITECTURE MVP — Mercurio Send

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
│  │  services.ts (fetch → API Routes)                     │  │
│  │         ↕                                             │  │
│  │  store.tsx (React Context - estado global)             │  │
│  │  AppProvider (restaura sesión al montar)              │  │
│  └───────────────────────────────────────────────────────┘  │
│                         ↕ HTTP (X-API-Key header)           │
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

### Lectura
```
UI → services.ts → fetch('GET /api/...') con X-API-Key
  → API Route valida API Key (SHA256 vs clientes_whatsapp)
  → Supabase SELECT
  → Respuesta JSON → store.tsx → UI
```

### Escritura
```
UI → services.ts → fetch('POST/PUT/DELETE /api/...') con X-API-Key
  → API Route valida API Key
  → Supabase INSERT/UPDATE/DELETE
  → Respuesta JSON → UI
```

### Envío de Mensajes
```
UI → services.ts → POST /api/send-message (o send-media)
  → API Route valida API Key
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

### Session Restore (auto-login)
```
AppProvider (useEffect on mount)
  → localStorage.getItem('mercurio_api_key')
  → Si existe: GET /api/cliente con X-API-Key
    → Si ok: SET_CLIENTE + loadAllClientData (templates, prospects, messages, sendFormData)
    → Si error: SET_SESSION_EXPIRED, muestra banner rojo con botón "Ir al login"
  → Si no existe: SET_SESSION_LOADING = false, LoginForm
```

## Principios de Diseño
1. **Todo pasa por API Routes** — el navegador nunca habla directo a Supabase
2. **API Key como autenticación** — hash SHA256 en cada request
3. **Sin modo demo** — error real si la API Key es inválida
4. **Estado global** — React Context (store.tsx) mantiene el estado de la UI
5. **Misma DB para desarrollo y producción** — los datos de prueba se borran manualmente
6. **Sesión persistente** — AppProvider restaura sesión automáticamente al montar
7. **Prospectos en BD** — import CSV reemplaza todos los prospectos del cliente en Supabase
