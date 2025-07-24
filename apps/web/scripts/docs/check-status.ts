// scripts/check-docs-status.ts
import { StaticDocsService } from "@/lib/docs/static-docs-service";

async function checkDocsStatus() {
  const service = new StaticDocsService();

  console.log("📊 Static Documentation Status Report");
  console.log("=====================================");

  const isAvailable = service.isStaticDocsAvailable();
  console.log(`Status: ${isAvailable ? "✅ Available" : "❌ Not Available"}`);

  if (isAvailable) {
    const metadata = service.getMetadata();
    const fileCount = service.getAllContent().length;

    console.log(`Generated At: ${metadata?.generatedAt}`);
    console.log(`Total Files: ${fileCount}`);
    console.log(`Repository: ${metadata?.repository}`);
    console.log(`Version: ${metadata?.version}`);

    console.log("\n📁 Available Files:");
    const files = service.getFileList();
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.name} (${file.path})`);
    });
  } else {
    console.log("\n💡 To generate static docs, run: npm run generate-docs");
  }
}

checkDocsStatus();
