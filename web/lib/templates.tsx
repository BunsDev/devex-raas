import { IconBrandNodejs, IconBrandPython } from "@tabler/icons-react";

const templates = {
  node: {
    key: "node",
    name: "Node.js",
    description: "JavaScript runtime environment",
    icon: (
      <IconBrandNodejs className=" bg-green-800 h-9 w-9 p-2 rounded-full" />
    ),
  },
  python: {
    key: "python",
    name: "Python",
    description: "High-level programming language",
    icon: <IconBrandPython className=" bg-blue-800 h-9 w-9 p-2 rounded-full" />,
  },
};

export default templates;
