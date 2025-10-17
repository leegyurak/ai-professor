import { useEffect, useMemo, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api';
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
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        setPdf(pdfDoc);
        setNumPages(pdfDoc.numPages);
      } catch (error) {
        console.error('Failed to load PDF:', error);
      }
    };

    loadPdf();
  }, [file]);

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

      // Render pages sequentially to avoid concurrent rendering issues
      for (let i = 1; i <= numPages; i++) {
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

          // Render the page
          const renderTask = page.render({
            canvasContext: context,
            viewport: viewport,
          } as any);

          renderTasksRef.current.push(renderTask);

          await renderTask.promise;

          // Extract text content
          const textContent = await page.getTextContent();
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

              allTextItems.push({
                text: textItem.str,
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
        } catch (error) {
          if ((error as any)?.name !== 'RenderingCancelledException') {
            console.error(`Failed to render page ${i}:`, error);
          }
        }
      }

      if (isMounted) {
        setTextItems(allTextItems);
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

  const handleMouseDown = (index: number) => {
    setIsSelecting(true);
    setSelectionStart(index);

    // If already selected, mark for potential deselection (will be checked on mouseup)
    if (selectedIndices.has(index)) {
      setHasDragged(false); // Only set false if clicking already selected item
      return;
    }

    // Start new selection
    setHasDragged(true);
    setCurrentSelection(new Set([index]));
  };

  const handleMouseEnter = (index: number) => {
    if (isSelecting && selectionStart !== null) {
      setHasDragged(true); // Mark that dragging occurred

      // Get all items in the range
      const itemsInRange = textItems
        .map((item, idx) => ({ item, idx }))
        .filter(({ idx }) => {
          const startItem = textItems[selectionStart];
          const endItem = textItems[index];
          const currentItem = textItems[idx];

          // Same page selection
          if (startItem.pageIndex === endItem.pageIndex) {
            if (currentItem.pageIndex !== startItem.pageIndex) return false;

            // Select items between start and end positions
            const minY = Math.min(startItem.y, endItem.y);
            const maxY = Math.max(startItem.y, endItem.y) + Math.max(startItem.height, endItem.height);
            const minX = Math.min(startItem.x, endItem.x);
            const maxX = Math.max(startItem.x, endItem.x) + Math.max(startItem.width, endItem.width);

            return currentItem.y >= minY - currentItem.height &&
                   currentItem.y <= maxY &&
                   currentItem.x >= minX - 10 &&
                   currentItem.x <= maxX + 10;
          } else {
            // Multi-page selection
            if (currentItem.pageIndex < Math.min(startItem.pageIndex, endItem.pageIndex)) return false;
            if (currentItem.pageIndex > Math.max(startItem.pageIndex, endItem.pageIndex)) return false;
            return true;
          }
        })
        .map(({ idx }) => idx);

      setCurrentSelection(new Set(itemsInRange));
    }
  };

  const handleMouseUp = () => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="small" style={{ color: 'var(--muted)', fontSize: 12 }}>
          드래그하여 여러 영역 선택 가능
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
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsSelecting(false)}
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
                  const isSelected = selectedIndices.has(globalIdx);

                  // Use the stored canvas dimensions for accurate positioning
                  const leftPercent = (item.x / item.canvasWidth) * 100;
                  const topPercent = (item.y / item.canvasHeight) * 100;
                  const widthPercent = (item.width / item.canvasWidth) * 100;
                  const heightPercent = (item.height / item.canvasHeight) * 100;

                  return (
                    <div
                      key={idx}
                      onMouseDown={() => handleMouseDown(globalIdx)}
                      onMouseEnter={() => handleMouseEnter(globalIdx)}
                      style={{
                        position: 'absolute',
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        width: `${widthPercent}%`,
                        height: `${heightPercent}%`,
                        cursor: 'text',
                        background: isSelected ? 'rgba(255, 235, 59, 0.4)' : 'transparent',
                        transition: 'background 0.1s',
                        pointerEvents: 'auto',
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
