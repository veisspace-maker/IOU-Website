import { useRef, useEffect } from 'react';

/**
 * Custom hook to preserve scroll position across re-renders
 * Useful when data refreshes but you want to stay at the same scroll position
 */
export const useScrollPreservation = (dependencies: any[] = []) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);

  // Save scroll position before dependencies change
  useEffect(() => {
    if (scrollContainerRef.current && !isLoadingRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
    isLoadingRef.current = true;
  }, dependencies);

  // Restore scroll position after render
  useEffect(() => {
    if (scrollContainerRef.current && scrollPositionRef.current > 0) {
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollPositionRef.current;
        }
      });
    }
    isLoadingRef.current = false;
  });

  return scrollContainerRef;
};
