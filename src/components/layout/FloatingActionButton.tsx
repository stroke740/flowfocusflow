import { motion, AnimatePresence } from "framer-motion";
import { Plus, Layout, Timer, CheckCircle2 } from "lucide-react";

interface FloatingActionButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  onTemplates: () => void;
  onFocusTimer: () => void;
  onAddTask: () => void;
}

export function FloatingActionButton({
  isOpen,
  onToggle,
  onTemplates,
  onFocusTimer,
  onAddTask,
}: FloatingActionButtonProps) {
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-30"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed right-5 bottom-[calc(4rem+env(safe-area-inset-bottom)+80px)] z-40 flex flex-col items-end gap-3">
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: 0.1 }}
              onClick={onTemplates}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border shadow-lg text-sm font-medium"
            >
              <Layout size={16} className="text-accent-foreground" />
              Template
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: 0.05 }}
              onClick={onFocusTimer}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border shadow-lg text-sm font-medium"
            >
              <Timer size={16} className="text-warning" />
              Focus Timer
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ delay: 0 }}
              onClick={onAddTask}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border shadow-lg text-sm font-medium"
            >
              <CheckCircle2 size={16} className="text-primary" />
              Task
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: isOpen ? 45 : 0 }}
        transition={{ type: "spring", stiffness: 420, damping: 24, delay: isOpen ? 0 : 0.15 }}
        onClick={onToggle}
        className="fixed right-5 bottom-[calc(4.25rem+env(safe-area-inset-bottom)+12px)] z-40 w-[56px] h-[56px] rounded-[18px] bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform"
      >
        <Plus size={22} strokeWidth={2.5} />
      </motion.button>
    </>
  );
}
