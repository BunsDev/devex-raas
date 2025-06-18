"use client";
import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Play,
  Trash2,
  Folder,
  Clock,
  Zap,
  Filter,
  MoreVertical,
  Code,
  Server,
  Activity,
  GitBranch,
  ExternalLink,
} from "lucide-react";

// Types definition
interface StoredRepl {
  id: string;
  name: string;
  user: string;
}

const templates = {
  "node-js": {
    key: "templates/node-js",
    name: "Node.js",
    description: "JavaScript runtime environment",
    icon: "🟢",
    color: "bg-green-500",
  },
  python: {
    key: "templates/python",
    name: "Python",
    description: "High-level programming language",
    icon: "🐍",
    color: "bg-blue-500",
  },
};

interface ReplDashboardProps {
  userName: string;
  getRepls: () => Promise<StoredRepl[]>;
  createRepl: (templateKey: string, replName: string) => Promise<void>;
  startRepl: (replId: string) => Promise<void>;
  deleteRepl: (replId: string) => Promise<void>;
}

const GuiInterface: React.FC<ReplDashboardProps> = ({
  userName,
  getRepls,
  createRepl,
  startRepl,
  deleteRepl,
}) => {
  const [repls, setRepls] = useState<StoredRepl[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [newReplName, setNewReplName] = useState("");
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<{
    [key: string]: "starting" | "deleting" | null;
  }>({});

  useEffect(() => {
    loadRepls();
  }, []);

  const loadRepls = async () => {
    try {
      setLoading(true);
      const replList = await getRepls();
      setRepls(replList);
    } catch (error) {
      console.error("Error loading repls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepl = async () => {
    if (!newReplName.trim() || !selectedTemplate) return;

    try {
      setCreating(true);
      const template = templates[selectedTemplate as keyof typeof templates];
      await createRepl(template.key, newReplName.trim());
      await loadRepls();
      setShowCreateModal(false);
      setNewReplName("");
      setSelectedTemplate("");
    } catch (error) {
      console.error("Error creating repl:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleStartRepl = async (replId: string) => {
    try {
      setActionLoading({ ...actionLoading, [replId]: "starting" });
      await startRepl(replId);
      await loadRepls();
    } catch (error) {
      console.error("Error starting repl:", error);
    } finally {
      setActionLoading({ ...actionLoading, [replId]: null });
    }
  };

  const handleDeleteRepl = async (replId: string) => {
    try {
      setActionLoading({ ...actionLoading, [replId]: "deleting" });
      await deleteRepl(replId);
      await loadRepls();
    } catch (error) {
      console.error("Error deleting repl:", error);
    } finally {
      setActionLoading({ ...actionLoading, [replId]: null });
    }
  };

  const filteredRepls = repls.filter((repl) =>
    repl.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getTemplateFromRepl = (repl: StoredRepl) => {
    // Simple heuristic to determine template based on repl name or other properties
    const replName = repl.name.toLowerCase();
    if (replName.includes("node") || replName.includes("js")) {
      return templates["node-js"];
    }
    if (replName.includes("python") || replName.includes("py")) {
      return templates.python;
    }
    return templates["node-js"]; // default
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Code className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">devX Cloud</h1>
                  <p className="text-sm text-gray-400">
                    Welcome back, {userName}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search repls..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64"
                />
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors duration-200 font-medium"
              >
                <Plus className="w-4 h-4" />
                New Repl
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Repls</p>
                <p className="text-2xl font-bold text-white">{repls.length}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <Folder className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Sessions</p>
                <p className="text-2xl font-bold text-white">
                  {repls.filter((r) => r.id).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Templates Used</p>
                <p className="text-2xl font-bold text-white">
                  {Object.keys(templates).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Repls Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Your Repls</h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="w-4 h-4" />
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 animate-pulse"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-24 h-4 bg-gray-700 rounded"></div>
                    <div className="w-4 h-4 bg-gray-700 rounded"></div>
                  </div>
                  <div className="w-full h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="w-3/4 h-4 bg-gray-700 rounded mb-4"></div>
                  <div className="flex gap-2">
                    <div className="w-20 h-8 bg-gray-700 rounded"></div>
                    <div className="w-20 h-8 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredRepls.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Folder className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {searchQuery ? "No repls found" : "No repls yet"}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchQuery
                  ? `No repls match "${searchQuery}"`
                  : "Create your first repl to get started"}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors duration-200 font-medium mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create New Repl
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRepls.map((repl) => {
                const template = getTemplateFromRepl(repl);
                return (
                  <div
                    key={repl.id}
                    className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors duration-200 group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center text-white font-bold`}
                        >
                          {template.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white truncate">
                            {repl.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {template.name}
                          </p>
                        </div>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 hover:bg-gray-800 rounded-lg">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-400 mb-2">
                        Created by {repl.user}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <GitBranch className="w-3 h-3" />
                        <span>ID: {repl.id}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStartRepl(repl.id)}
                        disabled={actionLoading[repl.id] === "starting"}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 font-medium text-sm flex-1"
                      >
                        {actionLoading[repl.id] === "starting" ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Starting...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" />
                            Start
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteRepl(repl.id)}
                        disabled={actionLoading[repl.id] === "deleting"}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 font-medium text-sm"
                      >
                        {actionLoading[repl.id] === "deleting" ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Repl Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Create New Repl
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white transition-colors duration-200"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Repl Name
                </label>
                <input
                  type="text"
                  value={newReplName}
                  onChange={(e) => setNewReplName(e.target.value)}
                  placeholder="Enter repl name..."
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Choose Template
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(templates).map(([key, template]) => (
                    <div
                      key={key}
                      onClick={() => setSelectedTemplate(key)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors duration-200 ${
                        selectedTemplate === key
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 ${template.color} rounded-lg flex items-center justify-center text-white font-bold`}
                        >
                          {template.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-white">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRepl}
                disabled={!newReplName.trim() || !selectedTemplate || creating}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 font-medium flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Repl
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuiInterface;
