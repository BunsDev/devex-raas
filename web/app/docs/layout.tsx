import React from "react";
import { Inter } from "next/font/google";

import getDocTree from "../actions/docs/getTree";
import { slugToPath } from "@/lib/docs/utils";

import DocsSidebar from "@/components/docs/sidebar";
import { AlertCircle } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

interface DocsLayoutProps {
  children: React.ReactNode;
  params: {
    slug?: string[];
  };
}

const DocsLayout: React.FC<DocsLayoutProps> = async ({ children, params }) => {
  try {
    const {
      tree: docTree,
      warning: treeWarning,
      metadata,
    } = await getDocTree();

    if (treeWarning) {
      console.warn(treeWarning);
    }

    return (
      <div className="min-h-screen bg-black text-zinc-100 pt-14 overflow-hidden">
        <div className="flex relative">
          <DocsSidebar docTree={docTree} />
          {children}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading documentation:", error);

    return (
      <div className="min-h-screen bg-black flex items-center justify-center pt-20">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-zinc-100 mb-4 tracking-tight">
            Error Loading Documentation
          </h2>
          <p className="text-zinc-400 text-lg">
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred"}
          </p>
        </div>
      </div>
    );
  }
};

export default DocsLayout;
