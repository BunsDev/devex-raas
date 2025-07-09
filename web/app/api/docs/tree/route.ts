// app/api/docs/tree/route.ts
import { NextResponse } from "next/server";
import { StaticDocsService } from "@/lib/docs/static-docs-service";
import GitHubDocsService from "@/lib/docs/github";

export async function GET() {
  try {
    const staticService = new StaticDocsService();

    // Try to serve from static files first
    if (staticService.isStaticDocsAvailable()) {
      const tree = staticService.getDocTree();
      if (tree) {
        return NextResponse.json({
          tree,
          source: "static",
          metadata: staticService.getMetadata(),
        });
      }
    }

    // Fallback to GitHub API if static files aren't available
    console.warn("Static docs not available, falling back to GitHub API");
    const githubService = new GitHubDocsService(
      "https://github.com/parthkapoor-dev/devex",
    );
    const tree = await githubService.buildDocTree();

    return NextResponse.json({
      tree,
      source: "github",
      warning: "Using GitHub API fallback - consider regenerating static docs",
    });
  } catch (error) {
    console.error("Error building doc tree:", error);
    return NextResponse.json(
      { error: "Failed to build documentation tree" },
      { status: 500 },
    );
  }
}
