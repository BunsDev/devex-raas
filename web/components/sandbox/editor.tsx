import React, { useEffect, useRef, useState } from "react";
import {
  Play,
  Save,
  Settings,
  Download,
  Upload,
  Maximize2,
  Minimize2,
} from "lucide-react";

// Types for Monaco Editor
declare global {
  interface Window {
    monaco: any;
    require: any;
  }
}

interface Theme {
  value: string;
  label: string;
}

const CodeEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<any>(null);
  const [editor, setEditor] = useState<any>(null);
  const [language, setLanguage] = useState<string>("javascript");
  const [theme, setTheme] = useState<string>("vs-dark");
  const [fontSize, setFontSize] = useState<number>(14);
  const [wordWrap, setWordWrap] = useState<"off" | "on" | "wordWrapColumn">(
    "off",
  );
  const [minimap, setMinimap] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [code, setCode] = useState<string>(`// Welcome to your Cloud IDE Editor
// This editor supports syntax highlighting, autocomplete, error detection, and more!

function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// Try typing to see autocomplete in action
console.log('Fibonacci sequence:');
for (let i = 0; i < 10; i++) {
    console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}

// The editor supports:
// ✓ Syntax highlighting for 40+ languages
// ✓ IntelliSense and autocomplete
// ✓ Error highlighting and diagnostics
// ✓ Multi-cursor editing (Ctrl+Click)
// ✓ Code folding
// ✓ Find and replace (Ctrl+F)
// ✓ Command palette (F1)
// ✓ Format document (Shift+Alt+F)
`);

  // Supported languages
  const languages: string[] = [
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
    "scala",
    "html",
    "css",
    "scss",
    "less",
    "json",
    "xml",
    "yaml",
    "markdown",
    "sql",
    "shell",
    "powershell",
    "dockerfile",
    "graphql",
    "lua",
    "perl",
    "r",
    "dart",
    "elixir",
    "haskell",
    "clojure",
    "fsharp",
    "vb",
  ];

  const themes: Theme[] = [
    { value: "vs", label: "Light" },
    { value: "vs-dark", label: "Dark" },
    { value: "hc-black", label: "High Contrast Dark" },
    { value: "hc-light", label: "High Contrast Light" },
  ];

  useEffect(() => {
    // Load Monaco Editor
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js";
    script.onload = () => {
      window.require.config({
        paths: {
          vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs",
        },
      });

      window.require(["vs/editor/editor.main"], () => {
        if (editorRef.current) {
          const monacoEditor = window.monaco.editor.create(editorRef.current, {
            value: code,
            language: language,
            theme: theme,
            fontSize: fontSize,
            wordWrap: wordWrap,
            minimap: { enabled: minimap },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: "selection",
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
              showFunctions: true,
              showConstructors: true,
              showFields: true,
              showVariables: true,
              showClasses: true,
              showStructs: true,
              showInterfaces: true,
              showModules: true,
              showProperties: true,
              showEvents: true,
              showOperators: true,
              showUnits: true,
              showValues: true,
              showConstants: true,
              showEnums: true,
              showEnumMembers: true,
              showColors: true,
              showFiles: true,
              showReferences: true,
              showFolders: true,
              showTypeParameters: true,
            },
            quickSuggestions: {
              other: true,
              comments: true,
              strings: true,
            },
            parameterHints: { enabled: true },
            hover: { enabled: true },
            contextmenu: true,
            mouseWheelZoom: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: true,
            smoothScrolling: true,
            folding: true,
            foldingHighlight: true,
            showFoldingControls: "always",
            matchBrackets: "always",
            glyphMargin: true,
            lineNumbers: "on",
            lineNumbersMinChars: 3,
            renderLineHighlight: "all",
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: "line",
            accessibilitySupport: "auto",
            links: true,
            colorDecorators: true,
            codeLens: true,
            lightbulb: { enabled: true },
          });

          // Add custom key bindings
          monacoEditor.addCommand(
            window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KeyS,
            () => {
              handleSave();
            },
          );

          monacoEditor.addCommand(window.monaco.KeyCode.F5, () => {
            handleRun();
          });

          // Listen for content changes
          monacoEditor.onDidChangeModelContent(() => {
            setCode(monacoEditor.getValue());
          });

          setEditor(monacoEditor);
          monacoRef.current = window.monaco;
        }
      });
    };
    document.head.appendChild(script);

    return () => {
      if (editor) {
        editor.dispose();
      }
    };
  }, []);

  // Update editor when settings change
  useEffect(() => {
    if (editor && monacoRef.current) {
      const model = editor.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, language);
      }
    }
  }, [language, editor]);

  useEffect(() => {
    if (editor) {
      editor.updateOptions({
        theme: theme,
        fontSize: fontSize,
        wordWrap: wordWrap,
        minimap: { enabled: minimap },
      });
    }
  }, [theme, fontSize, wordWrap, minimap, editor]);

  const handleSave = (): void => {
    // Implement save functionality
    console.log("Saving file...", {
      language,
      code: code.substring(0, 100) + "...",
    });
    // You can emit an event or call a parent function here
  };

  const handleRun = (): void => {
    // Implement run functionality
    console.log("Running code...", {
      language,
      code: code.substring(0, 100) + "...",
    });
    // You can emit an event or call a parent function here
  };

  const handleDownload = (): void => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${getFileExtension(language)}`;
    a.click();
    URL.revokeObjectURL(url);
  };

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

  const formatCode = (): void => {
    if (editor) {
      editor.getAction("editor.action.formatDocument").run();
    }
  };

  const toggleFullscreen = (): void => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={`flex flex-col bg-gray-900 text-white border border-gray-700 rounded-lg overflow-hidden ${isFullscreen ? "fixed inset-0 z-50" : "h-96"}`}
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
        <div
          ref={editorRef}
          className="w-full h-full"
          style={{ minHeight: isFullscreen ? "calc(100vh - 120px)" : "300px" }}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-3 py-1 text-xs text-gray-300 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span>Language: {language}</span>
          <span>Lines: {code.split("\n").length}</span>
          <span>Characters: {code.length}</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>UTF-8</span>
          <span>LF</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
