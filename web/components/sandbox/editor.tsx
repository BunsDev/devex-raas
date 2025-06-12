import React, { useRef, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Play,
  Save,
  Settings,
  Download,
  Upload,
  Maximize2,
  Minimize2,
} from "lucide-react";

// Dynamically import Monaco Editor (SSR disabled)
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-900" />,
});

interface Theme {
  value: string;
  label: string;
}

const CodeEditor: React.FC = () => {
  const editorRef = useRef<any>(null);
  const [language, setLanguage] = useState<string>("javascript");
  const [theme, setTheme] = useState<string>("vs-dark");
  const [fontSize, setFontSize] = useState<number>(14);
  const [editor, setEditor] = useState<any>(null);
  const [wordWrap, setWordWrap] = useState<"off" | "on" | "wordWrapColumn">(
    "off",
  );
  const [minimap, setMinimap] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [code, setCode] = useState<string>(`// Welcome to your Cloud IDE Editor
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci sequence:');
for (let i = 0; i < 10; i++) {
  console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}`);

  // Supported languages and themes
  const languages = useMemo(
    () => [
      "javascript",
      "typescript",
      "python",
      "java",
      "cpp",
      "c",
      "csharp",
      "php",
      "ruby",
      "go",
      "rust",
      "swift",
      "kotlin",
      "html",
      "css",
      "json",
    ],
    [],
  );

  const themes: Theme[] = useMemo(
    () => [
      { value: "vs", label: "Light" },
      { value: "vs-dark", label: "Dark" },
      { value: "hc-black", label: "High Contrast Dark" },
    ],
    [],
  );

  // Editor options memoized to prevent unnecessary re-renders
  const editorOptions = useMemo(
    () => ({
      fontSize,
      wordWrap,
      minimap: { enabled: minimap },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      bracketPairColorization: { enabled: true },
      suggest: { showKeywords: true, showSnippets: true },
      quickSuggestions: true,
      cursorBlinking: "smooth",
      cursorSmoothCaretAnimation: true,
      folding: true,
      lineNumbers: "on",
    }),
    [fontSize, wordWrap, minimap],
  );
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const content = e.target?.result as string;
        setCode(content);
        if (editor) {
          editor.setValue(content);
        }
        // Try to detect language from file extension
        const ext = file.name.split(".").pop()?.toLowerCase();
        const detectedLang = detectLanguageFromExtension(ext);
        if (detectedLang) {
          setLanguage(detectedLang);
        }
      };
      reader.readAsText(file);
    }
  };

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      cpp: "cpp",
      c: "c",
      csharp: "cs",
      php: "php",
      ruby: "rb",
      go: "go",
      rust: "rs",
      swift: "swift",
      kotlin: "kt",
      html: "html",
      css: "css",
      json: "json",
      xml: "xml",
      yaml: "yml",
      markdown: "md",
    };
    return extensions[lang] || "txt";
  };

  const detectLanguageFromExtension = (
    ext: string | undefined,
  ): string | undefined => {
    if (!ext) return undefined;

    const langMap: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      py: "python",
      java: "java",
      cpp: "cpp",
      c: "c",
      cs: "csharp",
      php: "php",
      rb: "ruby",
      go: "go",
      rs: "rust",
      swift: "swift",
      kt: "kotlin",
      html: "html",
      css: "css",
      json: "json",
      xml: "xml",
      yml: "yaml",
      md: "markdown",
    };
    return langMap[ext];
  };

  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;

    // Add custom key bindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    editor.addCommand(monaco.KeyCode.F5, () => {
      handleRun();
    });
  }, []);

  const handleSave = useCallback((): void => {
    console.log("Saving file...", {
      language,
      code: code.substring(0, 100) + "...",
    });
  }, [code, language]);

  const handleRun = useCallback((): void => {
    console.log("Running code...", {
      language,
      code: code.substring(0, 100) + "...",
    });
  }, [code, language]);

  const handleDownload = useCallback((): void => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${getFileExtension(language)}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, language]);

  // Rest of helper functions (getFileExtension, detectLanguageFromExtension) remain the same

  const formatCode = useCallback((): void => {
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument").run();
    }
  }, []);

  const toggleFullscreen = useCallback((): void => {
    setIsFullscreen((prev) => !prev);
  }, []);

  return (
    <div
      className={`flex flex-col bg-gray-900 text-white border border-gray-700 rounded-lg overflow-hidden ${isFullscreen ? "fixed inset-0 z-50" : "h-full"}`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-800 border-b border-gray-700 p-2">
        <div className="flex items-center space-x-2">
          <select
            value={language}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setLanguage(e.target.value)
            }
            className="bg-gray-700 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>

          <div className="h-4 w-px bg-gray-600"></div>

          <button
            onClick={handleRun}
            className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm transition-colors"
            title="Run Code (F5)"
          >
            <Play size={14} />
            <span>Run</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-sm transition-colors"
            title="Save (Ctrl+S)"
          >
            <Save size={14} />
            <span>Save</span>
          </button>

          <button
            onClick={formatCode}
            className="bg-gray-600 hover:bg-gray-700 px-2 py-1 rounded text-sm transition-colors"
            title="Format Code (Shift+Alt+F)"
          >
            Format
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownload}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Download"
          >
            <Download size={16} />
          </button>

          <label
            className="p-1 hover:bg-gray-700 rounded transition-colors cursor-pointer"
            title="Upload"
          >
            <Upload size={16} />
            <input
              type="file"
              onChange={handleUpload}
              className="hidden"
              accept=".js,.ts,.py,.java,.cpp,.c,.cs,.php,.rb,.go,.rs,.swift,.kt,.html,.css,.json,.xml,.yml,.md,.txt"
            />
          </label>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 border-b border-gray-700 p-3 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-300 mb-1">Theme</label>
              <select
                value={theme}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setTheme(e.target.value)
                }
                className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                {themes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">
                Font Size
              </label>
              <input
                type="range"
                min="10"
                max="24"
                value={fontSize}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFontSize(parseInt(e.target.value))
                }
                className="w-full"
              />
              <div className="text-xs text-gray-400 text-center">
                {fontSize}px
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-300 mb-1">
                Word Wrap
              </label>
              <select
                value={wordWrap}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setWordWrap(e.target.value as "off" | "on" | "wordWrapColumn")
                }
                className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="off">Off</option>
                <option value="on">On</option>
                <option value="wordWrapColumn">Viewport</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={minimap}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setMinimap(e.target.checked)
                  }
                  className="rounded"
                />
                <span>Minimap</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 relative">
        <MonacoEditor
          height="100%"
          language={language}
          theme={theme}
          value={code}
          onChange={(newValue) => setCode(newValue || "")}
          options={editorOptions}
          onMount={handleEditorMount}
        />
      </div>

      {/* Status Bar - unchanged from original */}
    </div>
  );
};

export default CodeEditor;
