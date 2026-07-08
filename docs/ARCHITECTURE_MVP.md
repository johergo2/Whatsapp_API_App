# ARCHITECTURE MVP — Mercurio Send

## Arquitectura Actual (Prototipo)

```
┌─────────────────────────────────────────────────┐
│                  Navegador                       │
│  ┌───────────────────────────────────────────┐   │
│  │           index.html (SPA)                 │   │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────┐   │   │
│  │  │ Login   │  │Dashboard│  │Templates │   │   │
│  │  │ Section │  │ Section │  │ Section  │   │   │
│  │  └─────────┘  └─────────┘  └──────────┘   │   │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────┐   │   │
│  │  │Prospects│  │  Send   │  │ History  │   │   │
│  │  │ Section │  │ Section │  │ Section  │   │   │
│  │  └─────────┘  └─────────┘  └──────────┘   │   │
│  │                                            │   │
│  │  app.js (lógica) ←→ api.js (API/mock)     │   │
│  │              ↕                             │   │
│  │        localStorage                        │   │
│  └───────────────────────────────────────────┘   │
│                         ↕                        │
│              HTTP (fallback mock)                 │
└─────────────────────────────────────────────────┘
                         ↕
            ┌──────────────────────┐
            │  Render (caído)      │
            │  FastAPI Backend     │
            │  whatsapp-api-       │
            │  fastapi.onrender.com│
            └──────────────────────┘
```

## Arquitectura Destino (Vercel + Supabase)

```
┌─────────────────────────────────────────────────┐
│                  Navegador                       │
│  ┌───────────────────────────────────────────┐   │
│  │   index.html (SPA - servido por Vercel)   │   │
│  │   app.js ←→ api.js (con Supabase SDK)    │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
         ↕                          ↕
    Vercel Edge               Supabase
    (static files)         ┌──────────────────┐
                           │  PostgreSQL DB   │
                           │  - clientes      │
                           │  - plantillas    │
                           │  - prospectos    │
                           │  - mensajes      │
                           └──────────────────┘
```

## Principios de Diseño
1. **Sin backend propio** — Vercel sirve estáticos, Supabase es la base de datos
2. **Offline-first** — el prototipo funciona completamente sin conexión a API
3. **Mock mode** — detectable por el usuario (banner)
4. **Estado en localStorage** — reemplazable por Supabase sin cambios en la UI
5. **Columnas dinámicas** — la UI se adapta a la estructura de la plantilla

## Flujo de Datos (MVP)

### Lectura
```
UI → app.js → api.js → Supabase SDK → PostgreSQL
                    ↕ (fallback)
                 localStorage (caché local)
```

### Escritura
```
UI → app.js → api.js → Supabase SDK → PostgreSQL
                    ↕ (si offline)
                 localStorage → sync cuando vuelva conexión
```

## Estados de UI
Cada sección maneja explícitamente:
- **Loading**: spinner mientras carga datos
- **Empty**: mensaje cuando no hay datos
- **Error**: toast con descripción del error
- **Success**: datos renderizados
