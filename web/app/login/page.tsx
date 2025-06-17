"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoginButton } from "@/components/Auth/LoginButton";

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "session_error":
        return "Session error occurred. Please try again.";
      case "invalid_state":
        return "Invalid state parameter. Please try again.";
      case "exchange_failed":
        return "Failed to exchange code for token. Please try again.";
      case "user_fetch_failed":
        return "Failed to fetch user information. Please try again.";
      case "session_save_failed":
        return "Failed to save session. Please try again.";
      default:
        return "An error occurred during authentication. Please try again.";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Continue with your GitHub account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">{getErrorMessage(error)}</div>
          </div>
        )}

        <div className="text-center">
          <LoginButton />
        </div>
      </div>
    </div>
  );
}
