/**
 * Centralized API & WebSocket Configuration Utility for REDGRID
 * Handles environment-aware URL resolution for local monolithic development
 * and distributed production deployment (Vercel Frontend -> Node.js Backend).
 */

// Normalized API base URL from Vite environment variables
const rawApiUrl = import.meta.env.VITE_API_URL;
const rawWsUrl = import.meta.env.VITE_WS_URL;

const RENDER_BACKEND_URL = 'https://redgrid.onrender.com';

/**
 * Resolves the primary REST API base URL.
 * 1. Honors explicit VITE_API_URL environment variable if set.
 * 2. In browser on Vercel / non-local domains, defaults to live Render backend.
 * 3. In local / Cloud Run container dev server, returns empty string (same-origin proxy).
 */
function resolveApiBaseUrl(): string {
  if (typeof rawApiUrl === 'string' && rawApiUrl.trim() !== '') {
    return rawApiUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Route to live Render backend if hosted on Vercel or external domain
    if (
      host.includes('vercel.app') ||
      (host !== 'localhost' && host !== '127.0.0.1' && !host.includes('.run.app'))
    ) {
      return RENDER_BACKEND_URL;
    }
  }

  return '';
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Resolves WebSocket base URL for real-time synchronization.
 */
function resolveWsBaseUrl(): string | undefined {
  if (typeof rawWsUrl === 'string' && rawWsUrl.trim() !== '') {
    return rawWsUrl.trim().replace(/\/+$/, '');
  }
  if (API_BASE_URL) {
    return API_BASE_URL;
  }
  return undefined;
}

export const WS_BASE_URL = resolveWsBaseUrl();

/**
 * Resolves a full API URL given a relative or absolute path.
 * If VITE_API_URL is configured (production), prepends the base URL.
 * In development / monolithic mode, returns the relative path intact.
 */
export function getApiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

/**
 * Returns authentication headers containing the stored JWT token if present.
 */
export function getAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  const token = localStorage.getItem('redgrid_token');
  if (token && !headers['Authorization'] && !headers['authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Environment-aware fetch wrapper that automatically prefixes the API base URL,
 * attaches stored JWT Authorization header if present, and sets JSON Content-Type for request bodies.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const targetUrl = getApiUrl(path);
  const headers = new Headers(options.headers || {});

  // Automatically attach stored JWT token if present and not explicitly provided
  const token = typeof window !== 'undefined' ? localStorage.getItem('redgrid_token') : null;
  if (token && !headers.has('Authorization') && !headers.has('authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default Content-Type to application/json for stringified bodies if not specified
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type') && !headers.has('content-type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(targetUrl, {
    ...options,
    headers,
  });
}
