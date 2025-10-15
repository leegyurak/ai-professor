import { BACKEND_URL, REQUEST_TIMEOUT_MS, APP_ELECTRON_TOKEN } from '@/shared/config';

export interface ApiError {
  status: number;
  message: string;
  details?: string;
}

async function http<T>(path: string, init: RequestInit & { authToken?: string } = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');

  // Add X-App-Token header for production CORS
  if (APP_ELECTRON_TOKEN) {
    headers.set('X-App-Token', APP_ELECTRON_TOKEN);
  }

  console.log('[API] authToken:', init.authToken);
  if (init.authToken) {
    headers.set('Authorization', `Bearer ${init.authToken}`);
    console.log('[API] Authorization header set:', headers.get('Authorization'));
  }

  // Remove authToken from init before passing to fetch
  const { authToken, ...fetchInit } = init;

  console.log('[API] Request to:', `${BACKEND_URL}${path}`);
  console.log('[API] Headers:', Array.from(headers.entries()));

  try {
    const res = await fetch(`${BACKEND_URL}${path}`, {
      ...fetchInit,
      headers,
      signal: controller.signal,
    });
    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}`;
      let errorDetails = '';

      try {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await res.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
          errorDetails = errorData.details || '';
        } else {
          const text = await res.text();
          errorDetails = text;
        }
      } catch (e) {
        // Ignore parsing errors
      }

      const error = new Error(errorMessage) as Error & { status: number; details: string };
      error.status = res.status;
      error.details = errorDetails;
      throw error;
    }
    return (await res.json()) as T;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.') as Error & { status: number };
      timeoutError.status = 408;
      throw timeoutError;
    }
    if (error.message === 'Failed to fetch') {
      const networkError = new Error('네트워크 연결에 실패했습니다. 백엔드 서버가 실행 중인지 확인해주세요.') as Error & { status: number };
      networkError.status = 0;
      throw networkError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function getMacAddress(): string {
  // Generate a consistent MAC address for this device
  let mac = localStorage.getItem('device_mac');
  if (!mac) {
    const random = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    mac = `${random()}:${random()}:${random()}:${random()}:${random()}:${random()}`;
    localStorage.setItem('device_mac', mac);
  }
  return mac;
}

// Login API
export interface LoginParams {
  username: string;
  password: string;
}
export interface LoginResult {
  token: string;
  username: string;
  userId: number;
}
export async function login(params: LoginParams): Promise<LoginResult> {
  return http<LoginResult>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      username: params.username,
      password: params.password,
      macAddress: getMacAddress()
    })
  });
}

// Logout API
export async function logout(token: string): Promise<void> {
  await http<void>('/api/auth/logout', {
    method: 'POST',
    authToken: token
  });
}

// Document APIs
export type ActionType = 'summary' | 'quiz';

export interface GenerateParams {
  type: ActionType;
  prompt: string;
  pdfBase64?: string;
}

export interface GenerateResult {
  resultPdfUrl: string;
}

export async function generate(params: GenerateParams, token?: string): Promise<GenerateResult> {
  const endpoint = params.type === 'summary'
    ? '/api/documents/summary'
    : '/api/documents/exam-questions';

  const response = await http<{ resultPdfUrl: string }>(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      pdfBase64: params.pdfBase64 || '',
      userPrompt: params.prompt
    }),
    authToken: token,
  });

  return { resultPdfUrl: response.resultPdfUrl };
}

// History API
export interface HistoryItem {
  id: number;
  processingType: 'SUMMARY' | 'EXAM_QUESTIONS';
  userPrompt: string;
  inputUrl: string;
  outputUrl: string;
  createdAt: string;
}

export interface HistoryResponse {
  content: HistoryItem[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isLast: boolean;
}

export interface HistoryParams {
  page?: number;
  size?: number;
  processingType?: 'SUMMARY' | 'EXAM_QUESTIONS';
}

export async function getHistory(params: HistoryParams, token: string): Promise<HistoryResponse> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set('page', String(params.page));
  if (params.size !== undefined) query.set('size', String(params.size));
  if (params.processingType) query.set('processingType', params.processingType);

  const queryString = query.toString();
  const path = `/api/documents/history${queryString ? `?${queryString}` : ''}`;

  return http<HistoryResponse>(path, {
    method: 'GET',
    authToken: token
  });
}
