// utils/docs-utils.ts
export const generateBreadcrumbs = (
  path: string,
): Array<{ name: string; path: string }> => {
  const segments = path.split("/").filter(Boolean);
  const breadcrumbs: Array<{ name: string; path: string }> = [];

  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    let name = segment;
    if (segment === "README.md") {
      name = "Overview";
    } else if (segment.endsWith(".md")) {
      name = segment.replace(".md", "");
    }

    breadcrumbs.push({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      path: currentPath,
    });
  }

  return breadcrumbs;
};

export const getFileIcon = (fileName: string): string => {
  if (fileName === "README.md") return "📋";
  if (fileName.includes("API")) return "🔧";
  if (fileName.includes("DEPLOYMENT")) return "🚀";
  if (fileName.includes("CONTRIBUTING")) return "🤝";
  if (fileName.includes("CHANGELOG")) return "📝";
  if (fileName.includes("LICENSE")) return "📄";
  return "📄";
};

// Function to convert slug to file path
export function slugToPath(slug?: string[]): string {
  if (!slug || slug.length === 0) {
    return "README.md";
  }

  // Convert slug array to file path
  const pathStr = slug.join("/");

  // Add .md extension if not present
  if (!pathStr.endsWith(".md")) {
    return `${pathStr}/README.md`;
  }

  return pathStr;
}

export const getHref = (path: string): string => {
  const slug = pathToSlug(path);
  return slug === "" || slug === "README" ? "/docs" : `/docs/${slug}`;
};

export const pathToSlug = (path: string): string => {
  return (
    path
      // .replace(/\.md$/, "")
      .replace(/^\//, "")
      .replace(/\/README.md$/, "")
  );
};
