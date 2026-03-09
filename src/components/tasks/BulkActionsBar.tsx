import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, FolderOpen, Flag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskPriority, PRIORITY_CONFIG } from "@/types/task";
import { Project } from "@/hooks/use-projects";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface BulkActionsBarProps {
  selectedCount: number;
  onComplete: () => void;
  onDelete: () => void;
  onSetPriority: (p: TaskPriority) => void;
  onMoveToProject: (projectId: string | null) => void;
  onClear: () => void;
  projects: Project[];
}

export default function BulkActionsBar({
  selectedCount, onComplete, onDelete, onSetPriority, onMoveToProject, onClear, projects,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-20 left-4 right-4 z-40 bg-card border border-border rounded-2xl shadow-lg p-3 flex items-center gap-2 max-w-lg mx-auto"
        >
          <span className="text-[12px] font-bold text-primary tabular-nums mr-1">
            {selectedCount}
          </span>

          <button onClick={onComplete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/10 text-success text-[11px] font-semibold hover:bg-success/20 transition-colors">
            <Check size={13} /> Done
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-[11px] font-semibold hover:bg-accent transition-colors">
                <Flag size={13} /> Priority
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-36 p-1" align="center">
              {(["p1", "p2", "p3", "p4"] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => onSetPriority(p)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] flex items-center gap-2 hover:bg-muted transition-colors"
                >
                  <span>{PRIORITY_CONFIG[p].emoji}</span> {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-[11px] font-semibold hover:bg-accent transition-colors">
                <FolderOpen size={13} /> Move
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1" align="center">
              <button
                onClick={() => onMoveToProject(null)}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] hover:bg-muted transition-colors"
              >
                No project
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onMoveToProject(p.id)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] flex items-center gap-2 hover:bg-muted transition-colors"
                >
                  <span>{p.icon}</span> {p.name}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          <button onClick={onDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 text-destructive text-[11px] font-semibold hover:bg-destructive/20 transition-colors">
            <Trash2 size={13} />
          </button>

          <div className="flex-1" />

          <button onClick={onClear} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X size={14} className="text-muted-foreground" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
