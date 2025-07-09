import { DocTree } from "@/lib/docs/github";
import { StaticDocsService } from "@/lib/docs/static-docs-service";

// Server function to get file content
export default async function getFileContent(path: string): Promise<{
  content: string | null;
  source: "static" | "github";
  warning?: string;
}> {
  const staticService = new StaticDocsService();

  // Try to serve from static files first
  if (staticService.isStaticDocsAvailable()) {
    const content = staticService.getFileContent(path);
    if (content) {
      return {
        content,
        source: "static",
      };
    }
  }

  // Fallback to GitHub API if static files aren't available or file not found
  console.error(
    `Static content not found for ${path}, falling back to GitHub API`,
  );
  const content = "";

  return {
    content,
    source: "github",
    warning: "Using GitHub API fallback - consider regenerating static docs",
  };
}
