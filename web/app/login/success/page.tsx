"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LoginButton } from "@/components/Auth/LoginButton";
import Squares from "@/components/ui/background-squares";
import { toast } from "sonner";
import { CheckCircleIcon } from "lucide-react";

export default function LoginSuccessPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

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

  return (
    <div className="flex items-center justify-center min-h-screen max-md:mx-6">
      <Squares
        speed={0.5}
        squareSize={80}
        direction="diagonal"
        borderColor="black"
        hoverFillColor="#222"
      />

      <div className="z-10 max-w-3xl  w-full flex flex-col items-center justify-center">
        <CheckCircleIcon className="h-10 w-10 text-green-500" />
        <div className="flex justify-center items-center mt-6 gap-3 text-3xl font-bold text-gray-100">
          Magic link sent successfully. <br /> Check your email to continue.
        </div>
        <p className="mt-2 text-center text-lg text-gray-400">
          You may close this window
        </p>
      </div>
    </div>
  );
}
