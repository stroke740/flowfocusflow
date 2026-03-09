import { motion } from "framer-motion";

const TaskSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="space-y-2 mt-2">
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.06 }}
        className="flex items-center gap-3 p-3.5 rounded-2xl border border-border/40 bg-card"
      >
        <div className="w-10 h-10 rounded-xl animate-shimmer flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-3/4 rounded-lg animate-shimmer" />
          <div className="h-2.5 w-1/3 rounded-lg animate-shimmer" />
        </div>
        <div className="w-8 h-8 rounded-full animate-shimmer flex-shrink-0" />
      </motion.div>
    ))}
  </div>
);

export default TaskSkeleton;
