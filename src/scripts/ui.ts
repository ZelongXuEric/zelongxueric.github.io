// Native disclosures work without JavaScript; clipboard feedback, figure videos, and the
// Beyond Research slideshows and photo viewer need it.
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-copy-target]')) {
  button.hidden = false;
  const feedback = button.parentElement?.querySelector<HTMLElement>('[role="status"]');
  const tooltip = button.querySelector<HTMLElement>('.pub__tooltip');
  let timeout: ReturnType<typeof setTimeout>;

  button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copyTarget ?? '');
    if (!target) return;
    clearTimeout(timeout);
    let message = 'Copied';
    try {
      await navigator.clipboard.writeText(target.textContent?.trim() ?? '');
    } catch {
      // Keep the citation selectable when clipboard access is denied.
      target.closest<HTMLElement>('pre')?.focus();
      const range = document.createRange();
      range.selectNodeContents(target);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      message = 'Copy unavailable. Text selected.';
    }
    if (feedback) feedback.textContent = message;
    if (tooltip) tooltip.textContent = message;
    button.setAttribute('aria-label', message);
    timeout = setTimeout(() => {
      if (feedback) feedback.textContent = '';
      if (tooltip) tooltip.textContent = 'Copy BibTeX';
      button.setAttribute('aria-label', 'Copy BibTeX');
    }, 2200);
  });
}

// Figure videos ship with native controls. When motion is allowed, they play silently while
// on screen instead; with reduced motion the controls stay and nothing starts on its own.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const videos = document.querySelectorAll<HTMLVideoElement>('video[data-figure-video]');
if (videos.length && !reduceMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const video = entry.target as HTMLVideoElement;
      if (entry.isIntersecting) video.play().catch(() => { video.controls = true; });
      else video.pause();
    }
  }, { threshold: 0.4 });
  for (const video of videos) {
    video.controls = false;
    observer.observe(video);
  }
}

// Photo viewer for Beyond Research. Without JavaScript, a frame links to its first photo.
const viewer = document.querySelector<HTMLDialogElement>('dialog.lightbox');
const viewerImg = viewer?.querySelector<HTMLImageElement>('.lightbox__img');
const viewerCaption = viewer?.querySelector<HTMLElement>('.lightbox__caption');
let viewerPhotos: HTMLImageElement[] = [];
let viewerAt = 0;

const showInViewer = (index: number) => {
  if (!viewerImg || !viewerCaption) return;
  viewerAt = (index + viewerPhotos.length) % viewerPhotos.length;
  const photo = viewerPhotos[viewerAt];
  viewerImg.src = photo.dataset.full ?? photo.currentSrc;
  viewerImg.alt = photo.alt;
  viewerCaption.textContent = `${photo.alt} ${viewerAt + 1} / ${viewerPhotos.length}`;
};

if (viewer) {
  const steps = viewer.querySelectorAll<HTMLButtonElement>('[data-step]');
  for (const button of steps) button.addEventListener('click', () => showInViewer(viewerAt + Number(button.dataset.step)));
  viewer.querySelector('[data-close]')?.addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (event) => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showInViewer(viewerAt - 1);
    if (event.key === 'ArrowRight') showInViewer(viewerAt + 1);
  });
}

// Each frame cycles through its photos while on screen, pausing under the pointer.
for (const item of document.querySelectorAll<HTMLElement>('[data-slideshow]')) {
  const frame = item.querySelector<HTMLAnchorElement>('[data-gallery]');
  if (!frame) continue;
  const photos = [...frame.querySelectorAll<HTMLImageElement>('img')];
  const dotGroup = item.querySelector<HTMLElement>('.beyond__dots');
  const dots = [...(dotGroup?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
  let at = 0;
  let hovering = false;
  let visible = false;

  const show = (index: number) => {
    photos[at].classList.remove('is-on');
    dots[at]?.removeAttribute('aria-current');
    at = index;
    photos[at].classList.add('is-on');
    dots[at]?.setAttribute('aria-current', 'true');
  };

  if (dotGroup) dotGroup.hidden = false;
  dots.forEach((dot, index) => dot.addEventListener('click', () => show(index)));

  frame.addEventListener('click', (event) => {
    if (!viewer) return;
    event.preventDefault();
    viewerPhotos = photos;
    for (const button of viewer.querySelectorAll<HTMLButtonElement>('[data-step]')) button.hidden = photos.length < 2;
    showInViewer(at);
    viewer.showModal();
  });

  if (photos.length > 1 && !reduceMotion) {
    item.addEventListener('pointerenter', () => { hovering = true; });
    item.addEventListener('pointerleave', () => { hovering = false; });
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(frame);
    window.setTimeout(() => {
      window.setInterval(() => {
        if (visible && !hovering && !document.hidden && !viewer?.open) show((at + 1) % photos.length);
      }, 3500);
    }, Number(item.dataset.delay ?? 0));
  }
}
