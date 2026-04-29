import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import type { AppProps } from 'next/app';
import { Toaster } from 'sonner';
import FloatingAssistant from '../components/FloatingAssistant';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/globals.css';

const clerkAppearance = {
  baseTheme: dark,
  variables: {
    colorBackground: '#0D1117',
    colorPrimary: '#2563eb',
    colorText: '#f1f5f9',
    colorTextSecondary: '#94a3b8',
    colorInputBackground: '#0A0E17',
    colorInputText: '#f1f5f9',
    borderRadius: '0.75rem',
  },
};

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps} appearance={clerkAppearance}>
      <Component {...pageProps} />
      <FloatingAssistant />
      <Toaster richColors position="bottom-right" duration={3000} />
    </ClerkProvider>
  );
}