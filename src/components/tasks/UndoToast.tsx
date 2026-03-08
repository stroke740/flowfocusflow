import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2 } from "lucide-react";

interface UndoAction {
  id: string;
  label: string;
  onUndo: () => void;
}

let globalAddUndo: ((action: UndoAction) => void) | null = null;

export function showUndoToast(label: string, onUndo: () => void) {
  const id = crypto.randomUUID();
  globalAddUndo?.({ id, label, onUndo });
}

const UndoToast = () => {
  const [action, setAction] = useState<UndoAction | null>(null);

  useEffect(() => {
    globalAddUndo = (a) => {
      setAction(a);
    };
    return () => { globalAddUndo = null; };
  }, []);

  useEffect(() => {
    if (!action) return;
    const t = setTimeout(() => setAction(null), 4000);
    return () => clearTimeout(t);
  }, [action]);

  const handleUndo = useCallback(() => {
    if (action) {
      action.onUndo();
      setAction(null);
    }
  }, [action]);

  return (
    <AnimatePresence>
      {action && (
        <motion.div
          key={action.id}
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border shadow-lg"
        >
          <span className="text-[13px] font-medium">{action.label}</span>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Undo2 size={14} />
            Undo
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UndoToast;
