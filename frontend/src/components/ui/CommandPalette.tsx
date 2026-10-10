"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Play,
  FileCode,
  Terminal,
  Save,
  CheckCircle,
  FolderPlus,
  Users,
  CheckSquare,
  Sparkles,
  Command as CommandIcon,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";

export interface CommandItem {
  id: string;
  title: string;
  category: "Editor" | "Navigation" | "Actions";
  shortcut?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  customCommands?: CommandItem[];
}

export function CommandPalette({
  isOpen,
  onClose,
  customCommands = [],
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const defaultCommands: CommandItem[] = [
    {
      id: "save-file",
      title: "Save Current File",
      category: "Editor",
      shortcut: "⌘S",
      icon: <Save className="w-4 h-4 text-coral" />,
      onSelect: () => {
        window.dispatchEvent(new CustomEvent("editor:action:save"));
        onClose();
      },
    },
    {
      id: "format-code",
      title: "Format Active Document",
      category: "Editor",
      shortcut: "⌥⇧F",
      icon: <CheckCircle className="w-4 h-4 text-[#3B5A38]" />,
      onSelect: () => {
        window.dispatchEvent(new CustomEvent("editor:action:format"));
        onClose();
      },
    },
    {
      id: "run-code",
      title: "Execute / Run in Terminal",
      category: "Actions",
      shortcut: "⌘R",
      icon: <Play className="w-4 h-4 text-coral" />,
      onSelect: () => {
        window.dispatchEvent(new CustomEvent("editor:action:run"));
        onClose();
      },
    },
    {
      id: "toggle-terminal",
      title: "Toggle Integrated Terminal",
      category: "Editor",
      shortcut: "⌃`",
      icon: <Terminal className="w-4 h-4 text-carbon" />,
      onSelect: () => {
        window.dispatchEvent(new CustomEvent("editor:action:toggle-terminal"));
        onClose();
      },
    },
    {
      id: "new-file",
      title: "Create New Code File",
      category: "Editor",
      shortcut: "⌘N",
      icon: <FileCode className="w-4 h-4 text-muted" />,
      onSelect: () => {
        window.dispatchEvent(new CustomEvent("editor:action:new-file"));
        onClose();
      },
    },
    {
      id: "nav-tasks",
      title: "Go to Sprint Tasks Board",
      category: "Navigation",
      shortcut: "G T",
      icon: <CheckSquare className="w-4 h-4 text-periwinkle-dark" />,
      onSelect: () => {
        window.location.href = "/tasks";
        onClose();
      },
    },
    {
      id: "nav-team",
      title: "View Team Collaborators",
      category: "Navigation",
      shortcut: "G M",
      icon: <Users className="w-4 h-4 text-muted" />,
      onSelect: () => {
        window.location.href = "/team";
        onClose();
      },
    },
  ];

  const allCommands = [...customCommands, ...defaultCommands];

  const filteredCommands = allCommands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else window.dispatchEvent(new CustomEvent("command-palette:open"));
      }

      if (!isOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % Math.max(1, filteredCommands.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) =>
          i === 0 ? Math.max(0, filteredCommands.length - 1) : i - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].onSelect();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-carbon/40 backdrop-blur-[2px] transition-opacity duration-160"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-editor border border-divider shadow-2xl overflow-hidden animate-command-palette select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-divider bg-paper/60">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search action (e.g. Save, Run, Format)..."
            className="w-full bg-transparent text-sm text-carbon placeholder:text-muted outline-none font-sans"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-editor border border-divider text-[10px] font-mono text-muted">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted font-mono">
              No matching developer commands found.
            </div>
          ) : (
            filteredCommands.map((cmd, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => cmd.onSelect()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors duration-120",
                    isSelected
                      ? "bg-carbon text-paper font-medium"
                      : "text-carbon hover:bg-paper"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "p-1 rounded-lg shrink-0 transition-colors",
                        isSelected ? "bg-paper/20 text-paper" : "bg-paper text-carbon border border-divider"
                      )}
                    >
                      {cmd.icon}
                    </span>
                    <span>{cmd.title}</span>
                    <span
                      className={cn(
                        "text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border text-muted",
                        isSelected
                          ? "border-paper/20 text-paper/80"
                          : "border-divider bg-paper"
                      )}
                    >
                      {cmd.category}
                    </span>
                  </div>

                  {cmd.shortcut && (
                    <kbd
                      className={cn(
                        "font-mono text-[10px] px-1.5 py-0.5 rounded",
                        isSelected
                          ? "bg-paper/20 text-paper"
                          : "bg-paper text-muted border border-divider"
                      )}
                    >
                      {cmd.shortcut}
                    </kbd>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-divider bg-paper/40 text-[11px] text-muted font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Command Palette • NeoStats</span>
        </div>
      </div>
    </div>
  );
}
