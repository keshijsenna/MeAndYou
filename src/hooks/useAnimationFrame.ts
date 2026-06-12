import { useEffect, useRef } from 'react';

export const useAnimationFrame = (
  callback: (frameCount: number) => void,
  isActive: boolean = true
) => {
  const requestRef = useRef<number | undefined>(undefined);
  const frameCountRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      frameCountRef.current += 1;
      callbackRef.current(frameCountRef.current);
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isActive]);

  return { frameCount: frameCountRef.current };
};
