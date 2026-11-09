import React, { useEffect, useState, type ImgHTMLAttributes } from 'react';

/** Animated image files need a real still source: CSS cannot pause a GIF. */
export function MotionImage({ src, poster, ...props }: ImgHTMLAttributes<HTMLImageElement> & {
  poster: string;
}) {
  const [paused, setPaused] = useState(() => (
    typeof window !== 'undefined' && (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.visibilityState === 'hidden'
    )
  ));
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPaused(media.matches || document.visibilityState === 'hidden');
    update();
    media.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      media.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return <img {...props} src={paused ? poster : src} />;
}
