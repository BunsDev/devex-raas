import { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <div className="w-full relative">
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          {children}
          <Analytics />
          <Toaster richColors style={{}} />
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}
