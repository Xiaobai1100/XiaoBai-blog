import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Maximize2, Minus, Plus } from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
const RANGE_CHUNK_SIZE = 256 * 1024;
const PAGE_BATCH_SIZE = 10;

const waitForIdle = () => new Promise(resolve => {
  if (window.requestIdleCallback) window.requestIdleCallback(resolve, { timeout: 450 });
  else window.setTimeout(resolve, 40);
});

export default function LibraryPdfReader({ item, onClose }) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const loadSettledRef = useRef(false);
  const pageCacheRef = useRef(new Map());
  const prefetchedPagesRef = useRef(new Set());
  const prefetchGenerationRef = useRef(0);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState('fit');
  const [renderedScale, setRenderedScale] = useState(1);
  const [resizeVersion, setResizeVersion] = useState(0);
  const [status, setStatus] = useState('Loading document…');
  const [error, setError] = useState('');
  const [hasRenderedPage, setHasRenderedPage] = useState(false);

  useEffect(() => {
    let active = true;
    loadSettledRef.current = false;
    pageCacheRef.current.clear();
    prefetchedPagesRef.current.clear();
    prefetchGenerationRef.current += 1;
    const loadingTask = getDocument({
      url: item.fileUrl,
      cMapUrl: '/pdfjs/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/pdfjs/standard_fonts/',
      wasmUrl: '/pdfjs/wasm/',
      withCredentials: true,
      disableAutoFetch: true,
      disableStream: true,
      rangeChunkSize: RANGE_CHUNK_SIZE
    });
    loadingTask.onProgress = ({ loaded, total }) => {
      if (!active || loadSettledRef.current || !total) return;
      setStatus(`Loading document… ${Math.round((loaded / total) * 100)}%`);
    };
    loadingTask.promise.then(documentProxy => {
      if (!active) return;
      loadSettledRef.current = true;
      setPdfDocument(documentProxy);
      setStatus('Rendering page…');
    }).catch(loadError => {
      if (!active) return;
      loadSettledRef.current = true;
      console.error(loadError);
      setError('The PDF could not be loaded. You can still download the original file.');
      setStatus('');
    });
    return () => {
      active = false;
      loadSettledRef.current = true;
      prefetchGenerationRef.current += 1;
      renderTaskRef.current?.cancel();
      loadingTask.destroy();
    };
  }, [item.fileUrl]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !window.ResizeObserver) return undefined;
    const observer = new ResizeObserver(() => setResizeVersion(version => version + 1));
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current || !stageRef.current) return undefined;
    let active = true;
    const render = async () => {
      try {
        await Promise.resolve();
        if (!active) return;
        setError('');
        setStatus(`Rendering page ${pageNumber}…`);
        renderTaskRef.current?.cancel();
        let pagePromise = pageCacheRef.current.get(pageNumber);
        if (!pagePromise) {
          pagePromise = pdfDocument.getPage(pageNumber);
          pageCacheRef.current.set(pageNumber, pagePromise);
        }
        const page = await pagePromise;
        if (!active) return;
        const baseViewport = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(240, stageRef.current.clientWidth - 32);
        const scale = zoom === 'fit'
          ? clamp(availableWidth / baseViewport.width, 0.35, 2.5)
          : zoom;
        const viewport = page.getViewport({ scale });
        const maximumOutputScale = stageRef.current.clientWidth < 600 ? 1.5 : 2;
        const outputScale = clamp(window.devicePixelRatio || 1, 1, maximumOutputScale);
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { alpha: false });
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;
        const renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0]
        });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (!active) return;
        setRenderedScale(scale);
        setHasRenderedPage(true);
        setStatus('');
        stageRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        const generation = ++prefetchGenerationRef.current;
        const batchStart = Math.floor((pageNumber - 1) / PAGE_BATCH_SIZE) * PAGE_BATCH_SIZE + 1;
        const batchEnd = Math.min(pdfDocument.numPages, batchStart + PAGE_BATCH_SIZE - 1);
        const candidates = [];
        for (let number = pageNumber + 1; number <= batchEnd; number += 1) candidates.push(number);
        for (let number = pageNumber - 1; number >= batchStart; number -= 1) candidates.push(number);
        for (const number of candidates) {
          if (!active || generation !== prefetchGenerationRef.current) break;
          if (prefetchedPagesRef.current.has(number)) continue;
          await waitForIdle();
          if (!active || generation !== prefetchGenerationRef.current) break;
          try {
            let candidatePromise = pageCacheRef.current.get(number);
            if (!candidatePromise) {
              candidatePromise = pdfDocument.getPage(number);
              pageCacheRef.current.set(number, candidatePromise);
            }
            const candidate = await candidatePromise;
            await candidate.getOperatorList();
            prefetchedPagesRef.current.add(number);
          } catch {
            pageCacheRef.current.delete(number);
          }
        }
      } catch (renderError) {
        if (!active || renderError?.name === 'RenderingCancelledException') return;
        console.error(renderError);
        setError('This page could not be rendered. Try another page or download the file.');
        setStatus('');
      }
    };
    render();
    return () => {
      active = false;
      prefetchGenerationRef.current += 1;
      renderTaskRef.current?.cancel();
    };
  }, [pageNumber, pdfDocument, resizeVersion, zoom]);

  const pageCount = pdfDocument?.numPages || 0;
  const changePage = nextPage => setPageNumber(clamp(Number(nextPage) || 1, 1, pageCount || 1));
  const changeZoom = delta => setZoom(current => clamp((typeof current === 'number' ? current : renderedScale) + delta, 0.35, 3));

  return (
    <div className="pdf-reader" role="dialog" aria-modal="true" aria-label={`Read ${item.title}`}>
      <div className="reader-toolbar">
        <button className="reader-back" onClick={onClose}><ArrowLeft size={17} /> <span>Library</span></button>
        <strong title={item.title}>{item.title}</strong>
        <a className="reader-download" href={item.downloadUrl}><Download size={16} /> <span>Download</span></a>
      </div>
      <div className="reader-controls" aria-label="PDF controls">
        <button onClick={() => changePage(pageNumber - 1)} disabled={pageNumber <= 1} aria-label="Previous page"><ChevronLeft size={17} /><span>Previous</span></button>
        <label className="reader-page"><span>Page</span><input type="number" min="1" max={pageCount || 1} value={pageNumber} onChange={event => changePage(event.target.value)} /> <b>/ {pageCount || '—'}</b></label>
        <button onClick={() => changePage(pageNumber + 1)} disabled={!pageCount || pageNumber >= pageCount} aria-label="Next page"><span>Next</span><ChevronRight size={17} /></button>
        <i aria-hidden="true" />
        <button onClick={() => changeZoom(-0.2)} aria-label="Zoom out"><Minus size={17} /></button>
        <span className="reader-zoom">{Math.round(renderedScale * 100)}%</span>
        <button onClick={() => changeZoom(0.2)} aria-label="Zoom in"><Plus size={17} /></button>
        <button onClick={() => setZoom('fit')} aria-label="Fit page width"><Maximize2 size={16} /><span>Fit width</span></button>
      </div>
      <div className="pdf-stage" ref={stageRef}>
        <div className="pdf-canvas-sheet"><canvas ref={canvasRef} aria-label={`Page ${pageNumber}`} /></div>
        {(status || error) && <div className={`reader-status ${error ? 'is-error' : hasRenderedPage ? 'is-passive' : ''}`} role="status"><span>{error || status}</span>{error && <a href={item.downloadUrl}>Download PDF</a>}</div>}
      </div>
    </div>
  );
}
