function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.revealDelay || 0;
        setTimeout(() => {
          el.classList.add('visible');
        }, Number(delay));
        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0,
    rootMargin: '0px 0px -80px 0px'
  });

  document.querySelectorAll('.reveal:not(.visible), .reveal-fade:not(.visible)').forEach((el) => {
    const parent = el.closest('[data-reveal-container]');
    if (parent && !el.dataset.revealDelay) {
      const children = Array.from(parent.children).filter(c => c.classList.contains('reveal') || c.classList.contains('reveal-fade'));
      const idx = children.indexOf(el);
      el.dataset.revealDelay = String(idx * 150);
    }
    observer.observe(el);
  });

  const navbar = document.querySelector('header');
  if (navbar) {
    if (window.scrollY > 80) navbar.classList.add('scrolled');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }
}

document.addEventListener('DOMContentLoaded', initReveal);
document.addEventListener('astro:page-load', initReveal);
