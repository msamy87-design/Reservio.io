// utils/env.ts
/** Safe client env reader that works in Vite, tests, and fallbacks. */
export function getClientEnv(key: string): string | undefined {
  // Vite & modern browsers (during dev/build)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = (import.meta as any)?.env?.[key];
    if (typeof v === 'string' && v.length) return v;
  } catch { /* ignore */ }

  // Vitest/Jest or Node-based tools
  if (typeof process !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const v = (process.env as any)?.[key];
    if (typeof v === 'string' && v.length) return v;
  }

  return undefined;
}

export const API_BASE_URL =
  getClientEnv('VITE_API_BASE_URL') || '/api';

export const STRIPE_PUBLISHABLE_KEY =
  getClientEnv('VITE_STRIPE_PUBLISHABLE_KEY') || '';

// Environment validation for production
const isProd = import.meta.env.PROD;

if (isProd) {
  if (!STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    console.warn('Warning: Invalid or missing Stripe publishable key in production');
  }
  
  if (!API_BASE_URL || API_BASE_URL === '/api') {
    console.warn('Warning: API_BASE_URL should be set to your production API URL');
  }
}
