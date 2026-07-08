export interface Cliente {
  id: number;
  phone_number_id: string;
  display_number: string;
  api_key: string;
  estado: string;
  plan: string;
  requests_max: number;
  requests_usadas: number;
  periodo_inicio: string;
  periodo_fin: string;
}

export interface Variable {
  id: number;
  cliente_id: number;
  variable: string;
  valor: string;
}

export interface Plantilla {
  id: string;
  cliente_id?: number;
  name: string;
  template_name: string;
  language_code: string;
  num_textos: number;
  has_header: boolean;
  num_footer: number;
  footer_captions: string[];
  message_example: string;
}

export interface Prospecto {
  id?: number;
  cliente_id?: number;
  nombre: string;
  telefono: string;
  header_img: string;
  footer_imgs: string[];
  captions: string[];
  estado: string;
}

export interface Mensaje {
  id?: number;
  cliente_id?: number;
  to: string;
  to_number?: string;
  tipo: string;
  mensaje: string;
  estado: string;
  error: string;
  fecha: string;
}

export interface SendFormValues {
  [key: string]: string | undefined;
  texto1?: string;
  texto2?: string;
  texto3?: string;
  texto4?: string;
  texto5?: string;
  texto6?: string;
  header_img?: string;
  footer_url1?: string;
  footer_url2?: string;
  footer_url3?: string;
  footer_url4?: string;
  caption1?: string;
  caption2?: string;
  caption3?: string;
  caption4?: string;
}
