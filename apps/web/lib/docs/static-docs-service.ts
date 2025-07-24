// lib/static-docs-service.ts
import fs from "fs";
import path from "path";

interface DocFile {
  path: string;
  name: string;
  content: string;
  lastModified: string;
}

interface SearchResult {
  path: string;
  name: string;
  searchableContent: string;
  lastModified: string;
}

interface DocTree {
  [key: string]: any;
}

interface Metadata {
  generatedAt: string;
  totalFiles: number;
  repository: string;
  version: string;
}

export class StaticDocsService {
  private staticDocsPath: string;
  private contentPath: string;

  constructor() {
    this.staticDocsPath = path.join(process.cwd(), "public", "static-docs");
    this.contentPath = path.join(this.staticDocsPath, "content");
  }

  private fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  private readJsonFile<T>(filePath: string): T | null {
    try {
      if (!this.fileExists(filePath)) {
        return null;
      }
      const content = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
      return null;
    }
  }

  public getDocTree(): DocTree | null {
    const treePath = path.join(this.staticDocsPath, "tree.json");
    return this.readJsonFile<DocTree>(treePath);
  }

  public getFileContent(filePath: string): string | null {
    try {
      const safeFileName = filePath.replace(/[^a-zA-Z0-9]/g, "_") + ".json";
      const contentFilePath = path.join(this.contentPath, safeFileName);

      const docFile = this.readJsonFile<DocFile>(contentFilePath);
      return docFile?.content || null;
    } catch (error) {
      console.error(`Error getting file content for ${filePath}:`, error);
      return null;
    }
  }

  public getAllContent(): DocFile[] {
    const indexPath = path.join(this.staticDocsPath, "content-index.json");
    return this.readJsonFile<DocFile[]>(indexPath) || [];
  }

  public searchFiles(query: string): SearchResult[] {
    const searchIndexPath = path.join(this.staticDocsPath, "search-index.json");
    const searchIndex = this.readJsonFile<SearchResult[]>(searchIndexPath);

    if (!searchIndex || !query) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return searchIndex.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.path.toLowerCase().includes(lowerQuery) ||
        item.searchableContent.includes(lowerQuery),
    );
  }

  public getMetadata(): Metadata | null {
    const metadataPath = path.join(this.staticDocsPath, "metadata.json");
    return this.readJsonFile<Metadata>(metadataPath);
  }

  public isStaticDocsAvailable(): boolean {
    const treePath = path.join(this.staticDocsPath, "tree.json");
    const indexPath = path.join(this.staticDocsPath, "content-index.json");
    return this.fileExists(treePath) && this.fileExists(indexPath);
  }

  public getFileList(): Array<{ path: string; name: string }> {
    const allContent = this.getAllContent();
    return allContent.map((file) => ({
      path: file.path,
      name: file.name,
    }));
  }
}
