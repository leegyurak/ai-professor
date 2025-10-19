import React, { useEffect, useMemo, useState } from 'react';
import { MAX_PDF_SIZE } from '@/shared/config';
import { generate, getHistory, login, logout, register } from './apiClient';
import type { ActionType, HistoryItem } from './apiClient';
import { fileToBase64, getPdfPageCount, downloadPdfFromUrl } from './utils/pdfUtils';
import { PdfViewer } from './components/PdfViewer';
import { CrammingTab } from './components/CrammingTab';
import { UserProfileModal } from './components/UserProfileModal';
import { initTwemoji } from './utils/emojiUtils';

function PrivacyScreen() {
  return (
    <div className="center" style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: 'clamp(16px, 5vw, 24px)' }}>
      <div className="card" style={{ maxWidth: 800, width: '100%', padding: 'clamp(24px, 7vw, 40px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 7vw, 32px)' }}>
          <div style={{ fontSize: 'clamp(32px, 10vw, 40px)', marginBottom: 'clamp(8px, 2.5vw, 12px)' }}>🔒</div>
          <h1 className="title" style={{ fontSize: 'clamp(24px, 7vw, 32px)', marginBottom: 'clamp(8px, 2.5vw, 12px)' }}>개인정보처리방침</h1>
          <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(12px, 3.2vw, 14px)' }}>
            AI Professor 서비스
          </div>
        </div>

        <div style={{ lineHeight: '1.8', fontSize: 'clamp(13px, 3.5vw, 14px)', color: 'var(--text)' }}>
          <section style={{ marginBottom: 'clamp(20px, 6vw, 28px)' }}>
            <h2 style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', fontWeight: 600, marginBottom: 'clamp(10px, 3vw, 12px)' }}>
              1. 개인정보의 수집 및 이용 목적
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>
              AI Professor는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ul style={{ paddingLeft: 'clamp(16px, 5vw, 20px)', marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>
              <li>회원 가입 및 관리</li>
              <li>서비스 제공 및 이용</li>
              <li>고객 문의 대응</li>
            </ul>
          </section>

          <section style={{ marginBottom: 'clamp(20px, 6vw, 28px)' }}>
            <h2 style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', fontWeight: 600, marginBottom: 'clamp(10px, 3vw, 12px)' }}>
              2. 수집하는 개인정보 항목
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>
              AI Professor는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다:
            </p>
            <ul style={{ paddingLeft: 'clamp(16px, 5vw, 20px)', marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>
              <li>필수항목: 아이디, 비밀번호, 이메일</li>
              <li>자동 수집 항목: IP 주소, 기기 정보</li>
            </ul>
          </section>

          <section style={{ marginBottom: 'clamp(20px, 6vw, 28px)' }}>
            <h2 style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', fontWeight: 600, marginBottom: 'clamp(10px, 3vw, 12px)' }}>
              3. 개인정보의 보유 및 이용 기간
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>
              회원 탈퇴 시까지 보유하며, 탈퇴 후에는 즉시 파기합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.
            </p>
          </section>

          <section style={{ marginBottom: 'clamp(20px, 6vw, 28px)' }}>
            <h2 style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', fontWeight: 600, marginBottom: 'clamp(10px, 3vw, 12px)' }}>
              4. 개인정보의 제3자 제공
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>
              AI Professor는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
            </p>
          </section>

          <section style={{ marginBottom: 'clamp(20px, 6vw, 28px)' }}>
            <h2 style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', fontWeight: 600, marginBottom: 'clamp(10px, 3vw, 12px)' }}>
              5. 개인정보의 파기
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>
              개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우, 지체 없이 해당 개인정보를 파기합니다.
            </p>
          </section>

          <section style={{ marginBottom: 'clamp(20px, 6vw, 28px)' }}>
            <h2 style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', fontWeight: 600, marginBottom: 'clamp(10px, 3vw, 12px)' }}>
              6. 이용자의 권리
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>
              이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 개인정보의 처리에 동의하지 않는 경우 동의를 거부하거나 가입 해지를 요청할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', fontWeight: 600, marginBottom: 'clamp(10px, 3vw, 12px)' }}>
              7. 개인정보 보호책임자
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>
              개인정보 보호와 관련한 문의사항은 아래의 개인정보 보호책임자에게 연락 주시기 바랍니다.
            </p>
            <div style={{ background: 'var(--bg-secondary)', padding: 'clamp(12px, 4vw, 16px)', borderRadius: 4, border: '1px solid var(--border)' }}>
              <p style={{ marginBottom: 'clamp(4px, 1.5vw, 6px)' }}>담당자: AI Professor 보안팀</p>
              <p>이메일: privacy@ai-professor.me</p>
            </div>
          </section>
        </div>

        <div style={{ marginTop: 'clamp(24px, 7vw, 32px)', paddingTop: 'clamp(16px, 5vw, 20px)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <button
            className="btn"
            onClick={() => window.history.back()}
            style={{ padding: 'clamp(10px, 3vw, 12px) clamp(20px, 6vw, 24px)', fontSize: 'clamp(13px, 3.5vw, 14px)' }}
          >
            ← 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onDone }: { onDone: (username: string, token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const handle = async () => {
    if (!username || !password) {
      setErr('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const res = await login({ username, password });
      console.log('[LoginScreen] Login response:', res);
      console.log('[LoginScreen] token:', res.token);
      localStorage.setItem('auth', JSON.stringify({ username: res.username, token: res.token }));
      onDone(res.username, res.token);
    } catch (e: any) {
      setErr(e?.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!registerUsername || !registerPassword || !registerEmail) {
      setErr('모든 항목을 입력해주세요.');
      return;
    }
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerEmail)) {
      setErr('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    setErr(null);
    setRegisterLoading(true);
    try {
      await register({
        username: registerUsername,
        password: registerPassword,
        email: registerEmail
      });
      setRegisterSuccess(true);
    } catch (e: any) {
      setErr(e?.message || '회원가입에 실패했습니다.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handle();
  };

  const handleRegisterKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRegister();
  };

  return (
    <div className="center" style={{ height: '100%', background: '#ffffff', padding: 'clamp(8px, 3vw, 12px)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 400, maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px var(--shadow-md)' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(12px, 4vw, 16px)', flexShrink: 0 }}>
          <div style={{ fontSize: 'clamp(32px, 10vw, 40px)', marginBottom: 'clamp(6px, 2vw, 8px)' }}>🎓</div>
          <h1 className="title" style={{ fontSize: 'clamp(20px, 6vw, 24px)', marginBottom: 6 }}>AI Professor</h1>
          <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(11px, 3vw, 12px)' }}>교육 자료 요약 및 문제 생성</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
          <input
            className="input"
            placeholder="👤 아이디"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <div className="space" />
          <input
            className="input"
            type="password"
            placeholder="🔒 비밀번호"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          {err && (
            <>
              <div className="space" />
              <div className="alert error">
                <span className="alert-icon">⚠️</span>
                <span>{err}</span>
              </div>
            </>
          )}
          <div className="space" />
          <button className="btn" onClick={handle} disabled={loading} style={{ width: '100%' }}>
            {loading ? '⏳ 로그인 중...' : '✨ 로그인'}
          </button>
          <div className="space" />
          <button
            className="btn secondary"
            onClick={() => {
              setShowRegisterModal(true);
              setErr(null);
              setRegisterSuccess(false);
            }}
            style={{ width: '100%', fontSize: 'clamp(12px, 3.2vw, 13px)' }}
          >
            📝 회원가입
          </button>
        </div>
      </div>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="overlay" onClick={() => {
          setShowRegisterModal(false);
          setRegisterUsername('');
          setRegisterPassword('');
          setRegisterEmail('');
          setErr(null);
          setRegisterSuccess(false);
        }}>
          <div
            className="card"
            style={{
              padding: 'clamp(24px, 7vw, 32px)',
              maxWidth: 400,
              width: '90%',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowRegisterModal(false);
                setRegisterUsername('');
                setRegisterPassword('');
                setRegisterEmail('');
                setErr(null);
                setRegisterSuccess(false);
              }}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: 'var(--muted)',
                padding: 0,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
            >
              ✕
            </button>

            {registerSuccess ? (
              <div style={{ textAlign: 'center', padding: 'clamp(20px, 6vw, 30px) 0' }}>
                <div style={{ fontSize: 'clamp(40px, 12vw, 48px)', marginBottom: 'clamp(12px, 4vw, 16px)' }}>✅</div>
                <div style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', fontWeight: 600, marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>
                  가입 성공!
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 'clamp(13px, 3.5vw, 14px)', lineHeight: '1.5' }}>
                  승인 대기 중이에요
                </div>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 'clamp(16px, 5vw, 20px)' }}>
                  <div style={{ fontSize: 'clamp(32px, 10vw, 40px)', marginBottom: 'clamp(6px, 2vw, 8px)' }}>📝</div>
                  <h2 className="title" style={{ fontSize: 'clamp(18px, 5vw, 20px)', marginBottom: 4 }}>회원가입</h2>
                  <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(11px, 3vw, 12px)' }}>
                    새로운 계정을 만들어보세요
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 3vw, 12px)' }}>
                  <input
                    className="input"
                    placeholder="👤 아이디"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    onKeyDown={handleRegisterKeyPress}
                    style={{ fontSize: 'clamp(13px, 3.5vw, 14px)' }}
                  />
                  <input
                    className="input"
                    type="password"
                    placeholder="🔒 비밀번호"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    onKeyDown={handleRegisterKeyPress}
                    style={{ fontSize: 'clamp(13px, 3.5vw, 14px)' }}
                  />
                  <input
                    className="input"
                    type="email"
                    placeholder="📧 이메일"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    onKeyDown={handleRegisterKeyPress}
                    style={{ fontSize: 'clamp(13px, 3.5vw, 14px)' }}
                  />

                  {err && (
                    <div className="alert error">
                      <span className="alert-icon">⚠️</span>
                      <span style={{ fontSize: 'clamp(12px, 3.2vw, 13px)' }}>{err}</span>
                    </div>
                  )}

                  <div style={{
                    fontSize: 'clamp(10px, 2.8vw, 11px)',
                    color: 'var(--muted)',
                    textAlign: 'center',
                    lineHeight: '1.5',
                    marginTop: 'clamp(4px, 1.5vw, 6px)'
                  }}>
                    가입 시{' '}
                    <a
                      href="/privacy"
                      style={{
                        color: 'var(--text)',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      개인정보처리방침
                    </a>
                    에 동의하는 것으로 간주합니다.
                  </div>

                  <button
                    className="btn"
                    onClick={handleRegister}
                    disabled={registerLoading}
                    style={{
                      width: '100%',
                      marginTop: 'clamp(6px, 2vw, 8px)',
                      padding: 'clamp(10px, 3vw, 12px)',
                      fontSize: 'clamp(13px, 3.5vw, 14px)'
                    }}
                  >
                    {registerLoading ? '⏳ 가입 중...' : '✨ 가입하기'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [drag, setDrag] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      className={`dropzone ${drag ? 'drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) onFiles(files);
      }}
    >
      <div style={{ fontSize: 'clamp(24px, 8vw, 32px)', marginBottom: 'clamp(6px, 2vw, 8px)' }}>📄</div>
      <div style={{ fontSize: 'clamp(12px, 3.2vw, 14px)', lineHeight: '1.5' }}>
        {isMobile ? (
          <>
            PDF 파일을 드래그하거나 선택하세요<br />
            <span style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: 'var(--muted)' }}>(복수 선택 가능)</span>
          </>
        ) : (
          'PDF 파일을 드래그하거나 선택하세요 (복수 선택 가능)'
        )}
      </div>
      <div className="space" />
      <label className="btn ghost" htmlFor="file-input" style={{ fontSize: 'clamp(11px, 3vw, 12px)' }}>📁 파일 선택</label>
      <input id="file-input" type="file" accept="application/pdf" multiple style={{ display: 'none' }} onChange={(e) => {
        const files = Array.from(e.currentTarget.files || []);
        if (files.length > 0) onFiles(files);
      }} />
    </div>
  );
}

const LOADING_MESSAGES_DESKTOP = [
  '🎓 교수님이 자료를 읽고 계십니다...',
  '📝 교수님이 핵심 내용을 정리하고 있습니다...',
  '🤔 교수님이 문제를 고민하고 있습니다...',
  '✍️ 교수님이 문제를 내고 있습니다...',
  '📚 교수님이 중요한 부분을 체크하고 있습니다...',
  '💭 교수님이 깊이 생각에 잠겨 있습니다...',
  '😌 교수님이 커피를 한 모금 마시고 있습니다...',
  '📖 교수님이 책장을 넘기고 있습니다...',
  '🔍 교수님이 세밀하게 검토하고 있습니다...',
  '😅 교수님이 당신은 장학금 받을 생각하지 말라네요...',
  '✨ 교수님이 마무리 작업을 하고 있습니다...',
];

const LOADING_MESSAGES_MOBILE = [
  '🎓 자료를 읽고 있습니다...',
  '📝 핵심 내용 정리 중...',
  '🤔 문제를 고민 중...',
  '✍️ 문제를 만들고 있습니다...',
  '📚 중요 부분 체크 중...',
  '💭 깊이 생각하고 있습니다...',
  '😌 잠시 쉬고 있습니다...',
  '📖 내용을 확인 중...',
  '🔍 세밀하게 검토 중...',
  '😅 거의 다 끝났습니다...',
  '✨ 마무리 작업 중...',
];

function MainScreen({ username, token }: { username: string; token: string }) {
  console.log('[MainScreen] Received props - username:', username, 'token:', token);
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [action, setAction] = useState<ActionType>('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverHistory, setServerHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<'generate' | 'history' | 'cramming'>('generate');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedAreasByFile, setSelectedAreasByFile] = useState<Map<string, string[]>>(new Map());
  const [fileBase64Map, setFileBase64Map] = useState<Map<File, string>>(new Map());
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [autoCloseTimeoutId, setAutoCloseTimeoutId] = useState<number | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup timeout when component unmounts or loading state changes
  useEffect(() => {
    return () => {
      if (autoCloseTimeoutId !== null) {
        clearTimeout(autoCloseTimeoutId);
      }
    };
  }, [autoCloseTimeoutId]);

  const LOADING_MESSAGES = isMobile ? LOADING_MESSAGES_MOBILE : LOADING_MESSAGES_DESKTOP;

  const canSend = useMemo(() => prompt.trim().length > 0 && files.length > 0, [prompt, files]);

  const getCacheKey = (username: string, page: number) => `history_cache_${username}_page_${page}`;
  const getCacheMetaKey = (username: string) => `history_cache_meta_${username}`;

  const loadHistory = async (page: number = 0, append: boolean = false) => {
    console.log('[loadHistory] token:', token, 'page:', page, 'append:', append);

    // Try to load from cache first
    const cacheKey = getCacheKey(username, page);
    const cacheMetaKey = getCacheMetaKey(username);

    try {
      const cached = localStorage.getItem(cacheKey);
      const cacheMeta = localStorage.getItem(cacheMetaKey);

      if (cached && cacheMeta) {
        const cacheData = JSON.parse(cached);
        const meta = JSON.parse(cacheMeta);
        const cacheAge = Date.now() - meta.timestamp;

        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          console.log('[loadHistory] Using cached data for page', page);
          if (append) {
            setServerHistory(prev => [...prev, ...cacheData.content]);
          } else {
            setServerHistory(cacheData.content);
          }
          setHistoryPage(page);
          setHasMore(page + 1 < cacheData.totalPages);
          return;
        }
      }
    } catch (e) {
      console.warn('[loadHistory] Cache read failed:', e);
    }

    // Load from server if cache miss or expired
    setHistoryLoading(true);
    try {
      const res = await getHistory({ page, size: 20 }, token);

      // Save to cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          content: res.content,
          totalPages: res.totalPages
        }));
        localStorage.setItem(cacheMetaKey, JSON.stringify({
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn('[loadHistory] Cache write failed:', e);
      }

      if (append) {
        setServerHistory(prev => [...prev, ...res.content]);
      } else {
        setServerHistory(res.content);
      }
      setHistoryPage(page);
      setHasMore(page + 1 < res.totalPages);
    } catch (e: any) {
      console.error('Failed to load history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const clearHistoryCache = () => {
    try {
      // Clear all history cache for current user
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(`history_cache_${username}_`)) {
          localStorage.removeItem(key);
        }
      });
      console.log('[clearHistoryCache] Cleared cache for user:', username);
    } catch (e) {
      console.warn('[clearHistoryCache] Failed to clear cache:', e);
    }
  };

  const loadMoreHistory = () => {
    if (!historyLoading && hasMore) {
      loadHistory(historyPage + 1, true);
    }
  };

  useEffect(() => {
    if (currentTab === 'history') {
      setServerHistory([]);
      setHistoryPage(0);
      setHasMore(true);
      loadHistory(0, false);
    }
  }, [currentTab]);

  useEffect(() => {
    if (loading) {
      setLoadingMessageIndex(0);
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  const onSend = async () => {
    setError(null);
    if (files.length === 0) {
      setError('PDF 파일을 선택해주세요.');
      return;
    }
    if (!prompt.trim()) {
      setError('요청 내용을 입력해주세요.');
      return;
    }
    setLoading(true);
    setDownloadComplete(false);
    try {
      // Process each file in parallel
      const results = await Promise.all(
        files.map(async (file, index) => {
          const pdfBase64 = await fileToBase64(file);
          const res = await generate({
            type: action,
            prompt,
            pdfBase64,
            importantParts: selectedAreasByFile.get(pdfBase64) || undefined
          }, token);
          console.log(`[onSend] Generate response for file ${index + 1}:`, res);
          return {
            filename: `${username}_${action}_${file.name.replace('.pdf', '')}_${new Date().toISOString().slice(0, 10)}.pdf`,
            url: res.resultPdfUrl
          };
        })
      );

      // 다운로드 완료 상태로 전환
      setDownloadComplete(true);

      // 모든 파일 다운로드 시도
      for (const result of results) {
        await downloadPdfFromUrl(result.filename, result.url);
        // 다운로드 간 짧은 딜레이 (브라우저가 다운로드를 처리할 시간 제공)
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Clear cache and reload history after generating (reset to first page)
      clearHistoryCache();
      if (currentTab === 'history') {
        await loadHistory(0);
      }

      // 10초 후 자동으로 오버레이 닫기
      const timeoutId = window.setTimeout(() => {
        // 먼저 로딩 상태를 false로 변경하여 모달을 제거
        setLoading(false);
        // 다음 틱에서 나머지 state 정리
        setTimeout(() => {
          setDownloadComplete(false);
          setFiles([]);
          setPrompt('');
          setSelectedAreasByFile(new Map());
          setFileBase64Map(new Map());
          setAutoCloseTimeoutId(null);
        }, 0);
      }, 10000);
      setAutoCloseTimeoutId(timeoutId);
    } catch (e: any) {
      setError(e?.message || '요청 중 오류가 발생했습니다.');
      setLoading(false);
      setDownloadComplete(false);
    }
  };


  const handleLogout = async () => {
    try {
      await logout(token);
    } catch (e) {
      console.error('Logout failed:', e);
    } finally {
      localStorage.removeItem('auth');
      window.location.reload();
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--border)', background: 'var(--panel)' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'clamp(8px, 2.5vw, 10px) clamp(10px, 3vw, 12px)', gap: 'clamp(8px, 2vw, 12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1.5vw, 6px)', minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 'clamp(18px, 5vw, 20px)', flexShrink: 0 }}>🎓</div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <h1 className="title" style={{ fontSize: 'clamp(14px, 4vw, 16px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>AI Professor</h1>
              <div className="small" style={{ color: 'var(--muted)', marginTop: 1, fontSize: 'clamp(10px, 2.5vw, 11px)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>안녕하세요, <b>{username}</b>님 👋</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2.5vw, 12px)', flexShrink: 0 }}>
            <button onClick={() => setShowProfileModal(true)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'clamp(10px, 2.5vw, 11px)', fontFamily: 'inherit', padding: 'clamp(4px, 1.5vw, 5px) clamp(6px, 2vw, 8px)', transition: 'color 0.2s ease', whiteSpace: 'nowrap' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>👤 내 정보</button>
            <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 'clamp(10px, 2.5vw, 11px)', fontFamily: 'inherit', padding: 'clamp(4px, 1.5vw, 5px) clamp(6px, 2vw, 8px)', transition: 'color 0.2s ease', whiteSpace: 'nowrap' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>🚪 로그아웃</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 clamp(8px, 2.5vw, 12px)', display: 'flex', gap: 0 }}>
          <button
            onClick={() => setCurrentTab('generate')}
            style={{
              padding: 'clamp(8px, 2.5vw, 10px) clamp(8px, 3vw, 12px)',
              border: 'none',
              borderBottom: currentTab === 'generate' ? '2px solid var(--text)' : '2px solid transparent',
              background: 'transparent',
              color: currentTab === 'generate' ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer',
              fontSize: 'clamp(11px, 3vw, 12px)',
              fontWeight: currentTab === 'generate' ? 600 : 400,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              flex: 1
            }}
          >
            ✨ 생성하기
          </button>
          <button
            onClick={() => setCurrentTab('cramming')}
            style={{
              padding: 'clamp(8px, 2.5vw, 10px) clamp(8px, 3vw, 12px)',
              border: 'none',
              borderBottom: currentTab === 'cramming' ? '2px solid var(--text)' : '2px solid transparent',
              background: 'transparent',
              color: currentTab === 'cramming' ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer',
              fontSize: 'clamp(11px, 3vw, 12px)',
              fontWeight: currentTab === 'cramming' ? 600 : 400,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              flex: 1
            }}
          >
            ⚡ 벼락치기
          </button>
          <button
            onClick={() => setCurrentTab('history')}
            style={{
              padding: 'clamp(8px, 2.5vw, 10px) clamp(8px, 3vw, 12px)',
              border: 'none',
              borderBottom: currentTab === 'history' ? '2px solid var(--text)' : '2px solid transparent',
              background: 'transparent',
              color: currentTab === 'history' ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer',
              fontSize: 'clamp(11px, 3vw, 12px)',
              fontWeight: currentTab === 'history' ? 600 : 400,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              flex: 1
            }}
          >
            📚 작업 내역
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: 'clamp(8px, 2.5vw, 12px)' }}>
          {currentTab === 'cramming' ? (
            <CrammingTab token={token} username={username} isMobile={isMobile} />
          ) : currentTab === 'generate' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 2.5vw, 12px)', width: '100%', margin: '0 auto' }}>
              {/* Combined Form */}
              <div className="card" style={{ padding: 'clamp(12px, 4vw, 16px)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flexShrink: 0 }}>
                  <h3 style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>PDF 파일 업로드</h3>
                  <DropZone
                    onFiles={async (uploadedFiles) => {
                      const validFiles: File[] = [];

                      for (const f of uploadedFiles) {
                        if (f.type !== 'application/pdf') {
                          setError(`${f.name}은(는) PDF 파일이 아닙니다.`);
                          continue;
                        }
                        if (f.size > MAX_PDF_SIZE) {
                          setError(`${f.name}의 용량이 30MB를 초과합니다.`);
                          continue;
                        }

                        // 페이지 수 확인
                        const pageCount = await getPdfPageCount(f);
                        if (pageCount > 100) {
                          setError(`${f.name}의 페이지 수가 너무 많습니다. (${pageCount}페이지) 100페이지 이하의 PDF만 업로드 가능합니다.`);
                          continue;
                        }

                        validFiles.push(f);
                      }

                      if (validFiles.length > 0) {
                        setError(null);
                        // Encode files to base64 and store mapping
                        const newBase64Map = new Map(fileBase64Map);
                        for (const file of validFiles) {
                          const base64 = await fileToBase64(file);
                          newBase64Map.set(file, base64);
                        }
                        setFileBase64Map(newBase64Map);
                        setFiles(prev => [...prev, ...validFiles]);
                        setPreviewFiles(validFiles); // 미리보기용으로는 새로 업로드한 파일만
                        setShowPdfModal(true);
                      }
                    }}
                  />
                  {files.length > 0 && (
                    <>
                      <div className="space" />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(6px, 2vw, 8px)' }}>
                        {files.map((file, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 8px)', flexWrap: 'wrap' }}>
                            <button
                              className="btn secondary"
                              style={{
                                padding: '4px 10px',
                                fontSize: 'clamp(10px, 2.8vw, 11px)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                maxWidth: '100%',
                                cursor: 'default',
                                minHeight: '32px',
                                height: '32px'
                              }}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                                📎 {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newFiles = files.filter((_, i) => i !== index);
                                  setFiles(newFiles);
                                  // 파일 제거 시 해당 파일의 선택된 영역도 제거
                                  const base64 = fileBase64Map.get(file);
                                  if (base64) {
                                    setSelectedAreasByFile(prev => {
                                      const newMap = new Map(prev);
                                      newMap.delete(base64);
                                      return newMap;
                                    });
                                  }
                                  // base64 매핑도 제거
                                  setFileBase64Map(prev => {
                                    const newMap = new Map(prev);
                                    newMap.delete(file);
                                    return newMap;
                                  });
                                }}
                                style={{
                                  cursor: 'pointer',
                                  color: 'var(--muted)',
                                  transition: 'color 0.2s',
                                  flexShrink: 0
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
                              >
                                ✕
                              </span>
                            </button>
                            {(() => {
                              const base64 = fileBase64Map.get(file);
                              const areas = base64 ? selectedAreasByFile.get(base64) : undefined;
                              return areas && areas.length > 0 ? (
                                <div className="chip" style={{ padding: 'clamp(5px, 1.5vw, 6px) clamp(8px, 2.5vw, 10px)', fontSize: 'clamp(10px, 2.8vw, 11px)', background: 'rgba(255, 235, 59, 0.3)', border: '1px solid rgba(255, 193, 7, 0.5)' }}>
                                  ✓ {areas.length}개 영역 선택됨
                                </div>
                              ) : null;
                            })()}
                          </div>
                        ))}
                        <div style={{ display: 'flex', gap: 'clamp(6px, 2vw, 8px)', flexWrap: 'wrap' }}>
                          <button
                            className="btn secondary"
                            onClick={() => {
                              setPreviewFiles(files);
                              setShowPdfModal(true);
                            }}
                            style={{ padding: '4px 10px', fontSize: 'clamp(10px, 2.8vw, 11px)', minHeight: '32px', height: '32px' }}
                          >
                            📄 미리보기 / 텍스트 선택
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ height: 1, background: 'var(--border)', margin: 'clamp(12px, 4vw, 16px) 0', flexShrink: 0 }} />

                <div style={{ flexShrink: 0 }}>
                  <h3 style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>작업 유형 선택</h3>
                  <div className="toolbar">
                    <button
                      className={`btn ${action === 'summary' ? '' : 'secondary'}`}
                      onClick={() => setAction('summary')}
                      style={{ flex: 1, padding: 'clamp(10px, 3vw, 12px) clamp(12px, 4vw, 16px)', fontSize: 'clamp(12px, 3.2vw, 13px)' }}
                    >
                      📝 핵심 요약
                    </button>
                    <button
                      className={`btn ${action === 'quiz' ? '' : 'secondary'}`}
                      onClick={() => setAction('quiz')}
                      style={{ flex: 1, padding: 'clamp(10px, 3vw, 12px) clamp(12px, 4vw, 16px)', fontSize: 'clamp(12px, 3.2vw, 13px)' }}
                    >
                      📋 예상 문제
                    </button>
                  </div>
                </div>

                <div style={{ height: 1, background: 'var(--border)', margin: 'clamp(12px, 4vw, 16px) 0', flexShrink: 0 }} />

                <div style={{ flexShrink: 0 }}>
                  <h3 style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>요청 사항 입력</h3>
                  <textarea
                    className="input"
                    placeholder={isMobile ? "💬 원하는 요청을 입력하세요\n(예: 핵심 내용을 3페이지로 요약해주세요)" : "💬 원하는 요청을 입력하세요 (예: 이 자료의 핵심 내용을 3페이지로 요약해주세요)"}
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    style={{ minHeight: 'clamp(80px, 25vw, 100px)', resize: 'vertical', fontFamily: 'inherit', fontSize: 'clamp(12px, 3.2vw, 13px)', width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="space" style={{ flexShrink: 0 }} />
                <button className="btn" onClick={onSend} disabled={!canSend || loading} style={{ width: '100%', padding: 'clamp(10px, 3vw, 12px)', fontSize: 'clamp(12px, 3.2vw, 13px)', flexShrink: 0 }}>
                  {loading ? '⏳ 처리 중...' : '✨ 생성하기'}
                </button>
              </div>
            </div>
          ) : (
            /* History Tab */
            <div className="card" style={{ padding: 'clamp(12px, 4vw, 16px)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 'clamp(10px, 3.5vw, 14px)', flexShrink: 0 }}>
                <h2 className="title" style={{ fontSize: 'clamp(16px, 4.5vw, 18px)' }}>📚 작업 내역</h2>
                <div className="small" style={{ color: 'var(--muted)', marginTop: 3, fontSize: 'clamp(11px, 3vw, 12px)' }}>최근 작업한 내역을 확인하고 다운로드할 수 있습니다</div>
              </div>
              {historyLoading ? (
                <div className="center" style={{ padding: '60px 0' }}>
                  <div className="spinner" style={{ width: 40, height: 40 }} />
                </div>
              ) : serverHistory.length === 0 ? (
                <div className="center" style={{ flexDirection: 'column', gap: 12, padding: '60px 0' }}>
                  <div style={{ fontSize: 48 }}>📭</div>
                  <div style={{ color: 'var(--muted)', fontSize: 16 }}>아직 작업 내역이 없습니다</div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {serverHistory.map((it, index) => (
                      <div
                        key={it.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          padding: '12px 8px',
                          borderBottom: index < serverHistory.length - 1 ? '1px solid var(--border)' : 'none',
                          transition: 'background 0.2s',
                          cursor: 'pointer',
                          gap: 8,
                          flexWrap: 'wrap'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(4px, 1.5vw, 6px)', minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(4px, 1.5vw, 6px)', flexWrap: 'wrap' }}>
                            <span className="chip" style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', flexShrink: 0 }}>
                              {it.processingType === 'SUMMARY' ? '📝 요약' : it.processingType === 'CRAMMING' ? '⚡ 벼락치기' : '📋 문제'}
                            </span>
                            <div className="small" style={{ fontSize: 'clamp(10px, 2.8vw, 11px)', color: 'var(--muted)', flexShrink: 0 }}>
                              {new Date(it.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.3' }}>
                            {it.userPrompt}
                          </div>
                        </div>
                        <button
                          className="btn"
                          style={{ padding: 'clamp(5px, 1.5vw, 6px) clamp(8px, 2.5vw, 10px)', fontSize: 'clamp(10px, 2.8vw, 11px)', flexShrink: 0, alignSelf: 'flex-start' }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await downloadPdfFromUrl(`history_${it.id}.pdf`, it.outputUrl);
                            } catch (error) {
                              console.error('Failed to download:', error);
                              setError('다운로드에 실패했습니다.');
                            }
                          }}
                        >
                          📥 다운로드
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Loading indicator for infinite scroll */}
                  {historyLoading && (
                    <div className="center" style={{ padding: '20px 0' }}>
                      <div className="spinner" style={{ width: 24, height: 24 }} />
                    </div>
                  )}

                  {/* Sentinel element for intersection observer */}
                  {hasMore && !historyLoading && (
                    <div
                      ref={(el) => {
                        if (!el) return;
                        const observer = new IntersectionObserver(
                          (entries) => {
                            if (entries[0].isIntersecting && hasMore && !historyLoading) {
                              loadMoreHistory();
                            }
                          },
                          { threshold: 0.1 }
                        );
                        observer.observe(el);
                        return () => observer.disconnect();
                      }}
                      style={{ height: 20, visibility: 'hidden' }}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Modal */}
      {error && (
        <div className="overlay" onClick={() => setError(null)}>
          <div className="card" style={{ padding: 40, maxWidth: 500, position: 'relative' }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setError(null)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                fontSize: 24,
                cursor: 'pointer',
                color: 'var(--muted)',
                padding: 0,
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
            >
              ✕
            </button>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>오류</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPdfModal && previewFiles.length > 0 && (
        <div className="overlay" onClick={() => setShowPdfModal(false)}>
          <div
            className="card"
            style={{
              padding: '24px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              width: 900,
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'clamp(12px, 4vw, 16px)', flexShrink: 0, gap: 'clamp(8px, 2vw, 12px)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="title" style={{ fontSize: 'clamp(16px, 4.5vw, 18px)', marginBottom: 'clamp(3px, 1vw, 4px)' }}>PDF 미리보기 및 텍스트 선택</h2>
                <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(11px, 3vw, 12px)', lineHeight: '1.4' }}>
                  중요한 부분을 드래그하여 선택하거나, 스킵하고 전체 PDF를 사용할 수 있습니다
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPdfModal(false);
                  setCurrentFileIndex(0);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  padding: 0,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 'clamp(12px, 4vw, 16px)', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, color: 'var(--text)', wordBreak: 'break-all', padding: '0 clamp(8px, 2vw, 12px)' }}>
                📄 {previewFiles[currentFileIndex]?.name}
              </div>
              {previewFiles.length > 1 && (
                <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(11px, 3vw, 12px)', marginTop: 'clamp(3px, 1vw, 4px)' }}>
                  {currentFileIndex + 1} / {previewFiles.length} 파일
                </div>
              )}
            </div>

            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <PdfViewer
                file={previewFiles[currentFileIndex]}
                onAreasSelect={(areas) => {
                  const currentFile = previewFiles[currentFileIndex];
                  const base64 = fileBase64Map.get(currentFile);
                  if (base64) {
                    setSelectedAreasByFile(prev => {
                      const newMap = new Map(prev);
                      if (areas.length > 0) {
                        newMap.set(base64, areas);
                      } else {
                        newMap.delete(base64);
                      }
                      return newMap;
                    });
                  }
                }}
                selectedAreas={(() => {
                  const base64 = fileBase64Map.get(previewFiles[currentFileIndex]);
                  return base64 ? selectedAreasByFile.get(base64) || [] : [];
                })()}
              />
            </div>

            <div style={{ display: 'flex', gap: 'clamp(6px, 2vw, 8px)', marginTop: 'clamp(12px, 4vw, 16px)', flexShrink: 0 }}>
              <button
                className="btn secondary"
                onClick={() => {
                  setShowPdfModal(false);
                  setCurrentFileIndex(0);
                }}
                style={{ flex: 1, padding: 'clamp(8px, 2.5vw, 10px)', fontSize: 'clamp(12px, 3.2vw, 13px)' }}
              >
                ⏭️ 모두 스킵 (전체 PDF 사용)
              </button>
              <button
                className="btn"
                onClick={() => {
                  // 마지막 파일이 아니면 다음 파일로 이동
                  if (currentFileIndex < previewFiles.length - 1) {
                    setCurrentFileIndex(prev => prev + 1);
                  } else {
                    // 마지막 파일이면 모달 닫기
                    setShowPdfModal(false);
                    setCurrentFileIndex(0);
                  }
                }}
                style={{ flex: 1, padding: 'clamp(8px, 2.5vw, 10px)', fontSize: 'clamp(12px, 3.2vw, 13px)' }}
              >
                {currentFileIndex < previewFiles.length - 1 ? '다음 자료 확인 →' : '✓ 완료'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="overlay" key="loading-overlay">
          <div className="card center" style={{ gap: 16, padding: 40, boxShadow: '0 8px 24px var(--shadow-lg)', flexDirection: 'column', position: 'relative', minWidth: 500 }} key={downloadComplete ? 'complete' : 'loading'}>
            {downloadComplete && (
              <button
                onClick={() => {
                  if (autoCloseTimeoutId !== null) {
                    clearTimeout(autoCloseTimeoutId);
                    setAutoCloseTimeoutId(null);
                  }
                  setLoading(false);
                  setDownloadComplete(false);
                  setFiles([]);
                  setPrompt('');
                  setSelectedAreasByFile(new Map());
                  setFileBase64Map(new Map());
                }}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  padding: 0,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted)'}
              >
                ✕
              </button>
            )}
            {!downloadComplete ? (
              <>
                <div className="spinner" style={{ width: 'clamp(24px, 8vw, 32px)', height: 'clamp(24px, 8vw, 32px)', borderWidth: 'clamp(2px, 0.5vw, 3px)' }} />
                <div style={{ fontSize: 'clamp(13px, 3.8vw, 15px)', fontWeight: 500, textAlign: 'center', padding: '0 clamp(12px, 4vw, 16px)', lineHeight: '1.4' }}>{LOADING_MESSAGES[loadingMessageIndex]}</div>
                <div className="small" style={{ color: 'var(--muted)', textAlign: 'center', fontSize: 'clamp(11px, 3vw, 12px)', padding: '0 clamp(12px, 4vw, 16px)', lineHeight: '1.5' }}>
                  {isMobile ? (
                    <>⏱️ 최대 15분 정도 걸리니<br />바람이라도 쐬고 오세요!</>
                  ) : (
                    <>⏱️ 최대 15분 정도 걸리니 바람이라도 쐬고 오는 거 어때요?</>
                  )}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 'clamp(40px, 12vw, 48px)' }}>✅</div>
                <div style={{ fontSize: 'clamp(13px, 3.8vw, 15px)', fontWeight: 500, textAlign: 'center', padding: '0 clamp(12px, 4vw, 16px)', lineHeight: '1.4' }}>
                  {isMobile ? (
                    action === 'summary' ? '요약 완료!' : '문제 생성 완료!'
                  ) : (
                    action === 'summary' ? '요약이 완료되었습니다!' : '문제 생성이 완료되었습니다!'
                  )}
                </div>
                <div className="small" style={{ color: 'var(--muted)', textAlign: 'center', fontSize: 'clamp(11px, 3vw, 12px)', padding: '0 clamp(12px, 4vw, 16px)', lineHeight: '1.5' }}>
                  다운로드가 자동으로 진행됩니다.
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          token={token}
          onClose={() => setShowProfileModal(false)}
          onAccountDeleted={() => {
            // Clear all localStorage data
            localStorage.clear();
            // Redirect to login screen by reloading
            window.location.reload();
          }}
        />
      )}

      {/* Footer */}
      <div style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--panel)',
        padding: 'clamp(12px, 4vw, 16px)',
        marginTop: 'auto'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'clamp(12px, 4vw, 16px)',
          flexWrap: 'wrap',
          fontSize: 'clamp(10px, 2.8vw, 11px)',
          color: 'var(--muted)'
        }}>
          <div>
            © {new Date().getFullYear()} AI Professor. All rights reserved.
          </div>
          <a
            href="/privacy"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            개인정보처리방침
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<{ username: string; token: string } | null>(() => {
    try {
      const raw = localStorage.getItem('auth');
      console.log('[App] localStorage auth:', raw);
      if (!raw) return null;
      const a = JSON.parse(raw);
      console.log('[App] Parsed auth:', a);
      return a?.username && a?.token ? { username: a.username, token: a.token } : null;
    } catch {
      return null;
    }
  });

  // Initialize Twemoji for consistent emoji display across all platforms
  useEffect(() => {
    const cleanup = initTwemoji();
    return cleanup;
  }, []);

  console.log('[App] session state:', session);

  // Check if current path is /privacy
  if (window.location.pathname === '/privacy') {
    return <PrivacyScreen />;
  }

  return session ? (
    <MainScreen username={session.username} token={session.token} />
  ) : (
    <LoginScreen
      onDone={(username, token) => {
        setSession({ username, token });
      }}
    />
  );
}
