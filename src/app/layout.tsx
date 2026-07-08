import type { Metadata } from 'next';
import { AppProvider } from '@/lib/store';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mercurio Send',
  description: 'Plataforma de envío masivo de mensajes WhatsApp',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
