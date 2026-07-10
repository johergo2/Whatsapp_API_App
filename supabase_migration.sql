-- ================================================================
-- MIGRACIÓN: Reemplazar tablas antiguas con las 5 originales
-- Ejecutar en Supabase SQL Editor
-- ================================================================

-- 1. Eliminar tablas viejas (orden inverso por FK)
DROP TABLE IF EXISTS public.send_form_data CASCADE;
DROP TABLE IF EXISTS public.prospectos CASCADE;
DROP TABLE IF EXISTS public.plantillas CASCADE;
DROP TABLE IF EXISTS public.mensajes CASCADE;
DROP TABLE IF EXISTS public.variables CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;

-- 2. Función trigger para fecha_actualizacion
CREATE OR REPLACE FUNCTION public.set_fecha_actualizacion()
RETURNS trigger
LANGUAGE 'plpgsql'
AS $BODY$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$BODY$;

-- ================================================================
-- Tabla: clientes_whatsapp
-- ================================================================
CREATE TABLE public.clientes_whatsapp
(
    id SERIAL PRIMARY KEY,
    nit VARCHAR(20) NOT NULL,
    nombre_comercial VARCHAR(150) NOT NULL,
    phone_number_id VARCHAR(50) NOT NULL UNIQUE,
    display_number VARCHAR(20),
    api_key VARCHAR(255) UNIQUE,
    plan VARCHAR(50) NOT NULL DEFAULT 'FREE',
    requests_max INTEGER NOT NULL DEFAULT 1,
    requests_usadas INTEGER NOT NULL DEFAULT 0,
    periodo_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    periodo_fin DATE NOT NULL DEFAULT CURRENT_DATE,
    estado VARCHAR(20) DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_clientes_whatsapp_nit ON clientes_whatsapp(nit);
CREATE INDEX idx_clientes_whatsapp_display ON clientes_whatsapp(display_number);
CREATE INDEX idx_clientes_whatsapp_estado ON clientes_whatsapp(estado);

CREATE TRIGGER trg_set_fecha_actualizacion_cliewhat
    BEFORE UPDATE ON public.clientes_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION public.set_fecha_actualizacion();

-- Función para incrementar requests_usadas atómicamente
CREATE OR REPLACE FUNCTION public.increment_requests_usadas(p_cliente_id INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.clientes_whatsapp
    SET requests_usadas = COALESCE(requests_usadas, 0) + 1
    WHERE id = p_cliente_id;
END;
$$;

-- ================================================================
-- Tabla: contactos_whatsapp
-- ================================================================
CREATE TABLE public.contactos_whatsapp
(
    id BIGSERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes_whatsapp(id),
    telefono VARCHAR(20) NOT NULL,
    nombre VARCHAR(150),
    chatwoot_contact_id INTEGER,
    chatwoot_conversation_id INTEGER,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contactos_whatsapp_cliente_id_telefono_key UNIQUE (cliente_id, telefono)
);

CREATE INDEX idx_contactos_cliente ON contactos_whatsapp(cliente_id);
CREATE INDEX idx_contactos_telefono ON contactos_whatsapp(telefono);

CREATE TRIGGER trg_set_fecha_actualizacion_contwhat
    BEFORE UPDATE ON public.contactos_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION public.set_fecha_actualizacion();

-- ================================================================
-- Tabla: mensajes_whatsapp
-- ================================================================
CREATE TABLE public.mensajes_whatsapp
(
    id BIGSERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes_whatsapp(id),
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL, -- inbound / outbound
    mensaje TEXT,
    wamid TEXT,
    estado VARCHAR(20) DEFAULT 'pending',
    timestamp_wa TIMESTAMP,
    raw_payload JSONB NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mensajes_cliente ON mensajes_whatsapp(cliente_id);
CREATE INDEX idx_mensajes_created ON mensajes_whatsapp(fecha_creacion);
CREATE INDEX idx_mensajes_wamid ON mensajes_whatsapp(wamid);

-- ================================================================
-- Tabla: estado_mensajes_whatsapp
-- ================================================================
CREATE TABLE public.estado_mensajes_whatsapp
(
    id BIGSERIAL PRIMARY KEY,
    mensaje_id INT REFERENCES mensajes_whatsapp(id),
    wamid TEXT,
    estado VARCHAR(20),
    error_code VARCHAR(50),
    error_detail TEXT,
    timestamp_wa TIMESTAMP,
    raw_payload JSONB
);

CREATE INDEX idx_estado_wamid ON estado_mensajes_whatsapp(wamid);

-- ================================================================
-- Tabla: variables_whatsapp
-- ================================================================
CREATE TABLE public.variables_whatsapp
(
    id SERIAL PRIMARY KEY,
    variable VARCHAR(100) NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cliente_id INTEGER REFERENCES clientes_whatsapp(id)
);

CREATE UNIQUE INDEX varwhat_variable_uk ON public.variables_whatsapp (cliente_id, LOWER(TRIM(variable)));
CREATE INDEX varwhat_cliente_variable_idx ON variables_whatsapp (cliente_id, UPPER(TRIM(variable)));

CREATE TRIGGER trg_set_fecha_actualizacion_varwhat
    BEFORE UPDATE ON public.variables_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION public.set_fecha_actualizacion();

-- ================================================================
-- Tablas auxiliares para UI (plantillas, prospectos, send_form_data)
-- ================================================================
CREATE TABLE public.plantillas (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes_whatsapp(id),
    name TEXT NOT NULL,
    template_name TEXT NOT NULL,
    language_code TEXT DEFAULT 'es_CO',
    num_textos INTEGER DEFAULT 4,
    has_header BOOLEAN DEFAULT FALSE,
    num_footer INTEGER DEFAULT 0,
    footer_captions TEXT[],
    message_example TEXT,
    descripcion TEXT,
    nomb_mio TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plantillas_cliente ON plantillas(cliente_id);

CREATE TABLE public.prospectos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER REFERENCES clientes_whatsapp(id),
    nombre TEXT NOT NULL,
    telefono TEXT NOT NULL,
    header_img TEXT,
    footer_imgs TEXT[],
    captions TEXT[],
    estado TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prospectos_cliente ON prospectos(cliente_id);

-- ================================================================
-- Seed data: cliente #1 - Productos & Asesorías
-- ================================================================
INSERT INTO public.clientes_whatsapp (id, nit, nombre_comercial, phone_number_id, display_number, estado, api_key, plan, requests_max, requests_usadas, periodo_inicio, periodo_fin)
VALUES (1, '16780919', 'Productos & Asesorias', '958444014023857', '573052968034', 'ACT',
        'bf21276baba89222532bd27f164be88972dc104e30471a96cbb41f103898a478',
        'MAX 200 MSG', 200, 148, '2026-02-01', '2026-04-15');

-- Reiniciar secuencia del id para que el próximo cliente sea id=2
ALTER SEQUENCE clientes_whatsapp_id_seq RESTART WITH 2;

-- ================================================================
-- Seed data: variables_whatsapp para cliente 1
-- ================================================================
INSERT INTO public.variables_whatsapp (variable, valor, descripcion, cliente_id) VALUES
('phoneNumberID', '958444014023857', 'ID en Meta del número real 3052968034', 1),
('CHATWOOT_API_TOKEN', 'EgyYSsqVMbe1wKZLFD3qhEv1', 'Token Chatwoot', 1),
('VERIFY_TOKEN', 'johergo21970090516780919', 'Token verificación webhook Meta', 1),
('META_TOKEN', 'EAAmxP99IbJEBQnTZA046SHLwwuIoX87rs9pUDLoCzgjXbNa9PTvjSS9aZBmpwEht1veace0sq8xrgxuprK1LQsKdBg16T5xGDiJNHJRuNWIQDPoKtxlNWNHIHVeJgmFockCoQFobAEQgZCpgR299zcPE7PcK9x1LIgzy5ghKZCXwpjZBccxzn7xlPiT1JFHOayAZDZD', 'Token permanente Meta', 1),
('usr_excel_reader', 'Meta16780919', 'Usuario BD solo lectura', 1),
('CHATWOOT_INBOX_ID', '96844', 'Inbox Chatwoot cliente 1', 1),
('CHATWOOT_ACCOUNT_ID', '152767', 'Account ID Chatwoot cliente 1', 1);

-- ================================================================
-- Seed data: cliente #2 (opcional, descomentar si aplica)
-- ================================================================
-- INSERT INTO public.clientes_whatsapp (id, nit, nombre_comercial, phone_number_id, display_number, estado, api_key, plan, requests_max, requests_usadas, periodo_inicio, periodo_fin)
-- VALUES (2, '3145650653', 'Cliente 2', '973947112476845', '573145650653', 'ACT',
--         '<hash_api_key_del_cliente2>', 'PLAN 300', 300, 0, '2026-01-01', '2026-12-31');
