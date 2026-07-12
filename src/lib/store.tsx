'use client';

import { createContext, useContext, useReducer, ReactNode, Dispatch, useEffect } from 'react';
import type { Cliente, Plantilla, Prospecto, Mensaje, SendFormValues, Usuario } from '@/types';

interface AppState {
  user: Usuario | null;
  cliente: Cliente | null;
  templates: Plantilla[];
  prospects: Prospecto[];
  messages: Mensaje[];
  sendFormData: Record<string, SendFormValues>;
  currentSection: string;
  sending: boolean;
  prosTemplateId: number | null;
  demoMode: boolean;
  sessionExpired: boolean;
  sessionLoading: boolean;
}

interface AllData {
  templates: Plantilla[];
  prospects: Prospecto[];
  messages: Mensaje[];
  sendFormData: Record<string, SendFormValues>;
}

type Action =
  | { type: 'SET_USER'; payload: Usuario | null }
  | { type: 'SET_CLIENTE'; payload: Cliente | null }
  | { type: 'SET_ALL_DATA'; payload: AllData }
  | { type: 'SET_TEMPLATES'; payload: Plantilla[] }
  | { type: 'ADD_TEMPLATE'; payload: Plantilla }
  | { type: 'UPDATE_TEMPLATE'; payload: Plantilla }
  | { type: 'DELETE_TEMPLATE'; payload: number }
  | { type: 'SET_PROSPECTS'; payload: Prospecto[] }
  | { type: 'ADD_PROSPECT'; payload: Prospecto }
  | { type: 'UPDATE_PROSPECT'; payload: { index: number; data: Prospecto } }
  | { type: 'DELETE_PROSPECT'; payload: number }
  | { type: 'UPDATE_PROSPECT_FIELD'; payload: { index: number; field: string; value: string } }
  | { type: 'SET_MESSAGES'; payload: Mensaje[] }
  | { type: 'SET_SEND_FORM_DATA'; payload: { templateId: number; values: SendFormValues } }
  | { type: 'SET_SECTION'; payload: string }
  | { type: 'SET_SENDING'; payload: boolean }
  | { type: 'SET_PROS_TEMPLATE_ID'; payload: number | null }
  | { type: 'SET_DEMO_MODE'; payload: boolean }
  | { type: 'LOGOUT' }
  | { type: 'SET_SESSION_EXPIRED'; payload: boolean }
  | { type: 'SET_SESSION_LOADING'; payload: boolean };

const initialState: AppState = {
  user: null,
  cliente: null,
  templates: [],
  prospects: [],
  messages: [],
  sendFormData: {},
  currentSection: 'dashboard',
  sending: false,
  prosTemplateId: null,
  demoMode: false,
  sessionExpired: false,
  sessionLoading: true,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload, sessionLoading: false };
    case 'SET_CLIENTE':
      return { ...state, cliente: action.payload };
    case 'SET_ALL_DATA':
      return {
        ...state,
        templates: action.payload.templates,
        prospects: action.payload.prospects,
        messages: action.payload.messages,
        sendFormData: action.payload.sendFormData,
      };
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] };
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter((t) => t.id !== action.payload),
      };
    case 'SET_PROSPECTS':
      return { ...state, prospects: action.payload };
    case 'ADD_PROSPECT':
      return { ...state, prospects: [...state.prospects, action.payload] };
    case 'UPDATE_PROSPECT':
      return {
        ...state,
        prospects: state.prospects.map((p, i) =>
          i === action.payload.index ? action.payload.data : p
        ),
      };
    case 'DELETE_PROSPECT':
      return {
        ...state,
        prospects: state.prospects.filter((_, i) => i !== action.payload),
      };
    case 'UPDATE_PROSPECT_FIELD': {
      const p = { ...state.prospects[action.payload.index] };
      if (action.payload.field === 'adjunto_cabecera') {
        p.adjunto_cabecera = action.payload.value;
      }
      return {
        ...state,
        prospects: state.prospects.map((pp, i) =>
          i === action.payload.index ? p : pp
        ),
      };
    }
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'SET_SEND_FORM_DATA':
      return {
        ...state,
        sendFormData: {
          ...state.sendFormData,
          [String(action.payload.templateId)]: action.payload.values,
        },
      };
    case 'SET_SECTION':
      return { ...state, currentSection: action.payload };
    case 'SET_SENDING':
      return { ...state, sending: action.payload };
    case 'SET_PROS_TEMPLATE_ID':
      return { ...state, prosTemplateId: action.payload };
    case 'SET_DEMO_MODE':
      return { ...state, demoMode: action.payload };
    case 'LOGOUT':
      localStorage.removeItem('mercurio_user');
      return { ...initialState, sessionLoading: false };
    case 'SET_SESSION_EXPIRED':
      return { ...state, sessionExpired: action.payload };
    case 'SET_SESSION_LOADING':
      return { ...state, sessionLoading: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('mercurio_user') : null;
    if (!raw) {
      dispatch({ type: 'SET_SESSION_LOADING', payload: false });
      return;
    }

    let user: Usuario;
    try { user = JSON.parse(raw); } catch {
      localStorage.removeItem('mercurio_user');
      dispatch({ type: 'SET_SESSION_LOADING', payload: false });
      return;
    }

    dispatch({ type: 'SET_USER', payload: user });

    fetch(`/api/cliente?cliente_id=${user.cliente_id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('invalid');
        const cliente = await res.json();
        dispatch({ type: 'SET_CLIENTE', payload: cliente });

        const [templates, prospects, messages, sendFormData] = await Promise.all([
          fetch('/api/plantillas', { headers: { 'X-Cliente-Id': String(user.cliente_id) } }).then(r => r.json()).catch(() => []),
          fetch('/api/prospectos', { headers: { 'X-Cliente-Id': String(user.cliente_id) } }).then(r => r.json()).catch(() => []),
          fetch('/api/mensajes', { headers: { 'X-Cliente-Id': String(user.cliente_id) } }).then(r => r.json()).catch(() => []),
          fetch('/api/send-form-data', { headers: { 'X-Cliente-Id': String(user.cliente_id) } }).then(r => r.json()).then(rows => {
            const map: Record<string, SendFormValues> = {};
            for (const row of rows as Array<{ plantilla_id: number; values_json: Record<string, string> }>) {
              map[String(row.plantilla_id)] = row.values_json as SendFormValues;
            }
            return map;
          }).catch(() => ({})),
        ]);

        dispatch({ type: 'SET_ALL_DATA', payload: { templates, prospects, messages, sendFormData } });
      })
      .catch(() => {
        localStorage.removeItem('mercurio_user');
        dispatch({ type: 'SET_SESSION_EXPIRED', payload: true });
      })
      .finally(() => {
        dispatch({ type: 'SET_SESSION_LOADING', payload: false });
      });
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
