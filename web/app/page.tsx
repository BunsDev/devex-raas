"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LoginButton } from "@/components/Auth/LoginButton";
import { UserProfile } from "@/components/Auth/UserProfile";
import Link from "next/link";

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Welcome to Your App
              </h1>

              {isAuthenticated ? (
                <div className="space-y-4">
                  <UserProfile />
                  <div>
                    <Link
                      href="/dashboard"
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-600">
                    Please sign in to access your dashboard.
                  </p>
                  <LoginButton />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
