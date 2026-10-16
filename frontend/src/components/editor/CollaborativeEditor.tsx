"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Editor, { OnMount, BeforeMount } from "@monaco-editor/react";
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
} from "lucide-react";
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

const DEFAULT_STARTER_FILES: EditorFile[] = [
  {
    id: "file-main-js",
    name: "index.js",
    path: "src/index.js",
    folder: "src",
    language: "javascript",
    version: 1,
    content: `// VS Code Workspace - Main Application Entry (JavaScript / Node.js)
// Tip: Click in the left gutter next to any line number to toggle a red Breakpoint,
// then click "Debug (F5)" or "Run (Cmd+R)" in the top toolbar!

function calculateSprintVelocity(completedPoints, sprintDays) {
  const dailyRate = Number((completedPoints / sprintDays).toFixed(2));
  const projectedMonthly = Number((dailyRate * 22).toFixed(1));
  return {
    completedPoints,
    sprintDays,
    dailyRate,
    projectedMonthly,
    status: dailyRate >= 5 ? "ON_TRACK" : "NEEDS_ATTENTION",
  };
}

function analyzeTasks(tasks) {
  let totalPoints = 0;
  const completed = [];
  const pending = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    if (task.done) {
      totalPoints += task.points;
      completed.push(task.title);
    } else {
      pending.push(task.title);
    }
  }

  return { totalPoints, completedCount: completed.length, pendingCount: pending.length, completed };
}

const sprintTasks = [
  { id: 1, title: "Setup authentication & RBAC", points: 8, done: true },
  { id: 2, title: "Real-time Socket.IO sync", points: 13, done: true },
  { id: 3, title: "VS Code debugger integration", points: 10, done: true },
  { id: 4, title: "Production deployment pipeline", points: 5, done: false },
];

console.log("🚀 Starting LetsCollab Sprint Analytics Engine...");
const summary = analyzeTasks(sprintTasks);
console.log("📊 Task Summary:", JSON.stringify(summary, null, 2));

const metrics = calculateSprintVelocity(summary.totalPoints, 5);
console.log("⚡ Velocity Metrics:", JSON.stringify(metrics, null, 2));
`,
  },
  {
    id: "file-algo-ts",
    name: "scheduler.ts",
    path: "src/scheduler.ts",
    folder: "src",
    language: "typescript",
    version: 1,
    content: `// TypeScript Task Priority Scheduler
interface WorkItem {
  id: string;
  title: string;
  priority: number;
  estimateHours: number;
}

function scheduleWorkItems(items: WorkItem[], maxCapacityHours: number) {
  const sorted = [...items].sort((a, b) => b.priority - a.priority);
  const scheduled: string[] = [];
  let usedHours = 0;

  for (const item of sorted) {
    if (usedHours + item.estimateHours <= maxCapacityHours) {
      scheduled.push(item.title);
      usedHours += item.estimateHours;
    }
  }

  const utilization = Math.round((usedHours / maxCapacityHours) * 100);
  return { scheduled, usedHours, maxCapacityHours, utilizationPercent: utilization };
}

const backlog: WorkItem[] = [
  { id: "T-101", title: "Database connection pooling", priority: 90, estimateHours: 6 },
  { id: "T-102", title: "Zero-latency cursor broadcast", priority: 95, estimateHours: 8 },
  { id: "T-103", title: "Export audit log CSV", priority: 60, estimateHours: 4 },
  { id: "T-104", title: "Custom webhook retries", priority: 75, estimateHours: 5 },
];

const plan = scheduleWorkItems(backlog, 18);
console.log("📅 Scheduled Sprint Plan:", JSON.stringify(plan, null, 2));
`,
  },
  {
    id: "file-python-py",
    name: "analytics.py",
    path: "scripts/analytics.py",
    folder: "scripts",
    language: "python",
    version: 1,
    content: `# Python Real-Time Telemetry & Statistical Analyzer
# Supports full live execution AND step-by-step debugging with Breakpoints!

def compute_latency_stats(samples_ms):
    count = len(samples_ms)
    total = sum(samples_ms)
    mean_val = round(total / count, 2)
    sorted_samples = sorted(samples_ms)
    median_val = sorted_samples[count // 2]
    p95_index = min(count - 1, int(count * 0.95))
    p95_val = sorted_samples[p95_index]
    return {
        "count": count,
        "mean_ms": mean_val,
        "median_ms": median_val,
        "p95_ms": p95_val,
        "min_ms": sorted_samples[0],
        "max_ms": sorted_samples[-1]
    }

latencies = [12, 8, 15, 9, 11, 42, 7, 10, 14, 13]
print("🐍 Running Python Telemetry Analyzer...")
report = compute_latency_stats(latencies)

for key, val in report.items():
    print(f"  • {key}: {val}")

print("✅ Analysis completed successfully.")
`,
  },
  {
    id: "file-web-html",
    name: "preview.html",
    path: "web/preview.html",
    folder: "web",
    language: "html",
    version: 1,
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      margin: 0;
      padding: 24px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 20px;
      max-width: 480px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    }
    .badge {
      display: inline-block;
      background: #e65f42;
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      margin-bottom: 12px;
    }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 12px;
    }
    button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">LIVE HTML PREVIEW</span>
    <h2 style="margin: 0 0 8px 0;">Interactive Component Sandbox</h2>
    <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
      Edit this HTML/CSS/JS file in the VS Code editor to see instant live updates!
    </p>
    <div id="counter" style="font-size: 20px; font-weight: bold; color: #38bdf8; margin-top: 12px;">
      Clicks: 0
    </div>
    <button onclick="increment()">Trigger Event</button>
  </div>
  <script>
    let count = 0;
    function increment() {
      count++;
      document.getElementById('counter').innerText = 'Clicks: ' + count;
    }
  </script>
