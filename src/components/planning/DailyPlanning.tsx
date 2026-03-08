import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Star, Check, ChevronRight, Sparkles } from "lucide-react";
import { Task } from "@/types/task";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DailyPlanningProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelectTasks: (taskIds: string[]) => void;
}

const DailyPlanning = ({ open, onClose, tasks, onSelectTasks }: DailyPlanningProps) => {
  const [step, setStep] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const suggestions = useMemo(() => {
    return [...tasks]
      .sort((a, b) => {
        const pOrder = { p1: 0, p2: 1, p3: 2, p4: 3 };
        const pa = pOrder[a.priority] ?? 3;
        const pb = pOrder[b.priority] ?? 3;
        if (pa !== pb) return pa - pb;
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        return 0;
      })
      .slice(0, 10);
  }, [tasks]);

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < 3) next.add(id);
    setSelectedIds(next);
  };

  const handleConfirm = () => {
    onSelectTasks(Array.from(selectedIds));
    onClose();
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 0 ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <motion.div
                className="w-20 h-20 rounded-3xl bg-warning/10 flex items-center justify-center mx-auto mb-6"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                <Sun size={36} className="text-warning" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Good Morning!</h2>
              <p className="text-muted-foreground text-[14px] mb-8 leading-relaxed">
                Pick your top 3 tasks for today.<br />Focus on what matters most.
              </p>
              <Button onClick={() => setStep(1)} className="gap-2 rounded-xl px-6">
                Let's Plan <ChevronRight size={16} />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="picker"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full"
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-warning" />
                <h3 className="text-[15px] font-bold">Pick up to 3 tasks</h3>
              </div>
              <p className="text-[12px] text-muted-foreground mb-4">
                {selectedIds.size}/3 selected
              </p>
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                {suggestions.map((task) => {
                  const selected = selectedIds.has(task.id);
                  return (
                    <motion.button
                      key={task.id}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggle(task.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        selected ? "bg-primary border-primary" : "border-muted-foreground/20"
                      )}>
                        {selected && <Check size={12} className="text-primary-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{task.title}</p>
                        {task.priority !== "p4" && (
                          <p className="text-[10px] text-muted-foreground">{task.priority.toUpperCase()}</p>
                        )}
                      </div>
                      {selected && <Star size={14} className="text-warning flex-shrink-0" fill="currentColor" />}
                    </motion.button>
                  );
                })}
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">Skip</Button>
                <Button onClick={handleConfirm} disabled={selectedIds.size === 0} className="flex-1 rounded-xl gap-1">
                  Start Day <ChevronRight size={14} />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DailyPlanning;
