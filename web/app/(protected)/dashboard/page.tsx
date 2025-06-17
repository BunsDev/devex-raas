"use client";

import { useState, useEffect } from "react";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { CoreService } from "@/lib/auth";

export default function DashboardPage() {
  const [protectedData, setProtectedData] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const authService = CoreService.getInstance();

  const fetchProtectedData = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await authService.authFetch("/api/v1/repl/test");

      if (!response.ok) {
        throw new Error("Failed to fetch protected data");
      }

      const data = await response.json();
      setProtectedData(data.message);
    } catch (err) {
      setError("Failed to fetch protected data");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                  Dashboard
                </h1>

                <div className="space-y-4">
                  <div>
                    <button
                      onClick={fetchProtectedData}
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "Loading..." : "Fetch Protected Data"}
                    </button>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                      <div className="text-sm text-red-600">{error}</div>
                    </div>
                  )}

                  {protectedData && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                      <div className="text-sm text-green-600">
                        {protectedData}
                      </div>
                    </div>
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
