// app/login/page.tsx
"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoginButton } from "@/components/Auth/LoginButton";
import Squares from "@/components/ui/background-squares";

function LoginPageContent() {
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
    return null;
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
    <div className="flex items-center justify-center min-h-screen max-md:mx-6">
      <Squares
        speed={0.5}
        squareSize={80}
        direction="diagonal"
        borderColor="black"
        hoverFillColor="#222"
      />
      <div className="z-10 max-w-md w-full flex flex-col gap-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-200">
            Sign in to your account
          </h2>
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginPageContent />
    </Suspense>
  );
}
