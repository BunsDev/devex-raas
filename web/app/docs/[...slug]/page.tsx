// app/docs/[[...slug]]/page.tsx
import React from "react";
import { StaticDocsService } from "@/lib/docs/static-docs-service";
import { BookOpen, AlertCircle } from "lucide-react";
import DocsSidebar from "@/components/docs/sidebar";
import MarkdownRenderer from "@/components/docs/markdown-render";
import DocsSearchClient from "@/components/docs/search-client";
import getDocTree from "@/app/actions/docs/getTree";
import getFileContent from "@/app/actions/docs/getFile";
import { slugToPath } from "@/lib/docs/utils";

interface DocsPageProps {
  params?: Promise<{
    slug?: string[];
  }>;
}

export default async function DocsPage({ params }: DocsPageProps) {
  try {
    const paramsValue = await params;
    // Determine current path from slug
    const currentPath = slugToPath(paramsValue?.slug);

    // Get content for the current path (server-side)
    const { content: currentContent, warning: contentWarning } =
      await getFileContent(currentPath);

    if (contentWarning) {
      throw new Error(contentWarning);
    }

    return (
      <div className="flex-1 flex flex-col md:m-2 md:rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 sm:px-6 md:px-8 py-4 ">
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0 flex-1">
              <div className="p-1.5 sm:p-2 bg-emerald-500 rounded-lg mr-2 sm:mr-4 flex-shrink-0">
                <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-black" />
              </div>
              <h1 className="text-lg sm:text-2xl  font-bold text-zinc-100 tracking-tight truncate">
                {paramsValue?.slug?.join("/") || "Documentation"}
              </h1>
            </div>

            {/* Search component (client component for interactivity) */}
            <div className="ml-2 sm:ml-4 flex-shrink-0">
              <DocsSearchClient />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-zinc-950 pb-14">
          <div className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 ">
            {currentContent ? (
              <div
                suppressHydrationWarning
                className="prose prose-invert prose-zinc max-w-none
                                prose-headings:text-zinc-100 prose-headings:font-bold
                                prose-h1:text-xl sm:prose-h1:text-2xl md:prose-h1:text-3xl
                                prose-h2:text-lg sm:prose-h2:text-xl md:prose-h2:text-2xl
                                prose-h3:text-base sm:prose-h3:text-lg md:prose-h3:text-xl
                                prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:text-sm sm:prose-p:text-base
                                prose-code:text-emerald-400 prose-code:bg-zinc-900 prose-code:text-xs sm:prose-code:text-sm
                                prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800
                                prose-pre:text-xs sm:prose-pre:text-sm prose-pre:overflow-x-auto
                                prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline prose-a:text-sm sm:prose-a:text-base
                                prose-strong:text-zinc-100 prose-strong:font-semibold
                                prose-blockquote:border-l-emerald-500 prose-blockquote:text-zinc-300 prose-blockquote:text-sm sm:prose-blockquote:text-base
                                prose-hr:border-zinc-700
                                prose-li:text-zinc-300 prose-li:text-sm sm:prose-li:text-base
                                prose-table:border-zinc-700 prose-table:text-xs sm:prose-table:text-sm
                                prose-th:text-zinc-100 prose-td:text-zinc-300
                                prose-img:rounded-lg prose-img:border prose-img:border-zinc-800
                                [&>*]:break-words [&_table]:overflow-x-auto [&_table]:block [&_table]:w-full
                                [&_table]:whitespace-nowrap sm:[&_table]:whitespace-normal"
              >
                <MarkdownRenderer content={currentContent} />
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 md:py-20">
                <div className="p-4 sm:p-6 bg-zinc-900 rounded-2xl inline-block mb-4 sm:mb-6">
                  <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 text-zinc-600 mx-auto" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mb-2 sm:mb-3 tracking-tight px-4">
                  Ready to explore?
                </h2>
                <p className="text-zinc-400 text-base sm:text-lg font-medium px-4">
                  Select a document from the sidebar to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading documentation:", error);

    return (
      <div className="min-h-full bg-black flex-1 flex  items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 sm:h-16 sm:w-16 text-red-400 mx-auto mb-4 sm:mb-6" />
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-100 mb-3 sm:mb-4 tracking-tight">
            Error Loading Documentation
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg break-words">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
        </div>
      </div>
    );
  }
}

// Generate static params for all documentation paths
export async function generateStaticParams() {
  try {
    const staticService = new StaticDocsService();

    if (staticService.isStaticDocsAvailable()) {
      const fileList = staticService.getFileList();

      return fileList.map((file) => {
        // Convert file path to slug array
        const slug = file.path
          .replace(/\.md$/, "") // Remove .md extension
          .replace(/^\//, "") // Remove leading slash
          .split("/")
          .filter(Boolean); // Remove empty strings

        return { slug };
      });
    }

    return [];
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

// Optional: Add metadata for SEO
export async function generateMetadata({ params }: DocsPageProps) {
  const paramsValue = await params;

  const currentPath = slugToPath(paramsValue?.slug);
  const pathTitle = paramsValue?.slug?.join(" > ") || "Documentation";

  return {
    title: `${pathTitle} | Documentation`,
    description: `Documentation for ${pathTitle}`,
  };
}
