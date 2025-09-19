'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/lib/theme-context';
import { TenantProvider } from '@/lib/contexts/tenant-context';
import { queryClient } from '@/lib/query-client';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
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
  );
}
