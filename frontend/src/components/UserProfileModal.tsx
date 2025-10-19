import React, { useEffect, useState } from 'react';
import { getUserInfo, deleteAccount, type UserInfoResponse } from '../apiClient';

interface UserProfileModalProps {
  token: string;
  onClose: () => void;
  onAccountDeleted: () => void;
}

export function UserProfileModal({ token, onClose, onAccountDeleted }: UserProfileModalProps) {
  const [userInfo, setUserInfo] = useState<UserInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const info = await getUserInfo(token);
        setUserInfo(info);
      } catch (e: any) {
        setError(e?.message || '사용자 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [token]);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount(token);
      onAccountDeleted();
    } catch (e: any) {
      setError(e?.message || '회원 탈퇴에 실패했습니다.');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="card"
        style={{
          padding: 'clamp(24px, 7vw, 32px)',
          maxWidth: 400,
          width: '90%',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
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
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center', marginBottom: 'clamp(16px, 5vw, 20px)' }}>
          <div style={{ fontSize: 'clamp(32px, 10vw, 40px)', marginBottom: 'clamp(6px, 2vw, 8px)' }}>
            👤
          </div>
          <h2 className="title" style={{ fontSize: 'clamp(18px, 5vw, 20px)', marginBottom: 4 }}>
            내 정보
          </h2>
        </div>

        {loading ? (
          <div className="center" style={{ padding: 'clamp(20px, 6vw, 30px) 0' }}>
            <div className="spinner" style={{ width: 32, height: 32 }} />
          </div>
        ) : error && !userInfo ? (
          <div className="alert error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        ) : userInfo ? (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'clamp(12px, 4vw, 16px)',
                marginBottom: 'clamp(16px, 5vw, 20px)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 'clamp(11px, 3vw, 12px)',
                    color: 'var(--muted)',
                    marginBottom: 'clamp(3px, 1vw, 4px)',
                  }}
                >
                  아이디
                </div>
                <div
                  style={{
                    fontSize: 'clamp(13px, 3.5vw, 14px)',
                    color: 'var(--text)',
                    fontWeight: 500,
                  }}
                >
                  {userInfo.username}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 'clamp(11px, 3vw, 12px)',
                    color: 'var(--muted)',
                    marginBottom: 'clamp(3px, 1vw, 4px)',
                  }}
                >
                  이메일
                </div>
                <div
                  style={{
                    fontSize: 'clamp(13px, 3.5vw, 14px)',
                    color: 'var(--text)',
                    fontWeight: 500,
                  }}
                >
                  {userInfo.email}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 'clamp(11px, 3vw, 12px)',
                    color: 'var(--muted)',
                    marginBottom: 'clamp(3px, 1vw, 4px)',
                  }}
                >
                  가입일
                </div>
                <div
                  style={{
                    fontSize: 'clamp(13px, 3.5vw, 14px)',
                    color: 'var(--text)',
                    fontWeight: 500,
                  }}
                >
                  {formatDate(userInfo.createdAt)}
                </div>
              </div>
            </div>

            {error && (
              <>
                <div className="alert error">
                  <span className="alert-icon">⚠️</span>
                  <span style={{ fontSize: 'clamp(12px, 3.2vw, 13px)' }}>{error}</span>
                </div>
                <div style={{ height: 'clamp(12px, 4vw, 16px)' }} />
              </>
            )}

            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: 'clamp(12px, 4vw, 16px)',
                textAlign: 'center',
              }}
            >
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  fontSize: 'clamp(12px, 3.2vw, 13px)',
                  textDecoration: 'underline',
                  padding: 0,
                  fontFamily: 'inherit',
                }}
              >
                회원 탈퇴
              </button>
            </div>
          </>
        ) : null}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="overlay" onClick={() => !deleting && setShowDeleteConfirm(false)}>
          <div
            className="card"
            style={{
              padding: 'clamp(24px, 7vw, 32px)',
              maxWidth: 350,
              width: '90%',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'clamp(40px, 12vw, 48px)', marginBottom: 'clamp(12px, 4vw, 16px)' }}>
                ⚠️
              </div>
              <div
                style={{
                  fontSize: 'clamp(16px, 4.5vw, 18px)',
                  fontWeight: 600,
                  marginBottom: 'clamp(8px, 2.5vw, 10px)',
                }}
              >
                정말 탈퇴하시겠습니까?
              </div>
              <div
                style={{
                  color: 'var(--muted)',
                  fontSize: 'clamp(12px, 3.2vw, 13px)',
                  lineHeight: '1.5',
                  marginBottom: 'clamp(16px, 5vw, 20px)',
                }}
              >
                탈퇴하시면 모든 데이터가 삭제되며
                <br />
                복구할 수 없습니다.
              </div>

              <div style={{ display: 'flex', gap: 'clamp(6px, 2vw, 8px)' }}>
                <button
                  className="btn secondary"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: 'clamp(8px, 2.5vw, 10px)',
                    fontSize: 'clamp(12px, 3.2vw, 13px)',
                  }}
                >
                  취소
                </button>
                <button
                  className="btn"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  style={{
                    flex: 1,
                    padding: 'clamp(8px, 2.5vw, 10px)',
                    fontSize: 'clamp(12px, 3.2vw, 13px)',
                    background: 'var(--danger)',
                  }}
                >
                  {deleting ? '⏳ 탈퇴 중...' : '탈퇴하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
