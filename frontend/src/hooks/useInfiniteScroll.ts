import { useEffect, useRef } from 'react';

/** Renvoie une ref à placer sur une sentinelle en bas de liste ; appelle onReachEnd quand visible. */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>(
  onReachEnd: () => void,
  enabled = true,
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) onReachEnd();
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [onReachEnd, enabled]);
  return ref;
}
