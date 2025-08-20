import { useEffect, useState } from 'react';

interface UseCountUpOptions {
  start?: number;
  end: number;
  duration?: number;
  delay?: number;
  enabled?: boolean;
}

export const useCountUp = (options: UseCountUpOptions) => {
  const { start = 0, end, duration = 2000, delay = 0, enabled = false } = options;
  const [count, setCount] = useState(start);

  useEffect(() => {
    if (!enabled) return;

    const timer = setTimeout(() => {
      const startTime = Date.now();
      const difference = end - start;

      const updateCount = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentCount = Math.round(start + (difference * easeOutQuart));
        
        setCount(currentCount);

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        }
      };

      requestAnimationFrame(updateCount);
    }, delay);

    return () => clearTimeout(timer);
  }, [start, end, duration, delay, enabled]);

  return count;
};
