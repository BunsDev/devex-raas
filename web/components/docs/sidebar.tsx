"use client";
// components/docs/sidebar.tsx
import React, { useState, useEffect } from "react";
import { DocTree } from "@/lib/docs/github";
import { Folder, File, FolderOpen, Menu, X } from "lucide-react";
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
}

const TreeItem: React.FC<TreeItemProps> = ({
  name,
  item,
  currentPath,
  basePath = "",
  onLinkClick,
}) => {
  const fullPath = basePath ? `${basePath}/${name}` : name;
  const isCurrentPath =
    currentPath === fullPath || currentPath === `${fullPath}.md`;

  // If it's a file (has content property or is a markdown file)
  if (typeof item === "string" || item.content || name.endsWith(".md")) {
    const href =
      fullPath === "README.md" ? "/docs" : `/docs/${pathToSlug(fullPath)}`;
    return (
      <Link
        href={href}
        onClick={onLinkClick}
        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors group hover:bg-zinc-800 ${
          isCurrentPath
            ? "bg-emerald-500 text-black hover:bg-emerald-400"
            : "text-zinc-300 hover:text-zinc-100"
        }`}
      >
        <File className="h-4 w-4 mr-3 flex-shrink-0" />
        <span className="truncate">{name.replace(/\.md$/, "")}</span>
      </Link>
    );
  }

  // If it's a directory
  const hasChildren =
    item && typeof item === "object" && Object.keys(item).length > 0;
  if (!hasChildren) {
    return null;
  }

  // Check if any child is currently active
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

  return (
    <div className="mb-2">
      <div className="flex items-center px-3 py-2 text-sm font-medium text-zinc-400 mb-1">
        {hasActiveChild ? (
          <FolderOpen className="h-4 w-4 mr-3 flex-shrink-0" />
        ) : (
          <Folder className="h-4 w-4 mr-3 flex-shrink-0" />
        )}
        <span className="truncate">{name}</span>
      </div>
      <div className="ml-6 flex flex-col gap-1">
        {Object.entries(item.children)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([childName, childItem]) => (
            <TreeItem
              key={childName}
              name={childName}
              item={childItem}
              currentPath={currentPath}
              basePath={fullPath}
              onLinkClick={onLinkClick}
            />
          ))}
      </div>
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

  return (
    <>
      {/* Mobile toggle button */}
      <button
        id="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-zinc-800 text-zinc-100 rounded-lg border border-zinc-700 hover:bg-zinc-700 transition-colors"
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
          fixed md:static inset-y-0 left-0 z-40 w-80 bg-zinc-900 border-r border-zinc-800 overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          md:transform-none md:transition-none pb-14 rounded-lg m-2
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        <div className="p-6">
          {/* Mobile header with close button */}
          <div className="flex items-center justify-between mb-4 md:block">
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
              Documentation
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden p-1 text-zinc-400 hover:text-zinc-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-1">
            {Object.entries(docTree)
              .sort(([a], [b]) => {
                // Sort README.md first, then alphabetically
                if (a === "README.md") return -1;
                if (b === "README.md") return 1;
                return a.localeCompare(b);
              })
              .map(([name, item]) => (
                <TreeItem
                  key={name}
                  name={name}
                  item={item}
                  currentPath={currentPath}
                  onLinkClick={handleLinkClick}
                />
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default DocsSidebar;
