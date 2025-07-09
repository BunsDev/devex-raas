// app/api/docs/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { StaticDocsService } from "@/lib/docs/static-docs-service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const staticService = new StaticDocsService();

    if (staticService.isStaticDocsAvailable()) {
      const results = staticService.searchFiles(query);
      return NextResponse.json({
        results: results.map((result) => ({
          path: result.path,
          name: result.name,
        })),
        source: "static",
      });
    }

    // If static docs not available, return empty results
    // You could implement GitHub search here as fallback if needed
    return NextResponse.json({
      results: [],
      warning: "Static docs not available for search",
    });
  } catch (error) {
    console.error("Error searching docs:", error);
    return NextResponse.json(
      { error: "Failed to search documentation" },
      { status: 500 },
    );
  }
}
