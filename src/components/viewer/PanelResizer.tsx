/**
 * Draggable panel resizer component
 *
 * Provides a draggable divider between two panels that updates panel widths
 * in the Zustand store as the user drags.
 */

import { useEffect, useRef, useState } from 'react';

interface PanelResizerProps {
  onResize?: (leftWidth: number) => void;
  minLeftWidth?: number;
  minRightWidth?: number;
}

export function PanelResizer({
  onResize,
  minLeftWidth = 200,
  minRightWidth = 300,
}: PanelResizerProps) {
  const resizerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const resizer = resizerRef.current;
      if (!resizer) return;

      const container = resizer.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newLeftWidth = e.clientX - containerRect.left;

      // Respect minimum widths
      const maxLeftWidth = container.clientWidth - minRightWidth;
      if (newLeftWidth < minLeftWidth || newLeftWidth > maxLeftWidth) {
        return;
      }

      onResize?.(newLeftWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onResize, minLeftWidth, minRightWidth]);

  return (
    <div
      ref={resizerRef}
      onMouseDown={() => setIsDragging(true)}
      className={`
        w-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-500 dark:hover:bg-blue-400 cursor-col-resize
        transition-colors duration-150 flex-shrink-0
        ${isDragging ? 'bg-blue-500 dark:bg-blue-400' : ''}
      `}
      title="Drag to resize panels"
    />
  );
}
