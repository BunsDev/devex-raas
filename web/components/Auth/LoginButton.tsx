"use client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Link,
  LucideGithub,
  Mail,
  AlertCircle,
  Star,
  ChevronDown,
  ChevronUp,
  LucideRouter,
} from "lucide-react";
import { Ref, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function LoginButton() {
  const { login, isLoading } = useAuth();
  const inputRef: Ref<HTMLInputElement> | undefined = useRef(null);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkConsent, setMagicLinkConsent] = useState(false);
  const [email, setEmail] = useState("");
  const [magicLoading, setMagicLoading] = useState(false);
  const router = useRouter();

  function handleLoginError(err: string) {
    toast.error(err);
  }
  function handleLoginSuccess(email: string) {
    toast.success(`Magic Link Sent to ${email} `);
    router.push("/login/success");
  }

  const handleMagicLinkLogin = async () => {
    if (email && magicLinkConsent) {
      setMagicLoading(true);
      await login(
        "magiclink",
        handleLoginError,
        () => handleLoginSuccess(email),
        email,
      );
      setMagicLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 justify-center items-center w-full max-w-md mx-auto">
      {/* GitHub Login - Recommended */}
      <div className="w-full flex flex-col gap-3">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
          <p className="text-center text-sm font-medium text-gray-300">
            Recommended for DevOps Features
          </p>
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
        </div>

        <Button
          onClick={() => login("github", handleLoginError, () => {})}
          disabled={isLoading}
          className="w-full gap-3 rounded-lg border-2 bg-gradient-to-r from-gray-800 via-gray-950 to-gray-800 text-white shadow-lg hover:from-gray-900 hover:to-gray-800 hover:shadow-xl transition-all duration-300 ease-out transform hover:scale-[1.02] active:scale-[0.98] border-gray-700 hover:border-gray-600 py-3 font-medium"
          variant={"outline"}
        >
          <LucideGithub className="h-5 w-5" />
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Connecting...
            </div>
          ) : (
            "Continue with GitHub"
          )}
        </Button>
      </div>

      {/* Divider */}
      <div className="flex items-center w-full gap-4">
        <div className=" flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        <span className="text-xs text-gray-400 font-medium">OR</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
      </div>

      {/* Magic Link Toggle */}
      <div className="w-full">
        <Button
          onClick={() => setShowMagicLink(!showMagicLink)}
          className="w-full gap-2 text-gray-300 hover:text-white hover:bg-gray-800/70 transition-all duration-300 py-3 rounded-lg border border-gray-700/50 hover:border-gray-600/50 bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900"
        >
          <Mail className="h-4 w-4" />
          Use Magic Link instead
          {showMagicLink ? (
            <ChevronUp className="h-4 w-4 ml-auto transition-transform duration-300" />
          ) : (
            <ChevronDown className="h-4 w-4 ml-auto transition-transform duration-300" />
          )}
        </Button>

        {/* Magic Link Form - Animated */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-out ${
            showMagicLink ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-4 p-4 rounded-lg border border-gray-700/50 bg-gray-900/70 backdrop-blur-sm">
            {/* Warning Notice */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-900/20 border border-amber-700/30">
              <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-200">
                <p className="font-medium mb-1">Limited DevOps Features</p>
                <p className="text-amber-300/80">
                  Magic Link authentication doesn't support GitHub integrations,
                  CI/CD pipelines, and repository management features.
                </p>
              </div>
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">
                Email Address
              </label>
              <Input
                ref={inputRef}
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
              />
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="magic-link-consent"
                checked={magicLinkConsent}
                onChange={(e) => setMagicLinkConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900"
              />
              <label
                htmlFor="magic-link-consent"
                className="text-sm text-gray-300 cursor-pointer"
              >
                I understand that Magic Link has limited DevOps functionality
                compared to GitHub authentication
              </label>
            </div>

            {/* Magic Link Button */}
            <Button
              onClick={handleMagicLinkLogin}
              disabled={
                isLoading || !email || !magicLinkConsent || magicLoading
              }
              className={`w-full gap-2 rounded-lg py-3 font-medium transition-all duration-300 ${
                !email || !magicLinkConsent
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              <Link className="h-5 w-5" />
              {magicLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending Magic Link...
                </div>
              ) : (
                "Send Magic Link"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-xs text-center text-gray-400 mt-4">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
