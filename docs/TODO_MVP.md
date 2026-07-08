# TODO MVP — Mercurio Send

## Leyenda
- [x] Completado
- [ ] Pendiente
- [~] En progreso

## FASE 1 — Prototipo Funcional (Completado)

### Frontend
- [x] Login con API Key + modo demo automático
- [x] Dashboard con estadísticas del plan
- [x] Template manager (CRUD completo)
- [x] Prospectos con columnas dinámicas según plantilla
- [x] URLs editables inline en tabla de prospectos
- [x] Editor de caption por imagen por prospecto (modal ✏️)
- [x] Envío desde Prospectos con barra de progreso
- [x] Sección "Enviar mensajes" con textos y defaults
- [x] Historial de mensajes
- [x] Importación CSV con detección de encabezado
- [x] Descarga de CSV ejemplo
- [x] Persistencia en localStorage
- [x] Mock mode con datos de ejemplo
- [x] Diseño responsive

### Backend (API original)
- [x] Endpoint GET /cliente
- [x] Endpoint GET /variables
- [x] Endpoint POST /send-message
- [x] Endpoint POST /send-media

## FASE 2 — Migración a Vercel + Supabase

### Repositorio
- [x] Repositorio Git inicializado
- [x] Remote configurado
- [x] Commit inicial
- [x] Push a GitHub

### Supabase
- [x] Crear proyecto en Supabase
- [x] Ejecutar esquema SQL (ver DATABASE_SCHEMA.md)
- [ ] Configurar RLS y políticas de seguridad
- [x] Copiar SUPABASE_URL y SUPABASE_ANON_KEY

### Vercel
- [ ] Importar repositorio desde GitHub
- [ ] Configurar environment variables
- [ ] Desplegar

### Adaptación del Código
- [ ] Reemplazar localStorage por llamadas Supabase en api.js
- [ ] Agregar SDK de Supabase vía CDN
- [ ] Migrar mock data a datos reales desde DB
- [ ] Probar flujo completo con DB real

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
- [ ] TypeScript (migración gradual)

## FASE 4 — Escalabilidad

- [ ] Serverless functions en Vercel para lógica sensible
- [ ] Cache con Redis (Upstash)
- [ ] CDN para imágenes
- [ ] Backup automático de base de datos
- [ ] Monitoreo (Sentry)

## Issues Conocidos
- Render API free tier expirado → app funciona solo en mock mode
- Sin autenticación real → cualquier API Key funciona si Render está caído
- El estado de los prospectos se pierde al limpiar localStorage
- No hay validación de formato de teléfono
