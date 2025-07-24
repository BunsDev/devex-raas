// scripts/watch-docs.ts (for development)
import { watch } from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function watchDocs() {
  console.log("👀 Watching for documentation changes...");

  // Watch for changes in the docs directory (adjust path as needed)
  watch("./docs", { recursive: true }, async (eventType, filename) => {
    if (filename && filename.endsWith(".md")) {
      console.log(`📝 Documentation changed: ${filename}`);
      console.log("🔄 Regenerating static docs...");

      try {
        await execAsync("npm run generate-docs");
        console.log("✅ Static docs regenerated successfully!");
      } catch (error) {
        console.error("❌ Failed to regenerate docs:", error);
      }
    }
  });

  console.log("Press Ctrl+C to stop watching...");
}

watchDocs();
