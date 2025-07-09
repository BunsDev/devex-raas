"use client";

import React, { useState, useEffect } from "react";
import { DocTree } from "@/lib/docs/github";
import { Loader2, BookOpen, AlertCircle, Search } from "lucide-react";
import DocsSidebar from "@/components/docs/sidebar";
import MarkdownRenderer from "@/components/docs/markdown-render";
import { useParams } from "next/navigation";

interface ApiResponse {
  tree?: DocTree;
  content?: string;
  results?: Array<{ path: string; name: string }>;
  source?: "static" | "github";
  warning?: string;
  metadata?: {
    generatedAt: string;
    totalFiles: number;
    repository: string;
    version: string;
  };
}

const DocsPage: React.FC = () => {
  const params = useParams();
  const slug = params.slug as string[] | undefined;

  const [docTree, setDocTree] = useState<DocTree>({});
  const [currentContent, setCurrentContent] = useState<string>("");
  const [currentPath, setCurrentPath] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ path: string; name: string }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDocTree();
  }, [slug]);

  const loadDocTree = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/docs/tree");
      const data: ApiResponse = await response.json();
      console.log("Tree Route Response", data);

      if (data.tree) {
        setDocTree(data.tree);

        if (data.warning) {
          console.warn(data.warning);
        }
      }
    } catch (error) {
      console.error("Error loading doc tree:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchDocs = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(
        `/api/docs/search?q=${encodeURIComponent(query)}`,
      );
      const data: ApiResponse = await response.json();

      if (data.results) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error("Error searching docs:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchDocs(query);
  };

  const handleNavigate = async (path: string) => {
    setLoading(true);
    try {
      setCurrentPath(path);
      const response = await fetch(
        `/api/docs/content?path=${encodeURIComponent(path)}`,
      );
      const data: ApiResponse = await response.json();

      if (data.content) {
        setCurrentContent(data.content);

        if (data.warning) {
          console.warn(data.warning);
        }
      }
      // Update URL without page reload
      const routePath = path.replace(/\.md$/, "").replace(/\/README$/, "");
      const newUrl = routePath ? `/docs/${routePath}` : "/docs";
      window.history.pushState({}, "", newUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setLoading(false);
    }
  };

  if (loading && Object.keys(docTree).length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-6 text-emerald-400" />
          <p className="text-zinc-300 text-lg font-medium tracking-wide">
            Loading documentation...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-zinc-100 mb-4 tracking-tight">
            Error Loading Documentation
          </h2>
          <p className="text-zinc-400 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <DocsSidebar
          docTree={docTree}
          currentPath={currentPath}
          onNavigate={handleNavigate}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-zinc-900 border-b border-zinc-800 px-8 py-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-500 rounded-lg mr-4">
                <BookOpen className="h-6 w-6 text-black" />
              </div>
              <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">
                Documentation
              </h1>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-zinc-950">
            <div className="max-w-5xl mx-auto p-8">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin mr-3 text-emerald-400" />
                  <span className="text-zinc-300 text-lg font-medium">
                    Loading content...
                  </span>
                </div>
              ) : currentContent ? (
                <div
                  className="prose prose-invert prose-zinc max-w-none
                              prose-headings:text-zinc-100 prose-headings:font-bold
                              prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                              prose-p:text-zinc-300 prose-p:leading-relaxed
                              prose-code:text-emerald-400 prose-code:bg-zinc-900
                              prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800
                              prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
                              prose-strong:text-zinc-100 prose-strong:font-semibold
                              prose-blockquote:border-l-emerald-500 prose-blockquote:text-zinc-300
                              prose-hr:border-zinc-700
                              prose-li:text-zinc-300
                              prose-table:border-zinc-700
                              prose-th:text-zinc-100 prose-td:text-zinc-300"
                >
                  <MarkdownRenderer content={currentContent} />
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="p-6 bg-zinc-900 rounded-2xl inline-block mb-6">
                    <BookOpen className="h-16 w-16 text-zinc-600 mx-auto" />
                  </div>
                  <h2 className="text-2xl font-bold text-zinc-100 mb-3 tracking-tight">
                    Ready to explore?
                  </h2>
                  <p className="text-zinc-400 text-lg font-medium">
                    Select a document from the sidebar to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
