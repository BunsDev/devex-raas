// app/api/docs/status/route.ts (New endpoint to check static docs status)
import { NextResponse } from "next/server";
import { StaticDocsService } from "@/lib/docs/static-docs-service";

export async function GET() {
  try {
    const staticService = new StaticDocsService();
    const isAvailable = staticService.isStaticDocsAvailable();
    const metadata = staticService.getMetadata();

    return NextResponse.json({
      staticDocsAvailable: isAvailable,
      metadata,
      fileCount: staticService.getAllContent().length,
    });
  } catch (error) {
    console.error("Error checking static docs status:", error);
    return NextResponse.json(
      { error: "Failed to check static docs status" },
      { status: 500 },
    );
  }
}
