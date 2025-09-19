import { getSession } from 'next-auth/react'

/**
 * Get the JWT token from the current NextAuth session
 * @returns Promise<string | null> - The JWT token or null if not authenticated
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const session = await getSession()
    return session?.accessToken || null
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 * @returns Promise<boolean> - True if user has a valid session
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken()
  return token !== null
}
