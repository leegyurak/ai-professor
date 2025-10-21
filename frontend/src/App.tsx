import React, { useEffect, useState } from 'react';
import { login, register, verifyEmail } from './apiClient';
import { initTwemoji } from './utils/emojiUtils';
import { LandingPage } from './LandingPage';
import { MainScreen } from './MainScreen';

function EmailVerificationScreen() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      // URL에서 token 파라미터 가져오기
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');

      if (!token) {
        setError('인증 토큰이 없습니다.');
        setLoading(false);
        return;
      }

      try {
        const result = await verifyEmail(token);
        if (result.success) {
          setSuccess(true);
        } else {
          setError(result.message || '이메일 인증에 실패했습니다.');
        }
      } catch (e: any) {
        setError(e?.message || '이메일 인증 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  return (
    <div className="center" style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: 'clamp(16px, 5vw, 24px)' }}>
      <div className="card" style={{ maxWidth: 500, width: '100%', padding: 'clamp(24px, 7vw, 40px)' }}>
        <div style={{ textAlign: 'center' }}>
          {loading ? (
            <>
              <div className="spinner" style={{ width: 40, height: 40, margin: '0 auto 20px' }} />
              <h1 className="title" style={{ fontSize: 'clamp(20px, 6vw, 24px)', marginBottom: 'clamp(8px, 2.5vw, 12px)' }}>
                이메일 인증 중...
              </h1>
              <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(12px, 3.2vw, 14px)' }}>
                잠시만 기다려주세요
              </div>
            </>
          ) : success ? (
            <>
              <div style={{ fontSize: 'clamp(48px, 14vw, 64px)', marginBottom: 'clamp(12px, 4vw, 16px)' }}>✅</div>
              <h1 className="title" style={{ fontSize: 'clamp(20px, 6vw, 24px)', marginBottom: 'clamp(8px, 2.5vw, 12px)' }}>
                이메일 인증 완료!
              </h1>
              <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(12px, 3.2vw, 14px)', lineHeight: '1.5', marginBottom: 'clamp(20px, 6vw, 24px)' }}>
                이메일 인증이 완료되었습니다.<br />
                이제 로그인하실 수 있습니다.
              </div>
              <button
                className="btn"
                onClick={() => window.location.href = '/'}
                style={{ padding: 'clamp(10px, 3vw, 12px) clamp(20px, 6vw, 24px)', fontSize: 'clamp(13px, 3.5vw, 14px)' }}
              >
                로그인 페이지로 이동
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 'clamp(48px, 14vw, 64px)', marginBottom: 'clamp(12px, 4vw, 16px)' }}>❌</div>
              <h1 className="title" style={{ fontSize: 'clamp(20px, 6vw, 24px)', marginBottom: 'clamp(8px, 2.5vw, 12px)' }}>
                인증 실패
              </h1>
              <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(12px, 3.2vw, 14px)', lineHeight: '1.5', marginBottom: 'clamp(20px, 6vw, 24px)' }}>
                {error}
              </div>
              <button
                className="btn secondary"
                onClick={() => window.location.href = '/'}
                style={{ padding: 'clamp(10px, 3vw, 12px) clamp(20px, 6vw, 24px)', fontSize: 'clamp(13px, 3.5vw, 14px)' }}
              >
                홈으로 돌아가기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

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
      // Redirect to /main after successful login
      window.history.pushState({}, '', '/main');
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
                  가입 이메일이 전송되었습니다!
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 'clamp(13px, 3.5vw, 14px)', lineHeight: '1.5' }}>
                  이메일을 확인해주세요.<br />
                  만약 이메일이 보이지 않는다면<br />
                  스팸함을 확인해주세요.
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

  const [, forceUpdate] = useState({});

  // Initialize Twemoji for consistent emoji display across all platforms
  useEffect(() => {
    const cleanup = initTwemoji();
    return cleanup;
  }, []);

  // Disable browser's default scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  // Listen to popstate events for navigation
  useEffect(() => {
    const handlePopState = () => {
      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      }, 0);
      forceUpdate({});
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Force scroll to top on mount and path changes
  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
  }, [window.location.pathname]);

  console.log('[App] session state:', session);

  const navigateToLogin = () => {
    window.history.pushState({}, '', '/login');
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Check if current path is /privacy
  if (window.location.pathname === '/privacy') {
    return <PrivacyScreen />;
  }

  // Check if current path is /verify
  if (window.location.pathname === '/verify') {
    return <EmailVerificationScreen />;
  }

  // Check if current path is /main
  if (window.location.pathname === '/main') {
    return session ? (
      <MainScreen username={session.username} token={session.token} />
    ) : (
      <LoginScreen
        onDone={(username, token) => {
          setSession({ username, token });
          forceUpdate({});
        }}
      />
    );
  }

  // Check if current path is /login
  if (window.location.pathname === '/login') {
    return session ? (
      <MainScreen username={session.username} token={session.token} />
    ) : (
      <LoginScreen
        onDone={(username, token) => {
          setSession({ username, token });
          forceUpdate({});
        }}
      />
    );
  }

  // Root path - Check if user has valid session
  if (window.location.pathname === '/') {
    if (session) {
      // If user has valid token, redirect to /main
      window.history.replaceState({}, '', '/main');
      return <MainScreen username={session.username} token={session.token} />;
    }
    return <LandingPage onNavigateToLogin={navigateToLogin} />;
  }

  // Default fallback - Check if user has valid session
  if (session) {
    // If user has valid token, redirect to /main
    window.history.replaceState({}, '', '/main');
    return <MainScreen username={session.username} token={session.token} />;
  }
  // If no session, redirect to landing page
  window.history.replaceState({}, '', '/');
  return <LandingPage onNavigateToLogin={navigateToLogin} />;
}
