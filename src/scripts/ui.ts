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
