export interface Cliente {
  id: number;
  nit: string;
  nombre_comercial: string;
  phone_number_id: string;
  display_number: string;
  api_key: string;
  plan: string;
  requests_max: number;
  requests_usadas: number;
  periodo_inicio: string;
  periodo_fin: string;
  estado: string;
}

export interface Variable {
  id: number;
  cliente_id: number;
  variable: string;
  valor: string;
  descripcion?: string;
}

export interface Contacto {
  id?: number;
  cliente_id: number;
  telefono: string;
  nombre?: string;
  chatwoot_contact_id?: number;
  chatwoot_conversation_id?: number;
}

export interface Mensaje {
  id?: number;
  cliente_id: number;
  from_number: string;
  to_number: string;
  direction: 'inbound' | 'outbound';
  mensaje?: string;
  wamid?: string;
  estado?: string;
  timestamp_wa?: string;
  raw_payload?: any;
  fecha_creacion?: string;
}

export interface EstadoMensaje {
  id?: number;
  mensaje_id: number;
  wamid?: string;
  estado?: string;
  error_code?: string;
  error_detail?: string;
  timestamp_wa?: string;
  raw_payload?: any;
}

export type HeaderType = 'none' | 'image' | 'document' | 'video';

export interface Plantilla {
  id: number;
  cliente_id?: number;
  name: string;
  template_name: string;
  language_code: string;
  num_textos: number;
  header_type: HeaderType;
  num_footer: number;
  footer_captions: string[];
  message_example: string;
  descripcion: string;
  nomb_mio: string;
}

export interface Prospecto {
  id?: number;
  cliente_id?: number;
  nombre: string;
  telefono: string;
  adjunto_cabecera: string;
  footer_imgs: string[];
  captions: string[];
  estado: string;
}

export interface SendFormValues {
  [key: string]: string | undefined;
  texto1?: string;
  texto2?: string;
  texto3?: string;
  texto4?: string;
  texto5?: string;
  texto6?: string;
  adjunto_cabecera?: string;
  footer_url1?: string;
  footer_url2?: string;
  footer_url3?: string;
  footer_url4?: string;
  caption1?: string;
  caption2?: string;
  caption3?: string;
  caption4?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  email?: string;
  rol: 'superadmin' | 'usuario';
  activo: boolean;
  cliente_id: number;
}
