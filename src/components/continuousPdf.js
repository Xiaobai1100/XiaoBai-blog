// Continuous PDF pages with lazy canvases and bounded mobile memory.
export async function mountContinuousPdf({ pdf, stage, onState, onError, onReady }) {
  let destroyed = false;
  let generation = 0;
  let zoom = 'fit';
  let scale = 1;
  let currentPage = 1;
  let busy = false;
  let frame = 0;
  let resizeTimer;
  const first = await pdf.getPage(1);
  const base = first.getViewport({ scale: 1 });
  const host = document.createElement('div');
  host.className = 'pdf-continuous-pages';
  stage.append(host);
  const entries = Array.from({ length: pdf.numPages }, (_, index) => {
    const element = document.createElement('div');
    element.className = 'pdf-scroll-page';
    element.dataset.page = String(index + 1);
    element.setAttribute('aria-label', `Page ${index + 1}`);
    host.append(element);
    return { number: index + 1, element, nearby: false, canvas: null, task: null, rendered: false };
  });
  const publish = () => onState({ page: currentPage, count: pdf.numPages, scale });
  const release = entry => {
    entry.task?.cancel();
    entry.task = null;
    if (entry.canvas) {
      entry.canvas.width = 0;
      entry.canvas.height = 0;
      entry.canvas.remove();
    }
    entry.canvas = null;
    entry.rendered = false;
  };
  const pump = async () => {
    if (busy || destroyed) return;
    busy = true;
    while (!destroyed) {
      const entry = entries.filter(e => e.nearby && !e.rendered)
        .sort((a, b) => Math.abs(a.number - currentPage) - Math.abs(b.number - currentPage))[0];
      if (!entry) break;
      const version = generation;
      entry.rendered = true;
      try {
        const page = await pdf.getPage(entry.number);
        if (destroyed || version !== generation || !entry.nearby) continue;
        const viewport = page.getViewport({ scale });
        entry.element.style.width = `${viewport.width}px`;
        entry.element.style.height = `${viewport.height}px`;
        const canvas = document.createElement('canvas');
        const ratio = Math.min(window.devicePixelRatio || 1, stage.clientWidth < 600 ? 1.5 : 2);
        canvas.width = Math.ceil(viewport.width * ratio);
        canvas.height = Math.ceil(viewport.height * ratio);
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        entry.canvas = canvas;
        entry.element.append(canvas);
        entry.task = page.render({
          canvas, canvasContext: canvas.getContext('2d', { alpha: false }), viewport,
          transform: [ratio, 0, 0, ratio, 0, 0]
        });
        await entry.task.promise;
        if (!destroyed && version === generation) onReady?.();
      } catch (error) {
        if (!destroyed && version === generation && error.name !== 'RenderingCancelledException') {
          entry.element.dataset.error = 'Unable to render this page';
          onError?.('A page could not be rendered. Download the PDF to view the original.');
        }
      }
    }
    busy = false;
  };
  const observer = new IntersectionObserver(records => {
    for (const record of records) {
      const entry = entries[Number(record.target.dataset.page) - 1];
      entry.nearby = record.isIntersecting;
      if (!entry.nearby) release(entry);
    }
    pump();
  }, { root: stage, rootMargin: '900px 0px' });
  const jump = number => {
    currentPage = Math.max(1, Math.min(pdf.numPages, Math.round(Number(number) || 1)));
    stage.scrollTop = entries[currentPage - 1].element.offsetTop - host.offsetTop;
    publish();
  };
  const layout = () => {
    generation++;
    scale = zoom === 'fit'
      ? Math.max(0.2, Math.min(2.5, (stage.clientWidth - 32) / base.width))
      : zoom;
    for (const entry of entries) {
      release(entry);
      entry.element.style.width = `${base.width * scale}px`;
      entry.element.style.height = `${base.height * scale}px`;
      observer.unobserve(entry.element);
      observer.observe(entry.element);
    }
    jump(currentPage);
    publish();
  };
  const onScroll = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const y = stage.scrollTop + 32;
      let nearest = entries[0];
      for (const entry of entries) {
        if (entry.element.offsetTop - host.offsetTop > y) break;
        nearest = entry;
      }
      if (nearest.number !== currentPage) {
        currentPage = nearest.number;
        publish();
      }
    });
  };
  stage.addEventListener('scroll', onScroll, { passive: true });
  let previousWidth = stage.clientWidth;
  const resize = new ResizeObserver(() => {
    if (previousWidth === stage.clientWidth) return;
    previousWidth = stage.clientWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 120);
  });
  resize.observe(stage);
  layout();
  return {
    jump,
    setZoom(value) {
      zoom = value === 'fit' ? value : Math.max(0.2, Math.min(3, value));
      layout();
    },
    destroy() {
      destroyed = true;
      generation++;
      observer.disconnect();
      resize.disconnect();
      clearTimeout(resizeTimer);
      cancelAnimationFrame(frame);
      stage.removeEventListener('scroll', onScroll);
      entries.forEach(release);
      host.remove();
    }
  };
}
