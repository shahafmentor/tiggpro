import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { AuthProvider } from '@tiggpro/shared';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          // Request additional permissions for family management
          scope: 'openid email profile',
          prompt: 'select_account',
        },
      },
    }),
    // TODO: Add Apple Sign-In provider
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Here we'll sync with our backend
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/sync-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            image: user.image,
            providerId: account?.providerAccountId,
            provider: account?.provider as AuthProvider,
          }),
        });

        if (!response.ok) {
          console.error('Failed to sync user with backend');
          return false;
        }

        const backendUser = await response.json();

        // Store backend user info in the session
        user.id = backendUser.id;

        return true;
      } catch (error) {
        console.error('Error syncing user:', error);
        return false;
      }
    },

    async jwt({ token, user, account }) {
      // Persist the OAuth access_token and user info
      if (account && user) {
        token.accessToken = account.access_token;
        token.userId = user.id;
        token.provider = account.provider;
      }
      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.accessToken = token.accessToken as string;
        session.user.id = token.userId as string;
        session.provider = token.provider as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};
