"use client";

import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import GuiInterface from "@/components/dashboard/GuiInterface";
import TerminalInterface from "@/components/dashboard/TerminalInterface";
import { Button } from "@/components/ui/button";
import LetterGlitch from "@/components/ui/letter-glitch";
import StartReplCard from "@/components/ui/start-repl-card";
import { useAuth } from "@/contexts/AuthContext";
import { CoreService } from "@/lib/core";
import { Activity, Clock, Terminal, Zap } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function DashboardComponent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("view") === "gui" ? "ui" : "terminal";

  const [popup, setPopup] = useState<{ replName: string; link: string } | null>(
    null,
  );

  const { user } = useAuth();
  const userName = user?.login || "";

  const core = CoreService.getInstance();

  const getRepls = async () => await core.getRepls();
  const createRepl = async (template: string, replName: string) =>
    await core.newRepl({ template, replName, userName });
  const startRepl = async (name: string) => {
    try {
      const response = await core.startRepl(name);
      setPopup({
        replName: response.replName,
        link: `repl/${response.replId}`,
      });
      return response;
    } catch (err) {
      throw err;
    }
  };
  const deleteRepl = async (name: string) => await core.deleteRepl(name);

  useEffect(() => {
    const isMobile = window.innerWidth < 640;
    if (!searchParams.has("view") && isMobile) {
      router.replace(`${pathname}?view=gui`);
    }
  }, [pathname, router, searchParams]);

  const handleTabChange = (tab: "terminal" | "ui") => {
    const view = tab === "ui" ? "gui" : "terminal";
    router.push(`${pathname}?view=${view}`);
  };

  return (
    <ProtectedRoute>
      {popup && (
        <StartReplCard
          replName={popup?.replName}
          link={popup.link}
          onClose={() => setPopup(null)}
        />
      )}
      <div className="min-h-screen pt-16 text-gray-200">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
        />
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="w-full">
              <div className="h-[calc(100vh-6rem)] sm:h-[calc(100vh-8rem)] lg:h-[650px] flex flex-col">
                <div className="flex-1 flex flex-col bg-black border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
                  <DashboardHeader
                    activeTab={activeTab}
                    setActiveTab={handleTabChange}
                  />

                  {activeTab === "terminal" && (
                    <TerminalInterface
                      userName={user?.login.toLowerCase() || "developer"}
                      getRepls={getRepls}
                      createRepl={createRepl}
                      startRepl={startRepl}
                      deleteRepl={deleteRepl}
                    />
                  )}
                  {activeTab === "ui" && (
                    <GuiInterface
                      userName={user?.name || "developer"}
                      getRepls={getRepls}
                      createRepl={createRepl}
                      startRepl={startRepl}
                      deleteRepl={deleteRepl}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardComponent />
    </Suspense>
  );
}

const NavigationTabs = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: "terminal" | "ui";
  setActiveTab: (tab: "terminal" | "ui") => void;
}) => {
  return (
    <div className="w-full sm:w-auto">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-5 bg-gray-900 rounded-lg p-2">
        <Button
          className={`flex gap-2 sm:gap-3 justify-center items-center px-3 sm:px-4 py-2 text-xs sm:text-sm ${
            activeTab === "terminal"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          }`}
          onClick={() => setActiveTab("terminal")}
        >
          <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          <span className="font-semibold text-gray-200 hidden sm:inline">
            devX Terminal
          </span>
          <span className="font-semibold text-gray-200 sm:hidden">
            Terminal
          </span>
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500">
            <Activity className="w-3 h-3" />
            <span>Live</span>
          </div>
        </Button>
        <Button
          onClick={() => setActiveTab("ui")}
          className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
            activeTab === "ui"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          }`}
        >
          <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">GUI Mode</span>
          <span className="sm:hidden">GUI</span>
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1.5 sm:px-2 py-0.5 rounded-full">
            Beta
          </span>
        </Button>
      </div>
    </div>
  );
};

function DashboardHeader({
  activeTab,
  setActiveTab,
}: {
  activeTab: "terminal" | "ui";
  setActiveTab: (tab: "terminal" | "ui") => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 px-3 sm:px-4 py-3 bg-gray-900 border-b border-gray-700">
      <div className="w-full sm:w-auto">
        <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span className="hidden sm:inline">
            {new Date().toLocaleTimeString()}
          </span>
          <span className="sm:hidden">
            {new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        <div className="flex gap-1.5 sm:gap-2">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
        </div>
      </div>
    </div>
  );
}