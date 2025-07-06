"use client";
import * as React from "react";
import {
  CommandMenu,
  CommandMenuTrigger,
  CommandMenuContent,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuGroup,
  CommandMenuItem,
  CommandMenuSeparator,
  useCommandMenuShortcut,
  CommandMenuEmpty,
} from "@/components/ui/command-menu";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Command,
  Calendar,
  User,
  Settings,
  Plus,
  Upload,
  Download,
  Search,
  FileText,
  Home,
  List,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { RunIcon } from "@codesandbox/sandpack-react";

// Utility function to detect OS and return appropriate modifier key
const getModifierKey = () => {
  return { key: "cmd", symbol: "⌘" };
};

export const Cmd = () => {
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  useCommandMenuShortcut(() => setOpen(true));

  const allItems = [
    // Pages
    {
      type: "page",
      name: "Dashboard",
      icon: <Home />,
      shortcut: "g+d",
      link: "/dashboard",
    },
    {
      type: "page",
      name: "Docs",
      icon: <Settings />,
      shortcut: "g+a",
      link: "/docs",
    },

    // Actions
    {
      type: "action",
      name: "Create New Repl",
      icon: <Plus />,
      shortcut: "cmd+n",
    },
    {
      type: "action",
      name: "Activate a Repl",
      icon: <RunIcon />,
      shortcut: "cmd+u",
    },
    {
      type: "action",
      name: "Get Repls",
      icon: <List />,
      shortcut: "cmd+e",
    },
  ];

  const filteredItems = React.useMemo(() => {
    if (!value) return allItems;
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(value.toLowerCase()) ||
        item.type.toLowerCase().includes(value.toLowerCase()),
    );
  }, [value]);

  const groupedItems = React.useMemo(() => {
    const groups: Record<string, typeof allItems> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.type]) groups[item.type] = [];
      groups[item.type].push(item);
    });
    return groups;
  }, [filteredItems]);

  const getGroupTitle = (type: string) => {
    switch (type) {
      case "page":
        return "Pages";
      case "action":
        return "Actions";
      case "user":
        return "Users";
      case "document":
        return "Documents";
      default:
        return type;
    }
  };

  let globalIndex = 0;

  return (
    <CommandMenu open={open} onOpenChange={setOpen}>
      <CommandMenuTrigger asChild>
        <Button className="gap-2" variant={"outline"}>
          <Search size={16} />
          Command Palette
          <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-jetbrains-mono font-medium opacity-100 ml-auto flex">
            ⌘K
          </kbd>
        </Button>
      </CommandMenuTrigger>
      <CommandMenuContent className=" rounded-xl outline-2 outline-[var(--app-accent)] outline-offset-2">
        <CommandMenuInput
          placeholder="Type to search pages, actions, users, documents..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <CommandMenuList maxHeight="400px">
          {Object.keys(groupedItems).length === 0 ? (
            <CommandMenuEmpty>No results found for "{value}"</CommandMenuEmpty>
          ) : (
            Object.entries(groupedItems).map(([type, items], groupIndex) => (
              <React.Fragment key={type}>
                {groupIndex > 0 && <CommandMenuSeparator />}
                <CommandMenuGroup heading={getGroupTitle(type)}>
                  {items.map((item, index) => {
                    const currentIndex = globalIndex++;
                    return (
                      <CommandMenuItem
                        key={`${type}-${index}`}
                        icon={item.icon}
                        index={currentIndex}
                        shortcut={item.shortcut}
                        onSelect={() => {
                          if (item.type == "page" && item.link) {
                            router.push(item.link);
                          }
                          setOpen(false);
                          setValue("");
                        }}
                      >
                        {item.name}
                      </CommandMenuItem>
                    );
                  })}
                </CommandMenuGroup>
              </React.Fragment>
            ))
          )}
        </CommandMenuList>
      </CommandMenuContent>
    </CommandMenu>
  );
};
