import { useState, useEffect } from 'react';
import { generateCramming } from '../apiClient';
import { generateSpeedQuiz, gradeQuiz } from '../utils/chatgptClient';
import type { QuizQuestion, GradeResult } from '../utils/chatgptClient';
import { fileToBase64, getPdfPageCount, downloadPdfFromUrl } from '../utils/pdfUtils';
import { Confetti } from './Confetti';
import { MAX_PDF_SIZE } from '@/shared/config';

type CrammingPhase = 'upload' | 'studying' | 'quiz' | 'passed';

interface CrammingTabProps {
  token: string;
  username: string;
  isMobile?: boolean;
}

const CRAMMING_LOADING_MESSAGES_DESKTOP = [
  '⚡ 교수님이 핵심만 골라내고 계십니다...',
  '📚 두꺼운 교재를 얇게 압축하고 있습니다...',
  '🔥 불필요한 내용은 과감히 버리는 중...',
  '✨ 시험에 나올 법한 부분을 찾고 있습니다...',
  '💡 암기 포인트를 정리하고 있습니다...',
  '🎯 족집게처럼 중요한 부분만 추립니다...',
  '⏰ 시간 대비 효율을 최대로 만드는 중...',
  '📝 한눈에 들어오게 정리하고 있습니다...',
  '🚀 벼락치기 최적화 작업 중...',
  '😅 이 정도면 합격은 따놓은 당상...',
  '✅ 거의 완성되어 갑니다...',
];

const CRAMMING_LOADING_MESSAGES_MOBILE = [
  '⚡ 핵심만 골라내는 중...',
  '📚 교재를 압축하는 중...',
  '🔥 불필요한 내용 제거 중...',
  '✨ 시험 포인트 찾는 중...',
  '💡 암기 포인트 정리 중...',
  '🎯 족집게 찾는 중...',
  '⏰ 효율 최적화 중...',
  '📝 깔끔하게 정리 중...',
  '🚀 벼락치기 최적화 중...',
  '😅 거의 다 됐어요...',
  '✅ 마무리 중...',
];

