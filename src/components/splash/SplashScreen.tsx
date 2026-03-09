import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<"logo" | "fade" | "done">("logo");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("fade"), 2000);
    const t2 = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "fade" ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center overflow-hidden"
        style={{ pointerEvents: phase === "fade" ? "none" : "auto" }}
      >
        {/* Ambient glow circles */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full bg-primary/[0.06] blur-[100px]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ top: "-20%", left: "-10%" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full bg-primary/[0.04] blur-[80px]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          style={{ bottom: "-15%", right: "-10%" }}
        />

        {/* Logo icon with pulse ring */}
        <div className="relative">
          {/* Pulse ring */}
          <motion.div
            className="absolute inset-[-12px] rounded-[2rem] border-2 border-primary/20"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.15, 1.15], opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.8, delay: 0.5, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-[-24px] rounded-[2.5rem] border border-primary/10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.2, 1.2], opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, delay: 0.7, ease: "easeOut" }}
          />

          {/* Icon container */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
            className="w-[88px] h-[88px] rounded-[1.75rem] bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-xl shadow-primary/30"
          >
            {/* Lightning bolt SVG */}
            <motion.svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <path
                d="M13 2L4.09 12.6a1 1 0 0 0 .77 1.64H11l-1 7.74a.5.5 0 0 0 .86.41L19.91 11.4a1 1 0 0 0-.77-1.64H13l1-7.74a.5.5 0 0 0-.86-.41L13 2Z"
                fill="hsl(var(--primary-foreground))"
                stroke="hsl(var(--primary-foreground))"
                strokeWidth="0.5"
              />
            </motion.svg>
          </motion.div>
        </div>

        {/* App name */}
        <motion.div className="mt-7 flex items-center gap-0">
          {"FocusFlow".split("").map((char, i) => (
            <motion.span
              key={i}
              className="text-[28px] font-extrabold tracking-tight text-foreground"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.04, duration: 0.35, ease: "easeOut" }}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="text-[13px] text-muted-foreground mt-1.5 font-medium tracking-wide"
        >
          Stay focused, stay productive
        </motion.p>

        {/* Loading bar */}
        <motion.div
          className="mt-8 w-12 h-[3px] rounded-full bg-muted overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        >
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ delay: 1.1, duration: 0.8, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
