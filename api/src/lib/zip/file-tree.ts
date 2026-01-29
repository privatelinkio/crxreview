/**
 * Generate hierarchical file tree from ZIP entries
 */

import type { ZipFileEntry } from './extractor';

export interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  compressedSize: number;
  date: Date;
  children: FileTreeNode[];
}

/**
 * Build a hierarchical file tree from flat ZIP entry list
 *
 * Takes a flat list of ZIP entries and organizes them into a tree structure,
 * creating directory nodes as needed. Sorts children alphabetically with
 * directories appearing before files.
 *
 * @param entries - Array of ZIP file entries
 * @returns Root node of the file tree
 */
export function buildFileTree(entries: ZipFileEntry[]): FileTreeNode {
  const root: FileTreeNode = {
    name: 'root',
    path: '',
    isDirectory: true,
    size: 0,
    compressedSize: 0,
    date: new Date(),
    children: [],
  };

  // Create a map of all nodes for quick lookup
  const nodeMap = new Map<string, FileTreeNode>();
  nodeMap.set('', root);

  // First pass: create all nodes
  for (const entry of entries) {
    // Skip root entries that are just directory markers
    if (!entry.name || entry.name === '') {
      continue;
    }

    const parts = entry.name.split('/').filter((p) => p.length > 0);

    // Build path for each part
    let currentPath = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const previousPath = currentPath;
      currentPath = previousPath ? `${previousPath}/${part}` : part;
      const isLast = i === parts.length - 1;
      const isDirectory = entry.dir || !isLast;

      if (!nodeMap.has(currentPath)) {
        const node: FileTreeNode = {
          name: part,
          path: currentPath,
          isDirectory,
          size: isDirectory ? 0 : entry.size,
          compressedSize: isDirectory ? 0 : entry.compressedSize,
          date: entry.date,
          children: [],
        };
        nodeMap.set(currentPath, node);

        // Add to parent's children
        const parentPath = previousPath || '';
        const parent = nodeMap.get(parentPath);
        if (parent) {
          parent.children.push(node);
        }
      } else if (isLast && !entry.dir) {
        // Update existing node with actual file data
        const node = nodeMap.get(currentPath);
        if (node) {
          node.isDirectory = false;
          node.size = entry.size;
          node.compressedSize = entry.compressedSize;
          node.date = entry.date;
        }
      }
    }
  }

  // Second pass: sort children
  sortFileTreeNodes(root);

  return root;
}

/**
 * Recursively sort file tree nodes
 *
 * Sorts children alphabetically with directories appearing before files.
 *
 * @param node - Node to sort (and recursively sort its children)
 */
function sortFileTreeNodes(node: FileTreeNode): void {
  // Sort children: directories first, then files, both alphabetically
  node.children.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  // Recursively sort children's children
  for (const child of node.children) {
    if (child.isDirectory) {
      sortFileTreeNodes(child);
    }
  }
}

/**
 * Get a flat list of all files in the tree (excluding directories)
 *
 * @param node - Root node to traverse
 * @returns Array of file nodes
 */
export function getAllFiles(node: FileTreeNode): FileTreeNode[] {
  const files: FileTreeNode[] = [];

  function traverse(current: FileTreeNode): void {
    if (!current.isDirectory) {
      files.push(current);
    }
    for (const child of current.children) {
      traverse(child);
    }
  }

  traverse(node);
  return files;
}

/**
 * Find a node by path
 *
 * @param node - Root node to search from
 * @param path - Path to find (e.g., "folder/subfolder/file.js")
 * @returns Found node or undefined
 */
export function findNodeByPath(node: FileTreeNode, path: string): FileTreeNode | undefined {
  if (node.path === path) {
    return node;
  }

  for (const child of node.children) {
    const found = findNodeByPath(child, path);
    if (found) {
      return found;
    }
  }

  return undefined;
}
