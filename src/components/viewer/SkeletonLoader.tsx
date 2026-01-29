/**
 * Skeleton loaders for visual feedback during loading
 *
 * Provides skeleton components that mimic the structure of content
 * being loaded, creating a better perceived performance.
 */

/**
 * Props for SkeletonLoader component
 */
export interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}

/**
 * Generic skeleton loader element
 *
 * Usage:
 * ```tsx
 * <SkeletonLoader width="100%" height="20px" />
 * <SkeletonLoader width="80%" height="16px" className="mt-2" />
 * ```
 */
export function SkeletonLoader({
  width = '100%',
  height = '20px',
  className = '',
  isLoading = true,
  children,
}: SkeletonLoaderProps) {
  if (!isLoading && children) {
    return <>{children}</>;
  }

  if (!isLoading) {
    return null;
  }

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`}
      style={style}
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * File tree skeleton loader
 *
 * Shows a skeleton representation of the file tree structure
 */
export function FileTreeSkeletonLoader() {
  return (
    <div className="p-2 space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-2">
            <SkeletonLoader width="16px" height="16px" />
            <SkeletonLoader width={100 + i * 20} height="16px" />
          </div>
          {i % 3 === 0 && (
            <div className="ml-6 space-y-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <SkeletonLoader width="16px" height="16px" />
                  <SkeletonLoader width={80 + j * 15} height="14px" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Code viewer skeleton loader
 *
 * Shows a skeleton representation of code content
 */
export function CodeViewerSkeletonLoader() {
  // Pre-generate widths to avoid impure function calls during render
  const widths = Array.from({ length: 12 }).map((_, i) => 60 + ((i * 37) % 40) + '%');

  return (
    <div className="p-4 space-y-3">
      {widths.map((width, i) => (
        <div key={i} className="flex gap-2">
          <SkeletonLoader width="40px" height="20px" />
          <SkeletonLoader width={width} height="20px" />
        </div>
      ))}
    </div>
  );
}

/**
 * Toolbar skeleton loader
 *
 * Shows a skeleton representation of toolbar buttons
 */
export function ToolbarSkeletonLoader() {
  return (
    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonLoader key={i} width="80px" height="32px" className="rounded" />
      ))}
    </div>
  );
}
