'use client';

import { signIn, signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <Button disabled variant="outline">
        Loading...
      </Button>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name || 'User'}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm font-medium">
            Welcome, {session.user.name}
          </span>
        </div>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
        <Button onClick={() => signOut()} variant="outline">
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button onClick={() => signIn('google')} className="bg-blue-600 hover:bg-blue-700">
        Sign in with Google
      </Button>
      {/* TODO: Add Apple Sign-In */}
    </div>
  );
}
