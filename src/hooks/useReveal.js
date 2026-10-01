import { useEffect } from 'react';

// Pass a value that changes on navigation (e.g. the current route) so this
// re-scans the DOM for [data-reveal] elements every time the page changes.
// Without this, elements mounted by client-side navigation after the first
// render are never observed and stay stuck at opacity: 0 forever.
export default function useReveal(routeKey) {
  useEffect(() => {
    let cleanupObserver;

    // Let newly-mounted elements paint before we query for them.
    const raf = requestAnimationFrame(() => {
      const nodes = [...document.querySelectorAll('[data-reveal]:not(.is-visible)')];
      if (!nodes.length) return;

      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) {
        nodes.forEach(node => node.classList.add('is-visible'));
        return;
      }

      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.10, rootMargin: '0px 0px -6% 0px' });

      nodes.forEach((node, index) => {
        node.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 65}ms`);
        observer.observe(node);
      });

      cleanupObserver = () => observer.disconnect();
    });

    return () => {
      cancelAnimationFrame(raf);
      if (cleanupObserver) cleanupObserver();
    };
  }, [routeKey]);
}