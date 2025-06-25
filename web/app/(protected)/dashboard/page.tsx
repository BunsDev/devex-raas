"use client";

import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import GuiInterface from "@/components/dashboard/GuiInterface";
import TerminalInterface from "@/components/dashboard/TerminalInterface";
import { Button } from "@/components/ui/button";
import LetterGlitch from "@/components/ui/letter-glitch";
import StartReplCard from "@/components/ui/start-repl-card";
import { useAuth } from "@/contexts/AuthContext";
import { CoreService } from "@/lib/core";
import { create } from "domain";
import { Activity, Clock, Code, Terminal, Zap } from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"terminal" | "ui">("terminal");
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

  return (
    <ProtectedRoute>
      {popup && <StartReplCard replName={popup?.replName} link={popup.link} />}
      <div className=" pt-10 text-gray-200">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
        />
        <div className="max-w-7xl mx-auto p-6">
          <div className=" gap-6 mb-8">
            <div className="">
              <div className="h-[650px] flex flex-col">
                <div className="flex-1 flex flex-col bg-black border border-gray-800 rounded-lg overflow-hidden shadow-2xl">
                  <DashboardHeader
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
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

const NavigationTabs = ({
  activeTab,
  setActiveTab,
}: {
  activeTab: "terminal" | "ui";
  setActiveTab: Dispatch<SetStateAction<"terminal" | "ui">>;
}) => {
  return (
    <div className="">
      <div className="flex gap-5 bg-gray-900 rounded-lg">
        <Button
          className={`flex gap-3 justify-center items-center         ${
            activeTab === "terminal"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
              : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          }`}
          onClick={() => setActiveTab("terminal")}
        >
          <Terminal className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-semibold text-gray-200">
            devX Terminal
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Activity className="w-3 h-3" />
            <span>Live</span>
          </div>
        </Button>
        <Button
          onClick={() => setActiveTab("ui")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
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
  setActiveTab: Dispatch<SetStateAction<"terminal" | "ui">>;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-700">
      <div className="flex items-center gap-3">
        <NavigationTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
      </div>
    </div>
  );
}
