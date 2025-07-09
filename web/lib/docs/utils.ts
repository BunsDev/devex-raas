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

export const formatFileName = (fileName: string): string => {
  if (fileName === "README.md") return "Overview";
  return fileName
    .replace(".md", "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
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
