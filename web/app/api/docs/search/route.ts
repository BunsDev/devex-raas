// app/api/docs/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { StaticDocsService } from "@/lib/docs/static-docs-service";
import GitHubDocsService from "@/lib/docs/github";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 },
    );
  }

  try {
    const staticService = new StaticDocsService();

    // Try to search in static files first
    if (staticService.isStaticDocsAvailable()) {
      const results = staticService.searchFiles(query);
      return NextResponse.json({
        results,
        source: "static",
        totalFiles: staticService.getMetadata()?.totalFiles || 0,
      });
    }

    // Fallback to GitHub API if static files aren't available
    console.warn(
      "Static search index not available, falling back to GitHub API",
    );
    const githubService = new GitHubDocsService(
      "https://github.com/parthkapoor-dev/devex",
    );
    const files = await githubService.findMarkdownFiles();

    // Simple search implementation
    const results = files.filter(
      (file) =>
        file.name.toLowerCase().includes(query.toLowerCase()) ||
        file.path.toLowerCase().includes(query.toLowerCase()),
    );

    return NextResponse.json({
      results,
      source: "github",
      warning: "Using GitHub API fallback - consider regenerating static docs",
    });
  } catch (error) {
    console.error("Error searching docs:", error);
    return NextResponse.json(
      { error: "Failed to search documentation" },
      { status: 500 },
    );
  }
}
