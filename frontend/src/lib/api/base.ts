'use client'

import { getAuthToken } from '@/lib/auth-utils'
import { API_CONFIG, buildApiUrl, type ApiResponse } from './config'

/**
 * Base API client with centralized configuration and error handling
 */

/**
 * Makes an authenticated API request with centralized configuration
 *
 * @param endpoint - The API endpoint (e.g., '/tenants' or 'tenants')
 * @param options - Fetch options (method, body, etc.)
 * @returns Promise with typed API response
 */
export async function makeAuthenticatedRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Get authentication token
    const token = await getAuthToken()

    if (!token) {
      return {
        success: false,
        error: 'Authentication required. Please sign in.',
      }
    }

    // Build complete URL
    const url = buildApiUrl(endpoint)

    // Merge headers with authentication and default headers
    const headers = {
      ...API_CONFIG.HEADERS,
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    }

    // Create request configuration
    const requestConfig: RequestInit = {
      ...options,
      headers,
      credentials: API_CONFIG.CREDENTIALS,
    }

    // Add timeout to the request
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

    try {
      const response = await fetch(url, {
        ...requestConfig,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Parse JSON response
      const data = await response.json()

      // Log API calls in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`📡 API ${options.method || 'GET'} ${endpoint}:`, {
          status: response.status,
          success: data.success,
          url,
        })
      }

      return data
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout - please try again',
        }
      }

      throw error
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Network error'

    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error ${options.method || 'GET'} ${endpoint}:`, errorMessage)
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  /**
   * Make a GET request
   */
  get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return makeAuthenticatedRequest<T>(endpoint, { ...options, method: 'GET' })
  },

  /**
   * Make a POST request
   */
  post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return makeAuthenticatedRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * Make a PUT request
   */
  put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return makeAuthenticatedRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * Make a PATCH request
   */
  patch<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<ApiResponse<T>> {
    return makeAuthenticatedRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  /**
   * Make a DELETE request
   */
  delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return makeAuthenticatedRequest<T>(endpoint, { ...options, method: 'DELETE' })
  },
}

export default api

