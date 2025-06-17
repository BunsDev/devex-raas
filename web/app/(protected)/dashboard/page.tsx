"use client";

import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import TerminalInterface from "@/components/dashboard/TerminalInterface";
import LetterGlitch from "@/components/ui/letter-glitch";
import { useAuth } from "@/contexts/AuthContext";
import { Code, Terminal, Zap } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"terminal" | "ui">("terminal");

  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen text-gray-200">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
        />
        <div className="max-w-7xl mx-auto p-6">
          {/* <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} /> */}

          <div className=" gap-6 mb-8">
            {/* Terminal/Content Area */}
            <div className="">
              <div className="h-[600px]">
                {activeTab === "terminal" && (
                  <TerminalInterface userName={user?.name || "developer"} />
                )}
                {activeTab === "ui" && (
                  <div className="flex items-center justify-center h-full bg-gray-900 border border-gray-700 rounded-lg">
                    <div className="text-center">
                      <div className="p-4 bg-yellow-500/10 rounded-full w-16 h-16 mx-auto mb-4">
                        <Zap className="w-8 h-8 text-yellow-400 mx-auto" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-200 mb-2">
                        GUI Mode (Beta)
                      </h3>
                      <p className="text-gray-400 max-w-md">
                        The visual interface is currently in development. Switch
                        back to Terminal mode for full functionality.
                      </p>
                      <button
                        onClick={() => setActiveTab("terminal")}
                        className="mt-6 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Terminal className="w-4 h-4" />
                        Switch to Terminal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Stats */}
            {/* <div className="lg:col-span-1 space-y-6">
              <StatsCard
                icon={<Folder className="w-5 h-5" />}
                title="Projects"
                value={3}
                subtitle="Active"
                color="bg-emerald-500/10"
              />
              <StatsCard
                icon={<Cpu className="w-5 h-5" />}
                title="CPU"
                value="23%"
                subtitle="Utilization"
                color="bg-blue-500/10"
              />
              <StatsCard
                icon={<HardDrive className="w-5 h-5" />}
                title="Storage"
                value="128GB"
                subtitle="of 512GB"
                color="bg-purple-500/10"
              />
              <SystemMonitor />
            </div> */}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

const NavigationTabs = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: "terminal" | "ui";
  setActiveTab: Dispatch<SetStateAction<"terminal" | "ui">>;
}) => {
  return (
    <div className="mb-6">
      <div className="flex space-x-1 bg-gray-900 border border-gray-700 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("terminal")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === "terminal"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          }`}
        >
          <Terminal className="w-4 h-4" />
          Terminal Interface
        </button>
        <button
          onClick={() => setActiveTab("ui")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 ${
            activeTab === "ui"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          }`}
        >
          <Zap className="w-4 h-4" />
          GUI Mode
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
            Beta
          </span>
        </button>
      </div>
    </div>
  );
};

const DashboardHeader = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Code className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              CloudIDE Dashboard
            </h1>
            <p className="text-gray-400 mt-1">
              Next-Generation Development Environment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-400">Local Time</div>
            <div className="text-lg font-mono text-emerald-400">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};
