import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, Maximize2, Minus, Plus } from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { mountContinuousPdf } from './continuousPdf.js';

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function LibraryPdfReader({ item, onClose }) {
  const stageRef = useRef(null);
  const viewerRef = useRef(null);
  const [position, setPosition] = useState({ page: 1, count: 0, scale: 1 });
  const [status, setStatus] = useState('Loading document…');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let viewer;
    const task = getDocument({
      url: item.fileUrl, withCredentials: true,
      cMapUrl: '/pdfjs/cmaps/', cMapPacked: true,
      standardFontDataUrl: '/pdfjs/standard_fonts/', wasmUrl: '/pdfjs/wasm/',
      disableAutoFetch: true, disableStream: true, rangeChunkSize: 256 * 1024
    });
    task.promise.then(async pdf => {
      if (!active) return;
      viewer = await mountContinuousPdf({
        pdf, stage: stageRef.current,
        onState: value => { if (active) setPosition(value); },
        onError: message => { if (active) setError(message); },
        onReady: () => { if (active) setStatus(''); }
      });
      if (active) viewerRef.current = viewer;
      else viewer.destroy();
    }).catch(loadError => {
      if (!active) return;
      console.error(loadError);
      setStatus('');
      setError('The PDF could not be loaded. Download the original file to read it.');
    });
    return () => {
      active = false;
      viewer?.destroy();
      viewerRef.current = null;
      task.destroy();
    };
  }, [item.fileUrl]);

  return (
    <div className="pdf-reader" role="dialog" aria-modal="true" aria-label={`Read ${item.title}`}>
      <div className="reader-toolbar">
        <button className="reader-back" onClick={onClose}><ArrowLeft size={17} /><span>Library</span></button>
        <strong title={item.title}>{item.title}</strong>
        <a className="reader-download" href={item.downloadUrl}><Download size={16} /><span>Download</span></a>
      </div>
      <div className="reader-controls" aria-label="PDF controls">
        <label className="reader-page"><span>Page </span>
          <input aria-label="Page number" type="number" min="1" max={position.count || 1}
            value={position.page} onChange={event => viewerRef.current?.jump(event.target.value)} />
          <b> / {position.count || '—'}</b>
        </label>
        <button onClick={() => viewerRef.current?.setZoom(position.scale - 0.2)} aria-label="Zoom out"><Minus size={17} /></button>
        <span className="reader-zoom">{Math.round(position.scale * 100)}%</span>
        <button onClick={() => viewerRef.current?.setZoom(position.scale + 0.2)} aria-label="Zoom in"><Plus size={17} /></button>
        <button onClick={() => viewerRef.current?.setZoom('fit')} aria-label="Fit page width"><Maximize2 size={16} /><span>Fit width</span></button>
      </div>
      <div className="pdf-stage pdf-continuous-stage" ref={stageRef} />
      {(status || error) && <div className={`reader-status ${error ? 'is-error' : ''}`} role="status">
        <span>{error || status}</span>{error && <a href={item.downloadUrl}>Download PDF</a>}
      </div>}
    </div>
  );
}
