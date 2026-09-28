// Native disclosures work without JavaScript; clipboard feedback and figure video playback need it.
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
