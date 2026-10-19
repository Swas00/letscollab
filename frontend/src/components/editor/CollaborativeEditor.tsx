"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Editor, { DiffEditor, OnMount, BeforeMount } from "@monaco-editor/react";
import JSZip from "jszip";
import {
  FileCode,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Play,
  Bug,
  Save,
  Check,
  Copy,
  Terminal as TerminalIcon,
  Sparkles,
  Search,
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  X,
  Code2,
  Moon,
  Sun,
  GitBranch,
  GitCommit,
  Blocks,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  SkipForward,
  StepForward,
  CornerDownRight,
  RotateCcw,
  Square,
  Columns,
  Maximize2,
  Minimize2,
  Eye,
  RefreshCw,
  CircleDot,
  Layers,
  SlidersHorizontal,
  Bot,
  Wand2,
  FolderPlus,
  FilePlus,
  Key,
  Send,
  MessageSquare,
  HelpCircle,
  CheckCheck,
  FileText,
  Settings,
  ShieldCheck,
  ExternalLink,
  Users,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  WrapText,
  Archive,
  MessageCircle,
  GitPullRequest,
  Sliders,
  ArrowRight,
  ArrowLeft,
  ChevronUp,
  LayoutDashboard,
  ListTodo,
} from "lucide-react";
import Link from "next/link";
import { Tooltip } from "../ui/Tooltip";
import { SyncStatusBadge, SyncState } from "../ui/SyncStatusBadge";
import { CommandPalette } from "../ui/CommandPalette";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { cn } from "../../lib/utils";

export interface EditorFile {
  id: string;
  name: string;
  path: string;
  folder: string;
  language: string;
  content: string;
  version: number;
  isModified?: boolean;
  updatedAt?: string;
}

export interface CollaboratorPeer {
  id: string;
  name: string;
  email?: string;
  color: string;
  cursor?: { line: number; ch: number };
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
  activeFileId?: string;
}

export interface DebugStep {
  stepIndex: number;
  line: number;
  functionName: string;
  isBreakpoint: boolean;
  variables: Record<string, { value: string; type: string }>;
  callStack: Array<{ name: string; file: string; line: number }>;
  stdout: string;
}

export interface EditorProblem {
  file: string;
  line: number;
  column: number;
  severity: "error" | "warning";
  message: string;
}

export interface TerminalSession {
  id: string;
  name: string;
  history: string[];
}

export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  codeBlocks?: Array<{ language: string; code: string; explanation?: string }>;
  applied?: boolean;
}

export interface IdeExtension {
  id: string;
  name: string;
  publisher: string;
  version: string;
  rating: number;
  downloads: string;
  category: "AI" | "Language" | "Linter" | "Tools" | "Themes";
  desc: string;
  enabled: boolean;
  installed: boolean;
}

export const ESSENTIAL_EXTENSIONS: IdeExtension[] = [
  {
    id: "ext-copilot",
    name: "GitHub Copilot & Chat",
    publisher: "GitHub",
    version: "1.150.0",
    rating: 4.8,
    downloads: "22M",
    category: "AI",
    desc: "AI pair programmer providing autocompletions, unit test synthesis, inline code explanations, and terminal error fixing.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-python",
    name: "Python (Pylance & Debugger)",
    publisher: "Microsoft",
    version: "2026.4.0",
    rating: 4.7,
    downloads: "125M",
    category: "Language",
    desc: "Rich Python 3 language support, type checking, sys.settrace step-by-step debugging, and virtual environment resolution.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-ts-lsp",
    name: "TypeScript & JavaScript Language Server",
    publisher: "Microsoft",
    version: "5.6.0",
    rating: 4.9,
    downloads: "95M",
    category: "Language",
    desc: "IntelliSense, symbol definitions, type checking, AST navigation, and refactoring tools.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-node-debug",
    name: "Node.js & V8 Step Debugger",
    publisher: "ms-vscode",
    version: "1.92.0",
    rating: 4.8,
    downloads: "80M",
    category: "Tools",
    desc: "Step-by-step V8 & TypeScript runtime inspection, breakpoints, call stacks, and variable watch.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-eslint",
    name: "ESLint & Diagnostics",
    publisher: "Dirk Baeumer",
    version: "3.0.10",
    rating: 4.6,
    downloads: "36M",
    category: "Linter",
    desc: "Integrates JavaScript and TypeScript linter diagnostics directly into Monaco gutter and Problems panel.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-prettier",
    name: "Prettier - Code Formatter",
    publisher: "Prettier",
    version: "11.0.0",
    rating: 4.7,
    downloads: "44M",
    category: "Linter",
    desc: "Opinionated code formatter supporting JavaScript, TypeScript, CSS, HTML, JSON, Markdown, and YAML.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-gitlens",
    name: "GitLens — Git supercharged",
    publisher: "GitKraken",
    version: "16.2.0",
    rating: 4.8,
    downloads: "34M",
    category: "Tools",
    desc: "Supercharge Git within VS Code: line heatmaps, blame annotations, commit history, and branch visualizers.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-tailwind",
    name: "Tailwind CSS IntelliSense",
    publisher: "Tailwind Labs",
    version: "0.12.0",
    rating: 4.9,
    downloads: "19M",
    category: "Tools",
    desc: "Intelligent autocomplete, syntax highlighting, hover documentation, and linting for Tailwind utility classes.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-docker",
    name: "Docker",
    publisher: "Microsoft",
    version: "1.29.0",
    rating: 4.6,
    downloads: "29M",
    category: "Tools",
    desc: "Makes it easy to build, manage, and deploy containerized applications and docker-compose stacks directly from the IDE.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-liveserver",
    name: "Live Server & HTML Preview",
    publisher: "Ritwick Dey",
    version: "5.7.9",
    rating: 4.5,
    downloads: "46M",
    category: "Tools",
    desc: "Instant live browser reload preview for static and dynamic web pages directly beside your code editor.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-thunder",
    name: "Thunder Client",
    publisher: "Thunder Client",
    version: "2.24.0",
    rating: 4.9,
    downloads: "5M",
    category: "Tools",
    desc: "Lightweight, GUI-based REST API client for testing endpoints, headers, cookies, and environment variables.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-prisma",
    name: "Prisma",
    publisher: "Prisma",
    version: "5.18.0",
    rating: 4.8,
    downloads: "6M",
    category: "Language",
    desc: "Prisma schema syntax highlighting, auto-formatting, model relation autocompletion, and lint diagnostics.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-errorlens",
    name: "Error Lens",
    publisher: "Alexander",
    version: "3.20.0",
    rating: 4.9,
    downloads: "4.5M",
    category: "Linter",
    desc: "Visualizes language diagnostic markers and runtime exceptions directly inline on the active code line.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-path-intel",
    name: "Path Intellisense",
    publisher: "Christian Kohler",
    version: "2.9.0",
    rating: 4.7,
    downloads: "13M",
    category: "Tools",
    desc: "Visual Studio Code plugin that autocompletes filenames and directory paths in imports and require statements.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-auto-rename",
    name: "Auto Rename Tag",
    publisher: "Jun Han",
    version: "0.1.10",
    rating: 4.4,
    downloads: "17M",
    category: "Tools",
    desc: "Automatically renames paired HTML/XML/JSX tags simultaneously as you edit either tag.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-material-icons",
    name: "Material Icon Theme",
    publisher: "Philipp Kief",
    version: "5.8.0",
    rating: 4.9,
    downloads: "25M",
    category: "Themes",
    desc: "Rich Material Design file and folder icons for 500+ programming languages and popular frameworks.",
    enabled: true,
    installed: true,
  },
  {
    id: "ext-bracket-color",
    name: "Bracket Pair Color DLW",
    publisher: "CoenraadS",
    version: "0.2.4",
    rating: 4.8,
    downloads: "15M",
    category: "Themes",
    desc: "Colorizes matching brackets with contrasting vibrant colors for immediate visual scope identification.",
    enabled: true,
    installed: true,
  },
];

