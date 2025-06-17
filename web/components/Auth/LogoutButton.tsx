"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "../ui/button";

export function LogoutButton() {
  const { logout, isLoading } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
    >
      {isLoading ? "Loading..." : "Logout"}
    </Button>
  );
}
