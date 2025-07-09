import dotenv from "dotenv";
dotenv.config(); // Load .env into process.env

import { Octokit } from "@octokit/rest";

export interface DocFile {
  path: string;
  name: string;
  content?: string;
  url: string;
  type: "file" | "dir";
  children?: DocTree;
}

export interface DocTree {
  [key: string]: DocFile;
}

class GitHubDocsService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  constructor(repoUrl: string, token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN,
    });

    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error("Invalid GitHub repository URL");
    }

    this.owner = match[1];
    this.repo = match[2];
  }

  private getCacheKey(path: string): string {
    return `${this.owner}/${this.repo}/${path}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheExpiry;
  }

  async getRepositoryContents(path: string = ""): Promise<any[]> {
    const cacheKey = this.getCacheKey(path);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: path,
      });

      const data = Array.isArray(response.data)
        ? response.data
        : [response.data];

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      console.error(
        `Error fetching repository contents for path ${path}:`,
        error,
      );
      return [];
    }
  }

  async getFileContent(path: string): Promise<string | null> {
    const cacheKey = this.getCacheKey(`content:${path}`);
    const cached = this.cache.get(cacheKey);

    if (cached && this.isCacheValid(cached.timestamp)) {
      return cached.data;
    }

    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path: path,
      });

      if ("content" in response.data && response.data.content) {
        const content = Buffer.from(response.data.content, "base64").toString(
          "utf8",
        );

        this.cache.set(cacheKey, {
          data: content,
          timestamp: Date.now(),
        });

        return content;
      }
    } catch (error) {
      console.error(`Error fetching file content for ${path}:`, error);
    }

    return null;
  }

  async findMarkdownFiles(
    path: string = "",
    files: DocFile[] = [],
  ): Promise<DocFile[]> {
    const contents = await this.getRepositoryContents(path);

    for (const item of contents) {
      if (item.type === "file" && item.name.endsWith(".md")) {
        files.push({
          path: item.path,
          name: item.name,
          url: item.html_url,
          type: "file",
        });
      } else if (item.type === "dir") {
        await this.findMarkdownFiles(item.path, files);
      }
    }

    return files;
  }

  async buildDocTree(): Promise<DocTree> {
    const markdownFiles = await this.findMarkdownFiles();
    const tree: DocTree = {};

    for (const file of markdownFiles) {
      const pathParts = file.path.split("/");
      let current = tree;

      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const isLast = i === pathParts.length - 1;

        if (!current[part]) {
          current[part] = {
            path: pathParts.slice(0, i + 1).join("/"),
            name: part,
            type: isLast ? "file" : "dir",
            url: file.url,
            children: {},
          };
        }

        if (!isLast) {
          current = current[part].children as DocTree;
        }
      }
    }

    return tree;
  }

  generateRoutes(
    tree: DocTree,
    basePath: string = "/docs",
  ): Array<{ route: string; filePath: string }> {
    const routes: Array<{ route: string; filePath: string }> = [];

    const traverse = (node: DocTree, currentPath: string = "") => {
      Object.entries(node).forEach(([key, value]) => {
        if (value.type === "file") {
          let routePath = `${basePath}${currentPath}/${key}`;

          // Convert README.md to index route
          if (key === "README.md") {
            routePath = `${basePath}${currentPath}` || `${basePath}`;
          } else {
            // Remove .md extension from route
            routePath = routePath.replace(/\.md$/, "");
          }

          routes.push({
            route: routePath,
            filePath: value.path,
          });
        } else if (value.children) {
          traverse(value.children as DocTree, `${currentPath}/${key}`);
        }
      });
    };

    traverse(tree);
    return routes;
  }
}

export default GitHubDocsService;
