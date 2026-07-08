# PROJECT CONTEXT — Mercurio Send

## Descripción General
Plataforma web para envío masivo de mensajes WhatsApp utilizando plantillas de Meta (WhatsApp Business API). Permite gestionar plantillas, prospectos y realizar envíos con imágenes y texto personalizado por prospecto.

## Stack Actual (Prototipo)
- **Frontend**: HTML5 + CSS3 + JavaScript vanilla (SPA)
- **Persistencia**: localStorage
- **API Backend**: FastAPI desplegado en Render (caído por free tier)
- **Mock**: Modo demo automático cuando la API no responde

## Stack Destino
- **Hosting**: Vercel
- **Base de datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth (opcional)
- **API**: Serverless functions en Vercel (por implementar)

## Estructura del Proyecto
```
WhatsApp_API_App/
├── index.html          # SPA principal
├── css/
│   └── style.css       # Todos los estilos
├── js/
│   ├── api.js          # Capa de comunicación con API + mock
│   └── app.js          # Lógica de la aplicación
├── docs/
│   ├── PROJECT_CONTEXT.md
│   ├── API_SPEC.md
│   ├── ARCHITECTURE_MVP.md
│   ├── DATABASE_SCHEMA.md
│   ├── SMART_CONTRACT_SPEC.md
│   ├── TODO_MVP.md
│   └── Cambios.txt
├── app/                # Backend original FastAPI
├── Excel/              # Archivos Excel (legado)
├── Tablas/             # Base de conocimiento
├── Utils/              # Utilidades Python
└── venv/               # Entorno virtual Python
```

## Estado Actual
- Prototipo funcional 100% offline con modo demo
- Repositorio en GitHub: https://github.com/johergo2/Whatsapp_API_App.git
- Base de datos Supabase creada (6 tablas, plan Free)
- SUPABASE_URL y SUPABASE_ANON_KEY obtenidas
- Pendiente: despliegue en Vercel y migración de localStorage a Supabase

## Usuario Objetivo
- Administradores de negocio que envían mensajes masivos por WhatsApp
- Operación actual desde Colombia (código de área +57)
