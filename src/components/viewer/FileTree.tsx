/**
 * File tree component with folder expand/collapse
 *
 * Recursively renders a hierarchical file structure with expand/collapse
 * functionality for directories. Integrates with Zustand store for selection.
 */

import { useState } from 'react';
import type { FileTreeNode } from '@/lib/zip/file-tree';
import { useViewerStore } from '@/store/viewerStore';
import { getFileCategory } from '@/lib/code/language-detector';

interface FileTreeProps {
  node: FileTreeNode;
  level?: number;
}

interface FileTreeItemProps {
  node: FileTreeNode;
  level: number;
  onSelect: (path: string) => void;
  isSelected: boolean;
}

function getFileIcon(node: FileTreeNode): string {
  if (node.isDirectory) return '📁';

  const category = getFileCategory(node.path);
  switch (category) {
    case 'code':
      return '{}';
    case 'image':
      return '🖼️';
    case 'markup':
      return '🏷️';
    case 'data':
      return '📄';
    case 'document':
      return '📝';
    default:
      return '📄';
  }
}

function FileTreeItem({
  node,
  level,
  onSelect,
  isSelected,
}: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    if (node.isDirectory) {
      setIsExpanded(!isExpanded);
    } else {
      onSelect(node.path);
    }
  };

  const paddingLeft = `${level * 16}px`;

  return (
    <div>
      <div
        onClick={handleClick}
        className={`
          px-2 py-1.5 cursor-pointer flex items-center gap-2
          transition-colors duration-150
          ${isSelected && !node.isDirectory
            ? 'bg-blue-500 text-white'
            : 'hover:bg-gray-100'
          }
        `}
        style={{ paddingLeft }}
      >
        {node.isDirectory && (
          <span className="w-4 text-center">
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        {!node.isDirectory && <span className="w-4" />}

        <span className="text-lg leading-none">{getFileIcon(node)}</span>
        <span className="flex-1 text-sm truncate">{node.name}</span>
      </div>

      {node.isDirectory && isExpanded && (
        <div>
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              isSelected={isSelected && child.path === node.path}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ node, level = 0 }: FileTreeProps) {
  const selectedFilePath = useViewerStore((state) => state.selectedFilePath);
  const selectFile = useViewerStore((state) => state.selectFile);

  return (
    <div className="overflow-y-auto bg-white border-r border-gray-200">
      <div className="p-2">
        {node.children.map((child) => (
          <FileTreeItem
            key={child.path}
            node={child}
            level={level}
            onSelect={selectFile}
            isSelected={selectedFilePath === child.path}
          />
        ))}
      </div>
    </div>
  );
}
