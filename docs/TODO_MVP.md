# TODO MVP — Mercurio Software

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
- [x] Páginas: Templates, Prospects, Send, History, Login, Register
- [x] Variables de entorno configuradas

### API Routes
- [x] GET /api/cliente — validación API Key (SHA256)
- [x] GET /api/variables — variables de Meta
- [x] GET|POST|PUT|DELETE /api/plantillas — CRUD vía API
- [x] GET|POST|PUT|DELETE /api/prospectos — CRUD vía API (DELETE sin ?id= borra todos)
- [x] GET /api/mensajes — historial con paginación y filtros (query params: page, pageSize, direction, estado, search)
- [x] POST /api/send-message — envío de templates
- [x] POST /api/send-media — envío de imágenes/video
- [x] GET|POST /api/webhook — webhook Meta
- [x] POST /api/outbound — registro manual
- [x] GET|POST /api/send-form-data — persistencia de formulario de envío

### **Autenticación Multi-usuario (NUEVA)**
- [x] Tabla `usuarios` + `usuarios_clientes` en BD
- [x] POST /api/auth/login — usuario + password (SHA256)
- [x] POST /api/auth/register — usuario + api_key cliente
- [x] Header `X-Cliente-Id` en todas las API Routes
- [x] `auth-utils.ts` helper para extraer cliente_id
- [x] `services.ts` usa `X-Cliente-Id` automáticamente
- [x] `store.tsx` estado global con `user` + `cliente`
- [x] Session restore desde `localStorage.mercurio_user`
- [x] LoginForm: usuario + password + link a registro
- [x] Register page: usuario, email opcional, password, API Key
- [x] Logout limpia `mercurio_user` + dispatch LOGOUT
- [x] 6 API Routes migradas a `X-Cliente-Id` (cliente, plantillas, prospectos, mensajes, send-form-data, variables)

### Funcionalidad
- [x] Import CSV persiste en BD (reemplaza todos los prospectos del cliente)
- [x] Auto-restauración de sesión al refrescar página
- [x] Checkbox "Solo pendientes" funcional en envío
- [x] Campo nomb_mio en plantillas (nombre del remitente)
- [x] header_type reemplazó has_header (none/image/document/video)
- [x] adjunto_cabecera reemplazó header_img en prospectos
- [x] CSV import soporta columna "adjunto cabecera"
- [x] Dashboard muestra número de WhatsApp (display_number)
- [x] Estado de envío visible completo y seleccionable
- [x] Columnas `texto1`–`texto6` en prospectos (DB + tipo + API + CSV import + UI)
- [x] Texto personalizado por prospecto con fallback a valores por defecto de "Enviar mensajes"
- [x] Validación de textos por prospecto contra `tpl.num_textos` en import CSV y envío
- [x] `plantilla_id` y `usuario_id` en prospectos (filtrado por usuario + plantilla)
- [x] Tabla de prospectos muestra todas las columnas siempre (sin depender de plantilla)
- [x] Tabla de prospectos vacía cuando no hay plantilla seleccionada
- [x] Espaciado compacto en tablas (padding `4px 8px`)

### Base de Datos
- [x] Esquema SQL con 9 tablas (original + auxiliares + 2 auth)
- [x] Seed data para cliente #1
- [x] Función RPC increment_requests_usadas
- [x] Triggers para fecha_actualizacion
- [x] Trigger validate_usuario_cliente para FK integrity

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
- [x] Cargue de archivos al bucket documentos (pagina /upload con drag-and-drop, validacion client-side)
- [x] Header type dinamico en send-message (image/document/video segun header_type de la plantilla)
- [x] Envio de footer_imgs como mensajes separados tras la plantilla
- [x] Campos de archivo aceptan nombre en vez de URL (adjunto_cabecera y footer_imgs)
- [x] RLS policies para bucket documentos (insert/select/update/delete public)
- [ ] RLS (Row Level Security) en Supabase para aislar datos por cliente
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
- [x] Paginación en prospectos (20/página)
- [x] Paginación en historial (20/página)
- [x] Filtros por columna en historial (De, Para, Dirección, Mensaje, Estado, Fecha Desde/Hasta)
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
- No hay validación de formato de teléfono
- Sin RLS habilitado (autenticación a nivel aplicación)
- Un usuario solo puede pertenecer a un cliente (relación 1:1 actual, tabla permite N:M)

(End of file - total 130 lines)