/**
 * CORS Configuration for Edge Functions
 * 
 * In production, this restricts requests to only the SproutCV domain.
 * In development, it allows localhost for testing.
 */

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://sproutcv.app',
  'https://www.sproutcv.app',
  'http://localhost:5173',  // Vite dev server
  'http://localhost:3000',  // Alternative dev server
  'http://127.0.0.1:5173',
];

/**
 * Get CORS headers based on the request origin
 * Falls back to sproutcv.app for unmatched origins in production
 */
export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  // Check if the origin is in our allowed list
  const origin = requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)
    ? requestOrigin
    : 'https://sproutcv.app'; // Default to production domain

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
  };
}

/**
 * Legacy export for backwards compatibility
 * Note: Prefer using getCorsHeaders(req.headers.get('origin')) for better security
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
