"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/button";

export function LoginButton() {
  const { login, isLoading } = useAuth();

  return (
    <Button
      onClick={login}
      disabled={isLoading}
      className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
    >
      {isLoading ? "Loading..." : "Login with GitHub"}
    </Button>
  );
}
