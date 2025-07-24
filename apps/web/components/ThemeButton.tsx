"use client";

import { ThemeSwitcher } from "@/components/ui/kibo-ui/theme-switcher";
import { useState } from "react";

const ThemeButton = () => {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  return (
    <ThemeSwitcher defaultValue="system" value={theme} onChange={setTheme} />
  );
};

export default ThemeButton;
