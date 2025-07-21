"use client";
// components/docs/sidebar.tsx
import React, { useState, useEffect } from "react";
import { DocTree } from "@/lib/docs/github";
import {
  Folder,
  File,
  FolderOpen,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { pathToSlug, slugToPath } from "@/lib/docs/utils";

interface DocsSidebarProps {
  docTree: DocTree;
}

interface TreeItemProps {
  name: string;
  item: any;
  currentPath: string;
  basePath?: string;
  onLinkClick?: () => void;
  level?: number;
}

const TreeItem: React.FC<TreeItemProps> = ({
  name,
  item,
  currentPath,
  basePath = "",
  onLinkClick,
  level = 0,
}) => {
  const fullPath = basePath ? `${basePath}/${name}` : name;
  const isCurrentPath =
    currentPath === fullPath || currentPath === `${fullPath}.md`;

  const [isCollapsed, setIsCollapsed] = useState(true);

  // If it's a file (has content property or is a markdown file)
  if (typeof item === "string" || item.content || name.endsWith(".md")) {
    const href =
      fullPath === "README.md" ? "/docs" : `/docs/${pathToSlug(fullPath)}`;

    return (
      <Link
        href={href}
        onClick={onLinkClick}
        className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-all duration-200 group ${
          isCurrentPath
            ? "bg-emerald-500 text-black border-l-2 border-emerald-400 shadow-sm"
            : "text-gray-300 hover:text-white hover:bg-gray-800"
        }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <File
          className={`h-4 w-4 mr-2 flex-shrink-0 ${
            isCurrentPath ? "text-black" : "text-gray-400"
          }`}
        />
        <span className="truncate font-medium">
          {name.replace(/\.md$/, "")}
        </span>
      </Link>
    );
  }

  // If it's a directory
  const hasChildren =
    item && typeof item === "object" && Object.keys(item).length > 0;

  if (!hasChildren) {
    return null;
  }

  // Check if any child is currently active (for auto-expand)
  const hasActiveChild = Object.entries(item.children).some(
    ([childName, childItem]) => {
      const childFullPath = `${fullPath}/${childName}`;
      return (
        currentPath === childFullPath ||
        currentPath === `${childFullPath}.md` ||
        currentPath.startsWith(`${childFullPath}/`)
      );
    },
  );

  // Auto-expand if has active child
  useEffect(() => {
    if (hasActiveChild && isCollapsed) {
      setIsCollapsed(false);
    }
  }, [hasActiveChild, isCollapsed]);

  // Separate and sort children: files first, then folders
  const children = Object.entries(item.children);
  const files = children.filter(
    ([childName, childItem]: any) =>
      typeof childItem === "string" ||
      childItem.content ||
      childName.endsWith(".md"),
  );
  const folders = children.filter(
    ([childName, childItem]: any) =>
      !(
        typeof childItem === "string" ||
        childItem.content ||
        childName.endsWith(".md")
      ),
  );

  // Sort files: README.md first, then alphabetically
  files.sort(([a], [b]) => {
    if (a === "README.md") return -1;
    if (b === "README.md") return 1;
    return a.localeCompare(b);
  });

  // Sort folders alphabetically
  folders.sort(([a], [b]) => a.localeCompare(b));

  // Combine: files first, then folders
  const sortedChildren = [...files, ...folders];

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`w-full flex items-center px-3 py-1.5 text-sm font-medium transition-all duration-200 rounded-md group hover:bg-gray-800 ${
          hasActiveChild ? "text-white" : "text-gray-300"
        }`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <div className="flex items-center mr-2">
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3 text-teal-400 transition-transform duration-200" />
          ) : (
            <ChevronDown className="h-3 w-3 text-teal-400 transition-transform duration-200" />
          )}
        </div>
        {isCollapsed ? (
          <Folder
            className={`h-4 w-4 mr-2 flex-shrink-0 ${
              hasActiveChild ? "text-emerald-400" : "text-gray-400"
            }`}
          />
        ) : (
          <FolderOpen
            className={`h-4 w-4 mr-2 flex-shrink-0 ${
              hasActiveChild ? "text-emerald-400" : "text-gray-400"
            }`}
          />
        )}
        <span className="truncate text-left">{name}</span>
      </button>

      {!isCollapsed && (
        <div className="mt-1 flex flex-col gap-0.5">
          {sortedChildren.map(([childName, childItem]) => (
            <TreeItem
              key={childName}
              name={childName}
              item={childItem}
              currentPath={currentPath}
              basePath={fullPath}
              onLinkClick={onLinkClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DocsSidebar: React.FC<DocsSidebarProps> = ({ docTree }) => {
  const params = useParams();
  const slug = params.slug as string[] | undefined;
  const currentPath = slugToPath(slug);

  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && isOpen) {
        const sidebar = document.getElementById("docs-sidebar");
        const toggle = document.getElementById("sidebar-toggle");
        if (
          sidebar &&
          toggle &&
          !sidebar.contains(event.target as Node) &&
          !toggle.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, isOpen]);

  // Close sidebar when route changes on mobile
  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Separate and sort root items: files first, then folders
  const rootItems = Object.entries(docTree);
  const rootFiles = rootItems.filter(
    ([name, item]) =>
      typeof item === "string" || item.content || name.endsWith(".md"),
  );
  const rootFolders = rootItems.filter(
    ([name, item]) =>
      !(typeof item === "string" || item.content || name.endsWith(".md")),
  );

  // Sort files: README.md first, then alphabetically
  rootFiles.sort(([a], [b]) => {
    if (a === "README.md") return -1;
    if (b === "README.md") return 1;
    return a.localeCompare(b);
  });

  // Sort folders alphabetically
  rootFolders.sort(([a], [b]) => a.localeCompare(b));

  // Combine: files first, then folders
  const sortedRootItems = [...rootFiles, ...rootFolders];

  return (
    <>
      {/* Mobile toggle button */}
      <button
        id="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-black text-white rounded-lg border border-gray-700 shadow-sm hover:bg-gray-800 transition-colors"
        aria-label="Toggle documentation sidebar"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        id="docs-sidebar"
        className={`
          fixed md:static left-0 top-0 h-full z-40 w-[280px] bg-zinc-900 border border-teal-800 overflow-y-auto rounded-lg md:my-2
          transform transition-transform duration-300 ease-in-out
          md:transform-none md:transition-none
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 md:block">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-white tracking-tight">
                Documentation
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1 text-gray-400 hover:text-white transition-colors rounded"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation tree */}
          <nav className="flex flex-col gap-1">
            {sortedRootItems.map(([name, item]) => (
              <TreeItem
                key={name}
                name={name}
                item={item}
                currentPath={currentPath}
                onLinkClick={handleLinkClick}
                level={0}
              />
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default DocsSidebar;
