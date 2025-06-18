"use client";

import {
  ChevronRight,
  Code,
  Zap,
  Cloud,
  GitBranch,
  Play,
  Terminal,
  Layers,
} from "lucide-react";
import React, { useState, useEffect } from "react";

function DemoTerminals() {
  const [currentCode, setCurrentCode] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const codeSnippets = [
    {
      language: "JavaScript",
      code: `const app = express();\napp.get('/', (req, res) => {\n  res.send('Hello World!');\n});`,
      color: "text-yellow-400",
    },
    {
      language: "Python",
      code: `def hello_world():\n    print("Hello from Devex!")\n    return "Ready to code"`,
      color: "text-blue-400",
    },
    {
      language: "Go",
      code: `package main\n\nfunc main() {\n    fmt.Println("Deploy anywhere")\n}`,
      color: "text-cyan-400",
    },
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentCode((prev) => (prev + 1) % codeSnippets.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
      {/* Right Column - Code Demo */}
      <div
        className={`relative transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        {/* Terminal Window */}
        <div className="relative bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-800/50 border-b border-white/10">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <Terminal className="w-4 h-4" />
              <span>
                repl-{Math.random().toString(36).substr(2, 8)}.devex.cloud
              </span>
            </div>
          </div>

          {/* Code Content */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Code className="w-5 h-5 text-emerald-400" />
                <span className="text-white font-medium">
                  {codeSnippets[currentCode].language}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-sm">Live</span>
              </div>
            </div>

            {/* Code Block */}
            <div className="bg-black/40 rounded-lg p-4 font-mono text-sm">
              <pre
                className={`${codeSnippets[currentCode].color} transition-all duration-500`}
              >
                {codeSnippets[currentCode].code}
              </pre>
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                  Deployed
                </span>
                <span>Build: 2.3s</span>
                <span>Memory: 128MB</span>
              </div>
              <button className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-md transition-colors duration-200">
                Open Preview
              </button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-400 rounded-full animate-bounce delay-1000" />
        <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-blue-400 rounded-full animate-bounce delay-2000" />
      </div>
    </div>
  );
}
