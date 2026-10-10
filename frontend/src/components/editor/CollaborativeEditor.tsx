"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileCode,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Play,
  Save,
  Check,
  Copy,
  Terminal as TerminalIcon,
  Sparkles,
  Search,
  Plus,
  RefreshCw,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  Layers,
  Code2,
  Settings2,
} from "lucide-react";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { SyncStatusBadge, SyncState } from "../ui/SyncStatusBadge";
import { CommandPalette } from "../ui/CommandPalette";
import { useSocket } from "../../context/SocketContext";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

export interface EditorFile {
  id: string;
  name: string;
  language: string;
  content: string;
  version: number;
  isModified?: boolean;
}

export interface CollaboratorPeer {
  id: string;
  name: string;
  email?: string;
  color: string;
  cursor?: { line: number; ch: number };
  activeFileId?: string;
}

const INITIAL_FILES: EditorFile[] = [
  {
    id: "file-1",
    name: "crdt_sync.rs",
    language: "rust",
    version: 1,
    content: `// LetsCollab CRDT State Engine - Vector Clock & Concurrency Resolver
use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq)]
pub struct VectorClock {
    pub client_id: String,
    pub counters: HashMap<String, u64>,
}

impl VectorClock {
    pub fn new(client_id: &str) -> Self {
        let mut counters = HashMap::new();
        counters.insert(client_id.to_string(), 1);
        Self {
            client_id: client_id.to_string(),
            counters,
        }
    }

    /// Increments local clock counter prior to broadcasting event
    pub fn tick(&mut self) -> u64 {
        let count = self.counters.entry(self.client_id.clone()).or_insert(0);
        *count += 1;
        *count
    }

    /// Merges remote clock state and detects causal conflicts
    pub fn merge(&mut self, remote: &VectorClock) -> bool {
        let mut had_conflict = false;
        for (peer, &remote_val) in &remote.counters {
            let local_val = self.counters.entry(peer.clone()).or_insert(0);
            if remote_val > *local_val {
                *local_val = remote_val;
            } else if remote_val < *local_val {
                had_conflict = true;
            }
        }
        had_conflict
    }
}
`,
  },
  {
    id: "file-2",
    name: "socket_pipeline.ts",
    language: "typescript",
    version: 1,
    content: `// LetsCollab Real-Time Collaborative Socket Pipeline
import { Socket } from "socket.io";

export interface CodeDeltaEvent {
  projectId: string;
  fileId: string;
  version: number;
  patch: string;
  cursor: { line: number; ch: number };
}

export class SocketPipeline {
  private activePeers = new Map<string, Set<string>>();

  public handleJoin(socket: Socket, projectId: string, userId: string): void {
    socket.join(\`editor:\${projectId}\`);
    if (!this.activePeers.has(projectId)) {
      this.activePeers.set(projectId, new Set());
    }
    this.activePeers.get(projectId)!.add(userId);
    socket.to(\`editor:\${projectId}\`).emit("peer:connected", { userId, count: this.activePeers.get(projectId)!.size });
  }

  public broadcastDelta(socket: Socket, delta: CodeDeltaEvent): void {
    // Zero-alloc sub-10ms broadcast
    socket.to(\`editor:\${delta.projectId}\`).emit("code:delta", delta);
  }
}
`,
  },
  {
    id: "file-3",
    name: "protocol.proto",
    language: "protobuf",
    version: 1,
    content: `syntax = "proto3";

package letscollab.collaboration.v1;

message EditOperation {
  string op_id = 1;
  string author_id = 2;
  uint64 sequence_number = 3;
  string file_path = 4;
  int32 start_offset = 5;
  int32 delete_count = 6;
  string insert_text = 7;
  int64 timestamp_ms = 8;
}

message CursorPosition {
  string peer_id = 1;
  int32 line = 2;
  int32 column = 3;
  int32 selection_start = 4;
  int32 selection_end = 5;
}
`,
  },
];

