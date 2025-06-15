"use client";

import { useState } from "react";
import { File, Folder, Tree } from "@/components/magicui/file-tree";

export type DirEntry = {
  name: string;
  isDir: boolean;
};

export type Tree = {
  [path: string]: DirEntry[];
};

type Props = {
  tree: Tree;
  fetchDir: (path: string) => Promise<void>;
  fetchContent: (filePath: string) => Promise<void>;
};

export default function FileTree({ tree, fetchDir, fetchContent }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const handleToggleFolder = async (path: string) => {
    if (expanded.has(path)) {
      // Collapse folder
      const updated = new Set(expanded);
      updated.delete(path);
      setExpanded(updated);
    } else {
      // Expand and fetch if not already fetched
      if (!tree[path]) {
        await fetchDir(path);
      }
      const updated = new Set(expanded);
      updated.add(path);
      setExpanded(updated);
    }
  };

  const renderTree = (entries: DirEntry[], currentPath = "") => {
    return entries.map((entry) => {
      const entryPath = currentPath
        ? `${currentPath}/${entry.name}`
        : entry.name;

      if (entry.isDir) {
        return (
          <Folder
            key={entryPath}
            element={entry.name}
            value={entryPath}
            onClick={() => handleToggleFolder(entryPath)}
          >
            {expanded.has(entryPath) && tree[entryPath]
              ? renderTree(tree[entryPath], entryPath)
              : null}
          </Folder>
        );
      } else {
        return (
          <File
            key={entryPath}
            value={entryPath}
            onClick={async () => {
              await fetchContent(entryPath);
            }}
          >
            <p>{entry.name}</p>
          </File>
        );
      }
    });
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-auto rounded-lg border bg-background">
      <Tree className="overflow-hidden rounded-md bg-background p-2">
        {renderTree(tree[""], "")}
      </Tree>
    </div>
  );
}
