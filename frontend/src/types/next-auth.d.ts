import 'next-auth';
import { AuthProvider } from '@tiggpro/shared';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    provider?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    provider?: AuthProvider;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    userId?: string;
    provider?: string;
  }
}
