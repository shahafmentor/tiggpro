'use client'

/**
 * Centralized API Configuration
 *
 * This module provides a single source of truth for API configuration
 * across the entire frontend application.
 */

/**
 * Determines the API base URL based on environment and runtime context
 */
function getApiBaseUrl(): string {
  // In production, use the environment variable
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.tiggpro.com'
  }

  // In development, try environment variable first, then fall back to localhost
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // Development fallback - try common ports in order
  // This helps when backend starts on different ports
  return 'http://localhost:3001' // Default backend port
}

/**
 * Central API configuration object
 */
export const API_CONFIG = {
  /**
   * Base URL for all API requests
   */
  BASE_URL: getApiBaseUrl(),

  /**
   * Common headers for API requests
   */
  HEADERS: {
    'Content-Type': 'application/json',
  },

  /**
   * Request timeout in milliseconds
   */
  TIMEOUT: 10000,

  /**
   * Whether to include credentials in requests
   */
  CREDENTIALS: 'include' as RequestCredentials,
} as const

/**
 * API endpoint builder utility
 *
 * @param endpoint - The endpoint path (e.g., '/tenants')
 * @returns Complete URL for the API endpoint
 */
export function buildApiUrl(endpoint: string): string {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_CONFIG.BASE_URL}${normalizedEndpoint}`
}

/**
 * Environment-aware logging for API configuration
 */
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  console.info('🔧 API Configuration:', {
    baseUrl: API_CONFIG.BASE_URL,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
}

/**
 * Type definitions for API responses
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

/**
 * Standard API error response
 */
export interface ApiError {
  success: false
  error: string
  message?: string
}