</body>
</html>
`,
  },
];

const COLLABORATOR_COLORS = ["#E65F42", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

type ActivityTab = "explorer" | "search" | "git" | "debug" | "extensions";
type BottomTab = "terminal" | "output" | "debug-console" | "problems" | "preview";

interface CollaborativeEditorProps {
  projectId?: string;
  initialActiveFile?: string;
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
  initialActiveFile = "file-main-js",
}: CollaborativeEditorProps) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  // Workspace Files State
  const [files, setFiles] = useState<EditorFile[]>(DEFAULT_STARTER_FILES);
  const [activeFileId, setActiveFileId] = useState<string>(initialActiveFile);
  const [openTabIds, setOpenTabIds] = useState<string[]>([
    "file-main-js",
    "file-algo-ts",
    "file-python-py",
    "file-web-html",
  ]);
  const [commits, setCommits] = useState<
    Array<{ id: string; message: string; authorName: string; timestamp: string }>
  >([
    {
      id: "init001",
      message: "Initialize VS Code collaborative project workspace",
      authorName: user?.name || "Project Owner",
      timestamp: new Date().toISOString(),
    },
  ]);

  // Real-Time Collaborators State (NO fake hardcoded users)
  const [peers, setPeers] = useState<CollaboratorPeer[]>([]);

  // VS Code Workbench Layout State
  const [activeSidebarTab, setActiveSidebarTab] = useState<ActivityTab>("explorer");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>("terminal");
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(true);
  const [isSplitPreviewOpen, setIsSplitPreviewOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "letscollab-paper">("vs-dark");
  const [activeMenuDropdown, setActiveMenuDropdown] = useState<string | null>(null);

  // Editor Status & Cursor
  const [syncState, setSyncState] = useState<SyncState>("Synced");
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
  const [cursorPos, setCursorPos] = useState<{ line: number; col: number }>({ line: 1, col: 1 });
  const [isCopied, setIsCopied] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Explorer File Creation / Rename Modals
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileNameInput, setNewFileNameInput] = useState("");
  const [newFileFolderInput, setNewFileFolderInput] = useState("src");
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [treeExpanded, setTreeExpanded] = useState<Record<string, boolean>>({
    src: true,
    scripts: true,
    web: true,
    root: true,
  });

  // Search & Replace State
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  const [searchCaseSensitive, setSearchCaseSensitive] = useState(false);

  // Source Control (Git) State
  const [commitMessage, setCommitMessage] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);

  // Execution & Terminal State
  const [isRunning, setIsRunning] = useState(false);
  const [outputLogs, setOutputLogs] = useState<string[]>([
    "[VS Code Engine] Ready. Press 'Run (⌘R)' to execute or 'Debug (F5)' to step through code.",
  ]);
  const [problems, setProblems] = useState<EditorProblem[]>([]);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "LetsCollab VS Code Integrated Terminal v2.4 (bash / node / python3)",
    "Type 'help' for available commands, or run 'node src/index.js' / 'python3 scripts/analytics.py'.",
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdHistoryIdx, setCmdHistoryIdx] = useState<number>(-1);

  // Step-by-Step Debugger State
  const [breakpointsByFile, setBreakpointsByFile] = useState<Record<string, number[]>>({
    "file-main-js": [10, 25],
    "file-python-py": [8, 22],
  });
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

  // Extensions State
  const [extensions, setExtensions] = useState([
    { id: "ext-node-debug", name: "Node.js & TypeScript Debugger", publisher: "ms-vscode", version: "1.92.0", enabled: true, desc: "Step-by-step V8 & TypeScript runtime inspection, breakpoints, and variable watch." },
    { id: "ext-python", name: "Python & sys.settrace Debugger", publisher: "ms-python", version: "2026.4.0", enabled: true, desc: "Rich Python support with live execution, sys.settrace line stepping, and local variable inspector." },
    { id: "ext-eslint", name: "ESLint & Diagnostics", publisher: "dbaeumer", version: "3.0.10", enabled: true, desc: "Integrates syntax and runtime diagnostics directly into Monaco Editor and Problems tab." },
    { id: "ext-prettier", name: "Prettier - Code Formatter", publisher: "esbenp", version: "11.0.0", enabled: true, desc: "Automatic code formatting for JS, TS, JSON, HTML, and CSS." },
    { id: "ext-liveserver", name: "Live HTML/CSS Preview", publisher: "ritwickdey", version: "5.7.9", enabled: true, desc: "Instant split-screen live browser rendering for HTML/CSS/JS files." },
  ]);

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
    () => files.find((f) => f.id === activeFileId) || files[0] || DEFAULT_STARTER_FILES[0],
    [files, activeFileId]
  );

  const currentDebugStep: DebugStep | null = useMemo(() => {
    if (!isDebugging || debugSteps.length === 0) return null;
    return debugSteps[Math.min(currentDebugStepIdx, debugSteps.length - 1)] || null;
  }, [isDebugging, debugSteps, currentDebugStepIdx]);

  // Load Persistent Project Files from Backend
  useEffect(() => {
    if (!projectId || projectId === "demo-workspace") return;
    api.editor.getFiles(projectId).then((res) => {
      if (res.data?.files && res.data.files.length > 0) {
        setFiles(res.data.files);
        setOpenTabIds(res.data.files.slice(0, 4).map((f: EditorFile) => f.id));
        setActiveFileId(res.data.files[0].id);
        if (res.data.commits) {
          setCommits(res.data.commits);
        }
      }
    });
  }, [projectId]);

  // Auto-open Live Preview when switching to an HTML file
  useEffect(() => {
    if (activeFile?.name.endsWith(".html")) {
      setIsSplitPreviewOpen(true);
    }
  }, [activeFile?.name]);

  // Scroll terminal to bottom on new output
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalHistory, outputLogs, debugConsoleLogs]);

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
              activeFileId: data.fileId,
            },
          ];
        }
        return prev.map((p) =>
          p.id === data.user.id
            ? { ...p, cursor: { line: data.line, ch: data.ch }, activeFileId: data.fileId }
            : p
        );
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
    };

    const handleFileDeleted = (data: any) => {
      if (!data?.fileId) return;
      setFiles((prev) => prev.filter((f) => f.id !== data.fileId));
      setOpenTabIds((prev) => prev.filter((id) => id !== data.fileId));
    };

    socket.on("editor:user-joined", handlePeerJoined);
    socket.on("editor:user-left", handlePeerLeft);
    socket.on("editor:cursor-moved", handleCursorMoved);
    socket.on("editor:code-updated", handleCodeUpdated);
    socket.on("editor:file-created", handleFileCreated);
    socket.on("editor:file-deleted", handleFileDeleted);

    return () => {
      socket.emit("editor:leave", { projectId });
      socket.off("editor:user-joined", handlePeerJoined);
      socket.off("editor:user-left", handlePeerLeft);
      socket.off("editor:cursor-moved", handleCursorMoved);
      socket.off("editor:code-updated", handleCodeUpdated);
      socket.off("editor:file-created", handleFileCreated);
      socket.off("editor:file-deleted", handleFileDeleted);
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
    if (!model) return;

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

    updateEditorDecorations();
  };

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
        version: activeFile.version + 1,
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

  // Execute Code (Run Without Debugging)
  const handleRunCode = async () => {
    if (!activeFile) return;

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
        setTerminalHistory((prev) => [
          ...prev,
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
    if (!activeFile) return;

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

  // File Creation, Deletion, Rename, Download & Upload
  const handleCreateNewFile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newFileNameInput.trim();
    if (!cleanName) return;

    const cleanFolder = newFileFolderInput.trim().replace(/^\/+|\/+$/g, "");
    const fullPath = cleanFolder ? `${cleanFolder}/${cleanName}` : cleanName;
    const lang = getMonacoLanguage(cleanName);

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

  const handleDeleteFile = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (files.length <= 1) return;

    if (projectId && projectId !== "demo-workspace") {
      await api.editor.deleteFile(projectId, fileId);
    }

    const remaining = files.filter((f) => f.id !== fileId);
    setFiles(remaining);
    const nextTabs = openTabIds.filter((id) => id !== fileId);
    setOpenTabIds(nextTabs.length > 0 ? nextTabs : [remaining[0].id]);
    if (activeFileId === fileId) {
      setActiveFileId(nextTabs[nextTabs.length - 1] || remaining[0].id);
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

  // Interactive Terminal Command Handler
  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    setTerminalInput("");
    setCmdHistory((prev) => [cmd, ...prev]);
    setCmdHistoryIdx(-1);
    setTerminalHistory((prev) => [...prev, `$ ${cmd}`]);

    if (cmd === "clear" || cmd === "cls") {
      setTerminalHistory([]);
      return;
    }

    if (cmd === "help") {
      setTerminalHistory((prev) => [
        ...prev,
        "Available VS Code Integrated Terminal Commands:",
        "  node <file>        Execute JavaScript file (e.g., node src/index.js)",
        "  python3 <file>     Execute Python script (e.g., python3 scripts/analytics.py)",
        "  ls                 List all files in project workspace",
        "  cat <file>         Print file contents",
        "  git status         Check modified workspace files",
        "  clear              Clear terminal output",
      ]);
      return;
    }

    const res = await api.editor.terminal({
      command: cmd,
      files: files.map((f) => ({ path: f.path || f.name, content: f.content })),
    });

    if (res.data) {
      const out: string[] = [];
      if (res.data.stdout) out.push(...res.data.stdout.trimEnd().split("\n"));
      if (res.data.stderr) out.push(...res.data.stderr.trimEnd().split("\n"));
      setTerminalHistory((prev) => [...prev, ...(out.length > 0 ? out : ["(completed)"])]);
    } else {
      // Built-in client fallback for ls / git status
      if (cmd === "ls" || cmd === "dir") {
        setTerminalHistory((prev) => [...prev, ...files.map((f) => f.path || f.name)]);
      } else {
        setTerminalHistory((prev) => [...prev, `Executed: ${cmd}`]);
      }
    }
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

    setFiles((prev) => prev.map((f) => ({ ...f, isModified: false })));
    setCommitMessage("");
    setIsCommitting(false);
    setSyncState("Synced");
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
    const groups: Record<string, EditorFile[]> = { src: [], scripts: [], web: [], root: [] };
    for (const f of files) {
      const folderKey = f.folder || (f.path.includes("/") ? f.path.split("/")[0] : "root");
      if (!groups[folderKey]) groups[folderKey] = [];
      groups[folderKey].push(f);
    }
    return groups;
  }, [files]);

  const modifiedFiles = useMemo(() => files.filter((f) => f.isModified), [files]);
  const linesCount = activeFile.content.split("\n").length;

  return (
    <div
      className={cn(
        "flex flex-col bg-[#1e1e1e] text-[#cccccc] border border-[#333333] shadow-2xl overflow-hidden select-none transition-all",
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen rounded-none"
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
        {/* Left: Window Controls + VS Code Menus */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>

          <div className="flex items-center gap-1.5 font-semibold text-[#e1e1e1] pl-1">
            <Code2 className="w-4 h-4 text-[#007acc]" />
            <span className="hidden sm:inline">Visual Studio Code</span>
          </div>

          {/* Interactive Top Menu Bar */}
          <div className="hidden md:flex items-center gap-0.5 text-[11px] text-[#cccccc] relative">
            {[
              {
                label: "File",
                items: [
                  { name: "New File", shortcut: "⌘N", action: () => { setIsSidebarOpen(true); setActiveSidebarTab("explorer"); setIsCreatingFile(true); } },
                  { name: "Upload File from Disk...", shortcut: "⌘O", action: () => fileUploadRef.current?.click() },
                  { name: "Save", shortcut: "⌘S", action: handleSave },
                  { name: "Download Active File", shortcut: "⌘D", action: handleDownloadActiveFile },
                ],
              },
              {
                label: "Edit",
                items: [
                  { name: "Format Document", shortcut: "⇧⌥F", action: handleFormat },
                  { name: "Find & Replace in Files", shortcut: "⌘⇧F", action: () => { setIsSidebarOpen(true); setActiveSidebarTab("search"); } },
                  { name: "Copy File Content", shortcut: "⌘C", action: () => { navigator.clipboard.writeText(activeFile.content); setIsCopied(true); setTimeout(() => setIsCopied(false), 1200); } },
                ],
              },
              {
                label: "View",
                items: [
                  { name: "Command Palette...", shortcut: "⌘K", action: () => setIsCommandPaletteOpen(true) },
                  { name: "Toggle Primary Sidebar", shortcut: "⌘B", action: () => setIsSidebarOpen((v) => !v) },
                  { name: "Toggle Bottom Panel", shortcut: "⌘J", action: () => setIsBottomPanelOpen((v) => !v) },
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
                  { name: "Clear Terminal", shortcut: "", action: () => setTerminalHistory([]) },
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
              <span className="truncate">{activeFile.path || activeFile.name} — ⌘K Commands</span>
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

          {/* Fullscreen Toggle */}
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
                      onClick={() => setIsCreatingFile((v) => !v)}
                      className="p-1 rounded hover:bg-[#3c3c3c] text-[#cccccc]"
                      title="New File"
                    >
                      <Plus className="w-3.5 h-3.5" />
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
                        <option value="src">src/</option>
                        <option value="scripts">scripts/</option>
                        <option value="web">web/</option>
                        <option value="">root</option>
                      </select>
                      <input
                        type="text"
                        autoFocus
                        value={newFileNameInput}
                        onChange={(e) => setNewFileNameInput(e.target.value)}
                        placeholder="app.js / main.py"
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

                {/* Folder & File Tree */}
                <div className="flex-1 overflow-y-auto py-1.5 space-y-1">
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
                                        {files.length > 1 && (
                                          <button
                                            onClick={(e) => handleDeleteFile(file.id, e)}
                                            className="p-0.5 hover:text-[#f48771] text-[#858585]"
                                            title="Delete File"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
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
                </div>
              </div>
            )}

            {/* VIEW 2: SEARCH & REPLACE ACROSS FILES */}
            {activeSidebarTab === "search" && (
              <div className="flex flex-col h-full p-3 space-y-3">
                <div className="text-[11px] font-bold tracking-wider text-[#bbbbbb] uppercase">
                  SEARCH & REPLACE
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
                  <span>SOURCE CONTROL</span>
                  <span className="text-[10px] font-mono text-[#75beff]">main</span>
                </div>

                <form onSubmit={handleCommitChanges} className="space-y-2">
                  <textarea
                    rows={2}
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    placeholder="Message (⌘Enter to commit on 'main')"
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
                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-[#2a2d2e] cursor-pointer text-xs font-mono"
                      >
                        <span className="truncate text-[#e2c08d]">{f.path || f.name}</span>
                        <span className="text-[10px] font-bold text-[#e2c08d]">M</span>
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
                  <div className="text-[11px] font-bold tracking-wider text-[#bbbbbb] uppercase">
                    RUN AND DEBUG
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
                    Target: {activeFile.path || activeFile.name} ({getMonacoLanguage(activeFile.name)})
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
              <div className="flex flex-col h-full p-3 space-y-2.5 overflow-y-auto">
                <div className="text-[11px] font-bold tracking-wider text-[#bbbbbb] uppercase">
                  INSTALLED EXTENSIONS
                </div>
                {extensions.map((ext) => (
                  <div
                    key={ext.id}
                    className="p-2.5 rounded bg-[#1e1e1e] border border-[#333333] space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{ext.name}</span>
                      <span className="text-[10px] font-mono text-[#75beff]">v{ext.version}</span>
                    </div>
                    <p className="text-[11px] text-[#9d9d9d] leading-snug">{ext.desc}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono text-[#858585]">{ext.publisher}</span>
                      <button
                        onClick={() =>
                          setExtensions((prev) =>
                            prev.map((e) => (e.id === ext.id ? { ...e, enabled: !e.enabled } : e))
                          )
                        }
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold",
                          ext.enabled
                            ? "bg-[#2ea043]/20 text-[#3fb950] border border-[#2ea043]/40"
                            : "bg-[#3c3c3c] text-[#858585]"
                        )}
                      >
                        {ext.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  </div>
                ))}
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
                    {openTabIds.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rem = openTabIds.filter((id) => id !== file.id);
                          setOpenTabIds(rem);
                          if (activeFileId === file.id && rem.length > 0) {
                            setActiveFileId(rem[rem.length - 1]);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 hover:bg-[#3c3c3c] p-0.5 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

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
                  fontSize: 13,
                  fontFamily: "'IBM Plex Mono', Menlo, Monaco, 'Courier New', monospace",
                  tabSize: 2,
                  glyphMargin: true,
                  lineNumbersMinChars: 3,
                  minimap: { enabled: true, maxColumn: 80, scale: 0.75 },
                  wordWrap: "on",
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

          {/* =================================================================
              3. VS CODE MULTI-TAB BOTTOM PANEL (PROBLEMS / OUTPUT / DEBUG / TERMINAL)
             ================================================================= */}
          {isBottomPanelOpen && (
            <div className="h-52 border-t border-[#333333] bg-[#181818] flex flex-col shrink-0">
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
                      if (activeBottomTab === "terminal") setTerminalHistory([]);
                      if (activeBottomTab === "output") setOutputLogs([]);
                      if (activeBottomTab === "debug-console") setDebugConsoleLogs([]);
                    }}
                    className="text-[10px] text-[#858585] hover:text-white"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsBottomPanelOpen(false)}
                    className="text-[#858585] hover:text-white"
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
                  <div className="flex-1 overflow-y-auto p-2.5 font-mono text-[11px] space-y-1 text-[#cccccc] select-text">
                    {terminalHistory.map((line, idx) => (
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
                    className="flex items-center gap-2 px-2.5 py-1.5 border-t border-[#252526] bg-[#141414] text-[11px] font-mono"
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
              ● Paused at {activeFile.name}:{currentDebugStep.line}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span>
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="hidden sm:inline">Spaces: 2</span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="uppercase font-semibold">
            {getMonacoLanguage(activeFile.name)}
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
    </div>
  );
}
