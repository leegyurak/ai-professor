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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const autoScrollRef = useRef<number | null>(null);
  const dragThreshold = 5; // pixels to consider as drag vs click
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

  // Clear selection and text boxes when file changes
  useEffect(() => {
    setSelectionAreas([]);
    setCurrentSelection(new Set());
    setIsSelecting(false);
    setSelectionStart(null);
    setHasDragged(false);
    setDragStartPos(null);
    setHoveredIndex(null);

    // Clear auto-scroll
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  }, [file]);

  // Clear selections when selectedAreas becomes empty
  useEffect(() => {
    if (selectedAreas && selectedAreas.length === 0) {
      setSelectionAreas([]);
      setCurrentSelection(new Set());
    }
  }, [selectedAreas]);

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
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
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

  const handleStart = (index: number, clientX?: number, clientY?: number) => {
    setIsSelecting(true);
    setSelectionStart(index);
    setHasDragged(false);

    // Store drag start position for threshold detection
    if (clientX !== undefined && clientY !== undefined) {
      setDragStartPos({ x: clientX, y: clientY });
    }

    console.log('[PDF Viewer] handleStart:', {
      index,
      text: textItems[index]?.text,
      isAlreadySelected: selectedIndices.has(index)
    });

    // Always start new selection - let handleEnd decide what to do with existing selections
    setCurrentSelection(new Set([index]));
  };

  const handleMove = (index: number, clientX?: number, clientY?: number) => {
    if (isSelecting && selectionStart !== null) {
      // Check for drag conditions - only when we have valid text indices
      if (!hasDragged && textItems[selectionStart] && textItems[index]) {
        // If moving to a different index, it's considered a drag
        if (index !== selectionStart) {
          setHasDragged(true);
          console.log('[PDF Viewer] Drag detected by text index change:', selectionStart, '->', index);
        }
        // Additional threshold check for fine-grained control
        else if (dragStartPos && clientX !== undefined && clientY !== undefined) {
          const distance = Math.sqrt(
            Math.pow(clientX - dragStartPos.x, 2) + Math.pow(clientY - dragStartPos.y, 2)
          );
          if (distance >= dragThreshold) {
            setHasDragged(true);
            console.log('[PDF Viewer] Drag detected by pixel threshold:', distance, 'pixels');
          }
        }
      }

      const startItem = textItems[selectionStart];
      const endItem = textItems[index];

      console.log('[PDF Viewer] handleMove:', {
        startIndex: selectionStart,
        endIndex: index,
        startItem: { text: startItem.text, x: startItem.x, y: startItem.y },
        endItem: { text: endItem.text, x: endItem.x, y: endItem.y },
        sameLine: Math.abs(startItem.y - endItem.y) < 15
      });

      // Improved selection algorithm for more natural text flow
      const itemsInRange = textItems
        .map((item, idx) => ({ item, idx }))
        .filter(({ idx }) => {
          const currentItem = textItems[idx];

          // Same page selection
          if (startItem.pageIndex === endItem.pageIndex) {
            if (currentItem.pageIndex !== startItem.pageIndex) return false;

            // Check if start and end are on the same line (simplified)
            const startEndSameLine = Math.abs(startItem.y - endItem.y) < 15;

            if (startEndSameLine) {
              // Single line selection - much simpler logic
              const currentSameLine = Math.abs(currentItem.y - startItem.y) < 15;
              if (!currentSameLine) return false;

              // On same line, select everything between start and end X coordinates
              const leftX = Math.min(startItem.x, endItem.x);
              const rightX = Math.max(startItem.x + startItem.width, endItem.x + endItem.width);

              // Current item should overlap with the selection range
              const currentRight = currentItem.x + currentItem.width;
              const included = (currentItem.x <= rightX + 5) && (currentRight >= leftX - 5);

              if (idx <= 10) { // Log first few items for debugging
                console.log(`[Single Line] Item ${idx}: "${currentItem.text}" x:${currentItem.x}-${currentRight} y:${currentItem.y} | Range x:${leftX}-${rightX} | Included: ${included}`);
              }

              return included;
            } else {
              // Multi-line selection on same page
              // Determine reading order direction
              const isReversed = startItem.y > endItem.y ||
                (Math.abs(startItem.y - endItem.y) < 10 && startItem.x > endItem.x);

              const topItem = isReversed ? endItem : startItem;
              const bottomItem = isReversed ? startItem : endItem;

              const topY = topItem.y;
              const bottomY = bottomItem.y + bottomItem.height;

              // Item on first line of selection
              if (Math.abs(currentItem.y - topItem.y) < 15) {
                return currentItem.x >= topItem.x - 5;
              }
              // Item on last line of selection
              else if (Math.abs(currentItem.y - bottomItem.y) < 15) {
                return currentItem.x + currentItem.width <= bottomItem.x + bottomItem.width + 5;
              }
              // Item on middle lines
              else if (currentItem.y > topY + 5 && currentItem.y < bottomY - 5) {
                return true;
              }

              return false;
            }
          } else {
            // Multi-page selection with improved logic
            const minPage = Math.min(startItem.pageIndex, endItem.pageIndex);
            const maxPage = Math.max(startItem.pageIndex, endItem.pageIndex);

            if (currentItem.pageIndex < minPage || currentItem.pageIndex > maxPage) {
              return false;
            }

            // On start page, select from start position to end of page
            if (currentItem.pageIndex === startItem.pageIndex && startItem.pageIndex !== endItem.pageIndex) {
              return currentItem.y > startItem.y ||
                (Math.abs(currentItem.y - startItem.y) < 10 && currentItem.x >= startItem.x);
            }

            // On end page, select from start of page to end position
            if (currentItem.pageIndex === endItem.pageIndex && startItem.pageIndex !== endItem.pageIndex) {
              return currentItem.y < endItem.y + endItem.height ||
                (Math.abs(currentItem.y - endItem.y) < 10 && currentItem.x <= endItem.x + endItem.width);
            }

            // On middle pages, select everything
            return true;
          }
        })
        .map(({ idx }) => idx);

      console.log('[PDF Viewer] Selection result:', {
        itemsInRange: itemsInRange.length,
        selectedTexts: itemsInRange.slice(0, 5).map(idx => textItems[idx].text)
      });

      setCurrentSelection(new Set(itemsInRange));
    }
  };

  const handleEnd = () => {
    const clickedIndex = selectionStart;

    // Clear auto-scroll
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }

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

    console.log('[PDF Viewer] handleEnd:', {
      hasDragged,
      currentSelectionSize: currentSelection.size,
      clickedIndex,
      isClickedIndexSelected: clickedIndex !== null ? selectedIndices.has(clickedIndex) : false,
      currentSelectionContent: Array.from(currentSelection).slice(0, 3).map(idx => textItems[idx]?.text || 'undefined'),
      hasValidTextIndex: clickedIndex !== null && textItems[clickedIndex] !== undefined
    });

    // If we don't have a valid starting text index, cancel the selection
    if (clickedIndex !== null && !textItems[clickedIndex]) {
      console.log('[PDF Viewer] No valid text index, canceling selection');
      setIsSelecting(false);
      setSelectionStart(null);
      setHasDragged(false);
      setDragStartPos(null);
      setHoveredIndex(null);
      setCurrentSelection(new Set());
      return;
    }

    // Determine if this was a simple click or a drag
    const wasSimpleClick = !hasDragged && currentSelection.size <= 1;
    const wasOnExistingSelection = clickedIndex !== null && selectedIndices.has(clickedIndex);

    console.log('[PDF Viewer] Action analysis:', {
      wasSimpleClick,
      wasOnExistingSelection,
      willRemoveSelection: wasSimpleClick && wasOnExistingSelection,
      willAddSelection: !(wasSimpleClick && wasOnExistingSelection) && currentSelection.size > 0
    });

    if (wasSimpleClick && wasOnExistingSelection) {
      console.log('[PDF Viewer] Removing selected area - simple click on existing selection');
      // Find and remove the area containing this index
      const newAreas = selectionAreas.filter(area => !area.has(clickedIndex));
      setSelectionAreas(newAreas);

      // Convert all areas to text array and notify parent
      const areasText = newAreas.map(area => indicesToText(area)).filter(t => t);
      onAreasSelect(areasText);
    } else if (currentSelection.size > 0) {
      // Any selection with content - add current selection as a new area
      console.log('[PDF Viewer] Adding new selection area:', currentSelection.size, 'items',
        'hasDragged:', hasDragged, 'content:', Array.from(currentSelection).slice(0, 3).map(idx => textItems[idx]?.text));
      const newAreas = [...selectionAreas, currentSelection];
      setSelectionAreas(newAreas);
      setCurrentSelection(new Set());

      // Convert all areas to text array and notify parent
      const areasText = newAreas.map(area => indicesToText(area)).filter(t => t);
      console.log('[PDF Viewer] Notifying parent with areas:', areasText.length);
      onAreasSelect(areasText);
    } else {
      console.log('[PDF Viewer] No action taken - no current selection');
    }

    // Reset all selection state
    setIsSelecting(false);
    setSelectionStart(null);
    setHasDragged(false);
    setDragStartPos(null);
    setHoveredIndex(null);
  };

  const clearSelection = () => {
    setSelectionAreas([]);
    setCurrentSelection(new Set());
    onAreasSelect([]);
  };

  // Smooth auto-scroll function
  const autoScroll = (container: HTMLElement, direction: 'up' | 'down') => {
    const scrollSpeed = 8;
    const maxScroll = direction === 'up' ? 0 : container.scrollHeight - container.clientHeight;

    const scroll = () => {
      if (direction === 'up') {
        container.scrollTop = Math.max(maxScroll, container.scrollTop - scrollSpeed);
      } else {
        container.scrollTop = Math.min(maxScroll, container.scrollTop + scrollSpeed);
      }

      // Continue scrolling if we haven't reached the edge and still selecting
      if (isSelecting &&
          ((direction === 'up' && container.scrollTop > maxScroll) ||
           (direction === 'down' && container.scrollTop < maxScroll))) {
        autoScrollRef.current = requestAnimationFrame(scroll);
      }
    };

    autoScrollRef.current = requestAnimationFrame(scroll);
  };

  // Handle touch move at container level for better drag support
  const handleContainerTouchMove = (e: React.TouchEvent) => {
    if (!isSelecting) return;

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element && element.hasAttribute('data-text-index')) {
      const idx = parseInt(element.getAttribute('data-text-index')!, 10);
      if (!isNaN(idx)) {
        handleMove(idx, touch.clientX, touch.clientY);
      }
    }

    // Improved auto-scroll when dragging near edges
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const threshold = 60; // pixels from edge to trigger scroll

      // Clear existing auto-scroll
      if (autoScrollRef.current) {
        cancelAnimationFrame(autoScrollRef.current);
        autoScrollRef.current = null;
      }

      if (touch.clientY - rect.top < threshold) {
        // Near top
        autoScroll(container, 'up');
      } else if (rect.bottom - touch.clientY < threshold) {
        // Near bottom
        autoScroll(container, 'down');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <div className="small" style={{ color: 'var(--muted)', fontSize: 12 }}>
          {isProcessingOCR
            ? `OCR 처리 중... (${ocrProgress.current}/${ocrProgress.total} 페이지)`
            : '드래그로 텍스트 선택'}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
          cursor: isSelecting ? 'grabbing' : 'default',
          userSelect: 'none',
        }}
        onMouseUp={handleEnd}
        onMouseLeave={() => {
          setIsSelecting(false);
          setHoveredIndex(null);
          if (autoScrollRef.current) {
            cancelAnimationFrame(autoScrollRef.current);
            autoScrollRef.current = null;
          }
        }}
        onMouseMove={(e) => {
          // Only handle text selection if we're actively selecting
          if (!isSelecting || selectionStart === null) return;

          // Find text element under mouse cursor
          const element = document.elementFromPoint(e.clientX, e.clientY);
          if (element && element.hasAttribute('data-text-index')) {
            const idx = parseInt(element.getAttribute('data-text-index')!, 10);
            if (!isNaN(idx)) {
              handleMove(idx, e.clientX, e.clientY);
            }
          }

          // Improved auto-scroll when dragging near edges with mouse
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const threshold = 60;

            // Clear existing auto-scroll
            if (autoScrollRef.current) {
              cancelAnimationFrame(autoScrollRef.current);
              autoScrollRef.current = null;
            }

            if (e.clientY - rect.top < threshold) {
              autoScroll(container, 'up');
            } else if (rect.bottom - e.clientY < threshold) {
              autoScroll(container, 'down');
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

                  // Use the stored canvas dimensions for accurate positioning
                  const leftPercent = (item.x / item.canvasWidth) * 100;
                  const topPercent = (item.y / item.canvasHeight) * 100;
                  const widthPercent = (item.width / item.canvasWidth) * 100;
                  const heightPercent = (item.height / item.canvasHeight) * 100;

                  const isPageProcessingOCR = pagesProcessingOCR.has(i);

                  const handleMouseDown = (e: React.MouseEvent) => {
                    if (isPageProcessingOCR) return;
                    e.preventDefault();
                    handleStart(globalIdx, e.clientX, e.clientY);
                  };

                  const handleMouseEnter = () => {
                    if (!isPageProcessingOCR) {
                      setHoveredIndex(globalIdx);
                      if (isSelecting) {
                        handleMove(globalIdx);
                      }
                    }
                  };

                  const handleMouseLeave = () => {
                    if (hoveredIndex === globalIdx) {
                      setHoveredIndex(null);
                    }
                  };

                  const handleTouchStart = (e: React.TouchEvent) => {
                    if (isPageProcessingOCR) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const touch = e.touches[0];
                    handleStart(globalIdx, touch.clientX, touch.clientY);
                  };

                  // Enhanced visual feedback with hover effects
                  const isHovered = hoveredIndex === globalIdx;
                  let backgroundColor = 'transparent';

                  if (isInCurrentSelection && isSelecting) {
                    backgroundColor = 'rgba(33, 150, 243, 0.4)'; // Blue for active selection
                  } else if (isInSavedArea) {
                    backgroundColor = 'rgba(255, 235, 59, 0.4)'; // Yellow for saved areas
                  } else if (isHovered && !isSelecting) {
                    backgroundColor = 'rgba(158, 158, 158, 0.2)'; // Light gray hover
                  }

                  // Enhanced cursor states
                  let cursor = 'text';
                  if (isPageProcessingOCR) {
                    cursor = 'wait';
                  } else if (isSelecting) {
                    cursor = 'grabbing';
                  } else if (isInSavedArea) {
                    cursor = 'pointer';
                  }

                  return (
                    <div
                      key={idx}
                      data-text-index={globalIdx}
                      onMouseDown={handleMouseDown}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                      onTouchStart={handleTouchStart}
                      style={{
                        position: 'absolute',
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        width: `${widthPercent}%`,
                        height: `${heightPercent}%`,
                        cursor,
                        background: backgroundColor,
                        transition: isSelecting
                          ? 'background 0.05s ease-out, transform 0.05s ease-out'
                          : 'background 0.2s ease-out, transform 0.1s ease-out',
                        pointerEvents: 'auto',
                        touchAction: 'none',
                        WebkitUserSelect: 'none',
                        userSelect: 'none',
                        borderRadius: '2px',
                        transform: isHovered && !isSelecting ? 'scale(1.02)' : 'scale(1)',
                        zIndex: isInCurrentSelection || isInSavedArea || isHovered ? 10 : 1,
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
