import { useState, useRef, ReactNode } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableTaskWrapperProps {
  children: ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  enabled?: boolean;
}

const SWIPE_THRESHOLD = 80;

const SwipeableTaskWrapper = ({ children, onSwipeLeft, onSwipeRight, enabled = true }: SwipeableTaskWrapperProps) => {
  const x = useMotionValue(0);
  const [swiping, setSwiping] = useState(false);

  // Right swipe (complete) - green background
  const rightBg = useTransform(x, [0, SWIPE_THRESHOLD], ["hsl(var(--success) / 0)", "hsl(var(--success) / 0.15)"]);
  const rightIconOpacity = useTransform(x, [0, 40, SWIPE_THRESHOLD], [0, 0.5, 1]);
  const rightIconScale = useTransform(x, [0, SWIPE_THRESHOLD], [0.5, 1]);

  // Left swipe (delete) - red background
  const leftBg = useTransform(x, [-SWIPE_THRESHOLD, 0], ["hsl(var(--destructive) / 0.15)", "hsl(var(--destructive) / 0)"]);
  const leftIconOpacity = useTransform(x, [-SWIPE_THRESHOLD, -40, 0], [1, 0.5, 0]);
  const leftIconScale = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0.5]);

  if (!enabled) return <>{children}</>;

  const handleDragEnd = (_: any, info: PanInfo) => {
    setSwiping(false);
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipeRight();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipeLeft();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Right swipe background (complete) */}
      <motion.div
        className="absolute inset-0 flex items-center pl-4 rounded-xl"
        style={{ backgroundColor: rightBg }}
      >
        <motion.div style={{ opacity: rightIconOpacity, scale: rightIconScale }}>
          <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
            <Check size={16} className="text-success-foreground" />
          </div>
        </motion.div>
      </motion.div>

      {/* Left swipe background (delete) */}
      <motion.div
        className="absolute inset-0 flex items-center justify-end pr-4 rounded-xl"
        style={{ backgroundColor: leftBg }}
      >
        <motion.div style={{ opacity: leftIconOpacity, scale: leftIconScale }}>
          <div className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center">
            <Trash2 size={16} className="text-destructive-foreground" />
          </div>
        </motion.div>
      </motion.div>

      {/* Draggable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragStart={() => setSwiping(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default SwipeableTaskWrapper;