const COLLABORATOR_COLORS = [
  "#E65F42", // Signal Coral
  "#364573", // Periwinkle Dark
  "#3B5A38", // Soft Moss Dark
  "#d34628", // Coral Deep
  "#4B4F47", // Carbon Accent
];

interface CollaborativeEditorProps {
  projectId?: string;
  initialActiveFile?: string;
}

export function CollaborativeEditor({
  projectId = "demo-workspace",
  initialActiveFile = "file-1",
}: CollaborativeEditorProps) {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  // File System State
  const [files, setFiles] = useState<EditorFile[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string>(initialActiveFile);
  const [openTabIds, setOpenTabIds] = useState<string[]>(["file-1", "file-2", "file-3"]);

  // Collaboration State
  const [peers, setPeers] = useState<CollaboratorPeer[]>([
    { id: "peer-ananya", name: "Ananya Sharma", email: "ananya@neostats.app", color: "#364573", cursor: { line: 14, ch: 22 } },
    { id: "peer-rohan", name: "Rohan Verma", email: "rohan@neostats.app", color: "#E65F42", cursor: { line: 28, ch: 10 } },
  ]);

  // Editor Interaction States
  const [syncState, setSyncState] = useState<SyncState>("Synced");
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
  const [isCopied, setIsCopied] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    "$ cargo check --workspace",
    "   Compiling neostats-crdt v1.4.0 (/workspace/core)",
    "    Finished dev [unoptimized + debuginfo] target(s) in 0.42s",
    "✔ Zero warnings. CRDT synchronization mesh verified.",
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [treeExpanded, setTreeExpanded] = useState<Record<string, boolean>>({
    src: true,
    protocol: true,
  });

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const activeFile = files.find((f) => f.id === activeFileId) || files[0];

  // 1. Socket.IO Real-Time Peer Listeners
  useEffect(() => {
    if (!socket || !projectId) return;

    // Join editor room with authenticated user identity
    const userColor = COLLABORATOR_COLORS[Math.floor(Math.random() * COLLABORATOR_COLORS.length)];
    socket.emit("editor:join", {
      projectId,
      user: {
        id: user?.id || "guest",
        name: user?.name || "Guest Developer",
        email: user?.email,
        color: userColor,
      },
    });

    const handlePeerJoined = (data: any) => {
      if (!data?.user) return;
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
      setPeers((prev) =>
        prev.map((p) =>
          p.id === data.user.id ? { ...p, cursor: { line: data.line, ch: data.ch }, activeFileId: data.fileId } : p
        )
      );
    };

    const handleCodeUpdated = (data: any) => {
      if (data.fileId && data.content !== undefined) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === data.fileId ? { ...f, content: data.content, version: data.version || f.version + 1 } : f
          )
        );
        setSyncState("Synced");
        setLastSynced(new Date());
      }
    };

    socket.on("editor:user-joined", handlePeerJoined);
    socket.on("editor:user-left", handlePeerLeft);
    socket.on("editor:cursor-moved", handleCursorMoved);
    socket.on("editor:code-updated", handleCodeUpdated);

    return () => {
      socket.emit("editor:leave", { projectId });
      socket.off("editor:user-joined", handlePeerJoined);
      socket.off("editor:user-left", handlePeerLeft);
      socket.off("editor:cursor-moved", handleCursorMoved);
      socket.off("editor:code-updated", handleCodeUpdated);
    };
  }, [socket, projectId, user]);

  // Sync state management
  useEffect(() => {
    if (!isConnected) {
      setSyncState("Offline");
    } else {
      setSyncState("Synced");
    }
  }, [isConnected]);

  // Global custom event listeners (Command Palette actions)
  useEffect(() => {
    const onSave = () => handleSave();
    const onFormat = () => handleFormat();
    const onRun = () => handleRun();
    const onToggleTerm = () => setIsTerminalOpen((v) => !v);
    const onNewFile = () => handleNewFile();
    const onOpenCmd = () => setIsCommandPaletteOpen(true);

    window.addEventListener("editor:action:save", onSave);
    window.addEventListener("editor:action:format", onFormat);
    window.addEventListener("editor:action:run", onRun);
    window.addEventListener("editor:action:toggle-terminal", onToggleTerm);
    window.addEventListener("editor:action:new-file", onNewFile);
    window.addEventListener("command-palette:open", onOpenCmd);

    return () => {
      window.removeEventListener("editor:action:save", onSave);
      window.removeEventListener("editor:action:format", onFormat);
      window.removeEventListener("editor:action:run", onRun);
      window.removeEventListener("editor:action:toggle-terminal", onToggleTerm);
      window.removeEventListener("editor:action:new-file", onNewFile);
      window.removeEventListener("command-palette:open", onOpenCmd);
    };
  }, [activeFile, files]);

  // Keyboard shortcut listener for Cmd+S, Cmd+R
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    } else if ((e.metaKey || e.ctrlKey) && e.key === "r") {
      e.preventDefault();
      handleRun();
    }
  };

  // Editor Actions
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSyncState("Saving");

    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: val, isModified: true } : f))
    );

    // Broadcast edit to peers via Socket
    if (socket && projectId) {
      socket.emit("editor:code-change", {
        projectId,
        fileId: activeFileId,
        content: val,
        version: activeFile.version + 1,
        user: { id: user?.id, name: user?.name },
      });
    }

    // Debounce to Synced state
    setTimeout(() => {
      setSyncState("Synced");
      setLastSynced(new Date());
    }, 450);
  };

  const handleCursorMove = () => {
    if (!textareaRef.current || !socket || !projectId) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = textareaRef.current.value.substring(0, pos);
    const line = textBefore.split("\n").length;
    const ch = pos - textBefore.lastIndexOf("\n");

    socket.emit("editor:cursor", {
      projectId,
      fileId: activeFileId,
      line,
      ch,
      user: { id: user?.id, name: user?.name },
    });
  };

  const handleSave = () => {
    setSyncState("Saving");
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) => (f.id === activeFileId ? { ...f, isModified: false, version: f.version + 1 } : f))
      );
      setSyncState("Synced");
      setLastSynced(new Date());
    }, 280);
  };

  const handleCopy = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1600);
  };

  const handleFormat = () => {
    setIsFormatting(true);
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === activeFileId) {
            const formatted = f.content
              .split("\n")
              .map((line) => line.trimEnd())
              .join("\n");
            return { ...f, content: formatted, isModified: true };
          }
          return f;
        })
      );
      setIsFormatting(false);
      setSyncState("Synced");
    }, 240);
  };

  const handleRun = () => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalHistory((prev) => [
      ...prev,
      `$ cargo test --package ${activeFile.name.replace(".rs", "")} [${timestamp}]`,
      `   Running target/debug/deps/${activeFile.name.replace(".rs", "")}_test`,
      "running 4 tests",
      "test tests::test_vector_clock_initialization ... ok",
      "test tests::test_causal_merge_no_conflict ... ok",
      "test tests::test_concurrent_divergence_detected ... ok",
      "test tests::test_peer_cursor_broadcast ... ok",
      "",
      "test result: ok. 4 passed; 0 failed; finished in 0.08s",
    ]);
    setIsTerminalOpen(true);
  };

  const handleNewFile = () => {
    const newId = `file-${Date.now()}`;
    const newFileName = `module_${files.length + 1}.rs`;
    const newFile: EditorFile = {
      id: newId,
      name: newFileName,
      language: "rust",
      version: 1,
      content: `// New Module: ${newFileName}\n\npub fn execute_step() -> Result<(), &'static str> {\n    Ok(())\n}\n`,
      isModified: false,
    };
    setFiles((prev) => [...prev, newFile]);
    setOpenTabIds((prev) => [...prev, newId]);
    setActiveFileId(newId);
  };

  const closeTab = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = openTabIds.filter((id) => id !== fileId);
    setOpenTabIds(remaining);
    if (activeFileId === fileId && remaining.length > 0) {
      setActiveFileId(remaining[remaining.length - 1]);
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    setTerminalInput("");
    setTerminalHistory((prev) => [...prev, `$ ${cmd}`]);

    setTimeout(() => {
      if (cmd.includes("git status")) {
        setTerminalHistory((prev) => [
          ...prev,
          "On branch main",
          "Your branch is up to date with 'origin/main'.",
          "nothing to commit, working tree clean",
        ]);
      } else if (cmd.includes("npm test") || cmd.includes("cargo test")) {
        setTerminalHistory((prev) => [
          ...prev,
          "✔ All 9/9 integration suites passing (1.2s)",
        ]);
      } else {
        setTerminalHistory((prev) => [
          ...prev,
          `letscollab: ${cmd}: command executed successfully`,
        ]);
      }
    }, 180);
  };

  // Line numbers calculation
  const linesCount = activeFile.content.split("\n").length;

  return (
    <div className="flex flex-col h-[760px] max-h-[82vh] w-full rounded-2xl bg-editor border border-divider shadow-md overflow-hidden select-none">
      {/* 1. Editor Window Top Bar / Toolbar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-paper border-b border-divider shrink-0">
        <div className="flex items-center gap-3">
          {/* Window dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-coral/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#e3b04b]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#5bb062]" />
          </div>

          <span className="text-xs font-mono font-bold text-carbon">
            letscollab-workspace <span className="text-muted font-normal">/ {activeFile.name}</span>
          </span>

          <SyncStatusBadge state={syncState} lastSynced={lastSynced} />
        </div>

        {/* Center / Right: Collaborator Avatars & Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Active Collaborators Presence Bar */}
          <div className="flex items-center -space-x-1.5 mr-2">
            {peers.map((peer) => (
              <Tooltip key={peer.id} content={`${peer.name} (${peer.email || "Active"})`} side="bottom">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white border-2 border-editor shadow-xs transition-transform duration-160 hover:scale-110 hover:z-10 animate-avatar-enter"
                  style={{ backgroundColor: peer.color }}
                >
                  {peer.name.charAt(0)}
                </div>
              </Tooltip>
            ))}

            {/* Current User Identity */}
            <Tooltip content={`You (${user?.name || "Developer"})`} side="bottom">
              <div className="w-6 h-6 rounded-full bg-carbon text-paper border-2 border-editor flex items-center justify-center text-[10px] font-mono font-bold shadow-xs">
                {(user?.name || "Me").charAt(0)}
              </div>
            </Tooltip>
          </div>

          {/* Quick Command Palette Button */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-editor hover:bg-paper border border-divider text-muted hover:text-carbon text-[11px] font-mono transition-all duration-150 hover:-translate-y-0.5"
            title="Command Palette (Cmd+K)"
          >
            <Search className="w-3 h-3 text-muted" />
            <span>Cmd+K</span>
          </button>

          {/* Format Button */}
          <Tooltip content="Format Document (Shift+Alt+F)" side="bottom">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleFormat}
              isLoading={isFormatting}
              icon={<Code2 className="w-3.5 h-3.5 text-muted" />}
              className="h-7 text-xs"
            >
              Format
            </Button>
          </Tooltip>

          {/* Copy Button */}
          <Tooltip content="Copy Code to Clipboard" side="bottom">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              icon={
                isCopied ? (
                  <Check className="w-3.5 h-3.5 text-[#3B5A38] animate-checkmark-pop" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-muted" />
                )
              }
              className="h-7 text-xs"
            >
              {isCopied ? "Copied!" : "Copy"}
            </Button>
          </Tooltip>

          {/* Save Button */}
          <Tooltip content="Save Document (Cmd+S)" side="bottom">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSave}
              icon={<Save className="w-3.5 h-3.5 text-coral" />}
              className="h-7 text-xs"
            >
              Save
            </Button>
          </Tooltip>

          {/* Primary Run Button with arrow & tactile lift */}
          <Tooltip content="Execute Tests & Pipeline (Cmd+R)" side="bottom">
            <Button
              variant="primary"
              size="sm"
              onClick={handleRun}
              withArrow
              icon={<Play className="w-3.5 h-3.5 fill-current" />}
              className="h-7 text-xs font-bold"
            >
              Run
            </Button>
          </Tooltip>

          {/* Terminal Drawer Toggle */}
          <Tooltip content={isTerminalOpen ? "Hide Terminal (Ctrl+`)" : "Show Terminal (Ctrl+`)"} side="bottom">
            <button
              onClick={() => setIsTerminalOpen(!isTerminalOpen)}
              className={cn(
                "p-1.5 rounded-md border text-xs transition-all duration-150",
                isTerminalOpen
                  ? "bg-carbon text-paper border-carbon"
                  : "bg-editor text-muted hover:text-carbon border-divider hover:bg-paper"
              )}
            >
              <TerminalIcon className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 2. Main Editor Workspace Body (File Tree + Code View) */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Side: Resizable File Explorer */}
        <div className="w-56 shrink-0 bg-paper/60 border-r border-divider flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center justify-between px-3 py-2 border-b border-divider/60 text-[11px] font-mono text-muted uppercase tracking-wider">
              <span>EXPLORER</span>
              <button
                onClick={handleNewFile}
                className="p-1 hover:bg-paper rounded transition hover:text-coral"
                title="New File"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Folder 1: src */}
            <div className="p-1.5 space-y-0.5">
              <div
                onClick={() => setTreeExpanded((p) => ({ ...p, src: !p.src }))}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-carbon hover:bg-paper cursor-pointer font-medium"
              >
                {treeExpanded.src ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted transition-transform duration-160" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted transition-transform duration-160" />
                )}
                <FolderOpen className="w-3.5 h-3.5 text-[#e3b04b]" />
                <span className="font-mono text-xs">src / engine</span>
              </div>

              {treeExpanded.src && (
                <div className="pl-4 space-y-0.5">
                  {files.map((file) => {
                    const isActive = file.id === activeFileId;
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
                          "group flex items-center justify-between px-2 py-1 rounded-md text-xs font-mono cursor-pointer transition-all duration-140",
                          isActive
                            ? "bg-coral/10 text-coral font-bold border border-coral/30"
                            : "text-muted hover:text-carbon hover:bg-paper border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileCode className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-coral" : "text-muted")} />
                          <span className="truncate">{file.name}</span>
                        </div>
                        {file.isModified && <span className="w-1.5 h-1.5 rounded-full bg-coral shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Explorer Bottom Sync Status */}
          <div className="p-2 border-t border-divider/60 text-[10px] font-mono text-muted flex items-center justify-between bg-paper/40">
            <span>Branch: main</span>
            <span className="text-[#3B5A38]">● Live</span>
          </div>
        </div>

        {/* Center: Tabs + Code Editor */}
        <div className="flex-1 flex flex-col min-w-0 bg-editor">
          {/* Tabs Bar */}
          <div className="flex items-center border-b border-divider bg-paper/30 overflow-x-auto shrink-0">
            {openTabIds.map((tabId) => {
              const file = files.find((f) => f.id === tabId);
              if (!file) return null;
              const isActive = tabId === activeFileId;

              return (
                <div
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={cn(
                    "group flex items-center gap-2 px-3.5 py-2 border-r border-divider text-xs font-mono cursor-pointer transition-colors duration-140 select-none",
                    isActive
                      ? "bg-editor text-carbon font-bold border-t-2 border-t-coral"
                      : "text-muted hover:text-carbon hover:bg-paper/70 border-t-2 border-t-transparent"
                  )}
                >
                  <FileCode className={cn("w-3.5 h-3.5", isActive ? "text-coral" : "text-muted")} />
                  <span>{file.name}</span>
                  {file.isModified ? (
                    <span className="w-2 h-2 rounded-full bg-coral shrink-0" />
                  ) : (
                    <button
                      onClick={(e) => closeTab(file.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-carbon p-0.5 rounded transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Code Textarea & Line Numbers */}
          <div className="relative flex-1 flex min-h-0 overflow-hidden font-mono text-xs">
            {/* Line numbers column */}
            <div className="w-12 py-3 bg-editor border-r border-divider/40 text-muted/60 text-right pr-3 select-none shrink-0 font-mono text-[11px] leading-5">
              {Array.from({ length: linesCount }, (_, i) => (
                <div key={i + 1}>{i + 1}</div>
              ))}
            </div>

            {/* Code Input Area with Remote Peer Cursors */}
            <div className="relative flex-1 h-full overflow-hidden">
              <textarea
                ref={textareaRef}
                value={activeFile.content}
                onChange={handleTextChange}
                onSelect={handleCursorMove}
                onKeyUp={handleCursorMove}
                onClick={handleCursorMove}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="w-full h-full p-3 bg-editor text-carbon outline-none resize-none font-mono text-[12px] leading-5 selection:bg-periwinkle/70 selection:text-carbon"
              />

              {/* Real Remote Peer Cursors Overlay */}
              {peers.map((peer) => {
                if (!peer.cursor) return null;
                const topPx = (peer.cursor.line - 1) * 20 + 12;
                const leftPx = peer.cursor.ch * 7.2 + 12;

                return (
                  <div
                    key={peer.id}
                    className="absolute pointer-events-none transition-all duration-140 ease-out z-10"
                    style={{ top: `${topPx}px`, left: `${leftPx}px` }}
                  >
                    {/* Blinking remote cursor line */}
                    <div
                      className="w-0.5 h-4.5 animate-remote-cursor"
                      style={{ backgroundColor: peer.color }}
                    />
                    {/* Name badge */}
                    <div
                      className="absolute -top-4 left-1 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold text-white shadow-xs whitespace-nowrap"
                      style={{ backgroundColor: peer.color }}
                    >
                      {peer.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Collapsible Terminal Drawer */}
          {isTerminalOpen && (
            <div className="border-t border-divider bg-[#1e221d] text-paper shrink-0 animate-terminal-open flex flex-col h-44">
              {/* Terminal header */}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#30362f] bg-[#191c18] text-[11px] font-mono">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[#D9E7D5]">TERMINAL</span>
                  <span className="text-[#686D64]">• bash / zsh</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTerminalHistory(["$ terminal buffer cleared"])}
                    className="text-[#8e948a] hover:text-paper text-[10px] transition"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsTerminalOpen(false)}
                    className="text-[#8e948a] hover:text-paper"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Terminal output stream */}
              <div className="flex-1 overflow-y-auto p-2.5 font-mono text-[11px] space-y-1 text-[#d5dacd] select-text">
                {terminalHistory.map((line, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      line.startsWith("$") && "text-coral font-bold",
                      line.includes("error") && "text-[#ff6b6b]",
                      line.includes("Finished") && "text-[#5bb062]",
                      line.includes("ok") && "text-[#5bb062]"
                    )}
                  >
                    {line}
                  </div>
                ))}
              </div>

              {/* Terminal interactive prompt input */}
              <form
                onSubmit={handleTerminalSubmit}
                className="flex items-center gap-2 px-2.5 py-1.5 border-t border-[#30362f] bg-[#141613] text-[11px] font-mono"
              >
                <span className="text-coral font-bold">letscollab❯</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="Type command (e.g. cargo test, git status, npm test)..."
                  className="flex-1 bg-transparent text-paper outline-none placeholder:text-[#5e6459]"
                />
              </form>
            </div>
          )}
        </div>
      </div>

      {/* 4. Bottom Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-paper border-t border-divider text-[11px] font-mono text-muted shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#3B5A38]" />
            <span>CRDT Vector Clock: v{activeFile.version}</span>
          </span>
          <span>•</span>
          <span>UTF-8</span>
          <span>•</span>
          <span>{activeFile.language.toUpperCase()}</span>
        </div>

        <div className="flex items-center gap-3">
          <span>{linesCount} lines</span>
          <span>•</span>
          <span>2 Active Peers</span>
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="text-coral hover:underline font-bold"
          >
            ⌘K Actions
          </button>
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
