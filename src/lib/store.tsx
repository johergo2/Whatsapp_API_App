'use client';

import { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import type { Cliente, Plantilla, Prospecto, Mensaje, SendFormValues } from '@/types';

interface AppState {
  cliente: Cliente | null;
  templates: Plantilla[];
  prospects: Prospecto[];
  messages: Mensaje[];
  sendFormData: Record<string, SendFormValues>;
  currentSection: string;
  sending: boolean;
  prosTemplateId: string | null;
  demoMode: boolean;
}

type Action =
  | { type: 'SET_CLIENTE'; payload: Cliente | null }
  | { type: 'SET_TEMPLATES'; payload: Plantilla[] }
  | { type: 'ADD_TEMPLATE'; payload: Plantilla }
  | { type: 'UPDATE_TEMPLATE'; payload: Plantilla }
  | { type: 'DELETE_TEMPLATE'; payload: string }
  | { type: 'SET_PROSPECTS'; payload: Prospecto[] }
  | { type: 'ADD_PROSPECT'; payload: Prospecto }
  | { type: 'UPDATE_PROSPECT'; payload: { index: number; data: Prospecto } }
  | { type: 'DELETE_PROSPECT'; payload: number }
  | { type: 'UPDATE_PROSPECT_FIELD'; payload: { index: number; field: string; value: string } }
  | { type: 'SET_MESSAGES'; payload: Mensaje[] }
  | { type: 'SET_SEND_FORM_DATA'; payload: { templateId: string; values: SendFormValues } }
  | { type: 'SET_SECTION'; payload: string }
  | { type: 'SET_SENDING'; payload: boolean }
  | { type: 'SET_PROS_TEMPLATE_ID'; payload: string | null }
  | { type: 'SET_DEMO_MODE'; payload: boolean };

const initialState: AppState = {
  cliente: null,
  templates: [],
  prospects: [],
  messages: [],
  sendFormData: {},
  currentSection: 'dashboard',
  sending: false,
  prosTemplateId: null,
  demoMode: false,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_CLIENTE':
      return { ...state, cliente: action.payload };
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
      if (action.payload.field === 'header_img') {
        p.header_img = action.payload.value;
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
          [action.payload.templateId]: action.payload.values,
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
