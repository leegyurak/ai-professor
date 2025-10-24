import { BACKEND_URL, REQUEST_TIMEOUT_MS, APP_ELECTRON_TOKEN } from '@/shared/config';
import { getDeviceId } from '@/utils/deviceId';

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

    // Handle 204 No Content or empty responses
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined as T;
    }

    // Check if response has content before parsing JSON
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await res.json()) as T;
    }

    return undefined as T;
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
      macAddress: getDeviceId() // Use device ID instead of MAC address
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

// User Info API
export interface UserInfoResponse {
  userId: number;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export async function getUserInfo(token: string): Promise<UserInfoResponse> {
  return http<UserInfoResponse>('/api/auth/me', {
    method: 'GET',
    authToken: token
  });
}

// Delete Account API
export async function deleteAccount(token: string): Promise<void> {
  await http<void>('/api/auth/me', {
    method: 'DELETE',
    authToken: token
  });
}

// Register API
export interface RegisterParams {
  username: string;
  password: string;
  email: string;
}
export interface RegisterResult {
  userId: number;
  username: string;
  email: string;
}
export async function register(params: RegisterParams): Promise<RegisterResult> {
  return http<RegisterResult>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: params.username,
      password: params.password,
      email: params.email
    })
  });
}

// Document APIs
export type ActionType = 'summary' | 'quiz';

export interface GenerateParams {
  type: ActionType;
  prompt: string;
  pdfBase64?: string;
  importantParts?: string[];
}

export interface GenerateResult {
  resultPdfUrl: string;
}

export async function generate(params: GenerateParams, token?: string): Promise<GenerateResult> {
  const endpoint = params.type === 'summary'
    ? '/api/documents/summary'
    : '/api/documents/exam-questions';

  const requestBody: any = {
    pdfBase64: params.pdfBase64 || '',
    userPrompt: params.prompt
  };

  // Add importantParts if provided
  if (params.importantParts && params.importantParts.length > 0) {
    requestBody.importantParts = params.importantParts;
  }

  const response = await http<{ resultPdfUrl: string }>(endpoint, {
    method: 'POST',
    body: JSON.stringify(requestBody),
    authToken: token,
  });

  return { resultPdfUrl: response.resultPdfUrl };
}

// History API
export interface HistoryItem {
  id: number;
  processingType: 'SUMMARY' | 'EXAM_QUESTIONS' | 'CRAMMING';
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
  processingType?: 'SUMMARY' | 'EXAM_QUESTIONS' | 'CRAMMING';
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

// Cramming API
export interface CrammingParams {
  pdfBase64: string;
  hoursUntilExam: number;
}

export interface CrammingResult {
  markdownContent: string;
  resultPdfUrl: string;
}

export async function generateCramming(params: CrammingParams, token: string): Promise<CrammingResult> {
  return http<CrammingResult>('/api/documents/cramming', {
    method: 'POST',
    body: JSON.stringify({
      pdfBase64: params.pdfBase64,
      hoursUntilExam: params.hoursUntilExam
    }),
    authToken: token
  });
}

// Email Verification API
export interface VerifyEmailResult {
  success: boolean;
  message: string;
}

export async function verifyEmail(token: string): Promise<VerifyEmailResult> {
  return http<VerifyEmailResult>(`/api/auth/verify-email?token=${token}`, {
    method: 'GET'
  });
}

// Interview APIs
export interface CreateInterviewParams {
  interviewDate: string; // LocalDate in YYYY-MM-DD format
  interviewType: string; // 직무명
  announcementUrl: string; // 채용공고 URL
}

export interface InterviewResponse {
  id: number;
  userId: number;
  interviewDate: string;
  interviewType: string;
  announcementUrl: string;
  createdAt: string;
  updatedAt: string;
}

export async function createInterview(params: CreateInterviewParams, token: string): Promise<InterviewResponse> {
  return http<InterviewResponse>('/api/interviews', {
    method: 'POST',
    body: JSON.stringify(params),
    authToken: token
  });
}

export async function getInterviews(token: string): Promise<InterviewResponse[]> {
  return http<InterviewResponse[]>('/api/interviews', {
    method: 'GET',
    authToken: token
  });
}

// Mock Interview APIs
export interface CreateMockInterviewParams {
  userInterviewId: number;
  resumeFile: string; // Base64 encoded PDF
}

export interface MockInterviewResponse {
  mockInterviewId: number;
  questionMarkdown: string; // Markdown 형식의 면접 질문
}

export interface MockInterviewDetailResponse {
  id: number;
  userId: number;
  userInterviewId: number;
  resumeFilePath: string;
  questionFilePath: string;
  gradingFilePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createMockInterview(params: CreateMockInterviewParams, token: string): Promise<MockInterviewResponse> {
  return http<MockInterviewResponse>('/api/interviews/mock', {
    method: 'POST',
    body: JSON.stringify(params),
    authToken: token
  });
}

export async function getMockInterviews(token: string): Promise<MockInterviewDetailResponse[]> {
  return http<MockInterviewDetailResponse[]>('/api/interviews/mock', {
    method: 'GET',
    authToken: token
  });
}

export async function getMockInterviewsByInterview(userInterviewId: number, token: string): Promise<MockInterviewDetailResponse[]> {
  return http<MockInterviewDetailResponse[]>(`/api/interviews/mock/by-interview/${userInterviewId}`, {
    method: 'GET',
    authToken: token
  });
}

export interface GradingParams {
  answers: string; // 면접 답변 텍스트
}

export interface GradingResponse {
  gradingMarkdown: string; // Markdown 형식의 평가 결과
}

export async function gradeMockInterview(mockInterviewId: number, params: GradingParams, token: string): Promise<GradingResponse> {
  return http<GradingResponse>(`/api/interviews/mock/${mockInterviewId}/grading`, {
    method: 'POST',
    body: JSON.stringify(params),
    authToken: token
  });
}