export function CrammingTab({ token, username, isMobile }: CrammingTabProps) {
  const [phase, setPhase] = useState<CrammingPhase>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [hoursUntilExam, setHoursUntilExam] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [gradeResults, setGradeResults] = useState<GradeResult[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const LOADING_MESSAGES = isMobile ? CRAMMING_LOADING_MESSAGES_MOBILE : CRAMMING_LOADING_MESSAGES_DESKTOP;

  useEffect(() => {
    if (loading) {
      setLoadingMessageIndex(0);
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [loading, LOADING_MESSAGES.length]);

  const handleFileSelect = async (selectedFile: File) => {
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

    setFile(selectedFile);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!file || !hoursUntilExam) {
      setError('파일과 시험까지 남은 시간을 모두 입력해주세요.');
      return;
    }

    const hours = parseInt(hoursUntilExam);
    if (isNaN(hours) || hours <= 0) {
      setError('올바른 시간을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const pdfBase64 = await fileToBase64(file);
      const result = await generateCramming({ pdfBase64, hoursUntilExam: hours }, token);

      setMarkdownContent(result.markdownContent);

      // Download PDF
      await downloadPdfFromUrl(
        `${username}_cramming_${file.name.replace('.pdf', '')}_${new Date().toISOString().slice(0, 10)}.pdf`,
        result.resultPdfUrl
      );

      setPhase('studying');
    } catch (e: any) {
      setError(e?.message || '벼락치기 자료 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setError('OpenAI API 키가 설정되지 않았습니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const quizData = await generateSpeedQuiz(markdownContent, apiKey);
      setQuiz(quizData.questions);
      setPhase('quiz');
      setUserAnswers({});
      setQuizSubmitted(false);
    } catch (e: any) {
      setError(e?.message || '퀴즈 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setError('OpenAI API 키가 설정되지 않았습니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const gradeResult = await gradeQuiz(quiz, userAnswers, apiKey);
      const wrong = gradeResult.wrongCount;

      setWrongCount(wrong);
      setGradeResults(gradeResult.results);
      setQuizSubmitted(true);
      setLoading(false);
    } catch (e: any) {
      setError(e?.message || '채점에 실패했습니다.');
      setLoading(false);
    }
  };

  const resetToStart = () => {
    setPhase('upload');
    setFile(null);
    setHoursUntilExam('');
    setMarkdownContent('');
    setQuiz([]);
    setUserAnswers({});
    setQuizSubmitted(false);
    setWrongCount(0);
    setGradeResults([]);
    setShowConfetti(false);
  };

  return (
    <>
      {showConfetti && <Confetti />}

      <div className="card" style={{ padding: 'clamp(16px, 5vw, 20px)', display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 5vw, 20px)' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', paddingBottom: 'clamp(12px, 4vw, 16px)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 'clamp(40px, 10vw, 56px)', marginBottom: 'clamp(8px, 2.5vw, 12px)' }}>⚡</div>
          <h2 className="title" style={{ fontSize: 'clamp(18px, 5vw, 22px)', marginBottom: 'clamp(6px, 2vw, 8px)' }}>벼락치기 모드</h2>
          <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(12px, 3.2vw, 13px)', lineHeight: '1.5' }}>
            시험 직전! AI가 핵심만 빠르게 정리해드립니다
          </div>
        </div>

        {error && (
          <div className="alert error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Upload Phase */}
        {phase === 'upload' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 5vw, 20px)' }}>
            <div style={{
              padding: 'clamp(16px, 5vw, 20px)',
              background: 'var(--bg-secondary)',
              borderRadius: 4,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, marginBottom: 'clamp(10px, 3vw, 12px)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'clamp(18px, 5vw, 20px)' }}>📚</span>
                <span>STEP 1. 교재 업로드</span>
              </div>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0];
                  if (selectedFile) handleFileSelect(selectedFile);
                }}
                style={{ display: 'none' }}
                id="cramming-file-input"
              />
              <label
                htmlFor="cramming-file-input"
                className="btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: 'clamp(13px, 3.5vw, 14px)',
                  padding: 'clamp(10px, 3vw, 12px) clamp(16px, 5vw, 20px)',
                  width: file ? 'auto' : '100%'
                }}
              >
                📁 {file ? '파일 변경' : 'PDF 파일 선택'}
              </label>
              {file && (
                <div style={{
                  marginTop: 'clamp(12px, 4vw, 14px)',
                  padding: 'clamp(10px, 3vw, 12px)',
                  background: 'var(--panel)',
                  borderRadius: 4,
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: 'var(--muted)', marginBottom: 4 }}>✓ 선택된 파일</div>
                  <div style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600 }}>{file.name}</div>
                  <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: 'var(--muted)', marginTop: 4 }}>
                    크기: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              )}
            </div>

            <div style={{
              padding: 'clamp(16px, 5vw, 20px)',
              background: 'var(--bg-secondary)',
              borderRadius: 4,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, marginBottom: 'clamp(10px, 3vw, 12px)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'clamp(18px, 5vw, 20px)' }}>⏰</span>
                <span>STEP 2. 시험까지 남은 시간</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2.5vw, 10px)' }}>
                <input
                  className="input"
                  type="number"
                  min="1"
                  placeholder="숫자만 입력"
                  value={hoursUntilExam}
                  onChange={(e) => setHoursUntilExam(e.target.value)}
                  style={{
                    fontSize: 'clamp(16px, 4.5vw, 18px)',
                    fontWeight: 600,
                    textAlign: 'center',
                    flex: 1
                  }}
                />
                <span style={{ fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 500, whiteSpace: 'nowrap' }}>시간</span>
              </div>
              <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(10px, 2.8vw, 11px)', marginTop: 'clamp(8px, 2.5vw, 10px)', textAlign: 'center' }}>
                시험까지 남은 시간에 맞춰 최적화된 자료를 생성합니다
              </div>
            </div>

            <div style={{
              padding: 'clamp(16px, 5vw, 20px)',
              background: 'var(--bg-secondary)',
              borderRadius: 4,
              border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, marginBottom: 'clamp(6px, 2vw, 8px)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'clamp(18px, 5vw, 20px)' }}>📝</span>
                <span>STEP 3. 스피드 퀴즈로 테스트</span>
              </div>
              <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(11px, 3vw, 12px)', lineHeight: '1.5' }}>
                자료를 다 외운 뒤 스피드 퀴즈도 풀어보세요!
              </div>
            </div>

            <button
              className="btn"
              onClick={handleGenerate}
              disabled={!file || !hoursUntilExam || loading}
              style={{
                width: '100%',
                padding: 'clamp(14px, 4.5vw, 16px)',
                fontSize: 'clamp(14px, 4vw, 16px)',
                fontWeight: 600
              }}
            >
              {loading ? '⏳ 생성 중...' : '⚡ 벼락치기 자료 생성하기'}
            </button>
          </div>
        )}

        {/* Studying Phase */}
        {phase === 'studying' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 5vw, 20px)' }}>
            <div className="alert" style={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
              <span className="alert-icon" style={{ fontSize: 'clamp(20px, 5.5vw, 24px)' }}>✅</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>자료 생성 완료!</div>
                <div style={{ fontSize: 'clamp(11px, 3vw, 12px)' }}>PDF가 다운로드되었습니다. 학습 후 테스트를 시작하세요!</div>
              </div>
            </div>

            <button
              className="btn"
              onClick={handleStartQuiz}
              disabled={loading}
              style={{
                width: '100%',
                padding: 'clamp(14px, 4.5vw, 16px)',
                fontSize: 'clamp(14px, 4vw, 16px)',
                fontWeight: 600
              }}
            >
              {loading ? '⏳ 퀴즈 생성 중...' : '✅ 다 외웠어요! 테스트 시작'}
            </button>

            <button
              className="btn secondary"
              onClick={resetToStart}
              style={{ width: '100%', padding: 'clamp(10px, 3vw, 12px)', fontSize: 'clamp(12px, 3.2vw, 13px)' }}
            >
              🔄 처음부터 다시
            </button>
          </div>
        )}

        {/* Quiz Phase */}
        {phase === 'quiz' && !quizSubmitted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 5vw, 20px)' }}>
            <div className="alert" style={{ background: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
              <span className="alert-icon" style={{ fontSize: 'clamp(20px, 5.5vw, 24px)' }}>📝</span>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>스피드 퀴즈 10문제!</div>
                <div style={{ fontSize: 'clamp(11px, 3vw, 12px)' }}>⚠️ 3문제 이상 틀리면 다시 외워야 합니다</div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gap: 'clamp(12px, 4vw, 16px)',
              maxHeight: '500px',
              overflow: 'auto',
              padding: '2px'
            }}>
              {quiz.map((q, idx) => (
                <div key={idx} style={{
                  padding: 'clamp(14px, 4.5vw, 18px)',
                  background: 'var(--panel)',
                  borderRadius: 4,
                  border: '1px solid var(--border)'
                }}>
                  <div style={{
                    fontWeight: 600,
                    marginBottom: 'clamp(10px, 3vw, 14px)',
                    fontSize: 'clamp(13px, 3.5vw, 14px)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8
                  }}>
                    <span style={{
                      background: 'var(--text)',
                      color: 'var(--panel)',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 'clamp(11px, 3vw, 12px)',
                      fontWeight: 600,
                      flexShrink: 0
                    }}>
                      Q{idx + 1}
                    </span>
                    <span style={{ flex: 1 }}>{q.question}</span>
                  </div>

                  {q.type === 'multiple_choice' && q.options ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 2.5vw, 10px)' }}>
                      {q.options.map((option, optIdx) => (
                        <label
                          key={optIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'clamp(10px, 3vw, 12px)',
                            padding: 'clamp(10px, 3vw, 12px)',
                            background: userAnswers[idx] === option ? 'var(--bg-secondary)' : 'var(--panel)',
                            border: `1px solid ${userAnswers[idx] === option ? 'var(--text)' : 'var(--border)'}`,
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 'clamp(12px, 3.2vw, 13px)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            if (userAnswers[idx] !== option) {
                              e.currentTarget.style.background = 'var(--bg-secondary)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (userAnswers[idx] !== option) {
                              e.currentTarget.style.background = 'var(--panel)';
                            }
                          }}
                        >
                          <input
                            type="radio"
                            name={`question-${idx}`}
                            checked={userAnswers[idx] === option}
                            onChange={() => setUserAnswers({ ...userAnswers, [idx]: option })}
                            style={{ width: 18, height: 18, flexShrink: 0 }}
                          />
                          <span style={{ flex: 1 }}>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      className="input"
                      type="text"
                      placeholder="답을 입력하세요"
                      value={userAnswers[idx] || ''}
                      onChange={(e) => setUserAnswers({ ...userAnswers, [idx]: e.target.value })}
                      style={{ fontSize: 'clamp(13px, 3.5vw, 14px)' }}
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              className="btn"
              onClick={handleSubmitQuiz}
              disabled={loading}
              style={{
                width: '100%',
                padding: 'clamp(14px, 4.5vw, 16px)',
                fontSize: 'clamp(14px, 4vw, 16px)',
                fontWeight: 600
              }}
            >
              {loading ? '⏳ 채점 중...' : '✓ 제출하기'}
            </button>
          </div>
        )}

        {/* Quiz Result */}
        {phase === 'quiz' && quizSubmitted && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 5vw, 20px)' }}>
            <div className="center" style={{ flexDirection: 'column', gap: 'clamp(12px, 4vw, 16px)', padding: 'clamp(20px, 6vw, 30px) 0' }}>
              {wrongCount >= 5 ? (
                <>
                  <div style={{ fontSize: 'clamp(48px, 14vw, 64px)' }}>😢</div>
                  <div style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 600 }}>
                    {wrongCount}문제 틀렸습니다
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 'clamp(12px, 3.2vw, 14px)', textAlign: 'center' }}>
                    아래 해설을 확인하고 다시 학습해보세요!
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 'clamp(48px, 14vw, 64px)' }}>🎉</div>
                  <div style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 600 }}>
                    합격입니다!
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 'clamp(12px, 3.2vw, 14px)', textAlign: 'center' }}>
                    {wrongCount === 0 ? '완벽합니다! 🎯' : `${wrongCount}문제만 틀렸어요!`}
                  </div>
                </>
              )}
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'clamp(12px, 4vw, 16px)',
              maxHeight: '400px',
              overflow: 'auto',
              padding: '2px'
            }}>
              {gradeResults.map((result, idx) => {
                const question = quiz[result.questionIndex];
                return (
                  <div
                    key={idx}
                    style={{
                      padding: 'clamp(14px, 4.5vw, 18px)',
                      background: 'var(--panel)',
                      borderRadius: 4,
                      border: `2px solid ${result.isCorrect ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)'}`,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 'clamp(8px, 2.5vw, 10px)'
                    }}>
                      <span style={{
                        background: result.isCorrect ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                        color: result.isCorrect ? 'rgb(76, 175, 80)' : 'rgb(244, 67, 54)',
                        borderRadius: 4,
                        padding: '2px 8px',
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        fontWeight: 600,
                        flexShrink: 0
                      }}>
                        {result.isCorrect ? '✓ 정답' : '✗ 오답'}
                      </span>
                      <span style={{
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        color: 'var(--muted)',
                        fontWeight: 600
                      }}>
                        Q{result.questionIndex + 1}
                      </span>
                    </div>

                    <div style={{
                      fontWeight: 600,
                      fontSize: 'clamp(13px, 3.5vw, 14px)',
                      marginBottom: 'clamp(10px, 3vw, 12px)'
                    }}>
                      {question.question}
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'clamp(6px, 2vw, 8px)',
                      fontSize: 'clamp(12px, 3.2vw, 13px)'
                    }}>
                      <div>
                        <span style={{ color: 'var(--muted)' }}>내 답변: </span>
                        <span style={{ color: result.isCorrect ? 'rgb(76, 175, 80)' : 'rgb(244, 67, 54)' }}>
                          {result.userAnswer || '(응답 없음)'}
                        </span>
                      </div>
                      {!result.isCorrect && (
                        <div>
                          <span style={{ color: 'var(--muted)' }}>정답: </span>
                          <span style={{ color: 'rgb(76, 175, 80)', fontWeight: 600 }}>
                            {result.correctAnswer}
                          </span>
                        </div>
                      )}
                      <div style={{
                        marginTop: 'clamp(4px, 1.5vw, 6px)',
                        padding: 'clamp(8px, 2.5vw, 10px)',
                        background: 'var(--bg-secondary)',
                        borderRadius: 4,
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        lineHeight: '1.5'
                      }}>
                        <div style={{ color: 'var(--muted)', marginBottom: 4, fontWeight: 600 }}>💡 해설</div>
                        <div>{result.explanation}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 3vw, 12px)' }}>
              {wrongCount >= 5 ? (
                <button
                  className="btn"
                  onClick={() => {
                    setPhase('studying');
                    setQuizSubmitted(false);
                    setUserAnswers({});
                  }}
                  style={{
                    width: '100%',
                    padding: 'clamp(14px, 4.5vw, 16px)',
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    fontWeight: 600
                  }}
                >
                  📚 다시 학습하기
                </button>
              ) : (
                <button
                  className="btn"
                  onClick={() => {
                    setPhase('passed');
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 5000);
                  }}
                  style={{
                    width: '100%',
                    padding: 'clamp(14px, 4.5vw, 16px)',
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    fontWeight: 600
                  }}
                >
                  🎉 축하 화면으로
                </button>
              )}
              <button
                className="btn secondary"
                onClick={resetToStart}
                style={{
                  width: '100%',
                  padding: 'clamp(10px, 3vw, 12px)',
                  fontSize: 'clamp(12px, 3.2vw, 13px)'
                }}
              >
                🔄 처음부터 다시
              </button>
            </div>
          </div>
        )}

        {/* Passed Phase */}
        {phase === 'passed' && (
          <div className="center" style={{ flexDirection: 'column', gap: 'clamp(20px, 6vw, 28px)', padding: 'clamp(50px, 15vw, 80px) 0' }}>
            <div style={{
              fontSize: 'clamp(72px, 20vw, 96px)',
              animation: 'bounce 1s ease-in-out infinite'
            }}>
              🎉
            </div>
            <div style={{
              fontSize: 'clamp(24px, 7vw, 32px)',
              fontWeight: 700,
              textAlign: 'center'
            }}>
              축하합니다!
            </div>
            <div style={{
              fontSize: 'clamp(16px, 4.5vw, 20px)',
              color: 'var(--text)',
              textAlign: 'center',
              lineHeight: '1.6',
              maxWidth: '500px'
            }}>
              완벽하게 학습하셨어요!<br />
              이제 자신감을 갖고 시험 치러 가세요! 🚀
            </div>
            <button
              className="btn"
              onClick={resetToStart}
              style={{
                marginTop: 'clamp(12px, 4vw, 20px)',
                padding: 'clamp(12px, 4vw, 14px) clamp(20px, 6vw, 24px)',
                fontSize: 'clamp(14px, 4vw, 16px)',
                fontWeight: 600
              }}
            >
              🔄 처음부터 다시 시작
            </button>
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
                {phase === 'quiz' && !quizSubmitted ? '📝 채점 중입니다...' : LOADING_MESSAGES[loadingMessageIndex]}
              </div>
              <div className="small" style={{ color: 'var(--muted)', fontSize: 'clamp(11px, 3vw, 12px)', textAlign: 'center' }}>
                {phase === 'quiz' && !quizSubmitted ? (
                  '잠시만 기다려주세요!'
                ) : isMobile ? (
                  <>⏱️ 최대 15분 정도 걸리니<br />잠시만 기다려주세요!</>
                ) : (
                  '⏱️ 최대 15분 정도 걸리니 잠시만 기다려주세요!'
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </>
  );
}
