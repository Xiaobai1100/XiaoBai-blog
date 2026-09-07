import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Maximize2, Minus, Plus } from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));

export default function LibraryPdfReader({ item, onClose }) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [pdfDocument, setPdfDocument] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState('fit');
  const [renderedScale, setRenderedScale] = useState(1);
  const [resizeVersion, setResizeVersion] = useState(0);
  const [status, setStatus] = useState('Loading document…');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadingTask = getDocument({
      url: item.fileUrl,
      cMapUrl: '/pdfjs/cmaps/',
      cMapPacked: true,
      standardFontDataUrl: '/pdfjs/standard_fonts/',
      wasmUrl: '/pdfjs/wasm/',
      withCredentials: true
    });
    loadingTask.onProgress = ({ loaded, total }) => {
      if (!active || !total) return;
      setStatus(`Loading document… ${Math.round((loaded / total) * 100)}%`);
    };
    loadingTask.promise.then(documentProxy => {
      if (!active) return;
      setPdfDocument(documentProxy);
      setStatus('Rendering page…');
    }).catch(loadError => {
      if (!active) return;
      console.error(loadError);
      setError('The PDF could not be loaded. You can still download the original file.');
      setStatus('');
    });
    return () => {
      active = false;
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
        const page = await pdfDocument.getPage(pageNumber);
        if (!active) return;
        const baseViewport = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(240, stageRef.current.clientWidth - 32);
        const scale = zoom === 'fit'
          ? clamp(availableWidth / baseViewport.width, 0.35, 2.5)
          : zoom;
        const viewport = page.getViewport({ scale });
        const outputScale = clamp(window.devicePixelRatio || 1, 1, 2);
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
        setStatus('');
        stageRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' });
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
        {(status || error) && <div className={`reader-status ${error ? 'is-error' : ''}`} role="status"><span>{error || status}</span>{error && <a href={item.downloadUrl}>Download PDF</a>}</div>}
      </div>
    </div>
  );
}
