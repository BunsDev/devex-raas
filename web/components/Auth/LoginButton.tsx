"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/button";
import { LucideGithub } from "lucide-react";

export function LoginButton() {
  const { login, isLoading } = useAuth();

  return (
    <Button
      onClick={login}
      disabled={isLoading}
      className="w-full max-w-sm gap-2 rounded-md border bg-white text-black shadow-sm hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
      variant={"outline"}
    >
      <LucideGithub className="h-5 w-5" />
      {isLoading ? "Loading..." : "Login with GitHub"}
    </Button>
  );
}
