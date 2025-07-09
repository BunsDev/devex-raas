// scripts/generate-static-docs.ts
import fs from "fs";
import path from "path";
import GitHubDocsService from "@/lib/docs/github";

interface DocFile {
  path: string;
  name: string;
  content: string;
  lastModified: string;
}

interface DocTree {
  [key: string]: any;
}

async function generateStaticDocs() {
  console.log("🚀 Starting static documentation generation...");

  try {
    const service = new GitHubDocsService(
      "https://github.com/parthkapoor-dev/devex",
    );

    // Create output directory
    const outputDir = path.join(process.cwd(), "public", "static-docs");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate doc tree
    console.log("📁 Building documentation tree...");
    const tree = await service.buildDocTree();

    // Save doc tree
    fs.writeFileSync(
      path.join(outputDir, "tree.json"),
      JSON.stringify(tree, null, 2),
    );

    // Get all markdown files
    console.log("📄 Fetching all markdown files...");
    const files = await service.findMarkdownFiles();

    // Generate content for each file
    const allContent: DocFile[] = [];
    const contentDir = path.join(outputDir, "content");

    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    for (const file of files) {
      try {
        console.log(`Processing: ${file.path}`);
        const content = await service.getFileContent(file.path);

        if (content) {
          const docFile: DocFile = {
            path: file.path,
            name: file.name,
            content,
            lastModified: new Date().toISOString(),
          };

          allContent.push(docFile);

          // Save individual file content
          const safeFileName =
            file.path.replace(/[^a-zA-Z0-9]/g, "_") + ".json";
          fs.writeFileSync(
            path.join(contentDir, safeFileName),
            JSON.stringify(docFile, null, 2),
          );
        }
      } catch (error) {
        console.error(`Error processing ${file.path}:`, error);
      }
    }

    // Save all content index
    fs.writeFileSync(
      path.join(outputDir, "content-index.json"),
      JSON.stringify(allContent, null, 2),
    );

    // Generate search index
    console.log("🔍 Building search index...");
    const searchIndex = allContent.map((file) => ({
      path: file.path,
      name: file.name,
      searchableContent: file.content.toLowerCase().slice(0, 500), // First 500 chars for search
      lastModified: file.lastModified,
    }));

    fs.writeFileSync(
      path.join(outputDir, "search-index.json"),
      JSON.stringify(searchIndex, null, 2),
    );

    // Generate metadata
    const metadata = {
      generatedAt: new Date().toISOString(),
      totalFiles: allContent.length,
      repository: "https://github.com/parthkapoor-dev/devex",
      version: "1.0.0",
    };

    fs.writeFileSync(
      path.join(outputDir, "metadata.json"),
      JSON.stringify(metadata, null, 2),
    );

    console.log("✅ Static documentation generation completed!");
    console.log(`📊 Generated ${allContent.length} documentation files`);
    console.log(`📍 Output directory: ${outputDir}`);
  } catch (error) {
    console.error("❌ Error generating static docs:", error);
    process.exit(1);
  }
}

// Run the script
generateStaticDocs();
