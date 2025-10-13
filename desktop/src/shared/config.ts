export const BACKEND_URL =
  (typeof process !== 'undefined' && (process as any).env?.VITE_BACKEND_URL) ||
  (import.meta as any).env?.VITE_BACKEND_URL ||
  'http://localhost:8080';

export const APP_ELECTRON_TOKEN =
  (typeof process !== 'undefined' && (process as any).env?.VITE_APP_ELECTRON_TOKEN) ||
  (import.meta as any).env?.VITE_APP_ELECTRON_TOKEN ||
  '';

export const REQUEST_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_PDF_SIZE = 30 * 1024 * 1024; // 30MB

