import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  createInterview,
  getInterviews,
  createMockInterview,
  getMockInterviewsByInterview,
  gradeMockInterview,
  type InterviewResponse,
  type MockInterviewDetailResponse
} from '../apiClient';
import { fileToBase64, getPdfPageCount } from '../utils/pdfUtils';
import { Confetti } from './Confetti';
import { MAX_PDF_SIZE } from '@/shared/config';

type InterviewPhase = 'list' | 'schedule' | 'resume' | 'questions' | 'answer' | 'grading';

interface InterviewTabProps {
  token: string;
  username: string;
  isMobile?: boolean;
}

const LOADING_MESSAGES_DESKTOP = [
  '💼 AI가 채용 공고를 분석하고 있습니다...',
  '📄 이력서 내용을 꼼꼼히 읽고 있습니다...',
  '🤔 맞춤형 면접 질문을 고민 중입니다...',
  '✨ 실제 면접처럼 질문을 만들고 있습니다...',
  '🎯 지원 직무에 맞는 질문을 선별하는 중...',
  '💡 당신의 경험을 끌어낼 질문을 준비 중...',
  '📝 총 10개의 질문을 작성하고 있습니다...',
  '🚀 거의 완성되어 갑니다...',
];

const LOADING_MESSAGES_MOBILE = [
  '💼 채용 공고 분석 중...',
  '📄 이력서 읽는 중...',
  '🤔 질문 고민 중...',
  '✨ 질문 생성 중...',
  '🎯 질문 선별 중...',
  '💡 질문 준비 중...',
  '📝 10개 질문 작성 중...',
  '🚀 거의 완성...',
];

