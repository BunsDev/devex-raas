// scripts/pre-deploy.ts
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function preDeployChecks() {
  console.log("🚀 Running pre-deployment checks...");

  try {
    // Check if static docs exist
    console.log("📄 Checking static documentation...");
    await execAsync("npm run docs:status");

    // Generate docs if they don't exist
    console.log("📝 Generating static documentation...");
    await execAsync("npm run generate-docs");

    console.log("✅ Pre-deployment checks completed successfully!");
  } catch (error) {
    console.error("❌ Pre-deployment checks failed:", error);
    process.exit(1);
  }
}

preDeployChecks();
