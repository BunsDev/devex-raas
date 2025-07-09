"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, X } from "lucide-react";
import Link from "next/link";
import { getHref } from "@/lib/docs/utils";

interface SearchResult {
  path: string;
  name: string;
}

const DocsSearchClient: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const searchDocs = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      setIsSearching(true);
      const response = await fetch(
        `/api/docs/search?q=${encodeURIComponent(query)}`,
      );
      const data = await response.json();

      if (data.results) {
        setSearchResults(data.results);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Error searching docs:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchDocs(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => searchQuery && setShowResults(true)}
          className="w-64 pl-10 pr-10 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-zinc-400" />
        )}
        {!isSearching && searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400 hover:text-zinc-300"
          >
            <X />
          </button>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs text-zinc-400 mb-2 px-2">
              {searchResults.length} result
              {searchResults.length !== 1 ? "s" : ""}
            </div>
            {searchResults.map((result, index) => (
              <Link
                key={index}
                href={getHref(result.path)}
                onClick={() => setShowResults(false)}
                className="block px-3 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
              >
                <div className="font-medium">{result.name}</div>
                <div className="text-xs text-zinc-500 mt-1">{result.path}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocsSearchClient;
