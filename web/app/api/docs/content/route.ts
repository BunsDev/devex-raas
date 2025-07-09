// app/api/docs/content/route.ts
import { NextRequest, NextResponse } from "next/server";
import { StaticDocsService } from "@/lib/docs/static-docs-service";
import GitHubDocsService from "@/lib/docs/github";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const path = searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Path parameter is required" },
      { status: 400 },
    );
  }

  try {
    const staticService = new StaticDocsService();

    // Try to serve from static files first
    if (staticService.isStaticDocsAvailable()) {
      const content = staticService.getFileContent(path);
      if (content) {
        return NextResponse.json({
          content,
          source: "static",
          lastModified: staticService.getMetadata()?.generatedAt,
        });
      }
    }

    // Fallback to GitHub API if static files aren't available or file not found
    console.warn(
      `Static content not found for ${path}, falling back to GitHub API`,
    );
    const githubService = new GitHubDocsService(
      "https://github.com/parthkapoor-dev/devex",
    );
    const content = await githubService.getFileContent(path);

    if (!content) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json({
      content,
      source: "github",
      warning: "Using GitHub API fallback - consider regenerating static docs",
    });
  } catch (error) {
    console.error("Error fetching file content:", error);
    return NextResponse.json(
      { error: "Failed to fetch file content" },
      { status: 500 },
    );
  }
}
