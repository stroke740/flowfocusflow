import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Props {
  completed: number;
  total: number;
  color?: string;
  showLabel?: boolean;
  className?: string;
}

const ProjectProgressBar = ({ completed, total, color, showLabel = false, className }: Props) => {
  if (total === 0) return null;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color || "hsl(var(--primary))" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        />
      </div>
      {showLabel && (
        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
          {pct}% ({completed}/{total})
        </span>
      )}
    </div>
  );
};

export default ProjectProgressBar;
