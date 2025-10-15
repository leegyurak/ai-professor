import React, { useEffect, useMemo, useState } from 'react';
import { MAX_PDF_SIZE } from '@/shared/config';
import { ActionType, generate, getHistory, HistoryItem, login, logout } from './apiClient';
import * as pdfjsLib from 'pdfjs-dist';

function LoginScreen({ onDone }: { onDone: (username: string, token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handle();
  };

  return (
    <div className="center" style={{ height: '100%', background: '#ffffff' }}>
      <div className="card" style={{ width: 400, boxShadow: '0 4px 12px var(--shadow-md)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎓</div>
          <h1 className="title" style={{ fontSize: 28, marginBottom: 8 }}>AI Professor</h1>
          <div className="small" style={{ color: 'var(--muted)' }}>교육 자료 요약 및 문제 생성</div>
        </div>
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
      </div>
    </div>
  );
}

function DropZone({ onFile }: { onFile: (f: File) => void }) {
  const [drag, setDrag] = useState(false);
  return (
    <div
      className={`dropzone ${drag ? 'drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault(); setDrag(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
    >
      <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
      <div>PDF 파일을 드래그하거나 선택하세요</div>
      <div className="space" />
      <label className="btn ghost" htmlFor="file-input">📁 파일 선택</label>
      <input id="file-input" type="file" accept="application/pdf" style={{ display: 'none' }} onChange={(e) => {
        const f = e.currentTarget.files?.[0]; if (f) onFile(f);
      }} />
    </div>
  );
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// PDF.js worker 설정
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    return pdf.numPages;
  } catch (e) {
    console.error('Failed to count PDF pages:', e);
    return 0;
  }
}

const LOADING_MESSAGES = [
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

function MainScreen({ username, token }: { username: string; token: string }) {
  console.log('[MainScreen] Received props - username:', username, 'token:', token);
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [action, setAction] = useState<ActionType>('summary');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverHistory, setServerHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<'generate' | 'history'>('generate');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [lastDownloadData, setLastDownloadData] = useState<{ filename: string; url: string } | null>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const canSend = useMemo(() => prompt.trim().length > 0 && !!file, [prompt, file]);

  const loadHistory = async (page: number = 0) => {
    console.log('[loadHistory] token:', token, 'page:', page);
    setHistoryLoading(true);
    try {
      const res = await getHistory({ page, size: 5 }, token);
      setServerHistory(res.content);
      setTotalPages(res.totalPages);
      setHistoryPage(page);
    } catch (e: any) {
      console.error('Failed to load history:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 0 && page < totalPages) {
      loadHistory(page);
    }
  };

  useEffect(() => {
    if (currentTab === 'history') {
      loadHistory(0);
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
    if (!file) {
      setError('PDF 파일을 선택해주세요.');
      return;
    }
    if (file.size > MAX_PDF_SIZE) {
      setError('PDF 용량은 30MB 이하여야 합니다.');
      return;
    }
    if (!prompt.trim()) {
      setError('요청 내용을 입력해주세요.');
      return;
    }
    setLoading(true);
    setDownloadComplete(false);
    try {
      const pdfBase64 = await fileToBase64(file);
      const res = await generate({ type: action, prompt, pdfBase64 }, token);
      console.log('[onSend] Generate response:', res);

      // 다운로드 완료 상태로 전환
      const defaultName = `${username}_${action}_${new Date().toISOString().slice(0, 10)}.pdf`;
      setLastDownloadData({ filename: defaultName, url: res.resultPdfUrl });
      setDownloadComplete(true);

      // 바로 다운로드 시도
      await window.api.savePdfFromUrl(defaultName, res.resultPdfUrl);

      // Reload history after generating (reset to first page)
      if (currentTab === 'history') {
        await loadHistory(0);
      }

      // 10초 후 자동으로 오버레이 닫기
      setTimeout(() => {
        setLoading(false);
        setDownloadComplete(false);
        setFile(null);
        setPrompt('');
      }, 10000);
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
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28 }}>🎓</div>
            <div>
              <h1 className="title" style={{ fontSize: 20 }}>AI Professor</h1>
              <div className="small" style={{ color: 'var(--muted)', marginTop: 2 }}>안녕하세요, <b>{username}</b>님 👋</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', padding: '8px 12px', transition: 'color 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>🚪 로그아웃</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 32px', display: 'flex', gap: 0 }}>
          <button
            onClick={() => setCurrentTab('generate')}
            style={{
              padding: '16px 24px',
              border: 'none',
              borderBottom: currentTab === 'generate' ? '2px solid var(--text)' : '2px solid transparent',
              background: 'transparent',
              color: currentTab === 'generate' ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: currentTab === 'generate' ? 600 : 400,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
          >
            ✨ 생성하기
          </button>
          <button
            onClick={() => setCurrentTab('history')}
            style={{
              padding: '16px 24px',
              border: 'none',
              borderBottom: currentTab === 'history' ? '2px solid var(--text)' : '2px solid transparent',
              background: 'transparent',
              color: currentTab === 'history' ? 'var(--text)' : 'var(--muted)',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: currentTab === 'history' ? 600 : 400,
              transition: 'all 0.2s ease',
              fontFamily: 'inherit'
            }}
          >
            📚 작업 내역
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '32px' }}>
          {currentTab === 'generate' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', margin: '0 auto' }}>
              {/* Combined Form */}
              <div className="card" style={{ padding: 40 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>PDF 파일 업로드</h3>
                <DropZone
                  onFile={async (f) => {
                    if (f.type !== 'application/pdf') {
                      setError('PDF 파일만 업로드할 수 있습니다.');
                      return;
                    }
                    if (f.size > MAX_PDF_SIZE) {
                      setError('PDF 용량은 30MB 이하여야 합니다.');
                      return;
                    }

                    // 페이지 수 확인
                    const pageCount = await getPdfPageCount(f);
                    if (pageCount > 100) {
                      setError(`PDF 페이지 수가 너무 많습니다. (${pageCount}페이지) 100페이지 이하의 PDF만 업로드 가능합니다.`);
                      return;
                    }

                    setError(null);
                    setFile(f);
                  }}
                />
                {file && (
                  <>
                    <div className="space" />
                    <div className="chip" style={{ width: 'fit-content', padding: '10px 16px', fontSize: 14 }}>
                      📎 {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </>
                )}

                <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />

                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>작업 유형 선택</h3>
                <div className="toolbar">
                  <button
                    className={`btn ${action === 'summary' ? '' : 'secondary'}`}
                    onClick={() => setAction('summary')}
                    style={{ flex: 1, padding: '16px 24px', fontSize: 15 }}
                  >
                    📝 핵심 요약
                  </button>
                  <button
                    className={`btn ${action === 'quiz' ? '' : 'secondary'}`}
                    onClick={() => setAction('quiz')}
                    style={{ flex: 1, padding: '16px 24px', fontSize: 15 }}
                  >
                    📋 예상 문제
                  </button>
                </div>

                <div style={{ height: 1, background: 'var(--border)', margin: '24px 0' }} />

                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>요청 사항 입력</h3>
                <textarea
                  className="input"
                  placeholder="💬 원하는 요청을 입력하세요 (예: 이 자료의 핵심 내용을 3페이지로 요약해주세요)"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  style={{ minHeight: 180, resize: 'vertical', fontFamily: 'inherit', fontSize: 15 }}
                />
                <div className="space" />
                <button className="btn" onClick={onSend} disabled={!canSend || loading} style={{ width: '100%', padding: '16px', fontSize: 15 }}>
                  {loading ? '⏳ 처리 중...' : '✨ 생성하기'}
                </button>
              </div>
            </div>
          ) : (
            /* History Tab */
            <div className="card" style={{ padding: 32, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 24 }}>
                <h2 className="title" style={{ fontSize: 24 }}>📚 작업 내역</h2>
                <div className="small" style={{ color: 'var(--muted)', marginTop: 4, fontSize: 14 }}>최근 작업한 내역을 확인하고 다운로드할 수 있습니다</div>
              </div>
              {historyLoading ? (
                <div className="center" style={{ flex: 1 }}>
                  <div className="spinner" style={{ width: 40, height: 40 }} />
                </div>
              ) : serverHistory.length === 0 ? (
                <div className="center" style={{ flex: 1, flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 48 }}>📭</div>
                  <div style={{ color: 'var(--muted)', fontSize: 16 }}>아직 작업 내역이 없습니다</div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'auto', flex: 1 }}>
                    {serverHistory.map((it, index) => (
                      <div
                        key={it.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '20px 24px',
                          borderBottom: index < serverHistory.length - 1 ? '1px solid var(--border)' : 'none',
                          transition: 'background 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
                          <span className="chip" style={{ fontSize: 12, flexShrink: 0 }}>
                            {it.processingType === 'SUMMARY' ? '📝 요약' : '📋 문제'}
                          </span>
                          <div style={{ flex: 1, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {it.userPrompt}
                          </div>
                          <div className="small" style={{ fontSize: 13, color: 'var(--muted)', flexShrink: 0 }}>
                            {new Date(it.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          className="btn"
                          style={{ padding: '8px 16px', fontSize: 13, marginLeft: 16, flexShrink: 0 }}
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              await window.api.savePdfFromUrl(`history_${it.id}.pdf`, it.outputUrl);
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
                  {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '20px 0', borderTop: '1px solid var(--border)' }}>
                      <button
                        className="btn secondary"
                        onClick={() => goToPage(historyPage - 1)}
                        disabled={historyPage === 0}
                        style={{ padding: '8px 16px', fontSize: 13 }}
                      >
                        ← 이전
                      </button>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i;
                          } else if (historyPage < 3) {
                            pageNum = i;
                          } else if (historyPage >= totalPages - 3) {
                            pageNum = totalPages - 5 + i;
                          } else {
                            pageNum = historyPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              className={`btn ${historyPage === pageNum ? '' : 'secondary'}`}
                              onClick={() => goToPage(pageNum)}
                              style={{
                                padding: '8px 12px',
                                fontSize: 13,
                                minWidth: 36
                              }}
                            >
                              {pageNum + 1}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        className="btn secondary"
                        onClick={() => goToPage(historyPage + 1)}
                        disabled={historyPage === totalPages - 1}
                        style={{ padding: '8px 16px', fontSize: 13 }}
                      >
                        다음 →
                      </button>
                    </div>
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

      {/* Loading Overlay */}
      {loading && (
        <div className="overlay">
          <div className="card center" style={{ gap: 16, padding: 40, boxShadow: '0 8px 24px var(--shadow-lg)', flexDirection: 'column', position: 'relative', minWidth: 500 }}>
            {downloadComplete && (
              <button
                onClick={() => {
                  setLoading(false);
                  setDownloadComplete(false);
                  setFile(null);
                  setPrompt('');
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
                <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                <div style={{ fontSize: 16, fontWeight: 500 }}>{LOADING_MESSAGES[loadingMessageIndex]}</div>
                <div className="small" style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>⏱️ 최대 15분 정도 걸리니 바람이라도 쐬고 오는 거 어때요?</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 48 }}>✅</div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>
                  {action === 'summary' ? '요약이 완료되었습니다!' : '문제 생성이 완료되었습니다!'}
                </div>
                <div className="small" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                  다운로드가 자동으로 진행됩니다.<br />
                  진행되지 않는다면{' '}
                  <button
                    onClick={async () => {
                      if (lastDownloadData) {
                        try {
                          await window.api.savePdfFromUrl(lastDownloadData.filename, lastDownloadData.url);
                        } catch (error) {
                          console.error('Failed to download:', error);
                          setError('다운로드에 실패했습니다.');
                        }
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      fontSize: 'inherit',
                      fontFamily: 'inherit',
                      padding: 0
                    }}
                  >
                    여기를 클릭
                  </button>
                  해주세요
                </div>
              </>
            )}
          </div>
        </div>
      )}
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

  console.log('[App] session state:', session);

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
