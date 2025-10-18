import { useEffect, useMemo, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api';
import { createWorker, PSM } from 'tesseract.js';
// Import pdfUtils to ensure worker initialization
import '../utils/pdfUtils';

interface PdfViewerProps {
  file: File;
  onAreasSelect: (areas: string[]) => void;
  selectedAreas: string[];
}

interface TextLayerItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  pageIndex: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function PdfViewer({ file, onAreasSelect, selectedAreas }: PdfViewerProps) {
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const textLayerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTasksRef = useRef<any[]>([]);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [textItems, setTextItems] = useState<TextLayerItem[]>([]);
  // Store multiple selection areas, each as a Set of indices
  const [selectionAreas, setSelectionAreas] = useState<Set<number>[]>([]);
  const [currentSelection, setCurrentSelection] = useState<Set<number>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [hasDragged, setHasDragged] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ current: 0, total: 0 });
  const [pagesProcessingOCR, setPagesProcessingOCR] = useState<Set<number>>(new Set());
  const ocrWorkerRef = useRef<any>(null);

  // Flatten all areas for display
  const selectedIndices = useMemo(() => {
    const allIndices = new Set<number>();
    selectionAreas.forEach(area => {
      area.forEach(idx => allIndices.add(idx));
    });
    currentSelection.forEach(idx => allIndices.add(idx));
    return allIndices;
  }, [selectionAreas, currentSelection]);

  // Clear selection when file changes
  useEffect(() => {
    setSelectionAreas([]);
    setCurrentSelection(new Set());
    setIsSelecting(false);
    setSelectionStart(null);
  }, [file]);

  // Restore selection from selectedAreas prop when textItems load
  useEffect(() => {
    if (!selectedAreas || selectedAreas.length === 0 || textItems.length === 0) {
      return;
    }

    // Only restore when textItems first become available (after PDF loads)
    if (selectionAreas.length > 0) {
      return; // Already have selection
    }

    // Find indices that match each area text
    const restoredAreas: Set<number>[] = [];

    for (const areaText of selectedAreas) {
      const targetText = areaText.toLowerCase();

      // Try to find matching sequence in text items
      for (let startIdx = 0; startIdx < textItems.length; startIdx++) {
        const testIndices = new Set<number>();
        let matchedText = '';

        for (let i = startIdx; i < textItems.length; i++) {
          testIndices.add(i);
          matchedText = Array.from(testIndices)
            .sort((a, b) => {
              const itemA = textItems[a];
              const itemB = textItems[b];
              if (itemA.pageIndex !== itemB.pageIndex) {
                return itemA.pageIndex - itemB.pageIndex;
              }
              if (Math.abs(itemA.y - itemB.y) > 5) {
                return itemA.y - itemB.y;
              }
              return itemA.x - itemB.x;
            })
            .map(idx => textItems[idx].text)
            .join(' ')
            .trim()
            .toLowerCase();

          if (matchedText === targetText) {
            restoredAreas.push(testIndices);
            break;
          }

          if (matchedText.length > targetText.length) {
            break;
          }
        }
      }
    }

    if (restoredAreas.length > 0) {
      setSelectionAreas(restoredAreas);
    }
  }, [textItems, selectedAreas]);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          useSystemFonts: false,
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          disableFontFace: false,
        });
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
      } catch (error) {
        console.error('Failed to load PDF:', error);
      }
    };

    loadPdf();
  }, [file]);

  // Initialize OCR worker
  useEffect(() => {
    const initWorker = async () => {
      try {
        const worker = await createWorker(['kor', 'eng'], 1, {
          workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js',
          langPath: 'https://tessdata.projectnaptha.com/4.0.0',
          corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js',
        });

        // Set parameters for better OCR performance
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.AUTO_OSD, // Automatic page segmentation with OSD (Orientation and Script Detection)
          preserve_interword_spaces: '1',
        });

        ocrWorkerRef.current = worker;
        console.log('OCR worker initialized with optimized parameters');
      } catch (error) {
        console.error('Failed to initialize OCR worker:', error);
      }
    };

    initWorker();

    return () => {
      if (ocrWorkerRef.current) {
        ocrWorkerRef.current.terminate();
      }
    };
  }, []);

  useEffect(() => {
    if (!pdf) return;

    let isMounted = true;

    // Cancel any ongoing render tasks
    renderTasksRef.current.forEach(task => {
      if (task && task.cancel) {
        task.cancel();
      }
    });
    renderTasksRef.current = [];

    const renderPages = async () => {
      const allTextItems: TextLayerItem[] = [];

      // Get container width for dynamic scaling
      const containerWidth = containerRef.current?.clientWidth || 800;

      setIsProcessingOCR(true);
      setOcrProgress({ current: 0, total: numPages });
      setPagesProcessingOCR(new Set());

      // Render pages sequentially to avoid concurrent rendering issues
      for (let i = 1; i <= numPages; i++) {
        setOcrProgress({ current: i, total: numPages });
        if (!isMounted) break;

        try {
          const page = await pdf.getPage(i);
          const canvas = canvasRefs.current[i - 1];
          if (!canvas) continue;

          // Calculate scale to fit container width
          const baseViewport = page.getViewport({ scale: 1.0, rotation: 0 });
          const scale = containerWidth / baseViewport.width;
          const viewport = page.getViewport({ scale, rotation: 0 });

          const context = canvas.getContext('2d');
          if (!context) continue;

          // Set canvas size to match viewport
          canvas.height = viewport.height;
          canvas.width = viewport.width;

          // Clear canvas before rendering
          context.clearRect(0, 0, canvas.width, canvas.height);

          // Render the page with text layer
          const renderTask = page.render({
            canvasContext: context,
            viewport: viewport,
            intent: 'display',
          } as any);

          renderTasksRef.current.push(renderTask);

          await renderTask.promise;

          // Extract text content
          const textContent = await page.getTextContent();
          const pageTextItems: TextLayerItem[] = [];

          textContent.items.forEach((item) => {
            if ('str' in item) {
              const textItem = item as TextItem;

              // Apply viewport transform to text item transform
              // This is how PDF.js officially calculates text positions
              const tx = pdfjsLib.Util.transform(
                viewport.transform,
                textItem.transform
              );

              // Extract position from the combined transform matrix
              // tx[4] = x position, tx[5] = y position in viewport coordinates
              const left = tx[4];
              const top = tx[5];

              // Calculate the font size (height) from the transform matrix
              const fontSize = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);

              // Normalize text to handle encoding issues
              // Use NFC (Canonical Composition) for consistent character representation
              const normalizedText = textItem.str.normalize('NFC');

              pageTextItems.push({
                text: normalizedText,
                x: left,
                y: top - fontSize, // Adjust for baseline to top
                width: textItem.width * viewport.scale,
                height: fontSize,
                pageIndex: i - 1,
                canvasWidth: canvas.width,
                canvasHeight: canvas.height,
              });
            }
          });

          // Run OCR only if text extraction found very little text
          const totalTextLength = pageTextItems.reduce((sum, item) => sum + item.text.trim().length, 0);
          const shouldRunOCR = totalTextLength < 100; // Only run OCR if less than 100 characters found

          console.log(`Page ${i} - PDF.js extracted:`, {
            itemCount: pageTextItems.length,
            totalChars: totalTextLength,
            sample: pageTextItems.slice(0, 3).map(item => item.text),
            willRunOCR: shouldRunOCR,
          });

          if (shouldRunOCR && ocrWorkerRef.current) {
            // Mark this page as processing OCR
            setPagesProcessingOCR(prev => new Set([...prev, i - 1]));

            try {
              console.log(`Running OCR on page ${i} (found only ${totalTextLength} chars)...`);

              // Create a temporary canvas for image preprocessing
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = canvas.width;
              tempCanvas.height = canvas.height;
              const tempCtx = tempCanvas.getContext('2d');

              if (tempCtx) {
                // Copy the original canvas
                tempCtx.drawImage(canvas, 0, 0);

                // Get image data for preprocessing
                const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                const data = imageData.data;

                // Convert to grayscale and increase contrast
                for (let j = 0; j < data.length; j += 4) {
                  const avg = (data[j] + data[j + 1] + data[j + 2]) / 3;
                  // Increase contrast: if pixel is darker than mid-gray, make it darker; if lighter, make it lighter
                  const contrast = avg < 128 ? avg * 0.7 : avg * 1.2;
                  const gray = Math.min(255, Math.max(0, contrast));
                  data[j] = gray;     // R
                  data[j + 1] = gray; // G
                  data[j + 2] = gray; // B
                }

                tempCtx.putImageData(imageData, 0, 0);

                // Run OCR with optimized settings
                const { data: ocrData } = await ocrWorkerRef.current.recognize(tempCanvas, {
                  rotateAuto: true,
                });

                console.log(`OCR Result for page ${i}:`, {
                  confidence: ocrData.confidence,
                  text: ocrData.text,
                  wordCount: ocrData.words?.length || 0,
                });

                if (ocrData.words && ocrData.words.length > 0) {
                  console.log(`OCR Words on page ${i}:`, ocrData.words.map((w: any) => ({
                    text: w.text,
                    confidence: w.confidence,
                    bbox: w.bbox,
                  })));

                  ocrData.words.forEach((word: any) => {
                    if (word.text.trim() && word.confidence > 30) { // Filter low confidence words
                      pageTextItems.push({
                        text: word.text,
                        x: word.bbox.x0,
                        y: word.bbox.y0,
                        width: word.bbox.x1 - word.bbox.x0,
                        height: word.bbox.y1 - word.bbox.y0,
                        pageIndex: i - 1,
                        canvasWidth: canvas.width,
                        canvasHeight: canvas.height,
                      });
                    }
                  });
                  console.log(`OCR extracted ${ocrData.words.filter((w: any) => w.text.trim() && w.confidence > 30).length} words from page ${i} (filtered by confidence)`);
                } else {
                  console.log(`OCR found no words on page ${i}`);
                }
              }
            } catch (ocrError) {
              console.warn(`OCR failed for page ${i}:`, ocrError);
            } finally {
              // Remove this page from processing OCR
              setPagesProcessingOCR(prev => {
                const next = new Set(prev);
                next.delete(i - 1);
                console.log(`Page ${i} OCR completed, removed from processing set`);
                return next;
              });
            }
          } else if (!shouldRunOCR) {
            console.log(`Skipping OCR for page ${i} (found ${totalTextLength} chars)`);
          }

          allTextItems.push(...pageTextItems);

          // Update textItems incrementally after each page
          if (isMounted) {
            setTextItems([...allTextItems]);
          }
        } catch (error) {
          if ((error as any)?.name !== 'RenderingCancelledException') {
            console.error(`Failed to render page ${i}:`, error);
          }
        }
      }

      if (isMounted) {
        setIsProcessingOCR(false);
      }
    };

    renderPages();

    return () => {
      isMounted = false;
      // Cancel all render tasks on cleanup
      renderTasksRef.current.forEach(task => {
        if (task && task.cancel) {
          task.cancel();
        }
      });
      renderTasksRef.current = [];
    };
  }, [pdf, numPages]);

  const handleStart = (index: number) => {
    setIsSelecting(true);
    setSelectionStart(index);

    // If already selected, mark for potential deselection (will be checked on end)
    if (selectedIndices.has(index)) {
      setHasDragged(false); // Only set false if clicking already selected item
      return;
    }

    // Start new selection
    setHasDragged(true);
    setCurrentSelection(new Set([index]));
  };

  const handleMove = (index: number) => {
    if (isSelecting && selectionStart !== null) {
      setHasDragged(true); // Mark that dragging occurred

      const startItem = textItems[selectionStart];
      const endItem = textItems[index];

      // Get all items in the range
      const itemsInRange = textItems
        .map((item, idx) => ({ item, idx }))
        .filter(({ idx }) => {
          const currentItem = textItems[idx];

          // Same page selection
          if (startItem.pageIndex === endItem.pageIndex) {
            if (currentItem.pageIndex !== startItem.pageIndex) return false;

            // Create a bounding box from start to end
            const minY = Math.min(startItem.y, endItem.y);
            const maxY = Math.max(startItem.y + startItem.height, endItem.y + endItem.height);
            const minX = Math.min(startItem.x, endItem.x);
            const maxX = Math.max(startItem.x + startItem.width, endItem.x + endItem.width);

            // Check if current item overlaps with the bounding box
            const itemBottom = currentItem.y + currentItem.height;
            const itemRight = currentItem.x + currentItem.width;

            // Item overlaps if it's not completely outside the box
            const overlapsY = currentItem.y <= maxY && itemBottom >= minY;
            const overlapsX = currentItem.x <= maxX + 10 && itemRight >= minX - 10;

            return overlapsY && overlapsX;
          } else {
            // Multi-page selection: include all items between start and end pages
            const minPage = Math.min(startItem.pageIndex, endItem.pageIndex);
            const maxPage = Math.max(startItem.pageIndex, endItem.pageIndex);

            if (currentItem.pageIndex < minPage || currentItem.pageIndex > maxPage) {
              return false;
            }

            // On start page, select from start position to end of page
            if (currentItem.pageIndex === startItem.pageIndex && startItem.pageIndex !== endItem.pageIndex) {
              const isAfterStart = currentItem.y >= startItem.y ||
                (Math.abs(currentItem.y - startItem.y) < 10 && currentItem.x >= startItem.x);
              return isAfterStart;
            }

            // On end page, select from start of page to end position
            if (currentItem.pageIndex === endItem.pageIndex && startItem.pageIndex !== endItem.pageIndex) {
              const isBeforeEnd = currentItem.y <= endItem.y + endItem.height ||
                (Math.abs(currentItem.y - endItem.y) < 10 && currentItem.x <= endItem.x + endItem.width);
              return isBeforeEnd;
            }

            // On middle pages, select everything
            return true;
          }
        })
        .map(({ idx }) => idx);

      setCurrentSelection(new Set(itemsInRange));
    }
  };

  const handleEnd = () => {
    const clickedIndex = selectionStart;

    // Helper function to convert indices to text
    const indicesToText = (indices: Set<number>) => {
      const sortedIndices = Array.from(indices).sort((a, b) => {
        const itemA = textItems[a];
        const itemB = textItems[b];
        if (itemA.pageIndex !== itemB.pageIndex) {
          return itemA.pageIndex - itemB.pageIndex;
        }
        if (Math.abs(itemA.y - itemB.y) > 5) {
          return itemA.y - itemB.y;
        }
        return itemA.x - itemB.x;
      });
      return sortedIndices.map(i => textItems[i].text).join(' ').trim();
    };

    // Check if this was a click (not drag) on an already selected item - remove that area
    if (!hasDragged && clickedIndex !== null && selectedIndices.has(clickedIndex)) {
      // Find and remove the area containing this index
      const newAreas = selectionAreas.filter(area => !area.has(clickedIndex));
      setSelectionAreas(newAreas);

      // Convert all areas to text array and notify parent
      const areasText = newAreas.map(area => indicesToText(area)).filter(t => t);
      onAreasSelect(areasText);
    } else if (hasDragged && currentSelection.size > 0) {
      // Drag completed - add current selection as a new area
      const newAreas = [...selectionAreas, currentSelection];
      setSelectionAreas(newAreas);
      setCurrentSelection(new Set());

      // Convert all areas to text array and notify parent
      const areasText = newAreas.map(area => indicesToText(area)).filter(t => t);
      onAreasSelect(areasText);
    }

    setIsSelecting(false);
    setSelectionStart(null);
    setHasDragged(false);
  };

  const clearSelection = () => {
    setSelectionAreas([]);
    setCurrentSelection(new Set());
    onAreasSelect([]);
  };

  // Handle touch move at container level for better drag support
  const handleContainerTouchMove = (e: React.TouchEvent) => {
    if (!isSelecting) return;

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element && element.hasAttribute('data-text-index')) {
      const idx = parseInt(element.getAttribute('data-text-index')!, 10);
      if (!isNaN(idx)) {
        handleMove(idx);
      }
    }

    // Auto-scroll when dragging near edges
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const threshold = 50; // pixels from edge to trigger scroll
      const scrollSpeed = 10;

      if (touch.clientY - rect.top < threshold) {
        // Near top
        container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed);
      } else if (rect.bottom - touch.clientY < threshold) {
        // Near bottom
        container.scrollTop = Math.min(
          container.scrollHeight - container.clientHeight,
          container.scrollTop + scrollSpeed
        );
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="small" style={{ color: 'var(--muted)', fontSize: 12 }}>
          {isProcessingOCR
            ? `OCR 처리 중... (${ocrProgress.current}/${ocrProgress.total} 페이지)`
            : '드래그하여 여러 영역 선택 가능'}
        </div>
        {selectedIndices.size > 0 && (
          <button
            className="btn secondary"
            onClick={clearSelection}
            style={{ padding: '4px 8px', fontSize: 11 }}
          >
            선택 해제
          </button>
        )}
      </div>

      {selectedAreas.length > 0 && (
        <div style={{
          padding: '8px 12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 4,
          fontSize: 11,
          maxHeight: 120,
          overflow: 'auto'
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--muted)' }}>
            선택된 영역 ({selectedAreas.length}개):
          </div>
          {selectedAreas.map((areaText, idx) => (
            <div key={idx} style={{
              color: 'var(--text)',
              marginBottom: idx < selectedAreas.length - 1 ? 6 : 0,
              paddingBottom: idx < selectedAreas.length - 1 ? 6 : 0,
              borderBottom: idx < selectedAreas.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              <span style={{ color: 'var(--muted)', marginRight: 4 }}>영역 {idx + 1}:</span>
              {areaText.length > 100 ? areaText.substring(0, 100) + '...' : areaText}
            </div>
          ))}
        </div>
      )}

      <div
        ref={containerRef}
        style={{
          maxHeight: '600px',
          overflow: 'auto',
          border: '1px solid var(--border)',
          borderRadius: 4,
          background: '#f5f5f5',
          cursor: isSelecting ? 'text' : 'default',
        }}
        onMouseUp={handleEnd}
        onMouseLeave={() => setIsSelecting(false)}
        onMouseMove={(e) => {
          // Auto-scroll when dragging near edges with mouse
          if (!isSelecting) return;

          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const threshold = 50;
            const scrollSpeed = 10;

            if (e.clientY - rect.top < threshold) {
              container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed);
            } else if (rect.bottom - e.clientY < threshold) {
              container.scrollTop = Math.min(
                container.scrollHeight - container.clientHeight,
                container.scrollTop + scrollSpeed
              );
            }
          }
        }}
        onTouchEnd={handleEnd}
        onTouchMove={handleContainerTouchMove}
        onTouchCancel={() => setIsSelecting(false)}
      >
        {Array.from({ length: numPages }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'relative',
              marginBottom: i < numPages - 1 ? 12 : 0,
              background: 'white',
            }}
          >
            <canvas
              ref={el => { canvasRefs.current[i] = el; }}
              style={{ display: 'block' }}
            />
            <div
              ref={el => { textLayerRefs.current[i] = el; }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            >
              {textItems
                .filter(item => item.pageIndex === i)
                .map((item, idx) => {
                  const globalIdx = textItems.indexOf(item);
                  const isInCurrentSelection = currentSelection.has(globalIdx);
                  const isInSavedArea = selectionAreas.some(area => area.has(globalIdx));
                  const isSelected = isInCurrentSelection || isInSavedArea;

                  // Use the stored canvas dimensions for accurate positioning
                  const leftPercent = (item.x / item.canvasWidth) * 100;
                  const topPercent = (item.y / item.canvasHeight) * 100;
                  const widthPercent = (item.width / item.canvasWidth) * 100;
                  const heightPercent = (item.height / item.canvasHeight) * 100;

                  const isPageProcessingOCR = pagesProcessingOCR.has(i);

                  const handleTouchStart = (e: React.TouchEvent) => {
                    if (isPageProcessingOCR) return;
                    e.preventDefault();
                    e.stopPropagation();
                    handleStart(globalIdx);
                  };

                  // Different colors for current selection vs saved areas
                  let backgroundColor = 'transparent';
                  if (isInCurrentSelection && isSelecting) {
                    backgroundColor = 'rgba(33, 150, 243, 0.3)'; // Blue for active selection
                  } else if (isInSavedArea) {
                    backgroundColor = 'rgba(255, 235, 59, 0.4)'; // Yellow for saved areas
                  }

                  return (
                    <div
                      key={idx}
                      data-text-index={globalIdx}
                      onMouseDown={() => !isPageProcessingOCR && handleStart(globalIdx)}
                      onMouseEnter={() => !isPageProcessingOCR && handleMove(globalIdx)}
                      onTouchStart={handleTouchStart}
                      style={{
                        position: 'absolute',
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        width: `${widthPercent}%`,
                        height: `${heightPercent}%`,
                        cursor: isPageProcessingOCR ? 'wait' : 'text',
                        background: backgroundColor,
                        transition: isSelecting ? 'background 0.05s ease-out' : 'background 0.15s ease-out',
                        pointerEvents: 'auto',
                        touchAction: 'none',
                        WebkitUserSelect: 'none',
                        userSelect: 'none',
                      }}
                    />
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div className="small" style={{ color: 'var(--muted)', fontSize: 11, textAlign: 'center' }}>
        {numPages}페이지 · 선택된 영역: {selectionAreas.length > 0 ? `${selectionAreas.length}개` : '없음'}
      </div>
    </div>
  );
}
