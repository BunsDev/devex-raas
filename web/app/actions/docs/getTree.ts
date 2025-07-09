import { DocTree } from "@/lib/docs/github";
import { StaticDocsService } from "@/lib/docs/static-docs-service";

// Server function to get doc tree
export default async function getDocTree(): Promise<{
  tree: DocTree;
  source: "static" | "github";
  warning?: string;
  metadata?: any;
}> {
  const staticService = new StaticDocsService();

  // Try to serve from static files first
  if (staticService.isStaticDocsAvailable()) {
    const tree = staticService.getDocTree();
    if (tree) {
      return {
        tree,
        source: "static",
        metadata: staticService.getMetadata(),
      };
    }
  }

  // Fallback to GitHub API if static files aren't available
  console.error("Static docs not available, falling back to GitHub API");
  const tree = {};

  return {
    tree,
    source: "github",
    warning: "Using GitHub API fallback - consider regenerating static docs",
  };
}
