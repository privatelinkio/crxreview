/**
 * Debounce utility for performance optimization
 *
 * Delays function execution until after a specified wait time
 * has elapsed since the last invocation.
 */

/**
 * Debounce a function to prevent excessive calls
 *
 * Usage:
 * ```tsx
 * const debouncedSearch = debounce((query: string) => {
 *   performSearch(query);
 * }, 300);
 *
 * // In event handler:
 * debouncedSearch(query);
 * ```
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds (default: 300)
 * @returns Debounced function
 */
export function debounce<T extends (...args: Parameters<T>[]) => void>(
  func: T,
  wait: number = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function to ensure it's called at most once per specified interval
 *
 * Usage:
 * ```tsx
 * const throttledResize = throttle(() => {
 *   handleResize();
 * }, 250);
 *
 * window.addEventListener('resize', throttledResize);
 * ```
 *
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds (default: 300)
 * @returns Throttled function
 */
export function throttle<T extends (...args: Parameters<T>[]) => void>(
  func: T,
  limit: number = 300
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Cancel a debounced function call
 *
 * Usage:
 * ```tsx
 * const debouncedSearch = debounce(search, 300);
 * const cancelSearch = debounceCancel(debouncedSearch);
 *
 * // Later, to cancel pending calls:
 * cancelSearch();
 * ```
 *
 * @param timeoutId - The timeout ID to clear
 */
export function debounceCancel(timeoutId: NodeJS.Timeout): void {
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
}
