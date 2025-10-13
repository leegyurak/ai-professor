export const BACKEND_URL =
  (typeof process !== 'undefined' && (process as any).env?.VITE_BACKEND_URL) ||
  (import.meta as any).env?.VITE_BACKEND_URL ||
  'http://localhost:8080';

export const REQUEST_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
export const MAX_PDF_SIZE = 30 * 1024 * 1024; // 30MB

