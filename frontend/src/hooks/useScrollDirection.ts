import { useEffect, useState } from 'react';

export function useScrollDirection(): 'up' | 'down' {
  const [dir, setDir] = useState<'up' | 'down'>('up');

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setDir(y > last && y > 40 ? 'down' : 'up');
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return dir;
}
