import { ReactNode, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

const THRESHOLD = 80;

const PullToRefresh = ({ children, onRefresh, className }: PullToRefreshProps) => {
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const spinnerOpacity = useTransform(y, [0, 40, THRESHOLD], [0, 0.5, 1]);
  const spinnerScale = useTransform(y, [0, THRESHOLD], [0.5, 1]);
  const spinnerRotate = useTransform(y, [0, THRESHOLD * 2], [0, 360]);

  const handleDragEnd = useCallback(async (_: any, info: PanInfo) => {
    if (info.offset.y > THRESHOLD && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  }, [onRefresh, refreshing]);

  const canDrag = () => {
    if (!containerRef.current) return true;
    return containerRef.current.scrollTop <= 0;
  };

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center z-10 pointer-events-none"
        style={{ opacity: spinnerOpacity }}
      >
        <motion.div
          className="mt-3 w-9 h-9 rounded-full bg-card border border-border shadow-md flex items-center justify-center"
          style={{ scale: spinnerScale }}
        >
          <motion.div
            style={{ rotate: refreshing ? undefined : spinnerRotate }}
            animate={refreshing ? { rotate: 360 } : undefined}
            transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : undefined}
          >
            <RefreshCw size={16} className={cn("text-primary", refreshing && "animate-spin")} />
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div
        drag={canDrag() ? "y" : false}
        dragConstraints={{ top: 0, bottom: 120 }}
        dragElastic={0.3}
        dragSnapToOrigin
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="touch-pan-x"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
