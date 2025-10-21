import { useEffect, useMemo, useState, useRef } from 'react';
import { MAX_PDF_SIZE } from '@/shared/config';
import { generate, getHistory, logout } from './apiClient';
import type { ActionType, HistoryItem } from './apiClient';
import { fileToBase64, getPdfPageCount, downloadPdfFromUrl, fetchPdfAsFile, extractTextFromPdf } from './utils/pdfUtils';
import { PdfViewer } from './components/PdfViewer';
import { CrammingTab } from './components/CrammingTab';
import { UserProfileModal } from './components/UserProfileModal';
import { chatWithPdfStream } from './utils/chatgptClient';

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

export function MainScreen({ username, token }: { username: string; token: string }) {
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
  const [resultPdfFiles, setResultPdfFiles] = useState<Array<{ file: File; filename: string; url: string }>>([]);
  const [showResultPdfModal, setShowResultPdfModal] = useState(false);
  const [currentResultFileIndex, setCurrentResultFileIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedPdfText, setSelectedPdfText] = useState<string[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [summaryPdfText, setSummaryPdfText] = useState<string>('');
  const [showCloseConfirmModal, setShowCloseConfirmModal] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Send chat message with streaming
  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setError('OpenAI API 키가 설정되지 않았습니다.');
      return;
    }

    const userMessage = chatInput.trim();
    setChatInput('');
    setIsChatLoading(true);

    // Add user message
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    // Add empty assistant message that will be filled with streaming content
    setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      // Use selected text from PDF, or empty string if no text selected
      const pdfContent = ''; // Could extract text from PDF file if needed

      // 선택된 텍스트를 사용하기 전에 저장
      const currentSelectedText = selectedPdfText;

      // 질문 전송 후 PDF viewer의 선택 영역 해제
      setSelectedPdfText([]);

      let accumulatedContent = '';

      for await (const chunk of chatWithPdfStream(
        userMessage,
        pdfContent,
        currentSelectedText,
        apiKey,
        summaryPdfText
      )) {
        accumulatedContent += chunk;

        // Update the last message with accumulated content using functional update
        setChatMessages(prev => {
          const newMessages = [...prev];
          const lastMessageIndex = newMessages.length - 1;
          if (lastMessageIndex >= 0 && newMessages[lastMessageIndex].role === 'assistant') {
            newMessages[lastMessageIndex] = {
              ...newMessages[lastMessageIndex],
              content: accumulatedContent
            };
          }
          return newMessages;
        });
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      // Update the last message with error
      setChatMessages(prev => {
        const newMessages = [...prev];
        const lastMessageIndex = newMessages.length - 1;
        if (lastMessageIndex >= 0 && newMessages[lastMessageIndex].role === 'assistant') {
          newMessages[lastMessageIndex] = {
            ...newMessages[lastMessageIndex],
            content: `오류가 발생했습니다: ${error.message}`
          };
        }
        return newMessages;
      });
    } finally {
      setIsChatLoading(false);
      // Clear text selection after question is answered
      setSelectedPdfText([]);
    }
  };

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

      // Clear cache and reload history after generating (reset to first page)
      clearHistoryCache();
      if (currentTab === 'history') {
        await loadHistory(0);
      }

      // 예상 문제의 경우 바로 새 탭에서 URL 열기 (File 변환 불필요)
      if (action === 'quiz') {
        // 다운로드 완료 상태로 전환 (모달 표시)
        setDownloadComplete(true);

        for (const result of results) {
          console.log('[Quiz] Response URL from server:', result.url);
          // response에서 받은 URL을 그대로 새 탭에서 열기
          window.open(result.url, '_blank', 'noopener,noreferrer');
        }
      } else {
        // 요약/벼락치기는 File 객체로 변환 필요 (PDF viewer에서 사용)
        const pdfFiles: Array<{ file: File; filename: string; url: string }> = [];
        for (const result of results) {
          const pdfUrl = import.meta.env.DEV
            ? 'https://cdn.devgyurak.com/datas/input/devgyurak_24ed1a3f-b57d-4ad2-9ef2-0af74e7d0e97.pdf'
            : result.url;
          const file = await fetchPdfAsFile(pdfUrl, result.filename);
          pdfFiles.push({ file, filename: result.filename, url: pdfUrl });
        }

        // 요약 정리인 경우 PDF 텍스트 추출
        if (action === 'summary' && pdfFiles.length > 0) {
          try {
            const extractedText = await extractTextFromPdf(pdfFiles[0].file);
            setSummaryPdfText(extractedText);
            console.log('[Summary] Extracted text from summary PDF:', extractedText.substring(0, 200) + '...');
          } catch (error) {
            console.error('[Summary] Failed to extract text from PDF:', error);
          }
        }

        // 로딩 종료 및 결과 PDF 모달 표시
        setLoading(false);
        setDownloadComplete(false);
        setResultPdfFiles(pdfFiles);
        setCurrentResultFileIndex(0);
        setShowResultPdfModal(true);
      }

      // Clear input state
      setFiles([]);
      setPrompt('');
      setSelectedAreasByFile(new Map());
      setFileBase64Map(new Map());
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
      window.history.pushState({}, '', '/');
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

      {/* Result PDF Viewer Modal with Chat */}
      {showResultPdfModal && resultPdfFiles.length > 0 && (
        <div
          className="overlay"
          style={{
            display: 'flex',
            gap: '16px',
            padding: '16px',
            alignItems: 'stretch'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowResultPdfModal(false);
              setResultPdfFiles([]);
              setCurrentResultFileIndex(0);
              setChatMessages([]);
              setChatInput('');
              setSelectedPdfText([]);
              setIsChatLoading(false);
            }
          }}
        >
          {/* Left Panel - PDF Viewer */}
          <div
            className="card"
            style={{
              padding: '24px',
              flex: 1,
              maxWidth: '50%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              height: 'calc(100vh - 32px)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0, gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="title" style={{ fontSize: '18px', marginBottom: '4px' }}>
                  {action === 'summary' ? '📝 요약 결과' : '📋 문제 생성 결과'}
                </h2>
                <div className="small" style={{ color: 'var(--muted)', fontSize: '12px', lineHeight: '1.4' }}>
                  결과를 확인하고 다운로드할 수 있습니다
                </div>
              </div>
              <button
                onClick={() => {
                  // 요약인 경우 확인 모달 표시
                  if (action === 'summary') {
                    setShowCloseConfirmModal(true);
                  } else {
                    // 문제 생성은 바로 닫기
                    setShowResultPdfModal(false);
                    setResultPdfFiles([]);
                    setCurrentResultFileIndex(0);
                    setChatMessages([]);
                    setChatInput('');
                    setSelectedPdfText([]);
                    setIsChatLoading(false);
                  }
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

            <div style={{ marginBottom: '16px', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', wordBreak: 'break-all', padding: '0 12px' }}>
                📄 {resultPdfFiles[currentResultFileIndex]?.filename}
              </div>
              {resultPdfFiles.length > 1 && (
                <div className="small" style={{ color: 'var(--muted)', fontSize: '12px', marginTop: '4px' }}>
                  {currentResultFileIndex + 1} / {resultPdfFiles.length} 파일
                </div>
              )}
            </div>

            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <PdfViewer
                file={resultPdfFiles[currentResultFileIndex].file}
                onAreasSelect={(areas) => setSelectedPdfText(areas)}
                selectedAreas={selectedPdfText}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexShrink: 0 }}>
              {/* 요약이 아닌 경우만 다운로드 버튼 표시 */}
              {action !== 'summary' && (
                <button
                  className="btn secondary"
                  onClick={async () => {
                    const current = resultPdfFiles[currentResultFileIndex];
                    await downloadPdfFromUrl(current.filename, current.url);
                  }}
                  style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                >
                  📥 다운로드
                </button>
              )}
              {resultPdfFiles.length > 1 && (
                <button
                  className="btn"
                  onClick={async () => {
                    if (currentResultFileIndex < resultPdfFiles.length - 1) {
                      setCurrentResultFileIndex(prev => prev + 1);
                    } else {
                      // 요약인 경우 다운로드 후 닫기
                      if (action === 'summary') {
                        const current = resultPdfFiles[currentResultFileIndex];
                        await downloadPdfFromUrl(current.filename, current.url);
                      }
                      setShowResultPdfModal(false);
                      setResultPdfFiles([]);
                      setCurrentResultFileIndex(0);
                      setChatMessages([]);
                      setChatInput('');
                      setSelectedPdfText([]);
                      setIsChatLoading(false);
                    }
                  }}
                  style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                >
                  {currentResultFileIndex < resultPdfFiles.length - 1 ? '다음 파일 →' : '✓ 완료'}
                </button>
              )}
              {resultPdfFiles.length === 1 && (
                <button
                  className="btn"
                  onClick={async () => {
                    // 요약인 경우 다운로드 후 닫기
                    if (action === 'summary') {
                      const current = resultPdfFiles[currentResultFileIndex];
                      await downloadPdfFromUrl(current.filename, current.url);
                    }
                    setShowResultPdfModal(false);
                    setResultPdfFiles([]);
                    setCurrentResultFileIndex(0);
                    setChatMessages([]);
                    setChatInput('');
                    setSelectedPdfText([]);
                    setIsChatLoading(false);
                  }}
                  style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                >
                  ✓ 완료
                </button>
              )}
            </div>
          </div>

          {/* Right Panel - Chat */}
          <div
            className="card"
            style={{
              padding: '24px',
              flex: 1,
              maxWidth: '50%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              height: 'calc(100vh - 32px)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '16px', flexShrink: 0 }}>
              <h2 className="title" style={{ fontSize: '18px', marginBottom: '4px' }}>
                💬 AI 교수와 대화
              </h2>
              <div className="small" style={{ color: 'var(--muted)', fontSize: '12px', lineHeight: '1.4' }}>
                요약 내용에 대해 질문하세요
              </div>
              {selectedPdfText.length > 0 && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'rgba(255, 235, 59, 0.2)',
                  border: '1px solid rgba(255, 193, 7, 0.5)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    ✓ {selectedPdfText.length}개 영역 선택됨 (AI가 이 부분을 참고합니다)
                  </div>
                  <button
                    onClick={() => setSelectedPdfText([])}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--muted)',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '0 4px',
                      lineHeight: 1
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '16px',
                background: 'var(--bg-secondary)',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {chatMessages.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: '12px',
                  color: 'var(--muted)'
                }}>
                  <div style={{ fontSize: '48px' }}>💭</div>
                  <div style={{ fontSize: '14px' }}>아직 대화가 없습니다</div>
                  <div style={{ fontSize: '12px', textAlign: 'center', lineHeight: '1.5' }}>
                    요약 내용에 대해 궁금한 점을<br />아래에서 질문해보세요
                  </div>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        gap: '4px'
                      }}
                    >
                      <div style={{ fontSize: '11px', color: 'var(--muted)', paddingLeft: '8px', paddingRight: '8px' }}>
                        {msg.role === 'user' ? '나' : 'AI 교수'}
                      </div>
                      <div
                        style={{
                          background: msg.role === 'user' ? '#e3f2fd' : 'var(--panel)',
                          color: msg.role === 'user' ? '#000000' : 'var(--text)',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          maxWidth: '80%',
                          fontSize: '13px',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          boxShadow: msg.role === 'user' ? '0 2px 8px rgba(0, 0, 0, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.08)',
                          border: msg.role === 'user' ? '1px solid #bbdefb' : '1px solid var(--border)'
                        }}
                      >
                        {msg.content || (msg.role === 'assistant' && isChatLoading ? '...' : '')}
                      </div>
                    </div>
                  ))}
                  <div ref={chatMessagesEndRef} />
                </>
              )}
            </div>

            {/* Chat Input */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <textarea
                className="input"
                placeholder="💬 질문을 입력하세요..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                disabled={isChatLoading}
                style={{
                  minHeight: '80px',
                  resize: 'none',
                  fontFamily: 'inherit',
                  fontSize: '13px',
                  flex: 1
                }}
              />
              <button
                className="btn"
                onClick={handleSendChat}
                disabled={!chatInput.trim() || isChatLoading}
                style={{
                  padding: '10px 16px',
                  fontSize: '13px',
                  alignSelf: 'flex-end',
                  height: '40px'
                }}
              >
                {isChatLoading ? '⏳' : '전송'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      {showCloseConfirmModal && (
        <div className="overlay" onClick={() => setShowCloseConfirmModal(false)}>
          <div
            className="card"
            style={{
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <h2 className="title" style={{ fontSize: '20px', marginBottom: '12px' }}>
              다운로드하지 않고 넘어갈까요?
            </h2>
            <div className="small" style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.5', marginBottom: '24px' }}>
              지금 다운로드하지 않아도<br />
              작업 내역에서 확인할 수 있어요!
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn secondary"
                onClick={() => setShowCloseConfirmModal(false)}
                style={{ flex: 1, padding: '12px', fontSize: '14px' }}
              >
                취소
              </button>
              <button
                className="btn"
                onClick={() => {
                  setShowCloseConfirmModal(false);
                  setShowResultPdfModal(false);
                  setResultPdfFiles([]);
                  setCurrentResultFileIndex(0);
                  setChatMessages([]);
                  setChatInput('');
                  setSelectedPdfText([]);
                  setIsChatLoading(false);
                }}
                style={{ flex: 1, padding: '12px', fontSize: '14px', background: '#f44336' }}
              >
                닫기
              </button>
            </div>
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
