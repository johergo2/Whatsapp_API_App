# TODO MVP — Mercurio Send

## Leyenda
- [x] Completado
- [ ] Pendiente
- [~] En progreso

## FASE 1 — Prototipo Funcional (Legado)
- [x] Login con API Key
- [x] Template manager (CRUD completo)
- [x] Prospectos con columnas dinámicas según plantilla
- [x] Envío desde Prospectos con barra de progreso
- [x] Sección "Enviar mensajes" con textos y defaults
- [x] Historial de mensajes
- [x] Importación CSV con detección de encabezado
- [x] Descarga de CSV ejemplo
- [x] Diseño responsive

## FASE 2 — Migración a Next.js + Vercel + Supabase

### Repositorio
- [x] Repositorio Git inicializado
- [x] Remote configurado
- [x] Push a GitHub

### Migración de Código
- [x] Proyecto Next.js 14 creado
- [x] Tipos TypeScript definidos
- [x] Store (React Context) implementado
- [x] Componentes de UI migrados (Sidebar, Card, Modal, LoginForm)
- [x] Páginas: Templates, Prospects, Send, History, Login
- [x] Variables de entorno configuradas

### API Routes
- [x] GET /api/cliente — validación API Key (SHA256)
- [x] GET /api/variables — variables de Meta
- [x] GET|POST|PUT|DELETE /api/plantillas — CRUD vía API
- [x] GET|POST|PUT|DELETE /api/prospectos — CRUD vía API
- [x] GET /api/mensajes — historial vía API
- [x] POST /api/send-message — envío de templates
- [x] POST /api/send-media — envío de imágenes/video
- [x] GET|POST /api/webhook — webhook Meta
- [x] POST /api/outbound — registro manual
- [x] GET|POST /api/send-form-data — persistencia de formulario de envío

### Base de Datos
- [x] Esquema SQL con 7 tablas (original + auxiliares)
- [x] Seed data para cliente #1
- [x] Función RPC increment_requests_usadas
- [x] Triggers para fecha_actualizacion

### Despliegue
- [x] Vercel project configurado
- [x] Environment variables en Vercel
- [x] App desplegada en producción

### Webhook
- [x] VERIFY_TOKEN configurado
- [x] Webhook de Meta conectado
- [x] Suscripción a eventos messages

## FASE 3 — Mejoras Post-MVP

### Funcionalidad
- [ ] Autenticación con Supabase Auth (email + password)
- [ ] Multi-cliente (cada usuario ve solo sus datos)
- [ ] Editor de plantillas con preview visual
- [ ] Programación de envíos (fecha/hora)
- [ ] Reportes descargables (PDF/Excel)
- [ ] Reintento automático de envíos fallidos
- [ ] Notificaciones en tiempo real (WebSockets)
- [ ] Dark mode

### UX
- [ ] Tutorial/onboarding para nuevo usuario
- [ ] Atajos de teclado
- [ ] Búsqueda y filtros en tabla de prospectos
- [ ] Paginación en prospectos e historial
- [ ] Selección múltiple de prospectos
- [ ] Clonación de plantillas

### Calidad
- [ ] Tests unitarios (Vitest)
- [ ] Tests de integración (Playwright)
- [ ] Linting (ESLint)
- [ ] TypeScript strict mode

## FASE 4 — Escalabilidad
- [ ] Cache con Redis (Upstash)
- [ ] CDN para imágenes
- [ ] Backup automático de base de datos
- [ ] Monitoreo (Sentry)

## Issues Conocidos
- Desarrollo local y producción comparten la misma DB de Supabase
- Sin autenticación real — solo API Key
- No hay validación de formato de teléfono
