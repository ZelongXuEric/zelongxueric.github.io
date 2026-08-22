// Small progressive enhancements: theme toggle, nav state, scroll-spy,
// reveal-on-scroll and copy buttons. The page is fully usable without it.

const root = document.documentElement;

// --- Theme ------------------------------------------------------------------
const darkQuery = matchMedia('(prefers-color-scheme: dark)');
const storedTheme = () => {
  try {
    return localStorage.getItem('theme');
  } catch {
    return null;
  }
};
const isDark = () => root.dataset.theme === 'dark';
const toggles = document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]');
const syncToggles = () => {
  for (const btn of toggles) {
    btn.setAttribute('aria-label', isDark() ? 'Switch to light theme' : 'Switch to dark theme');
  }
};
for (const btn of toggles) {
  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* private mode: theme still applies for this page view */
    }
    syncToggles();
  });
}
darkQuery.addEventListener('change', (e) => {
  if (storedTheme()) return; // an explicit choice wins over the OS setting
  root.dataset.theme = e.matches ? 'dark' : 'light';
  syncToggles();
});
syncToggles();

// --- Navigation -------------------------------------------------------------
const nav = document.querySelector('[data-nav]');
if (nav) {
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 12);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });
}

const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')];
const sections = navLinks
  .map((link) => document.getElementById(link.dataset.navLink ?? ''))
  .filter((el): el is HTMLElement => el !== null);
if (sections.length && 'IntersectionObserver' in window) {
  const spy = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of navLinks) {
          if (link.dataset.navLink === entry.target.id) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        }
      }
    },
    { rootMargin: '-40% 0px -55% 0px' },
  );
  sections.forEach((section) => spy.observe(section));
}

// --- Reveal on scroll -------------------------------------------------------
const revealTargets = document.querySelectorAll('[data-reveal]');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealTargets.forEach((el) => el.classList.add('is-visible'));
} else {
  const revealer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        revealer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );
  revealTargets.forEach((el) => revealer.observe(el));
}

// --- Copy buttons -----------------------------------------------------------
// <button data-copy="literal text"> or <button data-copy-target="element-id">
for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-copy], [data-copy-target]')) {
  const label = btn.querySelector<HTMLElement>('[data-copy-label]');
  const original = label?.textContent ?? '';
  btn.addEventListener('click', async () => {
    const target = btn.dataset.copyTarget ? document.getElementById(btn.dataset.copyTarget) : null;
    const text = (target ? target.textContent : btn.dataset.copy) ?? '';
    try {
      await navigator.clipboard.writeText(text.trim());
    } catch {
      return;
    }
    btn.classList.add('is-copied');
    if (label) label.textContent = 'Copied';
    setTimeout(() => {
      btn.classList.remove('is-copied');
      if (label) label.textContent = original;
    }, 1600);
  });
}
