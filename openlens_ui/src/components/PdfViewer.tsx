import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs, Outline } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronUp, ChevronDown, ZoomIn, ZoomOut, Loader2, MousePointer2, Sparkles, List, X as CloseIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  file: File | string | null;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  onTextSelect?: (text: string) => void;
  onReady?: (isReady: boolean) => void;
  onTranslateRequest?: (text: string) => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  file,
  initialPage = 1,
  onPageChange,
  onTextSelect,
  onReady,
  onTranslateRequest,
}) => {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState(800);
  const [isLoaded, setIsLoaded] = useState(false);
  const renderedPagesRef = useRef<Set<number>>(new Set());
  const [isCurrentPageReady, setIsCurrentPageReady] = useState(false);
  const hasScrolledToInitial = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [showOutline, setShowOutline] = useState(false);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([initialPage]));

  const pages = React.useMemo(() => {
    if (numPages <= 0) return null;

    const buffer = 3;

    return Array.from(new Array(numPages), (_, index) => {
      const pageNum = index + 1;
      const isNearCurrent = Math.abs(pageNum - pageNumber) <= buffer;
      const hasBeenVisible = visiblePages.has(pageNum);

      if (!isNearCurrent && !hasBeenVisible) {
        return (
          <div
            key={`page_${pageNum}`}
            id={`pdf-page-${pageNum}`}
            className="shadow-2xl bg-app border border-accent/5 flex items-center justify-center"
            style={{ width: containerWidth * scale, height: containerWidth * scale * 1.414 }}
          >
            <div className="text-accent/10 serif text-4xl font-bold">{pageNum}</div>
          </div>
        );
      }

      return (
        <div key={`page_${pageNum}`} id={`pdf-page-${pageNum}`} className="shadow-2xl bg-app transition-opacity duration-300">
          <Page
            pageNumber={pageNum}
            width={containerWidth}
            scale={scale}
            renderAnnotationLayer
            renderTextLayer
            onRenderTextLayerSuccess={() => {
              renderedPagesRef.current.add(pageNum);
            }}
            loading={
              <div className="flex items-center justify-center bg-app" style={{ width: containerWidth * scale, height: containerWidth * scale * 1.414 }}>
                <Loader2 className="w-6 h-6 animate-spin text-accent/20" />
              </div>
            }
          />
        </div>
      );
    });
  }, [numPages, containerWidth, scale, pageNumber, visiblePages]);

  useEffect(() => {
    const checkReady = () => {
      const isReady = renderedPagesRef.current.has(pageNumber);
      setIsCurrentPageReady(isReady);
      onReady?.(isReady);
    };

    checkReady();
    const interval = setInterval(checkReady, 500);
    return () => clearInterval(interval);
  }, [pageNumber, onReady]);

  const updateWidth = useCallback(() => {
    if (containerRef.current) {
      const isMobile = window.innerWidth < 768;
      const padding = isMobile ? 20 : 64;
      setContainerWidth(containerRef.current.clientWidth - padding);
    }
  }, []);

  useEffect(() => {
    updateWidth();
    observerRef.current = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }
    return () => observerRef.current?.disconnect();
  }, [updateWidth]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowDown' || e.key === 'j') {
        if (pageNumber < numPages) scrollToPage(pageNumber + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        if (pageNumber > 1) scrollToPage(pageNumber - 1);
      } else if (e.key === '=' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setScale((value) => Math.min(3, value + 0.1));
      } else if (e.key === '-' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setScale((value) => Math.max(0.2, value - 0.1));
      } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setScale(1.0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNumber, numPages]);

  useEffect(() => {
    const fileKey = typeof file === 'string' ? file : (file as File | null)?.name;
    if (isLoaded && initialPage > 1 && hasScrolledToInitial.current !== fileKey) {
      const timer = setTimeout(() => {
        scrollToPage(initialPage);
        hasScrolledToInitial.current = fileKey || 'unknown';
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, initialPage, file]);

  function onDocumentLoadSuccess({ numPages: loadedNumPages }: { numPages: number }) {
    setNumPages(loadedNumPages);
    setIsLoaded(true);
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      setSelectedText(text);
      onTextSelect?.(text);
      setSelectionCoords({
        x: e.clientX,
        y: e.clientY - 40,
      });
    } else {
      setSelectionCoords(null);
    }
  };

  const scrollToPage = (page: number) => {
    const pageElement = document.getElementById(`pdf-page-${page}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const onOutlineItemClick = ({ pageNumber: nextItemPageNumber }: { pageNumber: number }) => {
    setPageNumber(nextItemPageNumber);
    scrollToPage(nextItemPageNumber);
    setShowOutline(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const children = container.querySelectorAll('[id^="pdf-page-"]');
    let currentInView = 1;
    const newVisiblePages = new Set(visiblePages);

    for (let i = 0; i < children.length; i += 1) {
      const child = children[i] as HTMLElement;
      const rect = child.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      if (rect.top < containerRect.bottom && rect.bottom > containerRect.top) {
        const pageNum = parseInt(child.id.replace('pdf-page-', ''), 10);
        newVisiblePages.add(pageNum);
      }

      if (child.offsetTop <= container.scrollTop + container.clientHeight / 3) {
        currentInView = parseInt(child.id.replace('pdf-page-', ''), 10);
      }
    }

    if (newVisiblePages.size !== visiblePages.size) {
      setVisiblePages(newVisiblePages);
    }

    if (currentInView !== pageNumber) {
      setPageNumber(currentInView);
      onPageChange?.(currentInView);

      const isReady = renderedPagesRef.current.has(currentInView);
      setIsCurrentPageReady(isReady);
      onReady?.(isReady);
    }
  };

  if (!file) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-accent/60 space-y-4">
        <div className="w-16 h-16 rounded-full border-2 border-dashed border-accent/30 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <p className="serif text-xl italic">Waiting for a manuscript...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-app rounded-xl overflow-hidden shadow-inner border border-accent/10 relative">
      <AnimatePresence>
        {showOutline && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOutline(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-40"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 bottom-0 w-72 bg-app shadow-2xl z-50 flex flex-col border-r border-accent/10"
            >
              <div className="p-4 border-b border-accent/10 flex items-center justify-between bg-app">
                <h3 className="serif font-bold text-accent flex items-center">
                  <List className="w-4 h-4 mr-2" />
                  Table of Contents
                </h3>
                <button onClick={() => setShowOutline(false)} className="p-1 hover:bg-accent/10 rounded-full transition-colors">
                  <CloseIcon className="w-4 h-4 text-accent/60" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 outline-container">
                <Document file={file}>
                  <Outline onItemClick={onOutlineItemClick} className="pdf-outline" />
                </Document>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectionCoords && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            style={{
              position: 'fixed',
              left: selectionCoords.x,
              top: selectionCoords.y,
              zIndex: 100,
              transform: 'translateX(-50%)',
            }}
            onClick={() => {
              onTranslateRequest?.(selectedText);
              setSelectionCoords(null);
            }}
            className="bg-accent text-white px-3 py-1.5 rounded-full shadow-xl flex items-center space-x-2 hover:bg-accent/90 transition-all active:scale-[0.98] border border-white/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-bold uppercase tracking-tighter">Translate</span>
          </motion.button>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row items-center justify-between px-4 md:px-6 py-2 md:py-3 bg-card/50 backdrop-blur-sm border-b border-accent/10 z-10 space-y-2 md:space-y-0">
        <div className="flex items-center justify-between w-full md:w-auto space-x-2 md:space-x-4">
          <button onClick={() => setShowOutline(true)} className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-accent" title="Table of Contents">
            <List className="w-5 h-5" />
          </button>
          <div className="flex items-center bg-accent/5 rounded-lg px-3 py-1 border border-accent/10">
            <span className="serif text-lg font-medium">
              Page {pageNumber} <span className="text-accent/40 mx-1">/</span> {numPages}
            </span>
            {isCurrentPageReady && (
              <div className="hidden sm:flex items-center space-x-1 ml-2 pl-2 border-l border-accent/10">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-tighter">Ready</span>
              </div>
            )}
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => scrollToPage(pageNumber - 1)}
              disabled={pageNumber <= 1}
              className="p-1.5 rounded-lg hover:bg-accent/10 disabled:opacity-30 transition-colors"
              title="Previous Page (Up Arrow / K)"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollToPage(pageNumber + 1)}
              disabled={pageNumber >= numPages}
              className="p-1.5 rounded-lg hover:bg-accent/10 disabled:opacity-30 transition-colors"
              title="Next Page (Down Arrow / J)"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center w-full md:w-auto space-x-2">
          <button onClick={() => setScale((value) => Math.max(0.2, value - 0.1))} className="p-1.5 rounded-full hover:bg-accent/10" title="Zoom Out (Ctrl -)">
            <ZoomOut className="w-4 md:w-5 h-4 md:h-5" />
          </button>
          <span className="text-xs md:text-sm font-mono w-10 md:w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((value) => Math.min(3, value + 0.1))} className="p-1.5 rounded-full hover:bg-accent/10" title="Zoom In (Ctrl +)">
            <ZoomIn className="w-4 md:w-5 h-4 md:h-5" />
          </button>
          <div className="w-px h-4 bg-accent/10 mx-1 md:mx-2" />
          <button
            onClick={() => setScale(1.0)}
            className="px-3 py-1 text-xs font-medium bg-accent/5 hover:bg-accent/10 rounded-md border border-accent/10 transition-colors"
            title="Reset Zoom (Ctrl 0)"
          >
            Fit Width
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 md:p-8 flex flex-col items-center space-y-4 md:space-y-8 scroll-smooth bg-app"
        onMouseUp={handleMouseUp}
        onScroll={handleScroll}
      >
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center p-20">
              <Loader2 className="w-10 h-10 animate-spin text-accent" />
            </div>
          }
        >
          {pages}
        </Document>
      </div>

      <div className="px-4 py-2 bg-accent/5 border-t border-accent/10 flex items-center justify-center space-x-2 text-[10px] uppercase tracking-widest text-accent/40 font-bold">
        <MousePointer2 className="w-3 h-3" />
        <span>Select text to translate</span>
      </div>
    </div>
  );
};
