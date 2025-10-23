import { useEffect, useRef } from 'react';
import { trackEvent } from '../utils/analytics';

export function useSectionImpression(sectionName: string) {
  const ref = useRef<HTMLElement | null>(null);
  const hasSent = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasSent.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !hasSent.current) {
          hasSent.current = true;
          trackEvent('section_view', { section: sectionName });
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [sectionName]);

  return ref;
}