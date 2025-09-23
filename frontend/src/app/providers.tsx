'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode, createContext, useContext } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/lib/theme-context';
import { TenantProvider } from '@/lib/contexts/tenant-context';
import { queryClient } from '@/lib/query-client';
import type { Dictionary } from './[locale]/dictionaries';

interface DictionaryContextType {
  dictionary: Dictionary;
  locale: string;
}

const DictionaryContext = createContext<DictionaryContextType | null>(null);

export function useDictionary() {
  const context = useContext(DictionaryContext);
  if (!context) {
    throw new Error('useDictionary must be used within a DictionaryProvider');
  }
  return context;
}

interface ProvidersProps {
  children: ReactNode;
  dictionary: Dictionary;
  locale: string;
}

export function Providers({ children, dictionary, locale }: ProvidersProps) {
  return (
    <DictionaryContext.Provider value={{ dictionary, locale }}>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <TenantProvider>
              {children}
              <Toaster position="top-right" />
              <ReactQueryDevtools initialIsOpen={false} />
            </TenantProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SessionProvider>
    </DictionaryContext.Provider>
  );
}