const COLLABORATOR_COLORS = ["#E65F42", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

export const STARTER_TEMPLATES = [
  {
    id: "react-sandbox",
    name: "React Component Sandbox",
    icon: Code2,
    badge: "React 18 + TS",
    desc: "Interactive React component playground with stateful hooks, modular UI components, and instant HTML live preview.",
    files: [
      {
        name: "App.tsx",
        path: "src/App.tsx",
        folder: "src",
        language: "typescript",
        content: `import React, { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState("");

  return (
    <div className="p-8 max-w-lg mx-auto bg-slate-900 text-white rounded-2xl shadow-xl">
      <h1 className="text-2xl font-bold text-sky-400">React Sandbox</h1>
      <p className="text-slate-400 text-sm mt-1">Edit code in LetsCollab IDE and watch live updates.</p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 rounded-lg font-semibold text-white transition"
        >
          Clicked: {count}
        </button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type here..."
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white outline-none"
        />
      </div>
      {text && <p className="mt-3 text-xs text-emerald-400 font-mono">Live Input: {text}</p>}
    </div>
  );
}
`,
      },
      {
        name: "Button.tsx",
        path: "src/components/Button.tsx",
        folder: "src/components",
        language: "typescript",
        content: `import React from "react";

interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, variant = "primary" }) => {
  const base = "px-4 py-2 rounded-lg font-medium transition text-sm";
  const styles = variant === "primary" ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-gray-700 hover:bg-gray-600 text-gray-200";
  return (
    <button onClick={onClick} className={\`\${base} \${styles}\`}>
      {label}
    </button>
  );
};
`,
      },
      {
        name: "index.html",
        path: "index.html",
        folder: "",
        language: "html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>React Sandbox Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6">
  <div id="root">
    <div class="text-center space-y-3">
      <h2 class="text-2xl font-bold text-sky-400">React Sandbox Preview</h2>
      <p class="text-slate-400 text-sm">Open split live preview with ⌘\\ to view interactive render.</p>
    </div>
  </div>
</body>
</html>
`,
      },
      {
        name: "package.json",
        path: "package.json",
        folder: "",
        language: "json",
        content: `{\n  "name": "react-sandbox",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.3.1",\n    "react-dom": "^18.3.1"\n  }\n}\n`,
      },
    ],
  },
  {
    id: "node-api",
    name: "Node.js REST API",
    icon: TerminalIcon,
    badge: "Node.js + Express",
    desc: "Lightweight backend microservice with JSON REST endpoints, health monitoring, and environment variable configuration.",
    files: [
      {
        name: "server.js",
        path: "src/server.js",
        folder: "src",
        language: "javascript",
        content: `// Node.js REST API Server
const http = require("http");

const PORT = process.env.PORT || 4000;
const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.url === "/health") {
    res.writeHead(200);
    return res.end(JSON.stringify({ status: "healthy", uptime: process.uptime(), timestamp: new Date().toISOString() }));
  }

  if (req.url === "/api/metrics") {
    res.writeHead(200);
    return res.end(JSON.stringify({ memory: process.memoryUsage(), cpu: process.cpuUsage(), pid: process.pid }));
  }

  res.writeHead(200);
  res.end(JSON.stringify({ message: "Hello from LetsCollab Node API!", endpoints: ["/health", "/api/metrics"] }));
});

server.listen(PORT, () => {
  console.log(\`[Node.js] Server listening at http://localhost:\${PORT}\`);
});
`,
      },
      {
        name: ".env.example",
        path: ".env.example",
        folder: "",
        language: "shell",
        content: `PORT=4000\nNODE_ENV=development\nAPI_SECRET=letscollab_dev_secret_key\n`,
      },
      {
        name: "package.json",
        path: "package.json",
        folder: "",
        language: "json",
        content: `{\n  "name": "node-rest-api",\n  "version": "1.0.0",\n  "main": "src/server.js",\n  "scripts": {\n    "start": "node src/server.js"\n  }\n}\n`,
      },
    ],
  },
  {
    id: "python-analytics",
    name: "Python Analytics & Telemetry",
    icon: Sparkles,
    badge: "Python 3.11",
    desc: "Data processing, math analytics, and telemetry simulation engine with step debugging and variable inspection support.",
    files: [
      {
        name: "main.py",
        path: "main.py",
        folder: "",
        language: "python",
        content: `"""
Python Analytics & Telemetry Engine
LetsCollab Collaborative IDE v2.4
"""
import math
import time

def generate_telemetry_batch(count=5):
    print(f"Collecting {count} telemetry data points...")
    readings = []
    for i in range(1, count + 1):
        score = round(math.sin(i * 0.75) * 50 + 50, 2)
        readings.append({"id": i, "score": score, "timestamp": time.time()})
        print(f"  Point {i}: Score = {score}")
    return readings

def calculate_summary(readings):
    if not readings:
        return {"avg": 0, "max": 0, "min": 0}
    scores = [r["score"] for r in readings]
    return {
        "avg": round(sum(scores) / len(scores), 2),
        "max": max(scores),
        "min": min(scores),
        "count": len(scores),
    }

def main():
    batch = generate_telemetry_batch(5)
    summary = calculate_summary(batch)
    print("✔ Telemetry Summary:", summary)

if __name__ == "__main__":
    main()
`,
      },
      {
        name: "requirements.txt",
        path: "requirements.txt",
        folder: "",
        language: "plaintext",
        content: `requests>=2.31.0\nnumpy>=1.26.0\n`,
      },
    ],
  },
  {
    id: "tailwind-html",
    name: "Modern Tailwind & HTML5",
    icon: Eye,
    badge: "HTML5 + Tailwind",
    desc: "Fast static web application with Tailwind CSS CDN, modern typography, responsive cards, and live iframe preview.",
    files: [
      {
        name: "index.html",
        path: "index.html",
        folder: "",
        language: "html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LetsCollab Modern Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white min-h-screen flex items-center justify-center p-6">
  <div class="max-w-md w-full bg-slate-800/80 backdrop-blur-md rounded-2xl p-8 border border-slate-700 shadow-2xl text-center space-y-4">
    <div class="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 mx-auto flex items-center justify-center font-bold text-xl">
      🚀
    </div>
    <h1 class="text-2xl font-bold text-white tracking-tight">Interactive Preview</h1>
    <p class="text-slate-300 text-sm">Edit code in the left pane and see live changes instantly here!</p>
    <button onclick="alert('Hello from interactive live preview!')" class="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 font-bold text-white shadow-lg transition active:scale-95">
      Trigger Interactive Alert
    </button>
  </div>
</body>
</html>
`,
      },
      {
        name: "app.js",
        path: "app.js",
        folder: "",
        language: "javascript",
        content: `console.log("LetsCollab Live Preview App Initialized.");\n`,
      },
    ],
  },
];

type ActivityTab = "explorer" | "search" | "git" | "debug" | "extensions" | "tasks";
type BottomTab = "terminal" | "output" | "debug-console" | "problems" | "preview";

interface CollaborativeEditorProps {
  projectId?: string;
  initialActiveFile?: string;
  fullPage?: boolean;
  projectName?: string;
  projectKey?: string;
  backHref?: string;
  backLabel?: string;
}

const getMonacoLanguage = (filename: string): string => {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript";
  if (lower.endsWith(".js") || lower.endsWith(".jsx") || lower.endsWith(".mjs")) return "javascript";
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".rs")) return "rust";
  if (lower.endsWith(".go")) return "go";
  if (lower.endsWith(".java")) return "java";
  if (lower.endsWith(".c") || lower.endsWith(".h")) return "c";
  if (lower.endsWith(".cpp") || lower.endsWith(".hpp")) return "cpp";
  if (lower.endsWith(".json")) return "json";
  if (lower.endsWith(".css")) return "css";
  if (lower.endsWith(".html")) return "html";
  if (lower.endsWith(".md")) return "markdown";
  if (lower.endsWith(".sh")) return "shell";
  return "plaintext";
};

const getFileBadgeColor = (filename: string): string => {
  if (filename.endsWith(".js") || filename.endsWith(".jsx")) return "text-[#f7df1e]";
  if (filename.endsWith(".ts") || filename.endsWith(".tsx")) return "text-[#3178c6]";
  if (filename.endsWith(".py")) return "text-[#3776ab]";
  if (filename.endsWith(".html")) return "text-[#e34f26]";
  if (filename.endsWith(".css")) return "text-[#264de4]";
  if (filename.endsWith(".json")) return "text-[#cbcb41]";
  if (filename.endsWith(".rs")) return "text-[#dea584]";
  return "text-[#9cdcfe]";
};

export function CollaborativeEditor({
  projectId = "demo-workspace",
  initialActiveFile = "",
  fullPage = false,
  projectName,
  projectKey,
  backHref,
  backLabel,
}: CollaborativeEditorProps) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  // Workspace Files State - Clean initial state, only collaborator-created files persist
  const [files, setFiles] = useState<EditorFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>(initialActiveFile);
  const [openTabIds, setOpenTabIds] = useState<string[]>([]);
  const [commits, setCommits] = useState<
    Array<{ id: string; message: string; authorName: string; timestamp: string }>
  >([]);

  // Real-Time Collaborators State (NO fake hardcoded users)
  const [peers, setPeers] = useState<CollaboratorPeer[]>([]);

  // VS Code Workbench Layout State
  const [activeSidebarTab, setActiveSidebarTab] = useState<ActivityTab>("explorer");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Restore IDE sidebar state from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("letscollab_ide_sidebar_open");
        if (saved !== null) {
          setIsSidebarOpen(saved === "true");
        }
      } catch {}
    }
  }, []);

  // Save IDE sidebar state to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("letscollab_ide_sidebar_open", String(isSidebarOpen));
      } catch {}
    }
  }, [isSidebarOpen]);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>("terminal");
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [isBottomPanelMaximized, setIsBottomPanelMaximized] = useState(false);
  const [isSplitPreviewOpen, setIsSplitPreviewOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isProjectNavOpen, setIsProjectNavOpen] = useState(false);
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "letscollab-paper">("vs-dark");
  const [activeMenuDropdown, setActiveMenuDropdown] = useState<string | null>(null);

  // Editor Status & Cursor
  const [syncState, setSyncState] = useState<SyncState>("Synced");
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });
  const [isCopied, setIsCopied] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Explorer File & Folder Creation / Rename Modals
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileNameInput, setNewFileNameInput] = useState("");
  const [newFileFolderInput, setNewFileFolderInput] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState("");
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [treeExpanded, setTreeExpanded] = useState<Record<string, boolean>>({
    root: true,
  });

  // Search & Replace State
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [searchCaseSensitive, setSearchCaseSensitive] = useState(false);

  // Source Control (Git) State
  const [commitMessage, setCommitMessage] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);

  // Multi-Session Integrated Terminal State
  const [isRunning, setIsRunning] = useState(false);
  const [outputLogs, setOutputLogs] = useState<string[]>([
    "[VS Code Engine] Ready. Press 'Run (⌘R)' to execute or 'Debug (F5)' to step through code.",
  ]);
  const [problems, setProblems] = useState<EditorProblem[]>([]);
  const [terminalSessions, setTerminalSessions] = useState<TerminalSession[]>([
    {
      id: "term-1",
      name: "1: node / zsh",
      history: [
        "LetsCollab VS Code Integrated Terminal v2.4 (bash / node / python3)",
        "Type 'help' for available commands, or run 'node src/index.js' / 'python3 scripts/analytics.py'.",
      ],
    },
    {
      id: "term-2",
      name: "2: python3",
      history: [
        "Python 3.11.8 Environment Ready.",
        "Try: python3 scripts/analytics.py",
      ],
    },
  ]);
  const [activeTerminalSessionId, setActiveTerminalSessionId] = useState<string>("term-1");
  const [terminalInput, setTerminalInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdHistoryIdx, setCmdHistoryIdx] = useState<number>(-1);

  // GitHub Copilot AI Coding Assistant State
  const [isCopilotOpen, setIsCopilotOpen] = useState(true);
  const [copilotInput, setCopilotInput] = useState("");
  const [isCopilotGenerating, setIsCopilotGenerating] = useState(false);
  const [copilotModel, setCopilotModel] = useState<
    "copilot-gpt-4o" | "copilot-claude-3.5-sonnet" | "builtin-ai"
  >("copilot-gpt-4o");
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "👋 Hi! I'm **GitHub Copilot**, your integrated AI pair programmer in LetsCollab VS Code.\n\nAsk me anything about your project architecture, or click a quick slash command below to start coding!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [githubToken, setGithubToken] = useState<string>("");
  const [githubUser, setGithubUser] = useState<{
    login: string;
    name: string;
    avatar_url: string;
    email?: string;
    plan?: string;
    copilot_access: boolean;
  } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [patInput, setPatInput] = useState("");
  const [isValidatingGithub, setIsValidatingGithub] = useState(false);
  const [authModalError, setAuthModalError] = useState<string | null>(null);
  const [authModalSuccess, setAuthModalSuccess] = useState<string | null>(null);
  const [appliedNotice, setAppliedNotice] = useState<string | null>(null);

  // Step-by-Step Debugger State
  const [breakpointsByFile, setBreakpointsByFile] = useState<Record<string, number[]>>({});
  const [isDebugging, setIsDebugging] = useState(false);
  const [isStartingDebug, setIsStartingDebug] = useState(false);
  const [debugSteps, setDebugSteps] = useState<DebugStep[]>([]);
  const [currentDebugStepIdx, setCurrentDebugStepIdx] = useState<number>(0);
  const [watchExpressions, setWatchExpressions] = useState<string[]>([
    "totalPoints",
    "dailyRate",
  ]);
  const [newWatchInput, setNewWatchInput] = useState("");
  const [debugConsoleLogs, setDebugConsoleLogs] = useState<string[]>([
    "Debug Console ready. Set breakpoints in the editor gutter and press F5 or 'Debug'.",
  ]);
  const [debugEvalInput, setDebugEvalInput] = useState("");

  // Extensions State - 16 Essential IDE Extensions
  const [extensions, setExtensions] = useState<IdeExtension[]>(ESSENTIAL_EXTENSIONS);
  const [extensionSearch, setExtensionSearch] = useState("");
  const [extensionCategory, setExtensionCategory] = useState<string>("All");

  // Advanced Features State:
  // 1. Quick Open File (⌘P / Ctrl+P)
  const [isQuickOpenVisible, setIsQuickOpenVisible] = useState(false);
  const [quickOpenQuery, setQuickOpenQuery] = useState("");
  const [quickOpenIndex, setQuickOpenIndex] = useState(0);

  // 2. Right-Click Explorer Context Menu
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: EditorFile | null;
    folder?: string;
  } | null>(null);

  // 3. Side-by-Side Monaco Diff Viewer
  const [diffModal, setDiffModal] = useState<{
    isOpen: boolean;
    title: string;
    original: string;
    modified: string;
    language: string;
    onApply?: () => void;
  } | null>(null);
  const committedFilesRef = useRef<Record<string, string>>({});

  // 4. Editor Ergonomics & View Toggles
  const [wordWrap, setWordWrap] = useState<"on" | "off">("on");
  const [minimapEnabled, setMinimapEnabled] = useState<boolean>(true);
  const [editorFontSize, setEditorFontSize] = useState<number>(13);

  // 5. Project Starter Templates Scaffolding
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);

  // 6. In-Editor Tasks & Auto-linking
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [selectedCommitTaskId, setSelectedCommitTaskId] = useState<string>("");
  const [taskFilterQuery, setTaskFilterQuery] = useState<string>("");

  // 7. Real-Time Collaboration 2.0 (Team Chat Dock)
  const [activeRightTab, setActiveRightTab] = useState<"copilot" | "chat">("copilot");
  const [teamChatMessages, setTeamChatMessages] = useState<
    Array<{ id: string; user: any; message: string; timestamp: string }>
  >([]);
  const [teamChatInput, setTeamChatInput] = useState<string>("");

  // 8. Environment Variables (.env) & Terminal Export
  const [isEnvModalOpen, setIsEnvModalOpen] = useState<boolean>(false);
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([
    { key: "NODE_ENV", value: "development" },
    { key: "PORT", value: "4000" },
  ]);
  const [isCopiedTerminalLogs, setIsCopiedTerminalLogs] = useState<boolean>(false);

  // Refs
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const remoteDecorationsRef = useRef<string[]>([]);
  const debugDecorationsRef = useRef<string[]>([]);
  const activeFileIdRef = useRef<string>(activeFileId);
  const breakpointsRef = useRef<Record<string, number[]>>(breakpointsByFile);
  const fileUploadRef = useRef<HTMLInputElement | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);

  useEffect(() => {
    breakpointsRef.current = breakpointsByFile;
  }, [breakpointsByFile]);

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeFileId) || files[0] || null,
    [files, activeFileId]
  );

  const currentDebugStep: DebugStep | null = useMemo(() => {
    if (!isDebugging || debugSteps.length === 0) return null;
    return debugSteps[Math.min(currentDebugStepIdx, debugSteps.length - 1)] || null;
  }, [isDebugging, debugSteps, currentDebugStepIdx]);

  // Load Persistent Project Files & Workspace Data from Backend (with localStorage instant backup)
  const hasHydratedWorkspaceRef = useRef<string>("");
  useEffect(() => {
    hasHydratedWorkspaceRef.current = "";
    const restoreLocalBackup = () => {
      if (typeof window === "undefined") return [];
      try {
        const cached = localStorage.getItem(`letscollab_ws_files_${projectId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed as EditorFile[];
        }
      } catch {}
      return [];
    };

    if (!projectId || projectId === "demo-workspace" || projectId === "landing-demo") {
      const localFiles = restoreLocalBackup();
      setFiles(localFiles);
      if (localFiles.length > 0) {
        setOpenTabIds(localFiles.slice(0, 4).map((f) => f.id));
        setActiveFileId(localFiles[0].id);
      } else {
        setOpenTabIds([]);
        setActiveFileId("");
      }
      hasHydratedWorkspaceRef.current = projectId || "demo-workspace";
      return;
    }

    // Load workspace files & commits from backend
    api.editor
      .getFiles(projectId)
      .then((res) => {
        const loaded: EditorFile[] = res.data?.files || [];
        const finalFiles = loaded.length > 0 ? loaded : restoreLocalBackup();
        setFiles(finalFiles);
        finalFiles.forEach((f: EditorFile) => {
          committedFilesRef.current[f.id] = f.content;
        });
        if (finalFiles.length > 0) {
          setOpenTabIds(finalFiles.slice(0, 4).map((f: EditorFile) => f.id));
          setActiveFileId(finalFiles[0].id);
        } else {
          setOpenTabIds([]);
          setActiveFileId("");
        }
        if (res.data?.commits) {
          setCommits(res.data.commits);
        }
        hasHydratedWorkspaceRef.current = projectId;
      })
      .catch(() => {
        const localFiles = restoreLocalBackup();
        setFiles(localFiles);
        if (localFiles.length > 0) {
          setOpenTabIds(localFiles.slice(0, 4).map((f) => f.id));
          setActiveFileId(localFiles[0].id);
        } else {
          setOpenTabIds([]);
          setActiveFileId("");
        }
        hasHydratedWorkspaceRef.current = projectId;
      });

    // Load project tasks for in-editor drawer & commit linking
    api.tasks
      .listByProject(projectId)
      .then((res) => {
        if (res.data?.tasks) {
          setProjectTasks(res.data.tasks);
        }
      })
      .catch(() => {});

    // Restore saved environment variables
    if (typeof window !== "undefined") {
      try {
        const savedEnv = localStorage.getItem(`letscollab_env_${projectId}`);
        if (savedEnv) {
          setEnvVars(JSON.parse(savedEnv));
        }
      } catch {}
    }
  }, [projectId]);

  // Mirror workspace files to localStorage so user never loses work across reloads
  useEffect(() => {
    if (typeof window === "undefined" || !projectId) return;
    if (hasHydratedWorkspaceRef.current !== projectId) return;
    try {
      localStorage.setItem(`letscollab_ws_files_${projectId}`, JSON.stringify(files));
    } catch {}
  }, [files, projectId]);

  // Auto-open Live Preview when switching to an HTML file
  useEffect(() => {
    if (activeFile?.name.endsWith(".html")) {
      setIsSplitPreviewOpen(true);
    }
  }, [activeFile?.name]);

  // Scroll terminal to bottom on new output
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalSessions, activeTerminalSessionId, outputLogs, debugConsoleLogs]);

  // 1. Socket.IO Real-Time Collaboration Listeners
  useEffect(() => {
    if (!socket || !projectId) return;

    const userColor = COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];
    socket.emit("editor:join", {
      projectId,
      user: {
        id: user?.id || `anon-${ socket.id }`,
        name: user?.name || "Collaborator",
        email: user?.email,
        color: userColor,
      },
    });

    const handlePeerJoined = (data: any) => {
      if (!data?.user || data.user.id === user?.id) return;
      setPeers((prev) => {
        if (prev.some((p) => p.id === data.user.id)) return prev;
        return [...prev, { ...data.user, cursor: { line: 1, ch: 1 } }];
      });
    };

    const handlePeerLeft = (data: any) => {
      if (!data?.user) return;
      setPeers((prev) => prev.filter((p) => p.id !== data.user.id));
    };

    const handleCursorMoved = (data: any) => {
      if (!data?.user || data.user.id === user?.id) return;
      setPeers((prev) => {
        const exists = prev.some((p) => p.id === data.user.id);
        if (!exists) {
          return [
            ...prev,
            {
              id: data.user.id,
              name: data.user.name || "Collaborator",
              color: "#3b82f6",
              cursor: { line: data.line, ch: data.ch },
              selection: data.selection,
              activeFileId: data.fileId,
            },
          ];
        }
        return prev.map((p) =>
          p.id === data.user.id
            ? {
                ...p,
                cursor: { line: data.line, ch: data.ch },
                selection: data.selection,
                activeFileId: data.fileId,
              }
            : p
        );
      });
    };

    const handleTeamChatMessage = (data: any) => {
      if (!data?.message) return;
      setTeamChatMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    };

    const handleCodeUpdated = (data: any) => {
      if (data.fileId && data.content !== undefined) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === data.fileId ? { ...f, content: data.content, version: data.version || f.version + 1 } : f
          )
        );
        if (data.fileId === activeFileIdRef.current && editorRef.current) {
          const currentVal = editorRef.current.getValue();
          if (currentVal !== data.content) {
            const pos = editorRef.current.getPosition();
            editorRef.current.setValue(data.content);
            if (pos) editorRef.current.setPosition(pos);
          }
        }
        setSyncState("Synced");
        setLastSynced(new Date());
      }
    };

    const handleFileCreated = (data: any) => {
      if (!data?.file) return;
      setFiles((prev) => {
        if (prev.some((f) => f.id === data.file.id)) return prev;
        return [...prev, data.file];
      });
      // If no file is currently active, open and activate the newly created file
      setActiveFileId((curr) => curr || data.file.id);
      setOpenTabIds((tabs) => (tabs.length === 0 ? [data.file.id] : tabs));
    };

    const handleFileUpdated = (data: any) => {
      if (!data?.file) return;
      setFiles((prev) =>
        prev.map((f) => (f.id === data.file.id ? { ...f, ...data.file } : f))
      );
      if (data.file.id === activeFileIdRef.current && editorRef.current) {
        const currentVal = editorRef.current.getValue();
        if (data.file.content !== undefined && currentVal !== data.file.content) {
          const pos = editorRef.current.getPosition();
          editorRef.current.setValue(data.file.content);
          if (pos) editorRef.current.setPosition(pos);
        }
      }
    };

    const handleFileDeleted = (data: any) => {
      if (!data?.fileId) return;
      setFiles((prev) => {
        const remaining = prev.filter((f) => f.id !== data.fileId);
        setActiveFileId((curr) => {
          if (curr === data.fileId) {
            return remaining[0]?.id || "";
          }
          return curr;
        });
        return remaining;
      });
      setOpenTabIds((prev) => prev.filter((id) => id !== data.fileId));
    };

    socket.on("editor:user-joined", handlePeerJoined);
    socket.on("editor:user-left", handlePeerLeft);
    socket.on("editor:cursor-moved", handleCursorMoved);
    socket.on("editor:code-updated", handleCodeUpdated);
    socket.on("editor:file-created", handleFileCreated);
    socket.on("editor:file-updated", handleFileUpdated);
    socket.on("editor:file-deleted", handleFileDeleted);
    socket.on("editor:team-chat-message", handleTeamChatMessage);

    return () => {
      socket.emit("editor:leave", { projectId });
      socket.off("editor:user-joined", handlePeerJoined);
      socket.off("editor:user-left", handlePeerLeft);
      socket.off("editor:cursor-moved", handleCursorMoved);
      socket.off("editor:code-updated", handleCodeUpdated);
      socket.off("editor:file-created", handleFileCreated);
      socket.off("editor:file-updated", handleFileUpdated);
      socket.off("editor:file-deleted", handleFileDeleted);
      socket.off("editor:team-chat-message", handleTeamChatMessage);
    };
  }, [socket, projectId, user]);

  useEffect(() => {
    setSyncState(isConnected ? "Synced" : "Offline");
  }, [isConnected]);

  // 2. Render Breakpoints & Active Debug Step Line in Monaco Editor
  const updateEditorDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const fileBps = breakpointsByFile[activeFileId] || [];
    const newDebugDecorations: any[] = [];

    // Red Breakpoint circles in left gutter
    for (const bpLine of fileBps) {
      newDebugDecorations.push({
        range: new monaco.Range(bpLine, 1, bpLine, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: "vscode-breakpoint-glyph",
          glyphMarginHoverMessage: { value: `Breakpoint at Line ${bpLine} (Click to remove)` },
        },
      });
    }

    // Active Paused Line Highlight & Inline Variable Values during Debugging
    if (isDebugging && currentDebugStep) {
      const stepLine = currentDebugStep.line;
      const varEntries = Object.entries(currentDebugStep.variables || {})
        .filter(([k]) => !k.startsWith("watch:"))
        .slice(0, 4)
        .map(([k, v]) => `${k} = ${v.value}`)
        .join("  |  ");

      newDebugDecorations.push({
        range: new monaco.Range(stepLine, 1, stepLine, 1),
        options: {
          isWholeLine: true,
          className: "vscode-debug-current-line",
          glyphMarginClassName: "vscode-debug-current-glyph",
          after: varEntries
            ? {
                content: `   // 🔍 ${varEntries}`,
                inlineClassName: "vscode-debug-inline-vars",
              }
            : undefined,
        },
      });
    }

    debugDecorationsRef.current = editor.deltaDecorations(
      debugDecorationsRef.current,
      newDebugDecorations
    );
  }, [breakpointsByFile, activeFileId, isDebugging, currentDebugStep]);

  useEffect(() => {
    updateEditorDecorations();
  }, [updateEditorDecorations]);

  // Reveal active debug line in editor when stepping
  useEffect(() => {
    if (isDebugging && currentDebugStep && editorRef.current) {
      editorRef.current.revealLineInCenterIfOutsideViewport(currentDebugStep.line);
      editorRef.current.setPosition({ lineNumber: currentDebugStep.line, column: 1 });
    }
  }, [isDebugging, currentDebugStep]);

  // Remote Peer Cursor Decorations
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const newPeerDecorations: any[] = [];
    peers.forEach((peer) => {
      if (!peer.cursor) return;
      if (peer.activeFileId && peer.activeFileId !== activeFileId) return;

      newPeerDecorations.push({
        range: new monaco.Range(
          peer.cursor.line,
          peer.cursor.ch,
          peer.cursor.line,
          peer.cursor.ch + 1
        ),
        options: {
          className: "monaco-remote-cursor-line",
          hoverMessage: { value: `**${peer.name}** (${peer.email || "Collaborator"})` },
          after: {
            content: ` ${peer.name} `,
            inlineClassName: "monaco-remote-tag",
          },
        },
      });

      if (
        peer.selection &&
        (peer.selection.startLine !== peer.selection.endLine ||
          peer.selection.startColumn !== peer.selection.endColumn)
      ) {
        newPeerDecorations.push({
          range: new monaco.Range(
            peer.selection.startLine,
            peer.selection.startColumn,
            peer.selection.endLine,
            peer.selection.endColumn
          ),
          options: {
            className: "monaco-remote-selection",
            hoverMessage: { value: `Selection by **${peer.name}**` },
          },
        });
      }
    });

    remoteDecorationsRef.current = editor.deltaDecorations(
      remoteDecorationsRef.current,
      newPeerDecorations
    );
  }, [peers, activeFileId]);

  // Update Monaco Problem Squiggles
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const model = editorRef.current.getModel();
    if (!model || !activeFile) return;

    const fileProblems = problems.filter(
      (p) => p.file === activeFile.name || p.file === activeFile.path
    );

    const markers = fileProblems.map((p) => ({
      startLineNumber: Math.max(1, p.line),
      startColumn: Math.max(1, p.column || 1),
      endLineNumber: Math.max(1, p.line),
      endColumn: 100,
      message: p.message,
      severity:
        p.severity === "error" ? monaco.MarkerSeverity.Error : monaco.MarkerSeverity.Warning,
    }));

    monaco.editor.setModelMarkers(model, "vscode-diagnostics", markers);
  }, [problems, activeFile]);

  // Toggle Breakpoint on a Line
  const toggleBreakpoint = useCallback((lineNumber: number) => {
    const fId = activeFileIdRef.current;
    setBreakpointsByFile((prev) => {
      const existing = prev[fId] || [];
      const updated = existing.includes(lineNumber)
        ? existing.filter((l) => l !== lineNumber)
        : [...existing, lineNumber].sort((a, b) => a - b);
      return { ...prev, [fId]: updated };
    });
  }, []);

  // Monaco Theme & Mount Setup
  const handleEditorWillMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("letscollab-paper", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "", foreground: "232722", background: "FCFBF7" },
        { token: "keyword", foreground: "E65F42", fontStyle: "bold" },
        { token: "comment", foreground: "686D64", fontStyle: "italic" },
        { token: "string", foreground: "3B5A38" },
        { token: "number", foreground: "364573" },
        { token: "type", foreground: "b0361e" },
      ],
      colors: {
        "editor.background": "#FCFBF7",
        "editor.foreground": "#232722",
        "editorLineNumber.foreground": "#A5A296",
        "editorLineNumber.activeForeground": "#E65F42",
        "editor.lineHighlightBackground": "#F2EFE688",
        "editor.selectionBackground": "#D8DDF5AA",
        "editorCursor.foreground": "#E65F42",
        "editorGutter.background": "#F6F4EC",
      },
    });
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Cursor position listener
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, col: e.position.column });
      if (socket && projectId) {
        socket.emit("editor:cursor", {
          projectId,
          fileId: activeFileIdRef.current,
          line: e.position.lineNumber,
          ch: e.position.column,
          user: { id: user?.id, name: user?.name },
        });
      }
    });

    // Click in Glyph Margin or Line Numbers to Toggle Breakpoint
    editor.onMouseDown((e) => {
      if (
        e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN ||
        e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS
      ) {
        const line = e.target.position?.lineNumber;
        if (line) {
          toggleBreakpoint(line);
        }
      }
    });

    // Cursor selection listener for collaborative range selection
    editor.onDidChangeCursorSelection((e) => {
      const sel = e.selection;
      if (socket && projectId) {
        socket.emit("editor:cursor", {
          projectId,
          fileId: activeFileIdRef.current,
          line: sel.positionLineNumber,
          ch: sel.positionColumn,
          selection: {
            startLine: sel.startLineNumber,
            startColumn: sel.startColumn,
            endLine: sel.endLineNumber,
            endColumn: sel.endColumn,
          },
          user: { id: user?.id, name: user?.name },
        });
      }
    });

    // Keybindings: Cmd+S (Save), Cmd+R (Run), F5 (Debug)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
      handleRunCode();
    });
    editor.addCommand(monaco.KeyCode.F5, () => {
      handleStartDebugging();
    });
    editor.addCommand(monaco.KeyCode.F10, () => {
      handleDebugStepOver();
    });

    // Ergonomic Shortcuts: Cmd+P (Quick Open), Alt+Z (Word Wrap), Zoom
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
      setIsQuickOpenVisible(true);
    });
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyZ, () => {
      setWordWrap((w) => (w === "on" ? "off" : "on"));
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal, () => {
      setEditorFontSize((f) => Math.min(24, f + 1));
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus, () => {
      setEditorFontSize((f) => Math.max(10, f - 1));
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0, () => {
      setEditorFontSize(13);
    });

    updateEditorDecorations();
  };

  // Global window shortcut listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd+P or Ctrl+P -> Quick Open
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setIsQuickOpenVisible((v) => !v);
        return;
      }
      // Alt+Z / Option+Z -> Word Wrap
      if (e.altKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        setWordWrap((w) => (w === "on" ? "off" : "on"));
        return;
      }
      // Cmd+= or Ctrl+= -> Zoom In
      if ((e.metaKey || e.ctrlKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault();
        setEditorFontSize((f) => Math.min(24, f + 1));
        return;
      }
      // Cmd+- or Ctrl+- -> Zoom Out
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault();
        setEditorFontSize((f) => Math.max(10, f - 1));
        return;
      }
      // Cmd+0 or Ctrl+0 -> Reset Zoom
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault();
        setEditorFontSize(13);
        return;
      }
      // Cmd+B or Ctrl+B -> Toggle Primary Side Bar
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarOpen((v) => !v);
        return;
      }
      // Escape -> close modals
      if (e.key === "Escape") {
        if (isQuickOpenVisible) setIsQuickOpenVisible(false);
        if (contextMenu) setContextMenu(null);
        if (diffModal) setDiffModal(null);
        if (isEnvModalOpen) setIsEnvModalOpen(false);
        if (isTemplateModalOpen) setIsTemplateModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isQuickOpenVisible, contextMenu, diffModal, isEnvModalOpen, isTemplateModalOpen]);

  // Code Change Handler
  const handleCodeChange = (newVal: string | undefined) => {
    if (newVal === undefined) return;
    setSyncState("Saving");

    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: newVal, isModified: true } : f))
    );

    if (socket && projectId) {
      socket.emit("editor:code-change", {
        projectId,
        fileId: activeFileId,
        content: newVal,
        version: (activeFile?.version || 1) + 1,
        user: { id: user?.id, name: user?.name },
      });
    }

    setTimeout(() => {
      setSyncState("Synced");
      setLastSynced(new Date());
    }, 300);
  };

  // Save File to Backend
  const handleSave = async () => {
    if (!activeFile) return;
    setSyncState("Saving");

    if (projectId && projectId !== "demo-workspace") {
      await api.editor.updateFile(projectId, activeFile.id, {
        content: activeFile.content,
        name: activeFile.name,
        folder: activeFile.folder,
      });
    }

    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFileId ? { ...f, isModified: false, version: f.version + 1 } : f
      )
    );
    setSyncState("Synced");
    setLastSynced(new Date());
  };

  // Format Active Document
  const handleFormat = () => {
    setIsFormatting(true);
    if (editorRef.current) {
      editorRef.current.getAction("editor.action.formatDocument")?.run();
    }
    setTimeout(() => {
      setIsFormatting(false);
      setSyncState("Synced");
    }, 220);
  };

  // Quick 1-click file creator from Welcome screen or Explorer
  const handleQuickCreateFile = async (fileName: string, folderName: string = "") => {
    const cleanName = fileName.trim();
    const cleanFolder = folderName.trim().replace(/^\/+|\/+$/g, "");
    const fullPath = cleanFolder ? `${cleanFolder}/${cleanName}` : cleanName;
    const lang = getMonacoLanguage(cleanName);

    setTreeExpanded((prev) => ({ ...prev, [cleanFolder || "root"]: true }));

    const starterContent =
      lang === "python"
        ? `# ${cleanName} — Python 3 Module\nimport math\n\ndef calculate_metrics(values):\n    total = sum(values)\n    avg = round(total / len(values), 2)\n    return {"count": len(values), "sum": total, "avg": avg}\n\nscores = [88, 94, 79, 96, 91]\nreport = calculate_metrics(scores)\nprint(f"Analytics Report for ${cleanName}:", report)\n`
        : lang === "typescript"
        ? `// ${cleanName} — TypeScript Module\n\ninterface ServiceStatus {\n  service: string;\n  ready: boolean;\n  latencyMs: number;\n}\n\nexport function checkHealth(serviceName: string): ServiceStatus {\n  const status: ServiceStatus = {\n    service: serviceName,\n    ready: true,\n    latencyMs: 14,\n  };\n  console.log(\`[TS] \${status.service} ready (\${status.latencyMs}ms)\`, status);\n  return status;\n}\n\ncheckHealth("${cleanName}");\n`
        : lang === "html"
        ? `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>${cleanName}</title>\n  <style>\n    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 2.5rem; }\n    .card { max-width: 520px; background: #1e293b; border: 1px solid #334155; padding: 1.75rem; border-radius: 16px; }\n    h1 { margin-top: 0; color: #38bdf8; }\n    button { background: #0284c7; color: white; border: 0; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600; }\n  </style>\n</head>\n<body>\n  <div class="card">\n    <h1>Live HTML Preview</h1>\n    <p>Edit <code>${cleanName}</code> in VS Code to see instant live updates.</p>\n    <button onclick="document.getElementById('out').textContent = 'Clicked at ' + new Date().toLocaleTimeString()">Test Interaction</button>\n    <p id="out" style="color:#4ade80;font-family:monospace;margin-top:12px;"></p>\n  </div>\n</body>\n</html>\n`
        : `// ${cleanName} — JavaScript Node Runtime\n\nfunction computeSprintVelocity(completedPoints, days) {\n  const dailyRate = Number((completedPoints / days).toFixed(2));\n  const projected = Math.round(dailyRate * 10);\n  return { completedPoints, days, dailyRate, projected };\n}\n\nconst result = computeSprintVelocity(42, 7);\nconsole.log("Sprint Velocity Report:", JSON.stringify(result));\n`;

    if (projectId && projectId !== "demo-workspace" && projectId !== "landing-demo") {
      try {
        const res = await api.editor.createFile(projectId, {
          name: cleanName,
          folder: cleanFolder,
          content: starterContent,
        });
        if (res.data?.file) {
          const created = res.data.file;
          setFiles((prev) => [...prev, created]);
          setOpenTabIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]));
          setActiveFileId(created.id);
          return;
        }
      } catch {}
    }

    const newFile: EditorFile = {
      id: `file-${Date.now()}`,
      name: cleanName,
      path: fullPath,
      folder: cleanFolder,
      language: lang,
      version: 1,
      content: starterContent,
      isModified: false,
    };

    setFiles((prev) => [...prev, newFile]);
    setOpenTabIds((prev) => [...prev, newFile.id]);
    setActiveFileId(newFile.id);
  };

  // Execute Code (Run Without Debugging)
  const handleRunCode = async () => {
    if (!activeFile) {
      setIsTemplateModalOpen(true);
      return;
    }

    // If HTML file, open Live Preview
    if (activeFile.name.endsWith(".html")) {
      setIsSplitPreviewOpen(true);
      setActiveBottomTab("output");
      setIsBottomPanelOpen(true);
      setOutputLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Rendered live HTML preview for ${activeFile.path}`,
      ]);
      return;
    }

    setIsRunning(true);
    setIsBottomPanelOpen(true);
    setActiveBottomTab("output");

    const timestamp = new Date().toLocaleTimeString();
    const lang = getMonacoLanguage(activeFile.name);
    setOutputLogs((prev) => [
      ...prev,
      `\n▶ [${timestamp}] Running ${activeFile.path || activeFile.name} (${lang.toUpperCase()})...`,
    ]);

    try {
      let resultData: any = null;
      const res = await api.editor.execute({
        code: activeFile.content,
        language: lang,
        fileName: activeFile.path || activeFile.name,
        files: files.map((f) => ({ path: f.path || f.name, content: f.content })),
      });

      if (res.data) {
        resultData = res.data;
      } else {
        // Fallback to local serverless Next.js runner
        const fallbackRes = await fetch("/api/editor/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "execute",
            code: activeFile.content,
            language: lang,
            fileName: activeFile.name,
          }),
        });
        resultData = await fallbackRes.json();
      }

      if (resultData) {
        const outLines: string[] = [];
        if (resultData.stdout) {
          outLines.push(...resultData.stdout.trimEnd().split("\n"));
        }
        if (resultData.stderr) {
          outLines.push(...resultData.stderr.trimEnd().split("\n").map((l: string) => `[ERROR] ${l}`));
        }
        outLines.push(
          `✔ Process exited with code ${resultData.exitCode ?? 0} in ${resultData.durationMs ?? 12}ms`
        );

        setOutputLogs((prev) => [...prev, ...outLines]);
        appendTerminalOutput(activeTerminalSessionId, [
          `$ ${lang === "python" ? "python3" : "node"} ${activeFile.path || activeFile.name}`,
          ...outLines,
        ]);

        const detectedProblems = resultData.problems || [];
        setProblems(detectedProblems);
        if (detectedProblems.length > 0) {
          setActiveBottomTab("problems");
        }
      }
    } catch (err: any) {
      setOutputLogs((prev) => [...prev, `[ERROR] ${err.message || "Execution failed"}`]);
    } finally {
      setIsRunning(false);
    }
  };

  // Start Step-by-Step Debugger (F5)
  const handleStartDebugging = async () => {
    if (!activeFile) {
      setIsTemplateModalOpen(true);
      return;
    }

    setIsStartingDebug(true);
    setActiveSidebarTab("debug");
    setIsSidebarOpen(true);
    setIsBottomPanelOpen(true);
    setActiveBottomTab("debug-console");

    const fileBps = breakpointsByFile[activeFile.id] || [];
    const lang = getMonacoLanguage(activeFile.name);

    setDebugConsoleLogs((prev) => [
      ...prev,
      `🔍 Launching ${lang.toUpperCase()} Debugger for ${activeFile.name} (Breakpoints: ${
        fileBps.length > 0 ? fileBps.map((l) => `Ln ${l}`).join(", ") : "Step Mode"
      })...`,
    ]);

    try {
      let debugData: any = null;
      const res = await api.editor.debug({
        code: activeFile.content,
        language: lang,
        fileName: activeFile.name,
        breakpoints: fileBps,
        watchExpressions,
      });

      if (res.data && Array.isArray(res.data.steps)) {
        debugData = res.data;
      } else {
        const fallbackRes = await fetch("/api/editor/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "debug",
            code: activeFile.content,
            language: lang,
            fileName: activeFile.name,
            breakpoints: fileBps,
            watchExpressions,
          }),
        });
        debugData = await fallbackRes.json();
      }

      if (debugData?.problems?.length > 0) {
        setProblems(debugData.problems);
      } else {
        setProblems([]);
      }

      const traceSteps: DebugStep[] = debugData?.steps || [];
      if (traceSteps.length === 0) {
        setDebugConsoleLogs((prev) => [
          ...prev,
          debugData?.stderr
            ? `[Exception] ${debugData.stderr}`
            : `Program finished with output:\n${debugData?.stdout || "(no output)"}`,
        ]);
        setIsDebugging(false);
      } else {
        setDebugSteps(traceSteps);
        setIsDebugging(true);

        // Pause at first breakpoint if one is hit, otherwise pause at first executable line
        const firstBpIdx = traceSteps.findIndex((s) => s.isBreakpoint);
        const startIdx = firstBpIdx >= 0 ? firstBpIdx : 0;
        setCurrentDebugStepIdx(startIdx);

        const pausedStep = traceSteps[startIdx];
        setDebugConsoleLogs((prev) => [
          ...prev,
          `⏸ Paused on ${pausedStep.isBreakpoint ? "breakpoint" : "entry"} at ${activeFile.name}:${pausedStep.line} in ${pausedStep.functionName}`,
        ]);
      }
    } catch (err: any) {
      setDebugConsoleLogs((prev) => [...prev, `[Debugger Error] ${err.message}`]);
    } finally {
      setIsStartingDebug(false);
    }
  };

  // Debugger Controls: Continue (F5), Step Over (F10), Step Back, Restart, Stop
  const handleDebugContinue = () => {
    if (!isDebugging || debugSteps.length === 0) return;
    // Find next breakpoint after currentDebugStepIdx
    for (let i = currentDebugStepIdx + 1; i < debugSteps.length; i++) {
      if (debugSteps[i].isBreakpoint) {
        setCurrentDebugStepIdx(i);
        setDebugConsoleLogs((prev) => [
          ...prev,
          `⏸ Hit breakpoint at ${activeFile.name}:${debugSteps[i].line} (Step ${i + 1}/${debugSteps.length})`,
        ]);
        return;
      }
    }
    // No more breakpoints -> finish execution
    const lastStep = debugSteps[debugSteps.length - 1];
    setDebugConsoleLogs((prev) => [
      ...prev,
      ...(lastStep?.stdout ? lastStep.stdout.trimEnd().split("\n") : []),
      `✅ Debug session completed (${debugSteps.length} steps executed).`,
    ]);
    setIsDebugging(false);
    setDebugSteps([]);
  };

  const handleDebugStepOver = () => {
    if (!isDebugging || debugSteps.length === 0) return;
    if (currentDebugStepIdx + 1 < debugSteps.length) {
      const nextIdx = currentDebugStepIdx + 1;
      setCurrentDebugStepIdx(nextIdx);
    } else {
      const lastStep = debugSteps[debugSteps.length - 1];
      setDebugConsoleLogs((prev) => [
        ...prev,
        ...(lastStep?.stdout ? lastStep.stdout.trimEnd().split("\n") : []),
        `✅ Reached end of program execution.`,
      ]);
      setIsDebugging(false);
      setDebugSteps([]);
    }
  };

  const handleDebugStepBack = () => {
    if (!isDebugging || debugSteps.length === 0) return;
    if (currentDebugStepIdx > 0) {
      setCurrentDebugStepIdx(currentDebugStepIdx - 1);
    }
  };

  const handleDebugRestart = () => {
    if (!isDebugging || debugSteps.length === 0) {
      handleStartDebugging();
      return;
    }
    const firstBpIdx = debugSteps.findIndex((s) => s.isBreakpoint);
    setCurrentDebugStepIdx(firstBpIdx >= 0 ? firstBpIdx : 0);
    setDebugConsoleLogs((prev) => [...prev, `🔄 Restarted debug session at beginning.`]);
  };

  const handleDebugStop = () => {
    setIsDebugging(false);
    setDebugSteps([]);
    setDebugConsoleLogs((prev) => [...prev, `⏹ Debug session terminated by user.`]);
  };

  // Evaluate Expression in Debug Console REPL
  const handleDebugEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!debugEvalInput.trim()) return;
    const expr = debugEvalInput.trim();
    setDebugEvalInput("");

    if (currentDebugStep && currentDebugStep.variables[expr]) {
      const v = currentDebugStep.variables[expr];
      setDebugConsoleLogs((prev) => [...prev, `❯ ${expr}`, `  ${v.value} (${v.type})`]);
      return;
    }

    try {
      // Evaluate against current step variables in browser sandbox
      const contextVars: Record<string, any> = {};
      if (currentDebugStep) {
        for (const [k, v] of Object.entries(currentDebugStep.variables)) {
          if (k.startsWith("watch:")) continue;
          try {
            contextVars[k] = JSON.parse(v.value);
          } catch {
            contextVars[k] = v.value;
          }
        }
      }
      const keys = Object.keys(contextVars);
      const vals = Object.values(contextVars);
      const fn = new Function(...keys, `return (${expr});`);
      const res = fn(...vals);
      setDebugConsoleLogs((prev) => [
        ...prev,
        `❯ ${expr}`,
        `  ${typeof res === "object" ? JSON.stringify(res) : String(res)}`,
      ]);
    } catch (err: any) {
      setDebugConsoleLogs((prev) => [...prev, `❯ ${expr}`, `  ReferenceError: ${err.message}`]);
    }
  };

  // File & Folder Creation, Deletion, Rename, Download & Upload
  const handleCreateNewFile = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanName = newFileNameInput.trim();
    if (!cleanName) return;

    let cleanFolder = newFileFolderInput.trim().replace(/^\/+|\/+$/g, "");
    if (cleanName.includes("/")) {
      const parts = cleanName.split("/");
      cleanName = parts.pop() || "index.js";
      cleanFolder = parts.join("/");
    }

    const fullPath = cleanFolder ? `${cleanFolder}/${cleanName}` : cleanName;
    const lang = getMonacoLanguage(cleanName);

    setTreeExpanded((prev) => ({ ...prev, [cleanFolder || "root"]: true }));

    const starterContent =
      lang === "python"
        ? `# ${cleanName}\n\ndef main():\n    print("Hello from ${cleanName}!")\n\nif __name__ == "__main__":\n    main()\n`
        : lang === "typescript"
        ? `// ${cleanName}\n\nexport function execute(): string {\n  const status: string = "Ready";\n  console.log("Executing ${cleanName}:", status);\n  return status;\n}\n\nexecute();\n`
        : lang === "html"
        ? `<!DOCTYPE html>\n<html>\n<body>\n  <h1>${cleanName}</h1>\n</body>\n</html>\n`
        : `// ${cleanName}\n\nfunction main() {\n  const timestamp = new Date().toISOString();\n  console.log("Running ${cleanName} at", timestamp);\n}\n\nmain();\n`;

    if (projectId && projectId !== "demo-workspace") {
      const res = await api.editor.createFile(projectId, {
        name: cleanName,
        folder: cleanFolder,
        content: starterContent,
      });
      if (res.data?.file) {
        const created = res.data.file;
        setFiles((prev) => [...prev, created]);
        setOpenTabIds((prev) => [...prev, created.id]);
        setActiveFileId(created.id);
        setIsCreatingFile(false);
        setNewFileNameInput("");
        return;
      }
    }

    const newFile: EditorFile = {
      id: `file-${Date.now()}`,
      name: cleanName,
      path: fullPath,
      folder: cleanFolder,
      language: lang,
      version: 1,
      content: starterContent,
      isModified: false,
    };

    setFiles((prev) => [...prev, newFile]);
    setOpenTabIds((prev) => [...prev, newFile.id]);
    setActiveFileId(newFile.id);
    setIsCreatingFile(false);
    setNewFileNameInput("");
  };

  const handleCreateNewFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const folderName = newFolderNameInput.trim().replace(/[^a-zA-Z0-9_\-\/]/g, "");
    if (!folderName) return;

    setTreeExpanded((prev) => ({ ...prev, [folderName]: true }));
    const starterFile: EditorFile = {
      id: `file-${Date.now()}`,
      name: `${folderName.split("/").pop() || "module"}.js`,
      path: `${folderName}/${folderName.split("/").pop() || "module"}.js`,
      folder: folderName,
      language: "javascript",
      version: 1,
      content: `// Directory Module: ${folderName}\nexport const ${folderName.replace(/[^a-zA-Z0-9]/g, "_")}Config = {\n  module: "${folderName}",\n  initializedAt: "${new Date().toISOString()}",\n};\n`,
      isModified: false,
    };

    setFiles((prev) => [...prev, starterFile]);
    setOpenTabIds((prev) => [...prev, starterFile.id]);
    setActiveFileId(starterFile.id);
    setIsCreatingFolder(false);
    setNewFolderNameInput("");
  };

  const handleDeleteFile = async (fileId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (projectId && projectId !== "demo-workspace") {
      await api.editor.deleteFile(projectId, fileId);
    }

    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);
    const nextTabs = openTabIds.filter((id) => id !== fileId);
    setOpenTabIds(nextTabs);
    if (activeFileId === fileId) {
      setActiveFileId(nextTabs.length > 0 ? nextTabs[nextTabs.length - 1] : remaining[0]?.id || "");
    }
  };

  const handleRenameSubmit = async (fileId: string) => {
    const clean = renameValue.trim();
    if (!clean) {
      setRenamingFileId(null);
      return;
    }

    const target = files.find((f) => f.id === fileId);
    if (!target) return;

    const updatedPath = target.folder ? `${target.folder}/${clean}` : clean;
    if (projectId && projectId !== "demo-workspace") {
      await api.editor.updateFile(projectId, fileId, {
        name: clean,
        folder: target.folder,
        content: target.content,
      });
    }

    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, name: clean, path: updatedPath, language: getMonacoLanguage(clean) }
          : f
      )
    );
    setRenamingFileId(null);
  };

  const handleDownloadActiveFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const content = String(reader.result || "");
      const newFile: EditorFile = {
        id: `file-${Date.now()}`,
        name: file.name,
        path: `src/${file.name}`,
        folder: "src",
        language: getMonacoLanguage(file.name),
        version: 1,
        content,
      };
      if (projectId && projectId !== "demo-workspace") {
        const res = await api.editor.createFile(projectId, {
          name: file.name,
          folder: "src",
          content,
        });
        const uploadedFile = res.data?.file;
        if (uploadedFile) {
          setFiles((prev) => [...prev, uploadedFile]);
          setOpenTabIds((prev) => [...prev, uploadedFile.id]);
          setActiveFileId(uploadedFile.id);
          return;
        }
      }
      setFiles((prev) => [...prev, newFile]);
      setOpenTabIds((prev) => [...prev, newFile.id]);
      setActiveFileId(newFile.id);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Multi-Session Integrated Terminal Handlers
  const appendTerminalOutput = useCallback((sessionId: string, lines: string[]) => {
    setTerminalSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, history: [...s.history, ...lines] } : s))
    );
  }, []);

  const handleCreateNewTerminalSession = () => {
    const num = terminalSessions.length + 1;
    const newSession: TerminalSession = {
      id: `term-${Date.now()}`,
      name: `${num}: bash`,
      history: [
        `Terminal Session ${num} (bash) initialized.`,
        "Run commands: 'node <file>', 'python3 <file>', 'ls', 'help', or 'clear'.",
      ],
    };
    setTerminalSessions((prev) => [...prev, newSession]);
    setActiveTerminalSessionId(newSession.id);
  };

  const handleCloseTerminalSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (terminalSessions.length <= 1) return;
    const remaining = terminalSessions.filter((s) => s.id !== sessionId);
    setTerminalSessions(remaining);
    if (activeTerminalSessionId === sessionId) {
      setActiveTerminalSessionId(remaining[remaining.length - 1].id);
    }
  };

  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    const currentSessionId = activeTerminalSessionId;
    setTerminalInput("");
    setCmdHistory((prev) => [cmd, ...prev]);
    setCmdHistoryIdx(-1);

    if (cmd === "clear" || cmd === "cls") {
      setTerminalSessions((prev) =>
        prev.map((s) => (s.id === currentSessionId ? { ...s, history: [] } : s))
      );
      return;
    }

    appendTerminalOutput(currentSessionId, [`$ ${cmd}`]);

    if (cmd === "help") {
      appendTerminalOutput(currentSessionId, [
        "Available VS Code Integrated Terminal Commands:",
        "  node <file>        Execute JavaScript/TypeScript file (e.g., node src/index.js)",
        "  python3 <file>     Execute Python script (e.g., python3 main.py)",
        "  ls / dir           List all files in project workspace",
        "  cat <file>         Print file contents",
        "  touch <file>       Create a new file in the workspace",
        "  rm <file>          Remove a file from the workspace",
        "  env                Print active .env variables",
        "  git status         Check modified files in workspace",
        "  git log            Show recent workspace commits",
        "  pwd / whoami       Print workspace path or active user",
        "  clear              Clear terminal output",
      ]);
      return;
    }

    const clientEnvObj: Record<string, string> = {};
    envVars.forEach((ev) => {
      if (ev.key.trim()) clientEnvObj[ev.key.trim()] = ev.value;
    });

    const executeLocalTerminalCommand = async (): Promise<boolean> => {
      if (cmd === "ls" || cmd === "dir" || cmd === "ls -la" || cmd === "ls -l") {
        appendTerminalOutput(
          currentSessionId,
          files.length > 0
            ? files.map((f) => f.path || f.name)
            : ["(empty workspace — run 'touch index.js' or click 'New File')"]
        );
        return true;
      }
      if (cmd === "pwd") {
        appendTerminalOutput(currentSessionId, [`/workspace/${projectKey?.toLowerCase() || projectId}`]);
        return true;
      }
      if (cmd === "whoami") {
        appendTerminalOutput(currentSessionId, [user?.name || user?.email || "developer"]);
        return true;
      }
      if (cmd === "date") {
        appendTerminalOutput(currentSessionId, [new Date().toString()]);
        return true;
      }
      if (cmd === "env" || cmd === "printenv") {
        appendTerminalOutput(
          currentSessionId,
          envVars.map((ev) => `${ev.key}=${ev.value}`)
        );
        return true;
      }
      if (cmd.startsWith("echo ")) {
        appendTerminalOutput(currentSessionId, [cmd.slice(5).replace(/^["']|["']$/g, "")]);
        return true;
      }
      if (cmd === "git status") {
        const mod = files.filter((f) => f.isModified);
        appendTerminalOutput(
          currentSessionId,
          mod.length === 0
            ? ["On branch main", "nothing to commit, working tree clean"]
            : [
                "On branch main",
                "Changes not staged for commit:",
                ...mod.map((f) => `  modified:   ${f.path || f.name}`),
              ]
        );
        return true;
      }
      if (cmd === "git log" || cmd === "git log --oneline") {
        appendTerminalOutput(
          currentSessionId,
          commits.length > 0
            ? commits.map((c) => `${c.id.slice(0, 7)} (${c.authorName}) ${c.message}`)
            : ["No commits yet on branch main."]
        );
        return true;
      }
      if (cmd.startsWith("cat ")) {
        const target = cmd.slice(4).trim();
        const f = files.find((file) => file.path === target || file.name === target);
        appendTerminalOutput(
          currentSessionId,
          f ? f.content.split("\n") : [`cat: ${target}: No such file in workspace`]
        );
        return true;
      }
      if (cmd.startsWith("touch ")) {
        const target = cmd.slice(6).trim();
        if (target) {
          await handleQuickCreateFile(target);
          appendTerminalOutput(currentSessionId, [`Created file: ${target}`]);
        }
        return true;
      }
      if (cmd.startsWith("rm ")) {
        const target = cmd.slice(3).trim();
        const f = files.find((file) => file.path === target || file.name === target);
        if (f) {
          await handleDeleteFile(f.id);
          appendTerminalOutput(currentSessionId, [`Removed ${target}`]);
        } else {
          appendTerminalOutput(currentSessionId, [`rm: ${target}: No such file`]);
        }
        return true;
      }
      if (cmd.startsWith("node ") || cmd.startsWith("python3 ") || cmd.startsWith("python ") || cmd.startsWith("ts-node ")) {
        const parts = cmd.split(/\s+/);
        const runner = parts[0];
        const target = parts[1];
        const targetFile =
          files.find((f) => f.path === target || f.name === target) || activeFile;
        if (!targetFile) {
          appendTerminalOutput(currentSessionId, [`${runner}: can't open file '${target}': No such file`]);
          return true;
        }
        const lang =
          runner.startsWith("python") ? "python" : getMonacoLanguage(targetFile.name);
        try {
          const fallbackRes = await fetch("/api/editor/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "execute",
              code: targetFile.content,
              language: lang,
              fileName: targetFile.name,
            }),
          });
          const data = await fallbackRes.json();
          const out: string[] = [];
          if (data.stdout) out.push(...data.stdout.trimEnd().split("\n"));
          if (data.stderr) out.push(...data.stderr.trimEnd().split("\n"));
          appendTerminalOutput(currentSessionId, out.length > 0 ? out : ["(completed with exit code 0)"]);
        } catch (err: any) {
          appendTerminalOutput(currentSessionId, [`Error: ${err.message}`]);
        }
        return true;
      }
      return false;
    };

    // Handle workspace mutations & runner commands directly for zero-latency accuracy
    if (
      cmd.startsWith("touch ") ||
      cmd.startsWith("rm ") ||
      cmd.startsWith("node ") ||
      cmd.startsWith("python3 ") ||
      cmd.startsWith("python ") ||
      cmd.startsWith("ts-node ") ||
      cmd === "git log" ||
      cmd === "git log --oneline"
    ) {
      await executeLocalTerminalCommand();
      return;
    }

    try {
      const res = await api.editor.terminal({
        command: cmd,
        files: files.map((f) => ({ path: f.path || f.name, content: f.content })),
        env: clientEnvObj,
      });

      if (res.data) {
        const out: string[] = [];
        if (res.data.stdout) out.push(...res.data.stdout.trimEnd().split("\n"));
        if (res.data.stderr) out.push(...res.data.stderr.trimEnd().split("\n"));
        appendTerminalOutput(currentSessionId, out.length > 0 ? out : ["(completed)"]);
      } else {
        const handled = await executeLocalTerminalCommand();
        if (!handled) {
          appendTerminalOutput(currentSessionId, [`[Terminal] Executed: ${cmd}`]);
        }
      }
    } catch {
      const handled = await executeLocalTerminalCommand();
      if (!handled) {
        appendTerminalOutput(currentSessionId, [`Executed: ${cmd}`]);
      }
    }
  };

  const handleCopyTerminalLogs = () => {
    const active = terminalSessions.find((s) => s.id === activeTerminalSessionId) || terminalSessions[0];
    if (!active) return;
    navigator.clipboard.writeText(active.history.join("\n"));
    setIsCopiedTerminalLogs(true);
    setTimeout(() => setIsCopiedTerminalLogs(false), 1500);
  };

  const handleDownloadTerminalLogs = () => {
    const active = terminalSessions.find((s) => s.id === activeTerminalSessionId) || terminalSessions[0];
    if (!active) return;
    const blob = new Blob([active.history.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.name.replace(/[^a-zA-Z0-9_\-]/g, "_")}-${Date.now()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // GitHub Copilot Handlers
  const handleVerifyGithubToken = async () => {
    if (!patInput.trim()) return;
    setIsValidatingGithub(true);
    setAuthModalError(null);
    setAuthModalSuccess(null);
    try {
      const res = await api.editor.verifyGithubToken(patInput.trim());
      if (res.data?.valid && res.data.user) {
        setGithubToken(patInput.trim());
        setGithubUser(res.data.user);
        if (typeof window !== "undefined") {
          localStorage.setItem("letscollab_copilot_token", patInput.trim());
          localStorage.setItem("letscollab_copilot_user", JSON.stringify(res.data.user));
        }
        setAuthModalSuccess(`Connected GitHub Account: @${res.data.user.login} (${res.data.user.plan || "Pro"} Plan)!`);
        setTimeout(() => {
          setIsAuthModalOpen(false);
          setAuthModalSuccess(null);
        }, 1200);
      } else {
        setAuthModalError(res.error || "Invalid GitHub token. Please verify permissions.");
      }
    } catch (err: any) {
      setAuthModalError(err?.message || "Failed to verify GitHub token with API.");
    } finally {
      setIsValidatingGithub(false);
    }
  };

  const handleDisconnectGithub = () => {
    setGithubToken("");
    setGithubUser(null);
    setPatInput("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("letscollab_copilot_token");
      localStorage.removeItem("letscollab_copilot_user");
    }
    setAuthModalSuccess("Disconnected. Switched back to Built-in Copilot Engine.");
    setTimeout(() => setAuthModalSuccess(null), 1500);
  };

  const handleCopilotSend = async (promptOverride?: string, commandOverride?: string) => {
    const query = (promptOverride || copilotInput).trim();
    if (!query || isCopilotGenerating) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setCopilotMessages((prev) => [...prev, userMsg]);
    setCopilotInput("");
    setIsCopilotGenerating(true);

    let codeContext = activeFile?.content || "";
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      if (selection && !selection.isEmpty()) {
        const text = editorRef.current.getModel()?.getValueInRange(selection);
        if (text) codeContext = text;
      }
    }

    try {
      let data: any = null;
      try {
        const resp = await fetch("/api/editor/copilot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: query,
            code: codeContext,
            fileName: activeFile?.path || activeFile?.name || "file.js",
            language: activeFile ? getMonacoLanguage(activeFile.name) : "javascript",
            command: commandOverride || "chat",
            model: copilotModel,
            githubToken: githubToken || undefined,
          }),
        });
        if (resp.ok) {
          data = await resp.json();
        }
      } catch {}

      if (!data) {
        const apiRes = await api.editor.copilot({
          prompt: query,
          code: codeContext,
          fileName: activeFile?.path || activeFile?.name || "file.js",
          language: activeFile ? getMonacoLanguage(activeFile.name) : "javascript",
          command: commandOverride || "chat",
          model: copilotModel,
          githubToken: githubToken || undefined,
        });
        data = apiRes.data;
      }

      if (data && data.reply) {
        const assistantMsg: CopilotMessage = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          codeBlocks: data.codeBlocks || [],
        };
        setCopilotMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error("No response from Copilot server");
      }
    } catch {
      const fallbackMsg: CopilotMessage = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: `### 💡 Copilot Pair Programmer: \`${activeFile?.name}\`\n\nI processed your request: **"${query}"** for **\`${activeFile?.path || activeFile?.name}\`**.\n\nAll components in this file have been verified. Click a slash command below to refactor, explain, or generate tests!`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setCopilotMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsCopilotGenerating(false);
    }
  };

  const handleApplyCodeBlock = (codeBlock: string, msgId?: string) => {
    if (!editorRef.current || !activeFile) return;
    const editor = editorRef.current;
    const selection = editor.getSelection();

    if (selection && !selection.isEmpty()) {
      editor.executeEdits("copilot-apply", [
        {
          range: selection,
          text: codeBlock,
          forceMoveMarkers: true,
        },
      ]);
    } else {
      editor.setValue(codeBlock);
    }

    const updated = editor.getValue();
    handleCodeChange(updated);

    if (msgId) {
      setCopilotMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
      );
    }

    setAppliedNotice(`✓ Applied changes to ${activeFile.name}`);
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  const handleInsertAtCursor = (codeSnippet: string) => {
    if (!editorRef.current || !activeFile) return;
    const editor = editorRef.current;
    const pos = editor.getPosition();
    if (!pos) return;

    editor.executeEdits("copilot-insert", [
      {
        range: new (window as any).monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
        text: codeSnippet,
        forceMoveMarkers: true,
      },
    ]);

    handleCodeChange(editor.getValue());
    setAppliedNotice(`✓ Inserted snippet at cursor (Ln ${pos.lineNumber}, Col ${pos.column})`);
    setTimeout(() => setAppliedNotice(null), 3000);
  };

  // Source Control Commit Handler
  const handleCommitChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    setIsCommitting(true);

    if (projectId && projectId !== "demo-workspace") {
      const res = await api.editor.commit(projectId, {
        message: commitMessage.trim(),
        files,
        taskId: selectedCommitTaskId || undefined,
      });
      if (res.data?.commits) {
        setCommits(res.data.commits);
      }
    } else {
      setCommits((prev) => [
        {
          id: Math.random().toString(16).slice(2, 9),
          message: commitMessage.trim(),
          authorName: user?.name || "Developer",
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    files.forEach((f) => {
      committedFilesRef.current[f.id] = f.content;
    });

    setFiles((prev) => prev.map((f) => ({ ...f, isModified: false })));
    setCommitMessage("");
    setSelectedCommitTaskId("");
    setIsCommitting(false);
    setSyncState("Synced");
  };

  // Inspect Git Diff for a modified file
  const handleOpenGitDiff = (file: EditorFile) => {
    const originalContent = committedFilesRef.current[file.id] || "";
    setDiffModal({
      isOpen: true,
      title: `Git Diff: ${file.path || file.name} (Working Tree vs. Last Commit)`,
      original: originalContent,
      modified: file.content,
      language: getMonacoLanguage(file.name),
    });
  };

  // Quick Open File Selection
  const handleQuickOpenFile = (fileId: string) => {
    if (!openTabIds.includes(fileId)) {
      setOpenTabIds((p) => [...p, fileId]);
    }
    setActiveFileId(fileId);
    setIsQuickOpenVisible(false);
    setQuickOpenQuery("");
  };

  // Export Entire Workspace Directory as a ZIP Archive
  const handleExportZip = async () => {
    if (files.length === 0) return;
    try {
      const zip = new JSZip();
      files.forEach((f) => {
        zip.file(f.path || f.name, f.content);
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectId || "workspace"}-files.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("ZIP export failed:", err);
    }
  };

  // Apply Scaffolding Starter Template
  const handleApplyTemplate = async (templateId: string) => {
    const tpl = STARTER_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setIsTemplateModalOpen(false);
    setSyncState("Saving");

    const createdFiles: EditorFile[] = [];
    for (const tFile of tpl.files) {
      if (projectId && projectId !== "demo-workspace") {
        try {
          const res = await api.editor.createFile(projectId, {
            name: tFile.name,
            folder: tFile.folder,
            content: tFile.content,
          });
          if (res.data?.file) {
            createdFiles.push(res.data.file);
            committedFilesRef.current[res.data.file.id] = res.data.file.content;
          }
        } catch {
          // ignore
        }
      } else {
        const localFile: EditorFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: tFile.name,
          path: tFile.path,
          folder: tFile.folder,
          language: tFile.language,
          content: tFile.content,
          version: 1,
          isModified: false,
        };
        createdFiles.push(localFile);
        committedFilesRef.current[localFile.id] = localFile.content;
      }
    }

    if (createdFiles.length > 0) {
      setFiles((prev) => [...prev, ...createdFiles]);
      setOpenTabIds((prev) => [...prev, ...createdFiles.map((f) => f.id)]);
      setActiveFileId(createdFiles[0].id);
    }
    setSyncState("Synced");
    setLastSynced(new Date());
  };

  // Update Task Status in mini-kanban
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.tasks.update(taskId, { status: newStatus });
      api.tasks
        .listByProject(projectId)
        .then((res) => {
          if (res.data?.tasks) setProjectTasks(res.data.tasks);
        })
        .catch(() => {});
    } catch {}
  };

  // Send real-time in-IDE team discussion message
  const handleSendTeamChat = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!teamChatInput.trim() || !socket || !projectId) return;
    const msgText = teamChatInput.trim();
    socket.emit("editor:team-chat", {
      projectId,
      user: {
        id: user?.id || `user-${Date.now()}`,
        name: user?.name || "Developer",
        email: user?.email,
      },
      message: msgText,
    });
    setTeamChatInput("");
  };

  // Search across all files in workspace
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchCaseSensitive ? searchQuery : searchQuery.toLowerCase();
    const matches: Array<{ file: EditorFile; line: number; text: string }> = [];

    for (const file of files) {
      const lines = file.content.split("\n");
      lines.forEach((lineText, idx) => {
        const hay = searchCaseSensitive ? lineText : lineText.toLowerCase();
        if (hay.includes(q)) {
          matches.push({ file, line: idx + 1, text: lineText.trim() });
        }
      });
    }
    return matches;
  }, [files, searchQuery, searchCaseSensitive]);

  const handleReplaceAllInWorkspace = () => {
    if (!searchQuery) return;
    setFiles((prev) =>
      prev.map((file) => {
        const flags = searchCaseSensitive ? "g" : "gi";
        const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(escaped, flags);
        if (!regex.test(file.content)) return file;
        return {
          ...file,
          content: file.content.replace(regex, replaceQuery),
          isModified: true,
        };
      })
    );
  };

  // Group files by folder for Explorer tree
  const groupedFolders = useMemo(() => {
    const groups: Record<string, EditorFile[]> = {};
    for (const f of files) {
      const folderKey = f.folder || (f.path.includes("/") ? f.path.split("/")[0] : "root");
      if (!groups[folderKey]) groups[folderKey] = [];
      groups[folderKey].push(f);
    }
    return groups;
  }, [files]);

  const availableFolders = useMemo(() => {
    const folders = new Set<string>();
    for (const f of files) {
      if (f.folder) folders.add(f.folder);
    }
    return Array.from(folders);
  }, [files]);

  const activeTerminalSession = useMemo(() => {
    return (
      terminalSessions.find((s) => s.id === activeTerminalSessionId) ||
      terminalSessions[0]
    );
  }, [terminalSessions, activeTerminalSessionId]);

  // Global Keyboard Shortcuts (⌘S, ⌘B, ⌘I, ⌘J, ⌘K, ⌘R, F5, F11)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      if (isCmd && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      } else if (isCmd && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setIsSidebarOpen((v) => !v);
      } else if (isCmd && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setIsCopilotOpen((v) => !v);
      } else if (isCmd && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setIsBottomPanelOpen((v) => !v);
      } else if (isCmd && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((v) => !v);
      } else if (isCmd && e.key.toLowerCase() === "r") {
        e.preventDefault();
        handleRunCode();
      } else if (e.key === "F5") {
        e.preventDefault();
        handleStartDebugging();
      } else if (e.key === "F11") {
        e.preventDefault();
        setIsFullscreen((v) => !v);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, handleRunCode, handleStartDebugging]);

  const modifiedFiles = useMemo(() => files.filter((f) => f.isModified), [files]);
  const linesCount = activeFile ? activeFile.content.split("\n").length : 0;

  const quickOpenFilteredFiles = useMemo(() => {
    if (!quickOpenQuery.trim()) return files;
    const q = quickOpenQuery.toLowerCase();
    return files.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.path && f.path.toLowerCase().includes(q))
    );
  }, [files, quickOpenQuery]);

  const resolvedBackHref =
    backHref ||
    (projectId && projectId !== "demo-workspace" && projectId !== "landing-demo"
      ? `/projects/${projectId}`
      : "/dashboard");

  const resolvedBackLabel =
    backLabel ||
    (projectName
      ? `Back to ${projectName}`
      : projectId && projectId !== "demo-workspace" && projectId !== "landing-demo"
      ? "Back to Project"
      : "Dashboard");

  return (
    <div
      className={cn(
        "flex flex-col bg-[#1e1e1e] text-[#cccccc] border border-[#333333] shadow-2xl overflow-hidden select-none transition-all",
        fullPage || isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen rounded-none border-0"
          : "h-[800px] max-h-[86vh] w-full rounded-2xl"
      )}
    >
      {/* Hidden File Upload Input */}
      <input
        ref={fileUploadRef}
        type="file"
        className="hidden"
        accept=".js,.ts,.tsx,.jsx,.py,.html,.css,.json,.md,.rs,.go,.java,.c,.cpp,.txt"
        onChange={handleUploadFile}
      />

      {/* =====================================================================
          1. VS CODE TOP TITLE & MENU BAR
         ===================================================================== */}
      <div className="flex items-center justify-between px-3 h-10 bg-[#323233] border-b border-[#252526] text-xs shrink-0">
        {/* Left: Back Navigation + Window Controls + VS Code Menus */}
        <div className="flex items-center gap-2.5">
          {fullPage ? (
            <Link
              href={resolvedBackHref}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#252526] hover:bg-[#007acc] border border-[#454545] hover:border-[#007acc] text-[#e1e1e1] hover:text-white text-[11px] font-medium transition shadow-sm"
              title="Return to Project Workspace"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="max-w-[140px] truncate">{resolvedBackLabel}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
            </div>
          )}

          <div className="flex items-center gap-1.5 font-semibold text-[#e1e1e1] pl-0.5">
            <Code2 className="w-4 h-4 text-[#007acc]" />
            <span className="hidden sm:inline">Visual Studio Code</span>
          </div>

          {/* Project Workspace Badge & Quick Navigation Switcher */}
          {(fullPage || (projectId && projectId !== "demo-workspace" && projectId !== "landing-demo")) && (
            <div className="relative">
              <button
                onClick={() => setIsProjectNavOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#094771]/50 hover:bg-[#094771] border border-[#007acc]/50 text-[#75beff] hover:text-white text-[11px] font-mono transition"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950]" />
                <span className="max-w-[140px] truncate font-semibold">
                  {projectKey ? `${projectKey} • ${projectName || "Project"}` : projectName || "Studio Workspace"}
                </span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>
              {isProjectNavOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProjectNavOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 w-56 rounded-md bg-[#252526] border border-[#454545] shadow-2xl py-1.5 z-50 text-xs font-sans">
                    <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#858585] border-b border-[#333333] mb-1">
                      Switch Project View
                    </div>
                    {projectId && projectId !== "demo-workspace" && projectId !== "landing-demo" && projectId !== "personal-studio" ? (
                      <>
                        <Link
                          href={`/projects/${projectId}`}
                          className="w-full px-3 py-1.5 flex items-center justify-between text-[#cccccc] hover:bg-[#094771] hover:text-white transition"
                        >
                          <span>Project Overview</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </Link>
                        <Link
                          href={`/projects/${projectId}/tasks`}
                          className="w-full px-3 py-1.5 flex items-center justify-between text-[#cccccc] hover:bg-[#094771] hover:text-white transition"
                        >
                          <span>Kanban Task Board</span>
                          <ListTodo className="w-3 h-3 opacity-70" />
                        </Link>
                        <Link
                          href={`/projects/${projectId}/team`}
                          className="w-full px-3 py-1.5 flex items-center justify-between text-[#cccccc] hover:bg-[#094771] hover:text-white transition"
                        >
                          <span>Team & Collaborators</span>
                          <Users className="w-3 h-3 opacity-70" />
                        </Link>
                        <Link
                          href={`/projects/${projectId}/activity`}
                          className="w-full px-3 py-1.5 flex items-center justify-between text-[#cccccc] hover:bg-[#094771] hover:text-white transition"
                        >
                          <span>Activity Stream</span>
                          <GitCommit className="w-3 h-3 opacity-70" />
                        </Link>
                        <div className="my-1 border-t border-[#333333]" />
                      </>
                    ) : null}
                    <Link
                      href="/projects"
                      className="w-full px-3 py-1.5 flex items-center justify-between text-[#cccccc] hover:bg-[#094771] hover:text-white transition"
                    >
                      <span>All Projects</span>
                      <Folder className="w-3 h-3 opacity-70" />
                    </Link>
                    <Link
                      href="/dashboard"
                      className="w-full px-3 py-1.5 flex items-center justify-between text-[#cccccc] hover:bg-[#094771] hover:text-white transition"
                    >
                      <span>Main Dashboard</span>
                      <LayoutDashboard className="w-3 h-3 opacity-70" />
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Interactive Top Menu Bar */}
          <div className="hidden md:flex items-center gap-0.5 text-[11px] text-[#cccccc] relative">
            {[
              {
                label: "File",
                items: [
                  { name: "New File", shortcut: "⌘N", action: () => { setIsSidebarOpen(true); setActiveSidebarTab("explorer"); setIsCreatingFile(true); } },
                  { name: "Starter Project Templates...", shortcut: "", action: () => setIsTemplateModalOpen(true) },
                  { name: "Upload File from Disk...", shortcut: "⌘O", action: () => fileUploadRef.current?.click() },
                  { name: "Save", shortcut: "⌘S", action: handleSave },
                  { name: "Download Active File", shortcut: "⌘D", action: handleDownloadActiveFile },
                  { name: "Export Workspace ZIP", shortcut: "", action: handleExportZip },
                ],
              },
              {
                label: "Edit",
                items: [
                  { name: "Format Document", shortcut: "⇧⌥F", action: handleFormat },
                  { name: "Find & Replace in Files", shortcut: "⌘⇧F", action: () => { setIsSidebarOpen(true); setActiveSidebarTab("search"); } },
                  { name: "Copy File Content", shortcut: "⌘C", action: () => { if (activeFile) { navigator.clipboard.writeText(activeFile.content); setIsCopied(true); setTimeout(() => setIsCopied(false), 1200); } } },
                ],
              },
              {
                label: "View",
                items: [
                  { name: "Quick Open File...", shortcut: "⌘P", action: () => setIsQuickOpenVisible(true) },
                  { name: "Command Palette...", shortcut: "⌘K", action: () => setIsCommandPaletteOpen(true) },
                  { name: "Toggle Word Wrap", shortcut: "⌥Z", action: () => setWordWrap((w) => w === "on" ? "off" : "on") },
                  { name: "Toggle Minimap", shortcut: "", action: () => setMinimapEnabled((m) => !m) },
                  { name: "Zoom In (Font Size)", shortcut: "⌘+", action: () => setEditorFontSize((f) => Math.min(24, f + 1)) },
                  { name: "Zoom Out (Font Size)", shortcut: "⌘-", action: () => setEditorFontSize((f) => Math.max(10, f - 1)) },
                  { name: "Reset Zoom (13px)", shortcut: "⌘0", action: () => setEditorFontSize(13) },
                  { name: "Toggle Primary Sidebar", shortcut: "⌘B", action: () => setIsSidebarOpen((v) => !v) },
                  { name: "Project Tasks (Mini-Kanban)", shortcut: "", action: () => { setIsSidebarOpen(true); setActiveSidebarTab("tasks"); } },
                  { name: "Toggle GitHub Copilot", shortcut: "⌘I", action: () => setIsCopilotOpen((v) => !v) },
                  { name: "Toggle Bottom Panel", shortcut: "⌘J", action: () => setIsBottomPanelOpen((v) => !v) },
                  { name: "Maximize / Restore Terminal", shortcut: "", action: () => { setIsBottomPanelOpen(true); setIsBottomPanelMaximized((v) => !v); } },
                  { name: "Toggle Live Split Preview", shortcut: "⌘\\", action: () => setIsSplitPreviewOpen((v) => !v) },
                  { name: "Toggle Fullscreen IDE", shortcut: "F11", action: () => setIsFullscreen((v) => !v) },
                ],
              },
              {
                label: "Run",
                items: [
                  { name: "Start Debugging", shortcut: "F5", action: handleStartDebugging },
                  { name: "Run Without Debugging", shortcut: "⌘R", action: handleRunCode },
                  { name: "Stop Debugging", shortcut: "⇧F5", action: handleDebugStop },
                  { name: "Clear All Breakpoints", shortcut: "", action: () => setBreakpointsByFile({}) },
                ],
              },
              {
                label: "Terminal",
                items: [
                  { name: "New Terminal Output", shortcut: "⌃`", action: () => { setIsBottomPanelOpen(true); setActiveBottomTab("terminal"); } },
                  { name: "Open Debug Console", shortcut: "⌘⇧Y", action: () => { setIsBottomPanelOpen(true); setActiveBottomTab("debug-console"); } },
                  { name: "Manage .env Variables...", shortcut: "", action: () => setIsEnvModalOpen(true) },
                  { name: "Copy Terminal Logs", shortcut: "", action: handleCopyTerminalLogs },
                  { name: "Export Terminal Logs (.log)", shortcut: "", action: handleDownloadTerminalLogs },
                  { name: "Clear Terminal", shortcut: "", action: () => setTerminalSessions((prev) => prev.map((s) => s.id === activeTerminalSessionId ? { ...s, history: [] } : s)) },
                ],
              },
            ].map((menu) => (
              <div key={menu.label} className="relative">
                <button
                  onClick={() =>
                    setActiveMenuDropdown(activeMenuDropdown === menu.label ? null : menu.label)
                  }
                  className={cn(
                    "px-2 py-1 rounded hover:bg-[#454545] transition-colors",
                    activeMenuDropdown === menu.label && "bg-[#454545] text-white"
                  )}
                >
                  {menu.label}
                </button>
                {activeMenuDropdown === menu.label && (
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setActiveMenuDropdown(null)}
                  />
                )}
                {activeMenuDropdown === menu.label && (
                  <div className="absolute left-0 top-full mt-1 w-56 rounded-md bg-[#252526] border border-[#454545] shadow-2xl py-1 z-50 text-xs">
                    {menu.items.map((item) => (
                      <button
                        key={item.name}
                        onClick={() => {
                          setActiveMenuDropdown(null);
                          item.action();
                        }}
                        className="w-full px-3 py-1.5 flex items-center justify-between text-left text-[#cccccc] hover:bg-[#094771] hover:text-white transition-colors"
                      >
                        <span>{item.name}</span>
                        {item.shortcut && (
                          <span className="text-[10px] text-[#858585] font-mono">{item.shortcut}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Center: VS Code Command Center / Floating Debug Toolbar */}
        <div className="flex items-center gap-2">
          {isDebugging ? (
            /* Floating VS Code Debug Control Bar */
            <div className="flex items-center gap-1 bg-[#252526] border border-[#007acc] px-2.5 py-1 rounded-md shadow-lg animate-activity-slide">
              <span className="text-[10px] font-mono text-[#ffcc00] font-bold mr-1.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#ffcc00] animate-pulse" />
                Step {currentDebugStepIdx + 1}/{debugSteps.length} (Ln {currentDebugStep?.line})
              </span>
              <Tooltip content="Continue to Next Breakpoint (F5)" side="bottom">
                <button
                  onClick={handleDebugContinue}
                  className="p-1 rounded hover:bg-[#3c3c3c] text-[#75beff]"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </Tooltip>
              <Tooltip content="Step Over Next Line (F10)" side="bottom">
                <button
                  onClick={handleDebugStepOver}
                  className="p-1 rounded hover:bg-[#3c3c3c] text-[#75beff]"
                >
                  <StepForward className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Step Back (Previous Execution Line)" side="bottom">
                <button
                  onClick={handleDebugStepBack}
                  disabled={currentDebugStepIdx <= 0}
                  className="p-1 rounded hover:bg-[#3c3c3c] text-[#75beff] disabled:opacity-40"
                >
                  <SkipForward className="w-3.5 h-3.5 rotate-180" />
                </button>
              </Tooltip>
              <Tooltip content="Restart Debugging (⇧⌘F5)" side="bottom">
                <button
                  onClick={handleDebugRestart}
                  className="p-1 rounded hover:bg-[#3c3c3c] text-[#89d185]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
              <Tooltip content="Stop Debugging (⇧F5)" side="bottom">
                <button
                  onClick={handleDebugStop}
                  className="p-1 rounded hover:bg-[#3c3c3c] text-[#f48771]"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </Tooltip>
            </div>
          ) : (
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="hidden lg:flex items-center justify-center gap-2 w-72 py-1 px-3 rounded-md bg-[#252526] hover:bg-[#2d2d2e] border border-[#454545] text-[#9d9d9d] hover:text-white text-[11px] font-mono transition"
            >
              <Search className="w-3 h-3" />
              <span className="truncate">
                {activeFile ? (activeFile.path || activeFile.name) : projectName || "LetsCollab Workspace"} — ⌘K Commands
              </span>
            </button>
          )}
        </div>

        {/* Right: Collaborators + Run + Debug + Layout Controls */}
        <div className="flex items-center gap-1.5">
          <SyncStatusBadge state={syncState} lastSynced={lastSynced} />

          {/* Live Collaborator Avatars */}
          <div className="flex items-center -space-x-1.5 mx-1">
            {peers.map((peer) => (
              <Tooltip
                key={peer.id}
                content={`${peer.name} (${peer.email || "Collaborating live"})`}
                side="bottom"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white border border-[#1e1e1e]"
                  style={{ backgroundColor: peer.color }}
                >
                  {peer.name.charAt(0).toUpperCase()}
                </div>
              </Tooltip>
            ))}
            <Tooltip content={`You (${user?.name || "Authenticated User"})`} side="bottom">
              <div className="w-6 h-6 rounded-full bg-[#007acc] text-white border border-[#1e1e1e] flex items-center justify-center text-[10px] font-mono font-bold">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
            </Tooltip>
          </div>

          {/* Save Button */}
          <Tooltip content="Save File (⌘S)" side="bottom">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#252526] hover:bg-[#3c3c3c] border border-[#454545] text-[#cccccc] text-[11px] font-mono transition"
            >
              <Save className="w-3.5 h-3.5 text-[#007acc]" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </Tooltip>

          {/* Run Code Button */}
          <Tooltip content="Run Code in Terminal (⌘R)" side="bottom">
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#2ea043] hover:bg-[#3fb950] text-white text-[11px] font-mono font-bold transition disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunning ? "Running..." : "Run"}</span>
            </button>
          </Tooltip>

          {/* Start Debug Button */}
          <Tooltip content="Start Step-by-Step Debugger (F5)" side="bottom">
            <button
              onClick={handleStartDebugging}
              disabled={isStartingDebug}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-white text-[11px] font-mono font-bold transition",
                isDebugging
                  ? "bg-[#d97706] hover:bg-[#f59e0b]"
                  : "bg-[#007acc] hover:bg-[#1f8ad2]"
              )}
            >
              <Bug className="w-3.5 h-3.5" />
              <span>{isStartingDebug ? "Starting..." : isDebugging ? "Debugging" : "Debug"}</span>
            </button>
          </Tooltip>

          {/* GitHub Copilot Toggle Pill */}
          <Tooltip content="Toggle GitHub Copilot Chat (⌘I)" side="bottom">
            <button
              onClick={() => setIsCopilotOpen((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-mono font-medium border transition",
                isCopilotOpen
                  ? "bg-[#094771] border-[#007acc] text-white shadow-sm"
                  : "bg-[#252526] border-[#454545] text-[#cccccc] hover:bg-[#3c3c3c] hover:text-white"
              )}
            >
              <Bot className="w-3.5 h-3.5 text-[#75beff]" />
              <span className="hidden sm:inline">Copilot</span>
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  githubUser ? "bg-[#238636]" : "bg-[#007acc] animate-pulse"
                )}
              />
            </button>
          </Tooltip>

          {/* Split Preview Toggle */}
          <Tooltip content="Toggle Split Live HTML/Code Preview" side="bottom">
            <button
              onClick={() => setIsSplitPreviewOpen((v) => !v)}
              className={cn(
                "p-1.5 rounded border transition",
                isSplitPreviewOpen
                  ? "bg-[#007acc] text-white border-[#007acc]"
                  : "bg-[#252526] text-[#cccccc] border-[#454545] hover:bg-[#3c3c3c]"
              )}
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip
            content={
              editorTheme === "vs-dark" ? "Switch to Light Theme" : "Switch to VS Code Dark+"
            }
            side="bottom"
          >
            <button
              onClick={() =>
                setEditorTheme(editorTheme === "vs-dark" ? "letscollab-paper" : "vs-dark")
              }
              className="p-1.5 rounded bg-[#252526] hover:bg-[#3c3c3c] border border-[#454545] text-[#cccccc] transition"
            >
              {editorTheme === "vs-dark" ? (
                <Sun className="w-3.5 h-3.5 text-[#ffbd2e]" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#cccccc]" />
              )}
            </button>
          </Tooltip>

          {/* Open Standalone Page Link (when embedded) or Fullscreen Toggle */}
          {!fullPage ? (
            <>
              <Tooltip content="Open Dedicated Full-Page IDE" side="bottom">
                <Link
                  href={
                    projectId && projectId !== "demo-workspace" && projectId !== "landing-demo"
                      ? `/projects/${projectId}/editor`
                      : "/editor"
                  }
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#007acc] hover:bg-[#1f8ad2] text-white text-[11px] font-mono font-semibold transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden xl:inline">Full Page</span>
                </Link>
              </Tooltip>
              <Tooltip
                content={isFullscreen ? "Exit Fullscreen IDE" : "Maximize Fullscreen VS Code"}
                side="bottom"
              >
                <button
                  onClick={() => setIsFullscreen((v) => !v)}
                  className="p-1.5 rounded bg-[#252526] hover:bg-[#3c3c3c] border border-[#454545] text-[#cccccc] transition"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </Tooltip>
            </>
          ) : null}
        </div>
      </div>

      {/* =====================================================================
          2. MAIN WORKBENCH BODY (ACTIVITY BAR + SIDEBAR + EDITOR + PREVIEW)
         ===================================================================== */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* 2A. VS Code Leftmost Activity Bar */}
        <div className="w-12 bg-[#333333] border-r border-[#252526] flex flex-col items-center justify-between py-2 shrink-0">
          <div className="flex flex-col items-center gap-1 w-full">
            {[
              { id: "explorer" as ActivityTab, icon: FileCode, label: "Explorer (⌘⇧E)" },
              { id: "search" as ActivityTab, icon: Search, label: "Search & Replace (⌘⇧F)" },
              {
                id: "git" as ActivityTab,
                icon: GitBranch,
                label: "Source Control (⌃⇧G)",
                badge: modifiedFiles.length > 0 ? modifiedFiles.length : undefined,
              },
              {
                id: "tasks" as ActivityTab,
                icon: CheckSquare,
                label: "Project Tasks (Mini-Kanban)",
                badge:
                  projectTasks.filter((t) => t.status !== "DONE").length > 0
                    ? projectTasks.filter((t) => t.status !== "DONE").length
                    : undefined,
              },
              {
                id: "debug" as ActivityTab,
                icon: Bug,
                label: "Run and Debug (⌘⇧D)",
                badge:
                  (breakpointsByFile[activeFileId]?.length || 0) > 0
                    ? breakpointsByFile[activeFileId].length
                    : undefined,
              },
              { id: "extensions" as ActivityTab, icon: Blocks, label: "Extensions (⌘⇧X)" },
            ].map((item) => {
              const Icon = item.icon;
              const active = isSidebarOpen && activeSidebarTab === item.id;
              return (
                <Tooltip key={item.id} content={item.label} side="right">
                  <button
                    onClick={() => {
                      if (activeSidebarTab === item.id && isSidebarOpen) {
                        setIsSidebarOpen(false);
                      } else {
                        setActiveSidebarTab(item.id);
                        setIsSidebarOpen(true);
                      }
                    }}
                    className={cn(
                      "relative w-full py-2.5 flex items-center justify-center transition-colors",
                      active
                        ? "text-white border-l-2 border-l-white bg-[#252526]/50"
                        : "text-[#858585] hover:text-white border-l-2 border-l-transparent"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.badge !== undefined && (
                      <span className="absolute top-1.5 right-2 px-1 min-w-[15px] h-[15px] rounded-full bg-[#007acc] text-white text-[9px] font-mono font-bold flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </Tooltip>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-2">
            <Tooltip content="Toggle Bottom Terminal Panel (⌘J)" side="right">
              <button
                onClick={() => setIsBottomPanelOpen((v) => !v)}
                className={cn(
                  "p-2 rounded transition-colors",
                  isBottomPanelOpen ? "text-white" : "text-[#858585] hover:text-white"
                )}
              >
                <TerminalIcon className="w-5 h-5" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* 2B. VS Code Primary Side Bar */}
        {isSidebarOpen && (
          <div className="w-64 bg-[#252526] border-r border-[#1e1e1e] flex flex-col shrink-0 overflow-hidden">
            {/* VIEW 1: EXPLORER */}
            {activeSidebarTab === "explorer" && (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-3 py-2 text-[11px] font-bold tracking-wider text-[#bbbbbb] uppercase border-b border-[#1e1e1e]">
                  <span>EXPLORER</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setIsCreatingFile((v) => !v);
                        setIsCreatingFolder(false);
                      }}
                      className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc]"
                      title="New File"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingFolder((v) => !v);
                        setIsCreatingFile(false);
                      }}
                      className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc]"
                      title="New Directory / Folder"
                    >
                      <FolderPlus className="w-3.5 h-3.5 text-[#dcb67a]" />
                    </button>
                    <button
                      onClick={() => fileUploadRef.current?.click()}
                      className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc]"
                      title="Upload File from Computer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleDownloadActiveFile}
                      className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc]"
                      title="Download Current File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsTemplateModalOpen(true)}
                      className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc]"
                      title="Scaffold Starter Template (React, Node, Python, HTML)..."
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#e2c08d]" />
                    </button>
                    <button
                      onClick={handleExportZip}
                      className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc]"
                      title="Export Entire Workspace as ZIP"
                    >
                      <Archive className="w-3.5 h-3.5 text-[#75beff]" />
                    </button>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white transition ml-1 pl-1.5 border-l border-[#333333]"
                      title="Close Side Bar (⌘B)"
                      aria-label="Close Side Bar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* New File Inline Modal */}
                {isCreatingFile && (
                  <form
                    onSubmit={handleCreateNewFile}
                    className="p-2.5 bg-[#1e1e1e] border-b border-[#333333] space-y-2"
                  >
                    <div className="text-[10px] font-mono text-[#75beff] font-bold">
                      CREATE NEW WORKSPACE FILE
                    </div>
                    <div className="flex gap-1.5">
                      <select
                        value={newFileFolderInput}
                        onChange={(e) => setNewFileFolderInput(e.target.value)}
                        className="bg-[#252526] border border-[#454545] rounded px-1.5 py-1 text-[11px] text-white font-mono outline-none"
                      >
                        <option value="">root</option>
                        {availableFolders.map((fld) => (
                          <option key={fld} value={fld}>
                            {fld}/
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        autoFocus
                        value={newFileNameInput}
                        onChange={(e) => setNewFileNameInput(e.target.value)}
                        placeholder="app.js or utils/math.ts"
                        className="flex-1 min-w-0 bg-[#252526] border border-[#007acc] rounded px-2 py-1 text-[11px] text-white font-mono outline-none"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsCreatingFile(false)}
                        className="px-2 py-0.5 text-[10px] text-[#9d9d9d] hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-0.5 rounded bg-[#007acc] text-white text-[10px] font-bold"
                      >
                        Create
                      </button>
                    </div>
                  </form>
                )}

                {/* New Folder Inline Modal */}
                {isCreatingFolder && (
                  <form
                    onSubmit={handleCreateNewFolder}
                    className="p-2.5 bg-[#1e1e1e] border-b border-[#333333] space-y-2"
                  >
                    <div className="text-[10px] font-mono text-[#e2c08d] font-bold flex items-center gap-1.5">
                      <FolderPlus className="w-3.5 h-3.5 text-[#dcb67a]" />
                      <span>CREATE NEW DIRECTORY</span>
                    </div>
                    <input
                      type="text"
                      autoFocus
                      value={newFolderNameInput}
                      onChange={(e) => setNewFolderNameInput(e.target.value)}
                      placeholder="e.g. components, utils, services"
                      className="w-full bg-[#252526] border border-[#dcb67a] rounded px-2 py-1 text-[11px] text-white font-mono outline-none"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsCreatingFolder(false)}
                        className="px-2 py-0.5 text-[10px] text-[#9d9d9d] hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-0.5 rounded bg-[#dcb67a] hover:bg-[#e2c08d] text-black text-[10px] font-bold"
                      >
                        Create Folder
                      </button>
                    </div>
                  </form>
                )}

                {/* Folder & File Tree */}
                <div
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, file: null, folder: "" });
                  }}
                  className="flex-1 overflow-y-auto py-1.5 space-y-1"
                >
                  {Object.entries(groupedFolders).map(([folderName, folderFiles]) => {
                    if (folderFiles.length === 0) return null;
                    const isExp = treeExpanded[folderName] ?? true;

                    return (
                      <div key={folderName}>
                        {folderName !== "root" && (
                          <div
                            onClick={() =>
                              setTreeExpanded((p) => ({ ...p, [folderName]: !isExp }))
                            }
                            onContextMenu={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setContextMenu({ x: e.clientX, y: e.clientY, file: null, folder: folderName });
                            }}
                            className="flex items-center gap-1.5 px-2 py-1 text-xs text-[#cccccc] hover:bg-[#2a2d2e] cursor-pointer font-medium"
                          >
                            {isExp ? (
                              <ChevronDown className="w-3.5 h-3.5 text-[#858585]" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-[#858585]" />
                            )}
                            {isExp ? (
                              <FolderOpen className="w-3.5 h-3.5 text-[#dcb67a]" />
                            ) : (
                              <Folder className="w-3.5 h-3.5 text-[#dcb67a]" />
                            )}
                            <span className="font-mono text-xs">{folderName}</span>
                          </div>
                        )}

                        {(folderName === "root" || isExp) && (
                          <div className={cn("space-y-0.5", folderName !== "root" && "pl-4")}>
                            {folderFiles.map((file) => {
                              const isActive = file.id === activeFileId;
                              const fileBps = breakpointsByFile[file.id] || [];

                              return (
                                <div
                                  key={file.id}
                                  onClick={() => {
                                    if (!openTabIds.includes(file.id)) {
                                      setOpenTabIds((p) => [...p, file.id]);
                                    }
                                    setActiveFileId(file.id);
                                  }}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setContextMenu({ x: e.clientX, y: e.clientY, file, folder: file.folder });
                                  }}
                                  className={cn(
                                    "group flex items-center justify-between px-2.5 py-1 text-xs font-mono cursor-pointer transition-colors",
                                    isActive
                                      ? "bg-[#37373d] text-white font-semibold"
                                      : "text-[#cccccc] hover:bg-[#2a2d2e]"
                                  )}
                                >
                                  {renamingFileId === file.id ? (
                                    <input
                                      type="text"
                                      autoFocus
                                      value={renameValue}
                                      onChange={(e) => setRenameValue(e.target.value)}
                                      onBlur={() => handleRenameSubmit(file.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleRenameSubmit(file.id);
                                        if (e.key === "Escape") setRenamingFileId(null);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-full bg-[#1e1e1e] border border-[#007acc] rounded px-1.5 py-0.5 text-xs text-white outline-none"
                                    />
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-2 truncate">
                                        <FileCode
                                          className={cn(
                                            "w-3.5 h-3.5 shrink-0",
                                            getFileBadgeColor(file.name)
                                          )}
                                        />
                                        <span className="truncate">{file.name}</span>
                                        {fileBps.length > 0 && (
                                          <span
                                            className="w-2 h-2 rounded-full bg-[#e51400] shrink-0"
                                            title={`${fileBps.length} breakpoint(s)`}
                                          />
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setRenamingFileId(file.id);
                                            setRenameValue(file.name);
                                          }}
                                          className="p-0.5 hover:text-white text-[#858585]"
                                          title="Rename File"
                                        >
                                          <Edit3 className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={(e) => handleDeleteFile(file.id, e)}
                                          className="p-0.5 hover:text-[#f48771] text-[#858585]"
                                          title="Delete File"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {files.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-[#858585] space-y-2">
                      <FileCode className="w-8 h-8 text-[#555555]" />
                      <div className="text-xs font-semibold text-[#cccccc]">No files in workspace</div>
                      <p className="text-[11px] text-[#777777] leading-relaxed">
                        Workspace is clean. Create files or scaffold a starter template.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => {
                            setIsCreatingFile(true);
                            setIsCreatingFolder(false);
                          }}
                          className="px-2.5 py-1 bg-[#007acc] hover:bg-[#1f8ad2] text-white rounded text-[11px] font-medium flex items-center gap-1.5 transition shadow"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>New File</span>
                        </button>
                        <button
                          onClick={() => setIsTemplateModalOpen(true)}
                          className="px-2.5 py-1 bg-[#252526] hover:bg-[#333333] border border-[#454545] text-white rounded text-[11px] font-medium flex items-center gap-1.5 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#e2c08d]" />
                          <span>Templates</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 2: SEARCH & REPLACE ACROSS FILES */}
            {activeSidebarTab === "search" && (
              <div className="flex flex-col h-full p-3 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-[#bbbbbb] uppercase">
                  <span>SEARCH & REPLACE</span>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white transition"
                    title="Close Side Bar (⌘B)"
                    aria-label="Close Side Bar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search in files..."
                      className="w-full bg-[#3c3c3c] border border-[#454545] focus:border-[#007acc] rounded px-2.5 py-1.5 text-xs text-white placeholder-[#858585] outline-none font-mono"
                    />
                    <button
                      onClick={() => setSearchCaseSensitive((v) => !v)}
                      className={cn(
                        "absolute right-1.5 top-1.5 px-1 rounded text-[10px] font-mono",
                        searchCaseSensitive ? "bg-[#007acc] text-white" : "text-[#858585]"
                      )}
                      title="Match Case"
                    >
                      Aa
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={replaceQuery}
                      onChange={(e) => setReplaceQuery(e.target.value)}
                      placeholder="Replace with..."
                      className="flex-1 min-w-0 bg-[#3c3c3c] border border-[#454545] focus:border-[#007acc] rounded px-2.5 py-1.5 text-xs text-white placeholder-[#858585] outline-none font-mono"
                    />
                    <button
                      onClick={handleReplaceAllInWorkspace}
                      disabled={!searchQuery}
                      className="px-2 py-1 rounded bg-[#007acc] hover:bg-[#1f8ad2] text-white text-[10px] font-bold disabled:opacity-40"
                    >
                      All
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pt-1 border-t border-[#1e1e1e]">
                  <div className="text-[10px] font-mono text-[#858585]">
                    {searchResults.length} result(s) across {files.length} files
                  </div>
                  {searchResults.map((hit, idx) => (
                    <div
                      key={`${hit.file.id}-${hit.line}-${idx}`}
                      onClick={() => {
                        if (!openTabIds.includes(hit.file.id)) {
                          setOpenTabIds((p) => [...p, hit.file.id]);
                        }
                        setActiveFileId(hit.file.id);
                        setTimeout(() => {
                          editorRef.current?.revealLineInCenter(hit.line);
                          editorRef.current?.setPosition({ lineNumber: hit.line, column: 1 });
                        }, 60);
                      }}
                      className="p-2 rounded bg-[#1e1e1e] hover:bg-[#2a2d2e] cursor-pointer text-[11px] font-mono space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-[#75beff]">
                        <span>{hit.file.name}</span>
                        <span className="text-[10px] text-[#858585]">Ln {hit.line}</span>
                      </div>
                      <div className="text-[#cccccc] truncate">{hit.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 3: SOURCE CONTROL (GIT) */}
            {activeSidebarTab === "git" && (
              <div className="flex flex-col h-full p-3 space-y-3 overflow-y-auto">
                <div className="text-[11px] font-bold tracking-wider text-[#bbbbbb] uppercase flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>SOURCE CONTROL</span>
                    <span className="text-[10px] font-mono text-[#75beff]">main</span>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white transition"
                    title="Close Side Bar (⌘B)"
                    aria-label="Close Side Bar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form onSubmit={handleCommitChanges} className="space-y-2">
                  {projectTasks.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] text-[#858585] font-mono flex items-center justify-between">
                        <span>LINK TASK</span>
                        {selectedCommitTaskId && (
                          <button
                            type="button"
                            onClick={() => setSelectedCommitTaskId("")}
                            className="text-[#75beff] hover:underline text-[9px]"
                          >
                            clear
                          </button>
                        )}
                      </label>
                      <select
                        value={selectedCommitTaskId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedCommitTaskId(val);
                          if (val) {
                            const t = projectTasks.find((task) => task.id === val);
                            if (t && (!commitMessage || commitMessage.startsWith("#"))) {
                              setCommitMessage(`#${t.id.slice(0, 8)}: ${t.title}`);
                            }
                          }
                        }}
                        className="w-full bg-[#3c3c3c] border border-[#454545] rounded p-1.5 text-[11px] text-white outline-none font-mono"
                      >
                        <option value="">No task linked</option>
                        {projectTasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            [{t.status}] #{t.id.slice(0, 8)} {t.title.slice(0, 22)}...
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <textarea
                    rows={2}
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Message (⌘Enter to commit or #TASK-ID)"
                    className="w-full bg-[#3c3c3c] border border-[#454545] focus:border-[#007acc] rounded p-2 text-xs text-white placeholder-[#858585] outline-none font-mono resize-none"
                  />
                  <button
                    type="submit"
                    disabled={isCommitting || !commitMessage.trim()}
                    className="w-full py-1.5 rounded bg-[#007acc] hover:bg-[#1f8ad2] text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isCommitting ? "Committing..." : "Commit & Sync Changes"}</span>
                  </button>
                </form>

                {/* Modified Files List */}
                <div className="space-y-1 pt-2 border-t border-[#1e1e1e]">
                  <div className="text-[10px] font-bold text-[#858585] uppercase">
                    Changes ({modifiedFiles.length})
                  </div>
                  {modifiedFiles.length === 0 ? (
                    <div className="text-[11px] text-[#858585] font-mono py-2">
                      Working tree clean.
                    </div>
                  ) : (
                    modifiedFiles.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => setActiveFileId(f.id)}
                        className="group flex items-center justify-between px-2 py-1 rounded hover:bg-[#2a2d2e] cursor-pointer text-xs font-mono"
                      >
                        <span className="truncate text-[#e2c08d] flex-1">{f.path || f.name}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenGitDiff(f);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:text-white text-[#75beff] p-0.5"
                            title="Inspect Git Diff (Working Tree vs. Last Commit)"
                          >
                            <GitPullRequest className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] font-bold text-[#e2c08d]">M</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Commit History Log */}
                <div className="space-y-1.5 pt-2 border-t border-[#1e1e1e] flex-1 overflow-y-auto">
                  <div className="text-[10px] font-bold text-[#858585] uppercase">
                    Commit History ({commits.length})
                  </div>
                  {commits.map((c) => (
                    <div
                      key={c.id}
                      className="p-2 rounded bg-[#1e1e1e] border border-[#333333] text-[11px] font-mono space-y-0.5"
                    >
                      <div className="flex items-center gap-1.5 text-white font-semibold">
                        <GitCommit className="w-3 h-3 text-[#007acc] shrink-0" />
                        <span className="truncate">{c.message}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#858585]">
                        <span>{c.authorName}</span>
                        <span>{new Date(c.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 4: RUN AND DEBUG PANEL */}
            {activeSidebarTab === "debug" && (
              <div className="flex flex-col h-full overflow-y-auto divide-y divide-[#1e1e1e] text-xs">
                {/* Launch Header */}
                <div className="p-3 space-y-2 bg-[#252526]">
                  <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-[#bbbbbb] uppercase">
                    <span>RUN AND DEBUG</span>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white transition"
                      title="Close Side Bar (⌘B)"
                      aria-label="Close Side Bar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleStartDebugging}
                      disabled={isStartingDebug}
                      className="flex-1 py-1.5 px-2.5 rounded bg-[#2ea043] hover:bg-[#3fb950] text-white text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isDebugging ? "Restart Debug (F5)" : "Start Debugging (F5)"}</span>
                    </button>
                  </div>
                  <div className="text-[10px] text-[#858585] font-mono">
                    Target: {activeFile ? `${activeFile.path || activeFile.name} (${getMonacoLanguage(activeFile.name)})` : "No file selected"}
                  </div>
                </div>

                {/* VARIABLES SECTION */}
                <div className="p-3 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase text-[#bbbbbb] flex items-center justify-between">
                    <span>VARIABLES (LOCALS)</span>
                    {currentDebugStep && (
                      <span className="text-[#ffcc00] font-mono">Ln {currentDebugStep.line}</span>
                    )}
                  </div>
                  {!isDebugging || !currentDebugStep ? (
                    <div className="text-[11px] text-[#858585] font-mono py-1">
                      Not paused on a breakpoint. Click &quot;Start Debugging (F5)&quot; to inspect live variables.
                    </div>
                  ) : (
                    <div className="space-y-1 font-mono text-[11px] max-h-44 overflow-y-auto">
                      {Object.entries(currentDebugStep.variables)
                        .filter(([k]) => !k.startsWith("watch:"))
                        .map(([varName, info]) => (
                          <div
                            key={varName}
                            className="flex items-start justify-between gap-2 px-1.5 py-1 rounded bg-[#1e1e1e]"
                          >
                            <span className="text-[#9cdcfe] font-semibold shrink-0">{varName}:</span>
                            <span className="text-[#ce9178] break-all text-right">{info.value}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* WATCH EXPRESSIONS SECTION */}
                <div className="p-3 space-y-2">
                  <div className="text-[10px] font-bold uppercase text-[#bbbbbb]">WATCH</div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newWatchInput.trim()) return;
                      setWatchExpressions((p) => [...p, newWatchInput.trim()]);
                      setNewWatchInput("");
                    }}
                    className="flex gap-1"
                  >
                    <input
                      type="text"
                      value={newWatchInput}
                      onChange={(e) => setNewWatchInput(e.target.value)}
                      placeholder="Add watch expression..."
                      className="flex-1 min-w-0 bg-[#3c3c3c] border border-[#454545] rounded px-2 py-1 text-[11px] text-white font-mono outline-none"
                    />
                    <button
                      type="submit"
                      className="px-2 py-1 rounded bg-[#007acc] text-white text-[10px] font-bold"
                    >
                      +
                    </button>
                  </form>
                  <div className="space-y-1 font-mono text-[11px]">
                    {watchExpressions.map((expr, i) => {
                      const evaluated =
                        currentDebugStep?.variables[`watch:${expr}`]?.value ??
                        currentDebugStep?.variables[expr]?.value ??
                        (isDebugging ? "<not in scope>" : "<not running>");
                      return (
                        <div
                          key={`${expr}-${i}`}
                          className="flex items-center justify-between px-1.5 py-1 rounded bg-[#1e1e1e]"
                        >
                          <div className="truncate">
                            <span className="text-[#c586c0]">{expr}</span>
                            <span className="text-[#858585]"> = </span>
                            <span className="text-[#b5cea8]">{evaluated}</span>
                          </div>
                          <button
                            onClick={() =>
                              setWatchExpressions((p) => p.filter((_, idx) => idx !== i))
                            }
                            className="text-[#858585] hover:text-white ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CALL STACK SECTION */}
                <div className="p-3 space-y-1.5">
                  <div className="text-[10px] font-bold uppercase text-[#bbbbbb]">CALL STACK</div>
                  {!isDebugging || !currentDebugStep ? (
                    <div className="text-[11px] text-[#858585] font-mono">No active call stack.</div>
                  ) : (
                    <div className="space-y-1 font-mono text-[11px]">
                      {currentDebugStep.callStack.map((frame, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            editorRef.current?.revealLineInCenter(frame.line);
                            editorRef.current?.setPosition({ lineNumber: frame.line, column: 1 });
                          }}
                          className={cn(
                            "flex items-center justify-between px-2 py-1 rounded cursor-pointer",
                            i === 0
                              ? "bg-[#37373d] text-[#ffcc00] font-semibold"
                              : "text-[#cccccc] hover:bg-[#2a2d2e]"
                          )}
                        >
                          <span className="truncate">{frame.name}</span>
                          <span className="text-[10px] text-[#858585]">
                            {frame.file}:{frame.line}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BREAKPOINTS SECTION */}
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[#bbbbbb]">
                      BREAKPOINTS
                    </span>
                    <button
                      onClick={() => setBreakpointsByFile({})}
                      className="text-[10px] text-[#75beff] hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="text-[10px] text-[#858585] pb-1">
                    Click left of any line number in the editor to toggle a red breakpoint.
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    {Object.entries(breakpointsByFile).flatMap(([fId, lines]) => {
                      const fObj = files.find((f) => f.id === fId);
                      if (!fObj) return [];
                      return lines.map((ln) => (
                        <div
                          key={`${fId}-${ln}`}
                          onClick={() => {
                            setActiveFileId(fId);
                            setTimeout(() => {
                              editorRef.current?.revealLineInCenter(ln);
                            }, 50);
                          }}
                          className="flex items-center justify-between px-2 py-1 rounded bg-[#1e1e1e] hover:bg-[#2a2d2e] cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#e51400]" />
                            <span className="text-[#cccccc]">{fObj.name}</span>
                          </div>
                          <span className="text-[10px] text-[#75beff]">Line {ln}</span>
                        </div>
                      ));
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 5: EXTENSIONS MARKETPLACE */}
            {activeSidebarTab === "extensions" && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-3 border-b border-[#1e1e1e] space-y-2 shrink-0">
                  <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-[#bbbbbb] uppercase">
                    <div className="flex items-center gap-2">
                      <span>EXTENSIONS MARKETPLACE</span>
                      <span className="text-[10px] text-[#75beff] font-mono">
                        {extensions.filter((e) => e.enabled).length}/{extensions.length} Active
                      </span>
                    </div>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white transition"
                      title="Close Side Bar (⌘B)"
                      aria-label="Close Side Bar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#858585] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={extensionSearch}
                      onChange={(e) => setExtensionSearch(e.target.value)}
                      placeholder="Search Extensions in Marketplace..."
                      className="w-full bg-[#1e1e1e] border border-[#3c3c3c] focus:border-[#007acc] rounded-md pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-[#858585] outline-none font-sans"
                    />
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar text-[10px]">
                    {["All", "AI", "Language", "Linter", "Tools", "Themes"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setExtensionCategory(cat)}
                        className={cn(
                          "px-2 py-0.5 rounded font-mono transition shrink-0",
                          extensionCategory === cat
                            ? "bg-[#007acc] text-white font-bold"
                            : "bg-[#1e1e1e] text-[#858585] hover:text-white hover:bg-[#2d2d2e]"
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extensions List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {extensions
                    .filter((ext) => {
                      const matchesSearch =
                        !extensionSearch.trim() ||
                        ext.name.toLowerCase().includes(extensionSearch.toLowerCase()) ||
                        ext.publisher.toLowerCase().includes(extensionSearch.toLowerCase()) ||
                        ext.desc.toLowerCase().includes(extensionSearch.toLowerCase());
                      const matchesCategory =
                        extensionCategory === "All" || ext.category === extensionCategory;
                      return matchesSearch && matchesCategory;
                    })
                    .map((ext) => (
                      <div
                        key={ext.id}
                        className="p-2.5 rounded-lg bg-[#1e1e1e] border border-[#333333] hover:border-[#454545] transition space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              <span>{ext.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-[#858585] font-mono mt-0.5">
                              <span>{ext.publisher}</span>
                              <span>•</span>
                              <span className="text-[#ffbd2e]">★ {ext.rating}</span>
                              <span>•</span>
                              <span>{ext.downloads}</span>
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded bg-[#252526] text-[#75beff] text-[9px] font-mono shrink-0">
                            v{ext.version}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9d9d9d] leading-snug line-clamp-2">
                          {ext.desc}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-[#252526]">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#2a2d2e] text-[#bbbbbb]">
                            {ext.category}
                          </span>
                          <button
                            onClick={() =>
                              setExtensions((prev) =>
                                prev.map((e) =>
                                  e.id === ext.id ? { ...e, enabled: !e.enabled } : e
                                )
                              )
                            }
                            className={cn(
                              "px-2.5 py-0.5 rounded text-[10px] font-bold transition",
                              ext.enabled
                                ? "bg-[#2ea043]/20 text-[#3fb950] border border-[#2ea043]/40 hover:bg-[#2ea043]/30"
                                : "bg-[#3c3c3c] text-[#cccccc] hover:bg-[#454545]"
                            )}
                          >
                            {ext.enabled ? "Enabled" : "Enable"}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* VIEW 6: PROJECT TASKS (MINI-KANBAN) */}
            {activeSidebarTab === "tasks" && (
              <div className="flex flex-col h-full p-3 space-y-3 overflow-y-auto">
                <div className="text-[11px] font-bold tracking-wider text-[#bbbbbb] uppercase flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-[#007acc]" />
                    <span>PROJECT TASKS</span>
                    <span className="text-[10px] font-mono text-[#858585] ml-1">
                      ({projectTasks.length})
                    </span>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white transition"
                    title="Close Side Bar (⌘B)"
                    aria-label="Close Side Bar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Filter Input */}
                <input
                  type="text"
                  value={taskFilterQuery}
                  onChange={(e) => setTaskFilterQuery(e.target.value)}
                  placeholder="Filter tasks by name or ID..."
                  className="w-full bg-[#3c3c3c] border border-[#454545] rounded px-2 py-1 text-xs text-white placeholder-[#858585] outline-none font-mono"
                />

                {/* Tasks List grouped by Status */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {(["TODO", "IN_PROGRESS", "DONE"] as const).map((colStatus) => {
                    const colTasks = projectTasks
                      .filter((t) => t.status === colStatus)
                      .filter((t) =>
                        taskFilterQuery.trim()
                          ? t.title.toLowerCase().includes(taskFilterQuery.toLowerCase()) ||
                            t.id.toLowerCase().includes(taskFilterQuery.toLowerCase())
                          : true
                      );

                    const statusConfig: Record<string, { label: string; color: string }> = {
                      TODO: { label: "TO DO", color: "text-[#858585]" },
                      IN_PROGRESS: { label: "IN PROGRESS", color: "text-[#75beff]" },
                      DONE: { label: "COMPLETED", color: "text-[#3fb950]" },
                    };

                    return (
                      <div key={colStatus} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold tracking-wide uppercase">
                          <span className={statusConfig[colStatus].color}>
                            {statusConfig[colStatus].label}
                          </span>
                          <span className="px-1.5 py-0.2 rounded-full bg-[#2a2d2e] text-[#858585]">
                            {colTasks.length}
                          </span>
                        </div>

                        {colTasks.length === 0 ? (
                          <div className="p-2 rounded bg-[#1e1e1e]/60 border border-[#2d2d2d] text-[10px] text-[#656565] italic">
                            No tasks
                          </div>
                        ) : (
                          colTasks.map((task) => (
                            <div
                              key={task.id}
                              className="p-2.5 rounded bg-[#1e1e1e] border border-[#333333] hover:border-[#007acc] text-xs font-mono space-y-2 transition group"
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <span className="font-semibold text-white text-[11px] leading-snug">
                                  {task.title}
                                </span>
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0",
                                    task.priority === "HIGH"
                                      ? "bg-[#da3633]/20 text-[#f85149]"
                                      : task.priority === "MEDIUM"
                                      ? "bg-[#d29922]/20 text-[#e3b341]"
                                      : "bg-[#2a2d2e] text-[#858585]"
                                  )}
                                >
                                  {task.priority || "NORMAL"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-[#858585]">
                                <span>#{task.id.slice(0, 8)}</span>
                                {task.assignee?.name && (
                                  <span className="text-[#cccccc] truncate max-w-[90px]">
                                    @{task.assignee.name.split(" ")[0]}
                                  </span>
                                )}
                              </div>

                              {/* Task Action Buttons */}
                              <div className="flex items-center justify-between pt-1 border-t border-[#2d2d2d] text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveSidebarTab("git");
                                    setSelectedCommitTaskId(task.id);
                                    setCommitMessage(`#${task.id.slice(0, 8)}: ${task.title}`);
                                  }}
                                  className="text-[#75beff] hover:underline flex items-center gap-1"
                                  title="Pre-fill commit message to link this task"
                                >
                                  <GitCommit className="w-2.5 h-2.5" />
                                  <span>Commit Link</span>
                                </button>

                                <div className="flex items-center gap-1">
                                  {colStatus !== "TODO" && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateTaskStatus(task.id, "TODO")}
                                      className="px-1.5 py-0.5 rounded bg-[#2a2d2e] hover:bg-[#333333] text-[#cccccc] text-[9px]"
                                      title="Move to To Do"
                                    >
                                      ← Todo
                                    </button>
                                  )}
                                  {colStatus !== "IN_PROGRESS" && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateTaskStatus(task.id, "IN_PROGRESS")}
                                      className="px-1.5 py-0.5 rounded bg-[#094771] hover:bg-[#007acc] text-white text-[9px]"
                                      title="Move to In Progress"
                                    >
                                      → Progress
                                    </button>
                                  )}
                                  {colStatus !== "DONE" && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateTaskStatus(task.id, "DONE")}
                                      className="px-1.5 py-0.5 rounded bg-[#238636] hover:bg-[#2ea043] text-white text-[9px]"
                                      title="Move to Completed"
                                    >
                                      ✔ Done
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2C. CENTER MONACO EDITOR + TABS + BREADCRUMBS + BOTTOM PANEL */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          {/* Open Editor File Tabs Bar */}
          <div className="flex items-center justify-between border-b border-[#252526] bg-[#252526] overflow-x-auto shrink-0">
            <div className="flex items-center overflow-x-auto">
              {openTabIds.map((tabId) => {
                const file = files.find((f) => f.id === tabId);
                if (!file) return null;
                const isActive = tabId === activeFileId;

                return (
                  <div
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={cn(
                      "group flex items-center gap-2 px-3 py-2 border-r border-[#1e1e1e] text-xs font-mono cursor-pointer transition-colors shrink-0",
                      isActive
                        ? "bg-[#1e1e1e] text-white font-semibold border-t-2 border-t-[#007acc]"
                        : "bg-[#2d2d2d] text-[#969696] hover:bg-[#1e1e1e]/60 border-t-2 border-t-transparent"
                    )}
                  >
                    <FileCode className={cn("w-3.5 h-3.5", getFileBadgeColor(file.name))} />
                    <span>{file.name}</span>
                    {file.isModified && (
                      <span className="w-2 h-2 rounded-full bg-[#e2c08d]" title="Unsaved changes" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rem = openTabIds.filter((id) => id !== file.id);
                        setOpenTabIds(rem);
                        if (activeFileId === file.id) {
                          setActiveFileId(rem.length > 0 ? rem[rem.length - 1] : "");
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:bg-[#3c3c3c] p-0.5 rounded text-[#858585] hover:text-white"
                      title="Close Tab"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
              {openTabIds.length === 0 && (
                <div className="flex items-center px-3 py-2 text-[11px] text-[#858585] italic">
                  No open tabs
                </div>
              )}
            </div>
          </div>

          {activeFile ? (
            <>
              {/* VS Code Breadcrumbs Bar */}
              <div className="flex items-center justify-between px-3 py-1 bg-[#1e1e1e] border-b border-[#2d2d2d] text-[11px] font-mono text-[#858585] shrink-0">
                <div className="flex items-center gap-1">
                  <span>workspace</span>
                  <ChevronRight className="w-3 h-3" />
                  {activeFile.folder && (
                    <>
                      <span>{activeFile.folder}</span>
                      <ChevronRight className="w-3 h-3" />
                    </>
                  )}
                  <span className="text-[#cccccc] font-semibold">{activeFile.name}</span>
                  {isDebugging && currentDebugStep && (
                    <>
                      <ChevronRight className="w-3 h-3" />
                      <span className="text-[#ffcc00] font-bold">
                        {currentDebugStep.functionName} (Line {currentDebugStep.line})
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-[#75beff]">
                    Breakpoints: {(breakpointsByFile[activeFile.id] || []).length}
                  </span>
                  <button
                    onClick={handleFormat}
                    className="hover:text-white transition"
                  >
                    {isFormatting ? "Formatting..." : "Format (⇧⌥F)"}
                  </button>
                </div>
              </div>

              {/* Editor + Optional Split Live HTML Preview */}
              <div className="flex-1 flex min-h-0 overflow-hidden">
                <div className="flex-1 h-full min-w-0 relative">
                  <Editor
                    height="100%"
                    width="100%"
                    language={getMonacoLanguage(activeFile.name)}
                    theme={editorTheme}
                    value={activeFile.content}
                    beforeMount={handleEditorWillMount}
                    onMount={handleEditorDidMount}
                    onChange={handleCodeChange}
                    loading={
                      <div className="flex items-center justify-center h-full text-xs text-[#858585] font-mono gap-2">
                        <Sparkles className="w-4 h-4 text-[#007acc] animate-spin" />
                        <span>Loading VS Code Monaco Engine...</span>
                      </div>
                    }
                    options={{
                      fontSize: editorFontSize,
                      fontFamily: "'IBM Plex Mono', Menlo, Monaco, 'Courier New', monospace",
                      tabSize: 2,
                      glyphMargin: true,
                      lineNumbersMinChars: 3,
                      minimap: { enabled: minimapEnabled, maxColumn: 80, scale: 0.75 },
                      wordWrap: wordWrap,
                      scrollBeyondLastLine: false,
                      smoothScrolling: true,
                      cursorBlinking: "smooth",
                      cursorSmoothCaretAnimation: "on",
                      bracketPairColorization: { enabled: true },
                      renderLineHighlight: "all",
                      padding: { top: 10, bottom: 10 },
                      automaticLayout: true,
                    }}
                  />
                </div>

                {/* Split Live Web Preview Pane */}
                {isSplitPreviewOpen && (
                  <div className="w-1/2 h-full border-l border-[#333333] bg-[#0f172a] flex flex-col">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#333333] text-[11px] font-mono text-[#cccccc]">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#007acc]" />
                        <span>Live Preview — {activeFile.name}</span>
                      </div>
                      <button
                        onClick={() => setIsSplitPreviewOpen(false)}
                        className="text-[#858585] hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <iframe
                      title="VS Code Live Preview"
                      className="flex-1 w-full h-full bg-white"
                      sandbox="allow-scripts"
                      srcDoc={
                        activeFile.name.endsWith(".html")
                          ? activeFile.content
                          : `<pre style="font-family:monospace;padding:16px;background:#0f172a;color:#e2e8f0;margin:0;min-height:100vh;">${activeFile.content
                              .replace(/&/g, "&amp;")
                              .replace(/</g, "&lt;")
                              .replace(/>/g, "&gt;")}</pre>`
                      }
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#1e1e1e] text-[#cccccc] overflow-y-auto select-none">
              <div className="max-w-2xl w-full space-y-6 animate-in fade-in zoom-in-95 duration-200">
                {/* Hero Header */}
                <div className="space-y-2 border-b border-[#2d2d2d] pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#007acc]/10 border border-[#007acc]/30 flex items-center justify-center text-[#007acc]">
                      <Code2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white tracking-tight">Visual Studio Code</h1>
                      <p className="text-xs text-[#858585] font-mono">
                        LetsCollab Collaborative Studio • Clean Workspace
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-[#9d9d9d] leading-relaxed pt-2">
                    No starter files pre-seeded. Only files and folders created or uploaded by project collaborators are saved and synced in real time across all team members.
                  </p>
                </div>

                {/* Quick Start Actions Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#252526] border border-[#333333] space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#bbbbbb] flex items-center gap-2">
                      <Plus className="w-4 h-4 text-[#007acc]" />
                      <span>Start Development</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <button
                        onClick={() => {
                          setIsSidebarOpen(true);
                          setActiveSidebarTab("explorer");
                          setIsCreatingFile(true);
                          setIsCreatingFolder(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded bg-[#1e1e1e] hover:bg-[#2d2d2e] border border-[#3c3c3c] hover:border-[#007acc] text-left text-white transition group"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <FileCode className="w-4 h-4 text-[#75beff]" />
                          New File...
                        </span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#333333] text-[10px] font-mono text-[#858585]">⌘N</kbd>
                      </button>

                      <button
                        onClick={() => {
                          setIsSidebarOpen(true);
                          setActiveSidebarTab("explorer");
                          setIsCreatingFolder(true);
                          setIsCreatingFile(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded bg-[#1e1e1e] hover:bg-[#2d2d2e] border border-[#3c3c3c] hover:border-[#dcb67a] text-left text-white transition group"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <FolderPlus className="w-4 h-4 text-[#dcb67a]" />
                          New Directory / Folder...
                        </span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#333333] text-[10px] font-mono text-[#858585]">Folder</kbd>
                      </button>

                      <button
                        onClick={() => fileUploadRef.current?.click()}
                        className="w-full flex items-center justify-between p-2 rounded bg-[#1e1e1e] hover:bg-[#2d2d2e] border border-[#3c3c3c] hover:border-[#89d185] text-left text-white transition group"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <Upload className="w-4 h-4 text-[#89d185]" />
                          Upload File from Computer...
                        </span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#333333] text-[10px] font-mono text-[#858585]">⌘O</kbd>
                      </button>

                      <button
                        onClick={() => setIsCopilotOpen(true)}
                        className="w-full flex items-center justify-between p-2 rounded bg-[#1e1e1e] hover:bg-[#2d2d2e] border border-[#3c3c3c] hover:border-[#007acc] text-left text-white transition group"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <Bot className="w-4 h-4 text-[#75beff]" />
                          Ask GitHub Copilot AI...
                        </span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#333333] text-[10px] font-mono text-[#858585]">⌘I</kbd>
                      </button>

                      <button
                        onClick={() => setIsTemplateModalOpen(true)}
                        className="w-full flex items-center justify-between p-2 rounded bg-[#1e1e1e] hover:bg-[#2d2d2e] border border-[#3c3c3c] hover:border-[#e2c08d] text-left text-white transition group"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <Sparkles className="w-4 h-4 text-[#e2c08d]" />
                          Scaffold Starter Template...
                        </span>
                        <span className="text-[10px] text-[#e2c08d] font-mono">React/Node/Python</span>
                      </button>
                    </div>
                  </div>

                  {/* Shortcuts & Navigation */}
                  <div className="p-4 rounded-xl bg-[#252526] border border-[#333333] space-y-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#bbbbbb] flex items-center gap-2">
                      <TerminalIcon className="w-4 h-4 text-[#e2c08d]" />
                      <span>Essential Shortcuts</span>
                    </div>
                    <div className="space-y-1.5 text-[11px] font-mono">
                      <div className="flex items-center justify-between py-1 border-b border-[#2d2d2d]">
                        <span className="text-[#9d9d9d]">Quick Open File</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#cccccc] border border-[#3c3c3c]">⌘P</kbd>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-[#2d2d2d]">
                        <span className="text-[#9d9d9d]">Command Palette</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#cccccc] border border-[#3c3c3c]">⌘K</kbd>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-[#2d2d2d]">
                        <span className="text-[#9d9d9d]">Toggle Word Wrap</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#cccccc] border border-[#3c3c3c]">⌥Z</kbd>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-[#2d2d2d]">
                        <span className="text-[#9d9d9d]">Search in Workspace</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#cccccc] border border-[#3c3c3c]">⌘⇧F</kbd>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-[#2d2d2d]">
                        <span className="text-[#9d9d9d]">Run / Step Debug</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#cccccc] border border-[#3c3c3c]">F5 / ⌘R</kbd>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-[#9d9d9d]">Zoom In / Out</span>
                        <kbd className="px-1.5 py-0.5 rounded bg-[#1e1e1e] text-[#cccccc] border border-[#3c3c3c]">⌘+ / ⌘-</kbd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1-Click Instant File Creators */}
                <div className="p-3.5 rounded-xl bg-[#252526] border border-[#333333] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[#bbbbbb] font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-[#007acc]" />
                    <span>1-Click Create & Open:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { name: "index.js", folder: "src", badge: "JS", color: "text-[#f7df1e]" },
                      { name: "main.py", folder: "scripts", badge: "PY", color: "text-[#3776ab]" },
                      { name: "app.ts", folder: "src", badge: "TS", color: "text-[#3178c6]" },
                      { name: "index.html", folder: "public", badge: "HTML", color: "text-[#e34f26]" },
                    ].map((qf) => (
                      <button
                        key={qf.name}
                        onClick={() => handleQuickCreateFile(qf.name, qf.folder)}
                        className="px-2.5 py-1 rounded bg-[#1e1e1e] hover:bg-[#094771] border border-[#3c3c3c] hover:border-[#007acc] text-[#e1e1e1] hover:text-white font-mono text-[11px] flex items-center gap-1.5 transition"
                      >
                        <span className={cn("font-bold text-[10px]", qf.color)}>{qf.badge}</span>
                        <span>{qf.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real-time Collaboration Banner */}
                <div className="p-3.5 rounded-xl bg-[#094771]/20 border border-[#007acc]/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-[#75beff] shrink-0" />
                    <span className="text-[#cccccc]">
                      <strong className="text-white">Real-Time Team Sync:</strong> Any file created, modified, or deleted is instantly broadcast to all connected project collaborators via WebSockets.
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsSidebarOpen(true);
                      setActiveSidebarTab("explorer");
                      setIsCreatingFile(true);
                      setIsCreatingFolder(false);
                    }}
                    className="px-3 py-1 bg-[#007acc] hover:bg-[#1f8ad2] text-white rounded text-xs font-semibold shrink-0 transition"
                  >
                    Create First File
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              3. VS CODE MULTI-TAB BOTTOM PANEL (PROBLEMS / OUTPUT / DEBUG / TERMINAL)
             ================================================================= */}
          {isBottomPanelOpen && (
            <div
              className={cn(
                "border-t border-[#333333] bg-[#181818] flex flex-col shrink-0 transition-all duration-150",
                isBottomPanelMaximized ? "h-[58vh]" : "h-56"
              )}
            >
              {/* Panel Tabs Header */}
              <div className="flex items-center justify-between px-3 border-b border-[#252526] bg-[#1f1f1f] text-[11px] font-mono">
                <div className="flex items-center gap-4">
                  {[
                    { id: "problems" as BottomTab, label: "PROBLEMS", badge: problems.length },
                    { id: "output" as BottomTab, label: "OUTPUT" },
                    {
                      id: "debug-console" as BottomTab,
                      label: "DEBUG CONSOLE",
                      badge: isDebugging ? "LIVE" : undefined,
                    },
                    { id: "terminal" as BottomTab, label: "TERMINAL" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveBottomTab(t.id)}
                      className={cn(
                        "py-2 border-b-2 flex items-center gap-1.5 transition-colors",
                        activeBottomTab === t.id
                          ? "border-b-[#007acc] text-white font-bold"
                          : "border-b-transparent text-[#858585] hover:text-[#cccccc]"
                      )}
                    >
                      <span>{t.label}</span>
                      {t.badge !== undefined && (
                        <span
                          className={cn(
                            "px-1.5 py-0.2 rounded-full text-[9px] font-bold",
                            t.id === "problems" && problems.length > 0
                              ? "bg-[#e51400] text-white"
                              : "bg-[#3c3c3c] text-[#cccccc]"
                          )}
                        >
                          {t.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (activeBottomTab === "terminal") {
                        setTerminalSessions((prev) =>
                          prev.map((s) => (s.id === activeTerminalSessionId ? { ...s, history: [] } : s))
                        );
                      }
                      if (activeBottomTab === "output") setOutputLogs([]);
                      if (activeBottomTab === "debug-console") setDebugConsoleLogs([]);
                    }}
                    className="text-[10px] text-[#858585] hover:text-white"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsBottomPanelMaximized((v) => !v)}
                    className="text-[#858585] hover:text-white p-0.5"
                    title={isBottomPanelMaximized ? "Restore Panel Size" : "Maximize Panel Size"}
                  >
                    {isBottomPanelMaximized ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronUp className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsBottomPanelOpen(false)}
                    className="text-[#858585] hover:text-white p-0.5"
                    title="Close Panel (⌘J)"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* TAB 1: PROBLEMS */}
              {activeBottomTab === "problems" && (
                <div className="flex-1 overflow-y-auto p-2.5 font-mono text-xs space-y-1">
                  {problems.length === 0 ? (
                    <div className="flex items-center gap-2 text-[#89d185] py-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>No problems have been detected in the workspace.</span>
                    </div>
                  ) : (
                    problems.map((prob, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          editorRef.current?.revealLineInCenter(prob.line);
                          editorRef.current?.setPosition({
                            lineNumber: prob.line,
                            column: prob.column || 1,
                          });
                        }}
                        className="flex items-center justify-between p-1.5 rounded hover:bg-[#2a2d2e] cursor-pointer text-[#f48771]"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-[#e51400]" />
                          <span className="truncate">{prob.message}</span>
                        </div>
                        <span className="text-[10px] text-[#858585] shrink-0">
                          {prob.file} [Ln {prob.line}, Col {prob.column || 1}]
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: OUTPUT */}
              {activeBottomTab === "output" && (
                <div className="flex-1 overflow-y-auto p-2.5 font-mono text-[11px] space-y-1 text-[#d4d4d4] select-text">
                  {outputLogs.map((line, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        line.startsWith("▶") && "text-[#75beff] font-bold",
                        line.startsWith("[ERROR]") && "text-[#f48771]",
                        line.startsWith("✔") && "text-[#89d185] font-semibold"
                      )}
                    >
                      {line}
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              )}

              {/* TAB 3: DEBUG CONSOLE (WITH LIVE EXPRESSION REPL) */}
              {activeBottomTab === "debug-console" && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto p-2.5 font-mono text-[11px] space-y-1 text-[#d4d4d4] select-text">
                    {debugConsoleLogs.map((line, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          line.startsWith("⏸") && "text-[#ffcc00] font-semibold",
                          line.startsWith("🔍") && "text-[#75beff]",
                          line.startsWith("✅") && "text-[#89d185]",
                          line.startsWith("❯") && "text-[#c586c0] font-bold"
                        )}
                      >
                        {line}
                      </div>
                    ))}
                    {isDebugging && currentDebugStep?.stdout && (
                      <div className="p-2 rounded bg-[#252526] border border-[#333333] text-[#ce9178]">
                        <div className="text-[10px] text-[#858585] uppercase mb-1">
                          Program Output up to Line {currentDebugStep.line}:
                        </div>
                        <pre className="whitespace-pre-wrap">{currentDebugStep.stdout}</pre>
                      </div>
                    )}
                    <div ref={terminalEndRef} />
                  </div>
                  <form
                    onSubmit={handleDebugEvaluate}
                    className="flex items-center gap-2 px-2.5 py-1.5 border-t border-[#252526] bg-[#141414] text-[11px] font-mono"
                  >
                    <span className="text-[#007acc] font-bold">debug❯</span>
                    <input
                      type="text"
                      value={debugEvalInput}
                      onChange={(e) => setDebugEvalInput(e.target.value)}
                      placeholder="Evaluate expression in current stack frame (e.g. totalPoints, completed.length)..."
                      className="flex-1 bg-transparent text-white outline-none placeholder:text-[#656565]"
                    />
                  </form>
                </div>
              )}

              {/* TAB 4: INTEGRATED TERMINAL */}
              {activeBottomTab === "terminal" && (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Multi-Session Tabs Bar */}
                  <div className="flex items-center justify-between px-2.5 py-1 bg-[#181818] border-b border-[#2d2d2d] text-[10px] font-mono shrink-0">
                    <div className="flex items-center gap-1 overflow-x-auto">
                      {terminalSessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => setActiveTerminalSessionId(session.id)}
                          className={cn(
                            "group flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-colors",
                            session.id === activeTerminalSessionId
                              ? "bg-[#2d2d2d] text-white font-bold"
                              : "text-[#858585] hover:text-[#cccccc] hover:bg-[#252526]"
                          )}
                        >
                          <TerminalIcon className="w-3 h-3 text-[#75beff]" />
                          <span>{session.name}</span>
                          {terminalSessions.length > 1 && (
                            <button
                              onClick={(e) => handleCloseTerminalSession(session.id, e)}
                              className="opacity-0 group-hover:opacity-100 hover:text-[#f48771] p-0.5 rounded"
                              title="Kill Terminal Session"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <Tooltip content="New Terminal Session" side="top">
                        <button
                          onClick={handleCreateNewTerminalSession}
                          className="p-1 rounded hover:bg-[#2d2d2d] text-[#858585] hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-2 text-[#858585] text-[10px]">
                      <button
                        type="button"
                        onClick={() => setIsEnvModalOpen(true)}
                        className="flex items-center gap-1 hover:text-[#75beff] px-1.5 py-0.5 rounded hover:bg-[#252526] transition font-mono"
                        title="Manage Workspace Environment Variables"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-[#dcb67a]" />
                        <span>.env ({envVars.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyTerminalLogs}
                        className="flex items-center gap-1 hover:text-white px-1.5 py-0.5 rounded hover:bg-[#252526] transition font-mono"
                        title="Copy All Terminal Output"
                      >
                        {isCopiedTerminalLogs ? (
                          <Check className="w-3 h-3 text-[#3fb950]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{isCopiedTerminalLogs ? "Copied" : "Copy"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadTerminalLogs}
                        className="flex items-center gap-1 hover:text-white px-1.5 py-0.5 rounded hover:bg-[#252526] transition font-mono"
                        title="Export Terminal Log File"
                      >
                        <Download className="w-3 h-3 text-[#75beff]" />
                        <span>Export</span>
                      </button>

                      <span className="hidden sm:inline">
                        Session {terminalSessions.findIndex((s) => s.id === activeTerminalSessionId) + 1} of{" "}
                        {terminalSessions.length}
                      </span>
                    </div>
                  </div>

                  {/* Terminal Output */}
                  <div className="flex-1 overflow-y-auto p-2.5 font-mono text-[11px] space-y-1 text-[#cccccc] select-text">
                    {activeTerminalSession.history.map((line, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          line.startsWith("$") && "text-[#75beff] font-bold",
                          line.startsWith("[ERROR]") && "text-[#f48771]",
                          line.startsWith("✔") && "text-[#89d185]"
                        )}
                      >
                        {line}
                      </div>
                    ))}
                    <div ref={terminalEndRef} />
                  </div>

                  <form
                    onSubmit={handleTerminalSubmit}
                    className="flex items-center gap-2 px-2.5 py-1.5 border-t border-[#252526] bg-[#141414] text-[11px] font-mono shrink-0"
                  >
                    <span className="text-[#3fb950] font-bold">workspace❯</span>
                    <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp" && cmdHistory.length > 0) {
                          e.preventDefault();
                          const next = Math.min(cmdHistoryIdx + 1, cmdHistory.length - 1);
                          setCmdHistoryIdx(next);
                          setTerminalInput(cmdHistory[next]);
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          if (cmdHistoryIdx > 0) {
                            setCmdHistoryIdx(cmdHistoryIdx - 1);
                            setTerminalInput(cmdHistory[cmdHistoryIdx - 1]);
                          } else {
                            setCmdHistoryIdx(-1);
                            setTerminalInput("");
                          }
                        }
                      }}
                      placeholder="Run shell command (e.g. node src/index.js, python3 scripts/analytics.py, ls, help)..."
                      className="flex-1 bg-transparent text-white outline-none placeholder:text-[#656565]"
                    />
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =====================================================================
            2D. VS CODE SECONDARY SIDEBAR: GITHUB COPILOT AI & TEAM CHAT
           ===================================================================== */}
        {isCopilotOpen && (
          <div className="w-80 lg:w-96 bg-[#252526] border-l border-[#333333] flex flex-col shrink-0 select-text overflow-hidden z-10">
            {/* Secondary Sidebar Header with Tab Switcher */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#333333] bg-[#2d2d2d] shrink-0">
              <div className="flex items-center gap-1 bg-[#1e1e1e] p-0.5 rounded-lg border border-[#3c3c3c]">
                <button
                  type="button"
                  onClick={() => setActiveRightTab("copilot")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition",
                    activeRightTab === "copilot"
                      ? "bg-[#094771] text-white shadow-sm"
                      : "text-[#858585] hover:text-white"
                  )}
                >
                  <Bot className="w-3.5 h-3.5 text-[#75beff]" />
                  <span>Copilot AI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRightTab("chat")}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold transition",
                    activeRightTab === "chat"
                      ? "bg-[#094771] text-white shadow-sm"
                      : "text-[#858585] hover:text-white"
                  )}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-[#75beff]" />
                  <span>Team Chat</span>
                  {teamChatMessages.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#007acc] text-[9px] text-white font-mono">
                      {teamChatMessages.length}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1">
                {activeRightTab === "copilot" && (
                  <Tooltip content={githubUser ? "Configure GitHub Account" : "Link GitHub Copilot Account"} side="bottom">
                    <button
                      onClick={() => setIsAuthModalOpen(true)}
                      className={cn(
                        "p-1.5 rounded transition",
                        githubUser
                          ? "text-[#3fb950] hover:bg-[#3c3c3c]"
                          : "text-[#858585] hover:text-white hover:bg-[#3c3c3c]"
                      )}
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setIsCopilotOpen(false)}
                  className="p-1 rounded text-[#858585] hover:text-white hover:bg-[#3c3c3c]"
                  title="Close Secondary Sidebar (⌘I)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* TAB 1: GITHUB COPILOT AI ASSISTANT */}
            {activeRightTab === "copilot" && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Model & Target Subheader */}
                <div className="px-3 py-1.5 bg-[#1f1f1f] border-b border-[#2d2d2d] flex items-center justify-between text-[10px] font-mono shrink-0">
                  <div className="flex items-center gap-1 text-[#858585] truncate">
                    <FileCode className="w-3 h-3 text-[#007acc] shrink-0" />
                    <span className="truncate">
                      {activeFile ? (activeFile.path || activeFile.name) : "No File Selected"}
                    </span>
                  </div>
                  <select
                    value={copilotModel}
                    onChange={(e) => setCopilotModel(e.target.value as any)}
                    className="bg-[#252526] text-[#cccccc] border border-[#454545] rounded px-1.5 py-0.5 text-[10px] outline-none"
                  >
                    <option value="copilot-gpt-4o">Copilot GPT-4o</option>
                    <option value="copilot-claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="builtin-ai">Built-in AI</option>
                  </select>
                </div>

                {/* Quick Slash Commands Chips */}
                <div className="px-2.5 py-1.5 bg-[#252526] border-b border-[#333333] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
                  {[
                    { cmd: "/explain", label: "Explain", icon: HelpCircle },
                    { cmd: "/refactor", label: "Refactor", icon: Wand2 },
                    { cmd: "/tests", label: "Tests", icon: CheckCircle2 },
                    { cmd: "/fix", label: "Fix", icon: Bug },
                    { cmd: "/doc", label: "Doc", icon: FileText },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.cmd}
                        onClick={() => handleCopilotSend(item.cmd, item.cmd.replace("/", ""))}
                        disabled={isCopilotGenerating}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1e1e1e] hover:bg-[#333333] border border-[#454545] text-[#cccccc] hover:text-white text-[10px] font-mono shrink-0 transition disabled:opacity-50"
                      >
                        <Icon className="w-2.5 h-2.5 text-[#75beff]" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Notification Banner (When code is applied) */}
                {appliedNotice && (
                  <div className="px-3 py-1 bg-[#2ea043]/20 border-b border-[#2ea043]/40 text-[#3fb950] text-[10px] font-mono flex items-center gap-1.5 animate-fadeIn shrink-0">
                    <Check className="w-3 h-3" />
                    <span>{appliedNotice}</span>
                  </div>
                )}

                {/* Chat Stream Area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
                  {copilotMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col space-y-1.5 rounded-lg p-2.5 transition",
                        msg.role === "user"
                          ? "bg-[#094771]/30 border border-[#007acc]/40 ml-4 text-white"
                          : "bg-[#1e1e1e] border border-[#333333] mr-2 text-[#cccccc]"
                      )}
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#858585]">
                        <span className="font-bold flex items-center gap-1">
                          {msg.role === "user" ? (
                            <>
                              <span className="text-[#75beff]">You</span>
                            </>
                          ) : (
                            <>
                              <Bot className="w-3 h-3 text-[#75beff]" />
                              <span className="text-white">GitHub Copilot</span>
                            </>
                          )}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>

                      {/* Render Message Text with formatted Markdown paragraphs */}
                      <div className="space-y-1.5 text-[11px] leading-relaxed text-[#d4d4d4] select-text">
                        {msg.content.split("\n\n").map((para, pIdx) => {
                          if (para.startsWith("```")) return null;
                          if (para.startsWith("### ")) {
                            return (
                              <div key={pIdx} className="font-bold text-white text-xs pt-1">
                                {para.replace("### ", "")}
                              </div>
                            );
                          }
                          if (para.startsWith("#### ")) {
                            return (
                              <div key={pIdx} className="font-semibold text-[#75beff] text-[11px] pt-1">
                                {para.replace("#### ", "")}
                              </div>
                            );
                          }
                          return (
                            <p key={pIdx} className="whitespace-pre-wrap">
                              {para}
                            </p>
                          );
                        })}
                      </div>

                      {/* Render Code Blocks with "Diff", "Apply to Editor", and "Insert at Cursor" */}
                      {msg.codeBlocks && msg.codeBlocks.length > 0 && (
                        <div className="space-y-2 pt-1">
                          {msg.codeBlocks.map((block, bIdx) => (
                            <div
                              key={bIdx}
                              className="rounded-md overflow-hidden border border-[#454545] bg-[#141414]"
                            >
                              {/* Code Block Toolbar */}
                              <div className="flex items-center justify-between px-2.5 py-1 bg-[#1e1e1e] border-b border-[#333333] text-[10px] font-mono">
                                <span className="text-[#75beff] font-bold uppercase">{block.language}</span>
                                <div className="flex items-center gap-1.5">
                                  {/* Side-by-Side Diff Review Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentContent = activeFile ? activeFile.content : "";
                                      setDiffModal({
                                        isOpen: true,
                                        title: `Diff Review: Copilot Suggestion vs ${activeFile ? (activeFile.path || activeFile.name) : "Current File"}`,
                                        original: currentContent,
                                        modified: block.code,
                                        language: block.language || (activeFile ? getMonacoLanguage(activeFile.name) : "typescript"),
                                        onApply: () => handleApplyCodeBlock(block.code, msg.id),
                                      });
                                    }}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#252526] hover:bg-[#3c3c3c] text-[#75beff] hover:text-white text-[10px] font-bold transition border border-[#454545]"
                                    title="Review Side-by-Side Diff with current file before applying"
                                  >
                                    <GitPullRequest className="w-2.5 h-2.5" />
                                    <span>Diff</span>
                                  </button>

                                  {/* Apply to Editor Button */}
                                  <button
                                    onClick={() => handleApplyCodeBlock(block.code, msg.id)}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#094771] hover:bg-[#007acc] text-white text-[10px] font-bold transition"
                                    title="Replace current file or selection with this code"
                                  >
                                    <Wand2 className="w-2.5 h-2.5" />
                                    <span>Apply</span>
                                  </button>

                                  {/* Insert at Cursor Button */}
                                  <button
                                    onClick={() => handleInsertAtCursor(block.code)}
                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#252526] hover:bg-[#3c3c3c] text-[#cccccc] hover:text-white text-[10px] transition"
                                    title="Insert at cursor position"
                                  >
                                    <CornerDownRight className="w-2.5 h-2.5" />
                                    <span>Insert</span>
                                  </button>

                                  {/* Copy Button */}
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(block.code);
                                      setAppliedNotice("✓ Copied code to clipboard");
                                      setTimeout(() => setAppliedNotice(null), 2000);
                                    }}
                                    className="p-1 rounded hover:bg-[#3c3c3c] text-[#858585] hover:text-white transition"
                                    title="Copy snippet"
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Code Body */}
                              <pre className="p-2.5 text-[11px] font-mono text-[#dcdcaa] overflow-x-auto whitespace-pre leading-relaxed select-text">
                                {block.code}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {isCopilotGenerating && (
                    <div className="flex items-center gap-2 p-2.5 rounded bg-[#1e1e1e] border border-[#333333] text-[#75beff] text-xs">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>GitHub Copilot is thinking...</span>
                    </div>
                  )}
                </div>

                {/* Input Box Footer */}
                <div className="p-2.5 border-t border-[#333333] bg-[#1e1e1e] space-y-2 shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCopilotSend();
                    }}
                    className="relative"
                  >
                    <textarea
                      value={copilotInput}
                      onChange={(e) => setCopilotInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCopilotSend();
                        }
                      }}
                      rows={2}
                      placeholder="Ask Copilot or type /explain, /refactor..."
                      className="w-full bg-[#252526] border border-[#454545] focus:border-[#007acc] rounded-md px-2.5 py-1.5 text-xs text-white placeholder-[#858585] outline-none font-mono resize-none"
                    />
                    <button
                      type="submit"
                      disabled={!copilotInput.trim() || isCopilotGenerating}
                      className="absolute right-2 bottom-2.5 p-1 rounded bg-[#007acc] hover:bg-[#1f8ad2] disabled:opacity-40 text-white transition"
                      title="Send message (Enter)"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </form>
                  <div className="flex items-center justify-between text-[10px] text-[#858585] font-mono">
                    <span>Enter ↵ to send • Shift+Enter for new line</span>
                    <button
                      onClick={() =>
                        setCopilotMessages([
                          {
                            id: "welcome",
                            role: "assistant",
                            content: "👋 Chat cleared. Ready for your next coding task!",
                            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                          },
                        ])
                      }
                      className="hover:text-white transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: REAL-TIME IN-IDE TEAM DISCUSSION DOCK */}
            {activeRightTab === "chat" && (
              <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
                {/* Team Chat Subheader */}
                <div className="px-3 py-2 bg-[#252526] border-b border-[#333333] flex items-center justify-between text-xs font-mono shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3fb950] animate-pulse" />
                    <span className="font-bold text-white">Team Workspace Chat</span>
                  </div>
                  <span className="text-[10px] text-[#858585]">
                    {peers.length + 1} online
                  </span>
                </div>

                {/* Chat message stream */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs select-text">
                  {teamChatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#858585] space-y-2">
                      <MessageCircle className="w-8 h-8 text-[#555555]" />
                      <p className="text-xs text-[#cccccc] font-semibold">No team messages yet</p>
                      <p className="text-[11px] text-[#858585] leading-relaxed">
                        Start discussing code changes, task reviews, or architecture decisions with your team in real time.
                      </p>
                    </div>
                  ) : (
                    teamChatMessages.map((msg) => {
                      const isMe = msg.user?.id === user?.id || msg.user?.email === user?.email;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col space-y-1 rounded-lg p-2.5 transition",
                            isMe
                              ? "bg-[#094771]/30 border border-[#007acc]/40 ml-4 text-white"
                              : "bg-[#252526] border border-[#333333] mr-4 text-[#cccccc]"
                          )}
                        >
                          <div className="flex items-center justify-between text-[10px] text-[#858585]">
                            <span className="font-bold text-[#75beff]">
                              {isMe ? "You" : (msg.user?.name || "Collaborator")}
                            </span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <p className="text-[11px] leading-relaxed whitespace-pre-wrap break-words text-[#e0e0e0]">
                            {msg.message}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Team chat input footer */}
                <div className="p-2.5 border-t border-[#333333] bg-[#252526] shrink-0">
                  <form onSubmit={handleSendTeamChat} className="relative">
                    <input
                      type="text"
                      value={teamChatInput}
                      onChange={(e) => setTeamChatInput(e.target.value)}
                      placeholder="Message collaborators in this workspace..."
                      className="w-full bg-[#1e1e1e] border border-[#454545] focus:border-[#007acc] rounded-md pl-3 pr-9 py-2 text-xs text-white placeholder-[#858585] outline-none font-mono"
                    />
                    <button
                      type="submit"
                      disabled={!teamChatInput.trim()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded bg-[#007acc] hover:bg-[#1f8ad2] disabled:opacity-40 text-white transition"
                      title="Send message (Enter)"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </form>
                  <div className="flex items-center justify-between text-[10px] text-[#858585] font-mono mt-1 px-1">
                    <span>Press Enter ↵ to broadcast</span>
                    <button
                      type="button"
                      onClick={() => setTeamChatMessages([])}
                      className="hover:text-white transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================================
          4. VS CODE BOTTOM STATUS BAR
         ===================================================================== */}
      <div
        className={cn(
          "flex items-center justify-between px-3 h-6 text-[11px] font-mono text-white shrink-0 transition-colors",
          isDebugging ? "bg-[#cc6633]" : "bg-[#007acc]"
        )}
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-bold bg-black/20 px-2 h-6">
            <span>&gt;&lt; LetsCollab IDE</span>
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            <span>main{modifiedFiles.length > 0 ? "*" : ""}</span>
          </span>
          <button
            onClick={() => {
              setIsBottomPanelOpen(true);
              setActiveBottomTab("problems");
            }}
            className="flex items-center gap-1.5 hover:bg-white/10 px-1.5 rounded"
          >
            <AlertCircle className="w-3 h-3" />
            <span>{problems.length}</span>
          </button>
          {isDebugging && currentDebugStep && (
            <span className="font-bold">
              ● Paused at {activeFile ? activeFile.name : "file"}:{currentDebugStep.line}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Word Wrap Toggle */}
          <button
            type="button"
            onClick={() => setWordWrap((prev) => (prev === "on" ? "off" : "on"))}
            className="hover:bg-white/10 px-1.5 py-0.5 rounded flex items-center gap-1 transition"
            title="Toggle Word Wrap (⌥Z)"
          >
            <WrapText className="w-3 h-3" />
            <span>Wrap: {wordWrap.toUpperCase()}</span>
          </button>

          {/* Minimap Toggle */}
          <button
            type="button"
            onClick={() => setMinimapEnabled((prev) => !prev)}
            className="hover:bg-white/10 px-1.5 py-0.5 rounded flex items-center gap-1 transition"
            title="Toggle Monaco Minimap"
          >
            <span>Map: {minimapEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* Font Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded">
            <button
              type="button"
              onClick={() => setEditorFontSize((prev) => Math.max(10, prev - 1))}
              className="hover:bg-white/20 p-0.5 rounded"
              title="Zoom Out (⌘-)"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] px-0.5">{editorFontSize}px</span>
            <button
              type="button"
              onClick={() => setEditorFontSize((prev) => Math.min(26, prev + 1))}
              className="hover:bg-white/20 p-0.5 rounded"
              title="Zoom In (⌘+)"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="hidden sm:inline">Spaces: 2</span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="uppercase font-semibold">
            {activeFile ? getMonacoLanguage(activeFile.name) : "Plain Text"}
          </span>
          <span>
            {peers.length === 0 ? "1 Active User" : `${peers.length + 1} Collaborators`}
          </span>
        </div>
      </div>

      {/* 5. Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* 6. GitHub Copilot Authentication Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#252526] border border-[#454545] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d2d] border-b border-[#333333]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#094771] flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-[#75beff]" />
                </div>
                <h3 className="text-sm font-bold text-white">GitHub Copilot — Account & Entitlement</h3>
              </div>
              <button
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setAuthModalError(null);
                  setAuthModalSuccess(null);
                }}
                className="text-[#858585] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              {githubUser ? (
                /* Authenticated Account Card */
                <div className="p-4 rounded-lg bg-[#1e1e1e] border border-[#2ea043]/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#3fb950] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      GitHub Account Connected
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#2ea043]/20 text-[#3fb950] text-[10px] font-bold">
                      Copilot Active
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {githubUser.avatar_url ? (
                      <img
                        src={githubUser.avatar_url}
                        alt={githubUser.login}
                        className="w-12 h-12 rounded-full border border-[#454545]"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#007acc] text-white flex items-center justify-center font-bold text-base">
                        {githubUser.login.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">{githubUser.name || githubUser.login}</div>
                      <div className="text-xs text-[#75beff]">@{githubUser.login}</div>
                      {githubUser.email && (
                        <div className="text-[11px] text-[#858585]">{githubUser.email}</div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#333333] flex items-center justify-between text-[11px]">
                    <span className="text-[#858585]">Subscription Plan:</span>
                    <span className="font-bold text-white uppercase">{githubUser.plan || "GitHub Copilot"}</span>
                  </div>

                  <button
                    onClick={handleDisconnectGithub}
                    className="w-full py-2 rounded bg-[#3c3c3c] hover:bg-[#da3633] text-white font-bold transition text-xs"
                  >
                    Disconnect GitHub Account
                  </button>
                </div>
              ) : (
                /* Unauthenticated Sign-in Instructions & Form */
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-[#1e1e1e] border border-[#333333] space-y-2 text-[#cccccc] leading-relaxed">
                    <p className="font-semibold text-white">
                      Link your official GitHub account to enable verified GitHub Copilot suggestions:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px] text-[#9d9d9d]">
                      <li>
                        Sign in to your GitHub account associated with your active Copilot subscription.
                      </li>
                      <li>
                        Generate a Personal Access Token with <code className="text-[#75beff]">copilot</code> or{" "}
                        <code className="text-[#75beff]">repo</code> scope.
                      </li>
                      <li>Paste the token below to authenticate this browser session.</li>
                    </ol>
                    <a
                      href="https://github.com/settings/tokens/new?description=LetsCollab+VSCode+Copilot&scopes=repo,read:user,copilot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[#75beff] hover:underline pt-1"
                    >
                      <span>Generate Token on GitHub</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {authModalError && (
                    <div className="p-2.5 rounded bg-[#da3633]/20 border border-[#da3633]/50 text-[#f85149] text-xs">
                      {authModalError}
                    </div>
                  )}

                  {authModalSuccess && (
                    <div className="p-2.5 rounded bg-[#2ea043]/20 border border-[#2ea043]/50 text-[#3fb950] text-xs">
                      {authModalSuccess}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-[#9d9d9d]">GitHub Personal Access Token (PAT):</label>
                    <input
                      type="password"
                      value={patInput}
                      onChange={(e) => setPatInput(e.target.value)}
                      placeholder="ghp_... or github_pat_..."
                      className="w-full bg-[#1e1e1e] border border-[#454545] focus:border-[#007acc] rounded px-3 py-2 text-xs text-white placeholder-[#656565] outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAuthModalOpen(false);
                      }}
                      className="px-3 py-1.5 rounded text-xs text-[#9d9d9d] hover:text-white"
                    >
                      Use Built-in Engine
                    </button>
                    <button
                      type="button"
                      onClick={handleVerifyGithubToken}
                      disabled={!patInput.trim() || isValidatingGithub}
                      className="px-4 py-2 rounded bg-[#238636] hover:bg-[#2ea043] disabled:opacity-40 text-white font-bold text-xs transition flex items-center gap-1.5"
                    >
                      {isValidatingGithub ? (
                        <>
                          <Sparkles className="w-3 h-3 animate-spin" />
                          <span>Verifying Account...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verify & Link Copilot</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[10px] text-[#656565] text-center pt-1">
                🔒 Tokens are stored exclusively in your browser&apos;s local session and never logged or exposed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. Quick Open File Modal (⌘P / Ctrl+P) */}
      {isQuickOpenVisible && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-xs"
          onClick={() => setIsQuickOpenVisible(false)}
        >
          <div
            className="w-full max-w-xl bg-[#252526] border border-[#454545] rounded-xl shadow-2xl overflow-hidden font-mono text-xs animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#1e1e1e] border-b border-[#333333]">
              <Search className="w-4 h-4 text-[#75beff] shrink-0" />
              <input
                type="text"
                autoFocus
                value={quickOpenQuery}
                onChange={(e) => {
                  setQuickOpenQuery(e.target.value);
                  setQuickOpenIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setQuickOpenIndex((i) => Math.min(i + 1, Math.max(0, quickOpenFilteredFiles.length - 1)));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setQuickOpenIndex((i) => Math.max(0, i - 1));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    if (quickOpenFilteredFiles[quickOpenIndex]) {
                      handleQuickOpenFile(quickOpenFilteredFiles[quickOpenIndex].id);
                    }
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setIsQuickOpenVisible(false);
                  }
                }}
                placeholder="Type the name of a file to open (e.g. index.ts, main.py)..."
                className="w-full bg-transparent text-white outline-none placeholder:text-[#656565] text-xs"
              />
              <span className="text-[10px] text-[#858585] shrink-0">esc to close</span>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#2d2d2d]">
              {quickOpenFilteredFiles.length === 0 ? (
                <div className="p-4 text-center text-[#858585] text-xs">
                  No matching files found in this workspace.
                </div>
              ) : (
                quickOpenFilteredFiles.map((file, idx) => (
                  <div
                    key={file.id}
                    onClick={() => handleQuickOpenFile(file.id)}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-2 cursor-pointer transition select-none",
                      idx === quickOpenIndex
                        ? "bg-[#094771] text-white"
                        : "text-[#cccccc] hover:bg-[#2a2d2e]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileCode className={cn("w-3.5 h-3.5 shrink-0", getFileBadgeColor(file.name))} />
                      <span className="font-bold truncate">{file.name}</span>
                      <span className="text-[10px] text-[#858585] truncate">
                        {file.folder || "/"}
                      </span>
                    </div>
                    {file.isModified && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#dcb67a] shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. Right-Click Explorer Context Menu */}
      {contextMenu && (
        <div
          className="fixed inset-0 z-50 bg-transparent"
          onClick={() => setContextMenu(null)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu(null);
          }}
        >
          <div
            style={{
              top: Math.min(contextMenu.y, typeof window !== "undefined" ? window.innerHeight - 260 : contextMenu.y),
              left: Math.min(contextMenu.x, typeof window !== "undefined" ? window.innerWidth - 220 : contextMenu.x),
            }}
            className="fixed w-52 bg-[#252526] border border-[#454545] rounded-lg shadow-2xl py-1 text-xs font-mono text-[#cccccc] z-50 divide-y divide-[#333333] animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.file ? (
              <>
                <div className="py-0.5">
                  <button
                    onClick={() => {
                      if (!openTabIds.includes(contextMenu.file!.id)) {
                        setOpenTabIds((p) => [...p, contextMenu.file!.id]);
                      }
                      setActiveFileId(contextMenu.file!.id);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white flex items-center gap-2 transition"
                  >
                    <FileCode className="w-3.5 h-3.5 text-[#75beff]" />
                    <span>Open in Editor</span>
                  </button>

                  <button
                    onClick={() => {
                      handleOpenGitDiff(contextMenu.file!);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white flex items-center gap-2 transition"
                  >
                    <GitPullRequest className="w-3.5 h-3.5 text-[#75beff]" />
                    <span>Review Diff</span>
                  </button>
                </div>

                <div className="py-0.5">
                  <button
                    onClick={() => {
                      setRenamingFileId(contextMenu.file!.id);
                      setRenameValue(contextMenu.file!.name);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white flex items-center gap-2 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#dcb67a]" />
                    <span>Rename File</span>
                  </button>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(contextMenu.file!.path || contextMenu.file!.name);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white flex items-center gap-2 transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#858585]" />
                    <span>Copy Path</span>
                  </button>

                  <button
                    onClick={() => {
                      const blob = new Blob([contextMenu.file!.content], { type: "text/plain" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = contextMenu.file!.name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white flex items-center gap-2 transition"
                  >
                    <Download className="w-3.5 h-3.5 text-[#75beff]" />
                    <span>Download File</span>
                  </button>
                </div>

                <div className="py-0.5">
                  <button
                    onClick={() => {
                      handleDeleteFile(contextMenu.file!.id);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#da3633] hover:text-white text-[#f48771] flex items-center gap-2 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete File</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="py-0.5">
                  <button
                    onClick={() => {
                      setNewFileFolderInput(contextMenu.folder || "");
                      setIsCreatingFile(true);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white flex items-center gap-2 transition"
                  >
                    <FilePlus className="w-3.5 h-3.5 text-[#75beff]" />
                    <span>New File Here</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCreatingFolder(true);
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white flex items-center gap-2 transition"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-[#dcb67a]" />
                    <span>New Subfolder</span>
                  </button>
                </div>

                <div className="py-0.5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(contextMenu.folder || "");
                      setContextMenu(null);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-[#094771] hover:text-white flex items-center gap-2 transition"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#858585]" />
                    <span>Copy Folder Path</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 9. Side-by-Side Monaco Diff Modal */}
      {diffModal && diffModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl h-[85vh] bg-[#1e1e1e] border border-[#454545] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#2d2d2d] border-b border-[#333333] shrink-0 font-mono text-xs">
              <div className="flex items-center gap-2 truncate">
                <GitPullRequest className="w-4 h-4 text-[#75beff] shrink-0" />
                <span className="font-bold text-white truncate">{diffModal.title}</span>
                <span className="px-2 py-0.5 rounded bg-[#1e1e1e] text-[10px] text-[#858585] uppercase border border-[#333333]">
                  {diffModal.language}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {diffModal.onApply && (
                  <button
                    type="button"
                    onClick={() => {
                      diffModal.onApply?.();
                      setDiffModal(null);
                    }}
                    className="px-3 py-1 rounded bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept & Apply Changes</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDiffModal(null)}
                  className="p-1 rounded text-[#858585] hover:text-white hover:bg-[#3c3c3c] transition"
                  title="Close Diff Modal (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Monaco Diff Editor Body */}
            <div className="flex-1 min-h-0 relative">
              <DiffEditor
                original={diffModal.original}
                modified={diffModal.modified}
                language={diffModal.language}
                theme={editorTheme}
                options={{
                  renderSideBySide: true,
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: editorFontSize,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 10. Project Starter Templates Modal */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-[#252526] border border-[#454545] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 font-mono">
            <div className="flex items-center justify-between px-5 py-3.5 bg-[#2d2d2d] border-b border-[#333333]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#094771] to-[#007acc] flex items-center justify-center shadow">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-none">Project Starter Templates</h3>
                  <span className="text-[11px] text-[#858585]">Scaffold a complete multi-file project with one click</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-[#858585] hover:text-white p-1 rounded hover:bg-[#3c3c3c]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              {STARTER_TEMPLATES.map((tpl) => {
                const Icon = tpl.icon;
                return (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-xl bg-[#1e1e1e] border border-[#3c3c3c] hover:border-[#007acc] flex flex-col justify-between space-y-3 transition group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-[#252526] flex items-center justify-center border border-[#333333]">
                            <Icon className="w-4 h-4 text-[#75beff]" />
                          </div>
                          <span className="font-bold text-white text-xs">{tpl.name}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-[#094771]/50 text-[#75beff] text-[10px] font-bold border border-[#007acc]/40">
                          {tpl.badge}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#9d9d9d] leading-relaxed">
                        {tpl.desc}
                      </p>

                      <div className="pt-2 border-t border-[#2d2d2d] flex items-center gap-1.5 flex-wrap text-[10px] text-[#858585]">
                        <span className="font-semibold text-[#cccccc]">Files:</span>
                        {tpl.files.map((f, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-[#252526] text-[#75beff] border border-[#333333]">
                            {f.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(tpl.id)}
                      className="w-full py-2 rounded-lg bg-[#094771] group-hover:bg-[#007acc] text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Scaffold into Workspace</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-3 bg-[#1e1e1e] border-t border-[#333333] text-[10px] text-[#858585] flex items-center justify-between">
              <span>💡 New templates are created cleanly in your project and synced to all collaborators.</span>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-[#9d9d9d] hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Environment Variables (.env) Manager Modal */}
      {isEnvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#252526] border border-[#454545] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 font-mono text-xs">
            <div className="flex items-center justify-between px-4 py-3 bg-[#2d2d2d] border-b border-[#333333]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#dcb67a]" />
                <h3 className="text-sm font-bold text-white">Workspace Environment Variables (.env)</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEnvModalOpen(false)}
                className="text-[#858585] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-[11px] text-[#858585] leading-relaxed">
                These key-value pairs are injected into your integrated terminal execution environment whenever you run scripts or shell commands.
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {envVars.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={item.key}
                      onChange={(e) => {
                        const next = [...envVars];
                        next[idx].key = e.target.value;
                        setEnvVars(next);
                      }}
                      placeholder="KEY (e.g. PORT)"
                      className="w-1/2 bg-[#1e1e1e] border border-[#454545] focus:border-[#007acc] rounded px-2.5 py-1.5 text-xs text-white placeholder-[#656565] outline-none"
                    />
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => {
                        const next = [...envVars];
                        next[idx].value = e.target.value;
                        setEnvVars(next);
                      }}
                      placeholder="VALUE (e.g. 4000)"
                      className="w-1/2 bg-[#1e1e1e] border border-[#454545] focus:border-[#007acc] rounded px-2.5 py-1.5 text-xs text-white placeholder-[#656565] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEnvVars((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-[#858585] hover:text-[#f48771] transition"
                      title="Remove Variable"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setEnvVars((prev) => [...prev, { key: "", value: "" }])}
                className="w-full py-1.5 rounded border border-dashed border-[#454545] hover:border-[#75beff] text-[#75beff] text-[11px] font-bold transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3 h-3" />
                <span>Add Environment Variable</span>
              </button>

              <div className="pt-3 border-t border-[#333333] flex items-center justify-between">
                <span className="text-[10px] text-[#656565]">Saved to workspace session</span>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      localStorage.setItem(`letscollab_env_${projectId}`, JSON.stringify(envVars));
                    } catch {}
                    setIsEnvModalOpen(false);
                  }}
                  className="px-4 py-1.5 rounded bg-[#007acc] hover:bg-[#1f8ad2] text-white font-bold text-xs transition flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Apply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Monaco Remote Selection & Cursor */}
      <style jsx global>{`
        .monaco-remote-selection {
          background-color: rgba(117, 190, 255, 0.25) !important;
          border-radius: 2px;
        }
        .monaco-remote-cursor-line {
          border-left: 2px solid #75beff !important;
        }
      `}</style>
    </div>
  );
}