export function InterviewTab({ token, username: _username, isMobile }: InterviewTabProps) {
  const [phase, setPhase] = useState<InterviewPhase>('list');
  const [interviews, setInterviews] = useState<InterviewResponse[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<InterviewResponse | null>(null);
  const [mockInterviews, setMockInterviews] = useState<MockInterviewDetailResponse[]>([]);

  // Schedule phase
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewType, setInterviewType] = useState('');
  const [announcementUrl, setAnnouncementUrl] = useState('');

  // Resume phase
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [questionMarkdown, setQuestionMarkdown] = useState('');
  const [currentMockInterviewId, setCurrentMockInterviewId] = useState<number | null>(null);

  // Answer phase
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [timer, setTimer] = useState(60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [thinkingTimeLeft, setThinkingTimeLeft] = useState(2); // 생각할 시간 2번
  const [isThinkingTime, setIsThinkingTime] = useState(false); // 현재 생각하는 중인지

  // Grading phase
  const [gradingMarkdown, setGradingMarkdown] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [drag, setDrag] = useState(false);

  const LOADING_MESSAGES = isMobile ? LOADING_MESSAGES_MOBILE : LOADING_MESSAGES_DESKTOP;

  useEffect(() => {
    if (loading) {
      setLoadingMessageIndex(0);
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [loading, LOADING_MESSAGES.length]);

  // Timer countdown effect
  useEffect(() => {
    // 타이머는 isTimerRunning이 true이고, 생각하는 시간이 아닐 때만 작동
    if (isTimerRunning && timer > 0 && !isThinkingTime) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTimerRunning, timer, isThinkingTime]);

  // Handle timer expiration
  useEffect(() => {
    if (timer === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Small delay before auto-advancing
      const timeout = setTimeout(() => {
        handleNextQuestion();
      }, 100);
      return () => clearTimeout(timeout);
    }
  }, [timer, isTimerRunning]);

  // Load interviews on mount
  useEffect(() => {
    if (phase === 'list') {
      loadInterviews();
    }
  }, [phase]);

  const loadInterviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInterviews(token);
      setInterviews(data);
    } catch (e: any) {
      setError(e?.message || '면접 일정 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!interviewDate || !interviewType || !announcementUrl) {
      setError('모든 항목을 입력해주세요.');
      return;
    }

    // URL validation
    try {
      new URL(announcementUrl);
    } catch {
      setError('올바른 URL 형식을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newInterview = await createInterview({
        interviewDate,
        interviewType,
        announcementUrl
      }, token);

      setSelectedInterview(newInterview);
      setPhase('resume');
    } catch (e: any) {
      setError(e?.message || '면접 일정 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInterview = async (interview: InterviewResponse) => {
    setSelectedInterview(interview);
    setLoading(true);
    setError(null);

    try {
      const mocks = await getMockInterviewsByInterview(interview.id, token);
      setMockInterviews(mocks);
      setPhase('resume');
    } catch (e: any) {
      setError(e?.message || '모의 면접 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSelect = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      setError(`${selectedFile.name}은(는) PDF 파일이 아닙니다.`);
      return;
    }
    if (selectedFile.size > MAX_PDF_SIZE) {
      setError(`${selectedFile.name}의 용량이 30MB를 초과합니다.`);
      return;
    }

    const pageCount = await getPdfPageCount(selectedFile);
    if (pageCount > 100) {
      setError(`${selectedFile.name}의 페이지 수가 너무 많습니다. (${pageCount}페이지) 100페이지 이하의 PDF만 업로드 가능합니다.`);
      return;
    }

    setResumeFile(selectedFile);
    setError(null);
  };

  const handleCreateMockInterview = async () => {
    if (!resumeFile || !selectedInterview) {
      setError('이력서 파일을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const resumeBase64 = await fileToBase64(resumeFile);
      const result = await createMockInterview({
        userInterviewId: selectedInterview.id,
        resumeFile: resumeBase64
      }, token);

      setQuestionMarkdown(result.questionMarkdown);
      setCurrentMockInterviewId(result.mockInterviewId);
      setPhase('questions');
    } catch (e: any) {
      setError(e?.message || '모의 면접 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAnswer = () => {
    // Parse questions from markdown
    // Questions are separated by \n and can start with Q1., 1., or just be plain text
    console.log('[InterviewTab] Raw questionMarkdown:', questionMarkdown);

    const lines = questionMarkdown.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log('[InterviewTab] Parsed lines:', lines);
    console.log('[InterviewTab] Total questions:', lines.length);

    // Filter lines that look like questions (start with Q, number, or have significant content)
    const questionLines = lines.filter(line => {
      // Check if line starts with Q1, Q2, etc.
      if (/^Q\d+/i.test(line)) return true;
      // Check if line starts with 1., 2., etc.
      if (/^\d+\./.test(line)) return true;
      // Check if line starts with number and ) like 1) 2)
      if (/^\d+\)/.test(line)) return true;
      // If line has substantial content (more than 10 characters), consider it a question
      if (line.length > 10) return true;
      return false;
    });

    console.log('[InterviewTab] Filtered questions:', questionLines);
    console.log('[InterviewTab] Question count:', questionLines.length);

    setQuestions(questionLines);
    setQuestionAnswers(new Array(questionLines.length).fill(''));
    setCurrentQuestionIndex(0);
    setTimer(60);
    setIsTimerRunning(true);
    setThinkingTimeLeft(2); // 생각할 시간 초기화
    setIsThinkingTime(false);
    setPhase('answer');
  };

  const handleToggleThinkingTime = () => {
    if (!isThinkingTime && thinkingTimeLeft > 0) {
      // 생각할 시간 시작
      setIsThinkingTime(true);
      setThinkingTimeLeft(prev => prev - 1);
    } else if (isThinkingTime) {
      // 생각할 시간 종료
      setIsThinkingTime(false);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimer(60);
      setIsTimerRunning(true);
    } else {
      // All questions answered, combine answers and submit
      setIsTimerRunning(false);
      const combinedAnswers = questions.map((q, idx) => {
        return `${q}\n답변: ${questionAnswers[idx] || '(답변 없음)'}\n`;
      }).join('\n');

      // Set answers and then submit
      if (!combinedAnswers.trim()) {
        setError('답변을 입력해주세요.');
        return;
      }

      if (!currentMockInterviewId) {
        setError('모의 면접 ID가 없습니다.');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await gradeMockInterview(currentMockInterviewId, { answers: combinedAnswers }, token);
        setGradingMarkdown(result.gradingMarkdown);
        setPhase('grading');

        // Check if passed (score >= 60)
        const scoreMatch = result.gradingMarkdown.match(/총점[:\s]*(\d+)/);
        if (scoreMatch) {
          const score = parseInt(scoreMatch[1]);
          if (score >= 75) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
          }
        }
      } catch (e: any) {
        setError(e?.message || '답변 채점에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setTimer(60);
      setIsTimerRunning(true);
    }
  };

  const handleSaveCurrentAnswer = (answer: string) => {
    const newAnswers = [...questionAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setQuestionAnswers(newAnswers);
  };

  const resetToList = () => {
    setPhase('list');
    setSelectedInterview(null);
    setMockInterviews([]);
    setInterviewDate('');
    setInterviewType('');
    setAnnouncementUrl('');
    setResumeFile(null);
    setQuestionMarkdown('');
    setCurrentMockInterviewId(null);
    setCurrentQuestionIndex(0);
    setQuestionAnswers([]);
    setQuestions([]);
    setTimer(60);
    setIsTimerRunning(false);
    setThinkingTimeLeft(2);
    setIsThinkingTime(false);
    setGradingMarkdown('');
    setShowConfetti(false);
    loadInterviews();
  };

  return (
    <>
      {showConfetti && <Confetti />}

      {/* Welcome Banner (Desktop Only) */}
      {!isMobile && phase === 'list' && (
        <div style={{
          padding: '24px 32px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>💼</span>
            면접 준비
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            AI와 함께 실전 면접을 완벽하게 준비하세요. 채용공고와 이력서를 분석하여 맞춤형 면접 질문을 생성하고, 전문가 수준의 피드백을 받아보세요.
          </p>
        </div>
      )}

      <div className="card" style={{
        padding: isMobile ? '16px' : '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? '16px' : '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header (Mobile) */}
        {isMobile && (
          <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>💼</div>
            <h2 className="title" style={{ fontSize: '22px', marginBottom: '8px' }}>면접 준비</h2>
            <div className="small" style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: '1.5' }}>
              AI와 함께 실전 면접을 완벽하게 준비하세요
            </div>
          </div>
        )}

        {error && (
          <div className="alert error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* List Phase - Interview List */}
        {phase === 'list' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px' }}>
            <div style={{
              padding: isMobile ? '20px' : '32px',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: isMobile ? '14px' : '15px',
                color: 'var(--text)',
                marginBottom: isMobile ? '16px' : '20px',
                lineHeight: '1.6'
              }}>
                {!isMobile && '준비 중인 면접이 있나요? '}
                면접 일정을 등록하고 모의 면접을 시작하세요!
              </div>
              <button
                className="btn"
                onClick={() => setPhase('schedule')}
                style={{
                  padding: isMobile ? '12px 20px' : '14px 28px',
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                }}
              >
                ➕ 새 면접 일정 등록
              </button>
            </div>

            {loading ? (
              <div className="center" style={{ padding: 'clamp(40px, 12vw, 60px) 0' }}>
                <div className="spinner" style={{ width: 40, height: 40 }} />
              </div>
            ) : interviews.length === 0 ? (
              <div className="center" style={{ flexDirection: 'column', gap: 12, padding: 'clamp(40px, 12vw, 60px) 0' }}>
                <div style={{ fontSize: 48 }}>📭</div>
                <div style={{ color: 'var(--muted)', fontSize: 16 }}>등록된 면접 일정이 없습니다</div>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: isMobile ? '12px' : '16px'
              }}>
                {interviews.map((interview) => (
                  <div
                    key={interview.id}
                    onClick={() => handleSelectInterview(interview)}
                    style={{
                      padding: isMobile ? '16px' : '20px',
                      background: 'var(--panel)',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                      e.currentTarget.style.borderColor = 'var(--text-secondary)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'var(--panel)';
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 'clamp(8px, 2.5vw, 12px)',
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 'clamp(14px, 4vw, 16px)',
                          fontWeight: 600,
                          marginBottom: 'clamp(6px, 2vw, 8px)'
                        }}>
                          {interview.interviewType}
                        </div>
                        <div style={{
                          fontSize: 'clamp(12px, 3.2vw, 13px)',
                          color: 'var(--muted)',
                          marginBottom: 'clamp(4px, 1.5vw, 6px)'
                        }}>
                          📅 {new Date(interview.interviewDate).toLocaleDateString('ko-KR')}
                        </div>
                        <div style={{
                          fontSize: 'clamp(11px, 3vw, 12px)',
                          color: 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          🔗 {interview.announcementUrl}
                        </div>
                      </div>
                      <div className="chip" style={{
                        padding: 'clamp(4px, 1.5vw, 6px) clamp(8px, 2.5vw, 10px)',
                        fontSize: 'clamp(10px, 2.8vw, 11px)',
                        flexShrink: 0
                      }}>
                        모의 면접 시작 →
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule Phase - Create Interview Schedule */}
        {phase === 'schedule' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 5vw, 20px)' }}>
            <div style={{
              padding: 'clamp(16px, 5vw, 20px)',
              background: 'var(--bg-secondary)',
              borderRadius: 4,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, marginBottom: 'clamp(10px, 3vw, 12px)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'clamp(18px, 5vw, 20px)' }}>📅</span>
                <span>면접 날짜</span>
              </div>
              <input
                className="input"
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                style={{ fontSize: 'clamp(13px, 3.5vw, 14px)' }}
              />
            </div>

            <div style={{
              padding: 'clamp(16px, 5vw, 20px)',
              background: 'var(--bg-secondary)',
              borderRadius: 4,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, marginBottom: 'clamp(10px, 3vw, 12px)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'clamp(18px, 5vw, 20px)' }}>💼</span>
                <span>지원 직무</span>
              </div>
              <input
                className="input"
                type="text"
                placeholder="예: 백엔드 개발자, 프론트엔드 개발자"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                style={{ fontSize: 'clamp(13px, 3.5vw, 14px)' }}
              />
            </div>

            <div style={{
              padding: 'clamp(16px, 5vw, 20px)',
              background: 'var(--bg-secondary)',
              borderRadius: 4,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, marginBottom: 'clamp(10px, 3vw, 12px)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'clamp(18px, 5vw, 20px)' }}>🔗</span>
                <span>채용 공고 URL</span>
              </div>
              <input
                className="input"
                type="url"
                placeholder="https://..."
                value={announcementUrl}
                onChange={(e) => setAnnouncementUrl(e.target.value)}
                style={{ fontSize: 'clamp(13px, 3.5vw, 14px)' }}
              />
              <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(10px, 2.8vw, 11px)', marginTop: 'clamp(8px, 2.5vw, 10px)' }}>
                AI가 채용 공고를 분석하여 맞춤형 면접 질문을 생성합니다
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'clamp(8px, 2.5vw, 10px)' }}>
              <button
                className="btn secondary"
                onClick={() => setPhase('list')}
                style={{
                  flex: 1,
                  padding: 'clamp(10px, 3vw, 12px)',
                  fontSize: 'clamp(12px, 3.2vw, 13px)'
                }}
              >
                ← 뒤로
              </button>
              <button
                className="btn"
                onClick={handleCreateSchedule}
                disabled={!interviewDate || !interviewType || !announcementUrl || loading}
                style={{
                  flex: 2,
                  padding: isMobile ? '14px' : '18px',
                  fontSize: isMobile ? '15px' : '17px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  boxShadow: (interviewDate && interviewType && announcementUrl && !loading) ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                }}
              >
                {loading ? '⏳ 등록 중...' : '✅ 일정 등록하기'}
              </button>
            </div>
          </div>
        )}

        {/* Resume Phase - Upload Resume */}
        {phase === 'resume' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 5vw, 20px)' }}>
            {selectedInterview && (
              <div className="alert" style={{ background: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                <span className="alert-icon" style={{ fontSize: 'clamp(20px, 5.5vw, 24px)' }}>💼</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{selectedInterview.interviewType}</div>
                  <div style={{ fontSize: 'clamp(11px, 3vw, 12px)' }}>
                    면접일: {new Date(selectedInterview.interviewDate).toLocaleDateString('ko-KR')}
                  </div>
                </div>
              </div>
            )}

            {mockInterviews.length > 0 && (
              <div style={{
                padding: 'clamp(16px, 5vw, 20px)',
                background: 'var(--bg-secondary)',
                borderRadius: 4,
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, marginBottom: 'clamp(10px, 3vw, 12px)' }}>
                  📝 이전 모의 면접 기록
                </div>
                <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: 'var(--muted)' }}>
                  총 {mockInterviews.length}회의 모의 면접을 진행했습니다
                </div>
              </div>
            )}

            <div style={{
              padding: 'clamp(16px, 5vw, 20px)',
              background: 'var(--bg-secondary)',
              borderRadius: 4,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, marginBottom: 'clamp(10px, 3vw, 12px)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'clamp(18px, 5vw, 20px)' }}>📄</span>
                <span>이력서 업로드 (PDF)</span>
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleResumeSelect(selectedFile);
                }}
                style={{ display: 'none' }}
                id="resume-file-input"
              />
              <div
                className={`dropzone ${drag ? 'drag' : ''}`}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  const droppedFile = e.dataTransfer.files[0];
                  if (droppedFile) handleResumeSelect(droppedFile);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
              >
                <div style={{ fontSize: 'clamp(24px, 8vw, 32px)', marginBottom: 'clamp(6px, 2vw, 8px)' }}>📄</div>
                <div style={{ fontSize: 'clamp(12px, 3.2vw, 14px)', lineHeight: '1.5', marginBottom: 'clamp(8px, 2.5vw, 10px)' }}>
                  PDF 파일을 드래그하거나 선택하세요
                </div>
                <label className="btn ghost" htmlFor="resume-file-input" style={{ fontSize: 'clamp(11px, 3vw, 12px)' }}>📁 파일 선택</label>
              </div>
              {resumeFile && (
                <div style={{
                  marginTop: 'clamp(12px, 4vw, 14px)',
                  padding: 'clamp(10px, 3vw, 12px)',
                  background: 'var(--panel)',
                  borderRadius: 4,
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: 'var(--muted)', marginBottom: 4 }}>✓ 선택된 파일</div>
                  <div style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600 }}>{resumeFile.name}</div>
                  <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: 'var(--muted)', marginTop: 4 }}>
                    크기: {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              )}
              <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(10px, 2.8vw, 11px)', marginTop: 'clamp(8px, 2.5vw, 10px)' }}>
                AI가 이력서를 분석하여 당신의 경험에 맞는 면접 질문을 생성합니다
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'clamp(8px, 2.5vw, 10px)' }}>
              <button
                className="btn secondary"
                onClick={resetToList}
                style={{
                  flex: 1,
                  padding: 'clamp(10px, 3vw, 12px)',
                  fontSize: 'clamp(12px, 3.2vw, 13px)'
                }}
              >
                ← 목록으로
              </button>
              <button
                className="btn"
                onClick={handleCreateMockInterview}
                disabled={!resumeFile || loading}
                style={{
                  flex: 2,
                  padding: isMobile ? '14px' : '18px',
                  fontSize: isMobile ? '15px' : '17px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  boxShadow: (resumeFile && !loading) ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                }}
              >
                {loading ? '⏳ 생성 중...' : '🎤 면접 질문 생성하기'}
              </button>
            </div>
          </div>
        )}

        {/* Questions Phase - Ready to Start Interview */}
        {phase === 'questions' && (() => {
          // Parse question count for display
          const lines = questionMarkdown.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

          const questionCount = lines.filter(line => {
            if (/^Q\d+/i.test(line)) return true;
            if (/^\d+\./.test(line)) return true;
            if (/^\d+\)/.test(line)) return true;
            if (line.length > 10) return true;
            return false;
          }).length;

          return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 6vw, 32px)' }}>
            {/* Success Message */}
            <div className="center" style={{ flexDirection: 'column', gap: 'clamp(16px, 5vw, 24px)', padding: 'clamp(40px, 12vw, 60px) 0' }}>
              <div style={{ fontSize: 'clamp(64px, 18vw, 96px)' }}>🎤</div>
              <div style={{
                fontSize: 'clamp(20px, 6vw, 28px)',
                fontWeight: 700,
                textAlign: 'center',
                lineHeight: '1.4'
              }}>
                면접 준비가 완료되었습니다!
              </div>
              <div style={{
                fontSize: 'clamp(14px, 4vw, 16px)',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                lineHeight: '1.6',
                maxWidth: '500px'
              }}>
                총 {questionCount}개의 맞춤형 면접 질문이 준비되었습니다.<br />
                각 질문마다 1분의 답변 시간이 주어집니다.<br />
                준비되면 시작 버튼을 눌러주세요.
              </div>
            </div>

            {/* Tips */}
            <div style={{
              padding: 'clamp(16px, 5vw, 24px)',
              background: 'rgba(255, 235, 59, 0.1)',
              border: '2px solid rgba(255, 193, 7, 0.3)',
              borderRadius: '8px',
              fontSize: 'clamp(13px, 3.5vw, 14px)',
              lineHeight: '1.8'
            }}>
              <div style={{ fontWeight: 600, marginBottom: 'clamp(8px, 2.5vw, 12px)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                💡 면접 답변 팁
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                • STAR 기법을 활용하세요 (상황, 과제, 행동, 결과)<br />
                • 구체적인 사례와 수치를 포함하면 좋습니다<br />
                • 질문을 끝까지 읽고 답변의 방향을 정하세요<br />
                • 1분이 지나면 자동으로 다음 질문으로 넘어갑니다
              </div>
            </div>

            {/* Start Button */}
            <button
              className="btn"
              onClick={handleStartAnswer}
              style={{
                width: '100%',
                padding: 'clamp(16px, 5vw, 20px)',
                fontSize: 'clamp(16px, 4.5vw, 18px)',
                fontWeight: 700,
                borderRadius: '12px',
                boxShadow: '0 6px 16px rgba(76, 175, 80, 0.3)'
              }}
            >
              🚀 면접 시작하기
            </button>

            {/* Back Button */}
            <button
              className="btn secondary"
              onClick={resetToList}
              style={{
                width: '100%',
                padding: 'clamp(10px, 3vw, 12px)',
                fontSize: 'clamp(12px, 3.2vw, 13px)'
              }}
            >
              ← 목록으로 돌아가기
            </button>
          </div>
          );
        })()}

        {/* Answer Phase - Write Answers */}
        {phase === 'answer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 5vw, 20px)' }}>
            {/* Progress and Timer */}
            <div style={{ display: 'flex', gap: 'clamp(12px, 4vw, 16px)', alignItems: 'stretch', flexWrap: 'wrap' }}>
              <div className="alert" style={{
                flex: 1,
                minWidth: '200px',
                background: 'rgba(33, 150, 243, 0.1)',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span className="alert-icon" style={{ fontSize: 'clamp(20px, 5.5vw, 24px)' }}>✏️</span>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    질문 {currentQuestionIndex + 1} / {questions.length}
                  </div>
                  <div style={{ fontSize: 'clamp(11px, 3vw, 12px)' }}>
                    각 질문마다 1분의 답변 시간이 주어집니다
                  </div>
                </div>
              </div>

              {/* Timer Display */}
              <div style={{
                padding: 'clamp(12px, 4vw, 16px)',
                background: timer <= 10 ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                border: timer <= 10 ? '2px solid rgba(244, 67, 54, 0.5)' : '2px solid rgba(76, 175, 80, 0.3)',
                borderRadius: '8px',
                textAlign: 'center',
                minWidth: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <div style={{ fontSize: 'clamp(10px, 2.8vw, 11px)', color: 'var(--muted)', marginBottom: 2 }}>
                  ⏱️ 남은 시간
                </div>
                <div style={{
                  fontSize: 'clamp(20px, 6vw, 24px)',
                  fontWeight: 700,
                  color: timer <= 10 ? '#f44336' : '#4caf50'
                }}>
                  {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* Current Question */}
            <div style={{
              padding: 'clamp(20px, 6vw, 28px)',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '2px solid var(--border)'
            }}>
              <div style={{
                fontSize: 'clamp(11px, 3vw, 12px)',
                color: 'var(--muted)',
                marginBottom: 'clamp(12px, 4vw, 16px)',
                fontWeight: 600
              }}>
                📋 현재 질문
              </div>
              <div style={{
                fontSize: 'clamp(14px, 4vw, 16px)',
                lineHeight: '1.8',
                fontWeight: 500,
                color: 'var(--text)'
              }}>
                {questions[currentQuestionIndex]}
              </div>
            </div>

            {/* Answer Input */}
            <div>
              <div style={{
                fontSize: 'clamp(13px, 3.5vw, 14px)',
                fontWeight: 600,
                marginBottom: 'clamp(10px, 3vw, 12px)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                💬 답변 작성
                {questionAnswers[currentQuestionIndex] && (
                  <span style={{ fontSize: 'clamp(10px, 2.8vw, 11px)', color: '#4caf50' }}>
                    ✓ 작성됨
                  </span>
                )}
              </div>
              <textarea
                className="input"
                placeholder="STAR 기법을 활용하여 구체적으로 답변해주세요.&#10;&#10;- 상황(Situation): 어떤 상황이었나요?&#10;- 과제(Task): 무엇을 해결해야 했나요?&#10;- 행동(Action): 어떻게 행동했나요?&#10;- 결과(Result): 어떤 결과를 얻었나요?"
                value={questionAnswers[currentQuestionIndex] || ''}
                onChange={(e) => handleSaveCurrentAnswer(e.target.value)}
                disabled={isThinkingTime}
                style={{
                  minHeight: 'clamp(200px, 50vw, 300px)',
                  resize: 'vertical',
                  fontSize: 'clamp(13px, 3.5vw, 14px)',
                  lineHeight: '1.6',
                  opacity: isThinkingTime ? 0.6 : 1,
                  cursor: isThinkingTime ? 'not-allowed' : 'text'
                }}
              />
              <div className="small" style={{
                color: 'var(--muted)',
                fontSize: 'clamp(10px, 2.8vw, 11px)',
                marginTop: 'clamp(8px, 2.5vw, 10px)'
              }}>
                💡 구체적인 사례와 수치를 포함하면 더 좋은 평가를 받을 수 있습니다
              </div>
            </div>

            {/* Thinking Time Button */}
            <div style={{
              padding: 'clamp(12px, 4vw, 16px)',
              background: isThinkingTime ? 'rgba(255, 152, 0, 0.1)' : 'rgba(33, 150, 243, 0.1)',
              border: isThinkingTime ? '1px solid rgba(255, 152, 0, 0.3)' : '1px solid rgba(33, 150, 243, 0.3)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'clamp(12px, 4vw, 16px)',
              flexWrap: 'wrap'
            }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{
                  fontSize: 'clamp(12px, 3.2vw, 13px)',
                  fontWeight: 600,
                  marginBottom: 'clamp(4px, 1.5vw, 6px)'
                }}>
                  🤔 생각할 시간 (남은 횟수: {thinkingTimeLeft + (isThinkingTime ? 1 : 0)}/2)
                </div>
                <div style={{
                  fontSize: 'clamp(10px, 2.8vw, 11px)',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5'
                }}>
                  {isThinkingTime
                    ? '타이머가 일시정지되었습니다. 다시 시작하려면 버튼을 누르세요.'
                    : '막막할 때 사용하세요. 타이머가 멈추고 답변 입력이 잠시 차단됩니다.'
                  }
                </div>
              </div>
              <button
                className="btn"
                onClick={handleToggleThinkingTime}
                disabled={!isThinkingTime && thinkingTimeLeft === 0}
                style={{
                  padding: 'clamp(10px, 3vw, 12px) clamp(16px, 5vw, 20px)',
                  fontSize: 'clamp(12px, 3.2vw, 13px)',
                  fontWeight: 600,
                  minWidth: '120px',
                  backgroundColor: isThinkingTime ? '#ff9800' : undefined,
                  opacity: (!isThinkingTime && thinkingTimeLeft === 0) ? 0.5 : 1
                }}
              >
                {isThinkingTime ? '⏯️ 다시 시작' : '🤔 생각할 시간'}
              </button>
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', gap: 'clamp(8px, 2.5vw, 10px)' }}>
              <button
                className="btn secondary"
                onClick={handlePrevQuestion}
                disabled={currentQuestionIndex === 0}
                style={{
                  flex: 1,
                  padding: 'clamp(12px, 3.5vw, 14px)',
                  fontSize: 'clamp(13px, 3.5vw, 14px)',
                  opacity: currentQuestionIndex === 0 ? 0.5 : 1
                }}
              >
                ← 이전 질문
              </button>
              <button
                className="btn"
                onClick={handleNextQuestion}
                style={{
                  flex: 2,
                  padding: 'clamp(12px, 3.5vw, 14px)',
                  fontSize: 'clamp(13px, 3.5vw, 14px)',
                  fontWeight: 600,
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                }}
              >
                {currentQuestionIndex === questions.length - 1 ? '✅ 답변 제출' : '다음 질문 →'}
              </button>
            </div>

            {/* Skip Timer Button */}
            <button
              className="btn ghost"
              onClick={() => setTimer(0)}
              style={{
                padding: 'clamp(8px, 2.5vw, 10px)',
                fontSize: 'clamp(11px, 3vw, 12px)'
              }}
            >
              ⏩ 타이머 스킵하고 다음으로
            </button>
          </div>
        )}

        {/* Grading Phase - View Grading Results */}
        {phase === 'grading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 5vw, 20px)' }}>
            <div className="center" style={{ flexDirection: 'column', gap: 'clamp(12px, 4vw, 16px)', padding: 'clamp(20px, 6vw, 30px) 0' }}>
              <div style={{ fontSize: 'clamp(48px, 14vw, 64px)' }}>
                {(() => {
                  const scoreMatch = gradingMarkdown.match(/총점[:\s]*(\d+)/);
                  if (scoreMatch) {
                    const score = parseInt(scoreMatch[1]);
                    if (score >= 90) return '🏆';
                    if (score >= 75) return '🎉';
                    if (score >= 60) return '😊';
                    if (score >= 45) return '😐';
                    return '😢';
                  }
                  return '📊';
                })()}
              </div>
              <div style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 600 }}>
                면접 평가 결과
              </div>
            </div>

            <div style={{
              padding: 'clamp(16px, 5vw, 20px)',
              background: 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              maxHeight: '500px',
              overflow: 'auto'
            }}>
              <div style={{
                fontSize: 'clamp(13px, 3.5vw, 14px)',
                lineHeight: '1.8'
              }} className="markdown-content">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 style={{ fontSize: 'clamp(18px, 5vw, 24px)', fontWeight: 700, marginBottom: '16px', marginTop: '20px' }} {...props} />,
                    h2: ({node, ...props}) => <h2 style={{ fontSize: 'clamp(16px, 4.5vw, 20px)', fontWeight: 700, marginBottom: '12px', marginTop: '16px' }} {...props} />,
                    h3: ({node, ...props}) => <h3 style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 600, marginBottom: '10px', marginTop: '14px' }} {...props} />,
                    p: ({node, ...props}) => <p style={{ marginBottom: '12px', lineHeight: '1.8' }} {...props} />,
                    ul: ({node, ...props}) => <ul style={{ marginLeft: '20px', marginBottom: '12px', listStyleType: 'disc' }} {...props} />,
                    ol: ({node, ...props}) => <ol style={{ marginLeft: '20px', marginBottom: '12px', listStyleType: 'decimal' }} {...props} />,
                    li: ({node, ...props}) => <li style={{ marginBottom: '8px', lineHeight: '1.6' }} {...props} />,
                    strong: ({node, ...props}) => <strong style={{ fontWeight: 700, color: 'var(--text)' }} {...props} />,
                    em: ({node, ...props}) => <em style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }} {...props} />,
                    code: ({node, ...props}) => <code style={{ backgroundColor: 'var(--panel)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.9em' }} {...props} />,
                    blockquote: ({node, ...props}) => <blockquote style={{ borderLeft: '4px solid var(--border)', paddingLeft: '16px', marginLeft: '0', marginBottom: '12px', color: 'var(--text-secondary)' }} {...props} />,
                    hr: ({node, ...props}) => <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '20px 0' }} {...props} />
                  }}
                >
                  {gradingMarkdown}
                </ReactMarkdown>
              </div>
            </div>

            <div style={{
              padding: 'clamp(12px, 4vw, 16px)',
              background: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.3)',
              borderRadius: 4,
              fontSize: 'clamp(12px, 3.2vw, 13px)',
              lineHeight: '1.6'
            }}>
              💡 <b>팁:</b> 평가 결과를 바탕으로 부족한 부분을 보완하여 다시 도전해보세요!
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 3vw, 12px)' }}>
              <button
                className="btn"
                onClick={() => {
                  setPhase('resume');
                  setResumeFile(null);
                  setQuestionMarkdown('');
                  setCurrentMockInterviewId(null);
                  setCurrentQuestionIndex(0);
                  setQuestionAnswers([]);
                  setQuestions([]);
                  setTimer(60);
                  setIsTimerRunning(false);
                  setThinkingTimeLeft(2);
                  setIsThinkingTime(false);
                  setGradingMarkdown('');
                }}
                style={{
                  width: '100%',
                  padding: 'clamp(14px, 4.5vw, 16px)',
                  fontSize: 'clamp(14px, 4vw, 16px)',
                  fontWeight: 600
                }}
              >
                🔄 다시 모의 면접 보기
              </button>
              <button
                className="btn secondary"
                onClick={resetToList}
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 3vw, 12px)',
                  fontSize: 'clamp(12px, 3.2vw, 13px)'
                }}
              >
                📋 면접 목록으로
              </button>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="overlay">
            <div className="card center" style={{
              gap: 'clamp(16px, 5vw, 20px)',
              padding: 'clamp(32px, 10vw, 48px)',
              flexDirection: 'column'
            }}>
              <div className="spinner" style={{ width: 'clamp(32px, 10vw, 40px)', height: 'clamp(32px, 10vw, 40px)' }} />
              <div style={{ fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 500, textAlign: 'center' }}>
                {phase === 'answer' ? '📊 AI가 답변을 채점하고 있습니다...' : LOADING_MESSAGES[loadingMessageIndex]}
              </div>
              <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(11px, 3vw, 12px)', textAlign: 'center' }}>
                {phase === 'answer' ? (
                  isMobile ? (
                    <>⏱️ 최대 5분 정도 걸립니다<br />잠시만 기다려주세요!</>
                  ) : (
                    '⏱️ 최대 5분 정도 걸리니 잠시만 기다려주세요!'
                  )
                ) : (
                  isMobile ? (
                    <>⏱️ 최대 10분 정도 걸립니다<br />잠시만 기다려주세요!</>
                  ) : (
                    '⏱️ 최대 10분 정도 걸리니 잠시만 기다려주세요!'
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
