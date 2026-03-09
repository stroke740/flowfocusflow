import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const steps = [
  {
    emoji: "🌱",
    title: "Welcome to FocusFlow",
    subtitle: "YOUR PRODUCTIVITY COMPANION",
    description: "Build better habits, one day at a time.\nLet's get you set up in under a minute.",
    gradient: "from-primary/15 to-primary/5",
    ring: "ring-primary/20",
  },
  {
    emoji: "🎯",
    title: "Capture Everything",
    subtitle: "NEVER FORGET A TASK",
    description: "Add tasks with natural language shortcuts.\nPriorities, dates, and tags — all in one line.",
    gradient: "from-success/15 to-success/5",
    ring: "ring-success/20",
  },
  {
    emoji: "⚡",
    title: "Stay in the Zone",
    subtitle: "DEEP WORK, MADE EASY",
    description: "Focus Timer powers your deep work sessions.\nTrack streaks and celebrate progress.",
    gradient: "from-warning/15 to-warning/5",
    ring: "ring-warning/20",
  },
  {
    emoji: "🚀",
    title: "You're All Set!",
    subtitle: "LET'S GET PRODUCTIVE",
    description: "Start adding tasks and build momentum.\nYour productivity journey begins now.",
    gradient: "from-primary/15 to-primary/5",
    ring: "ring-primary/20",
  },
];

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState(0);
  const isLast = step === steps.length - 1;
  const current = steps[step];

  const next = () => {
    if (isLast) {
      onComplete();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Background gradient */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${step}`}
          className={cn("absolute inset-0 bg-gradient-to-b opacity-60 pointer-events-none", current.gradient)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </AnimatePresence>

      {/* Floating orbs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[100px]"
        animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "-10%", right: "-15%" }}
      />

      {/* Top section: step indicators */}
      <div className="flex-shrink-0 pt-12 pb-4 flex justify-center">
        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                i === step ? "w-8 bg-primary" : i < step ? "w-2.5 bg-primary/40" : "w-2.5 bg-muted-foreground/15"
              )}
              layout
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          ))}
        </div>
      </div>

      {/* Middle section: content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            {/* Emoji icon with ring */}
            <motion.div
              className={cn(
                "relative w-32 h-32 rounded-[2.5rem] flex items-center justify-center mb-10",
                "bg-gradient-to-br", current.gradient,
                "ring-2", current.ring
              )}
              initial={{ rotate: -15, scale: 0.6 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            >
              {/* Animated glow */}
              <motion.div
                className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent"
                animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-6xl relative z-10 drop-shadow-sm">{current.emoji}</span>
            </motion.div>

            {/* Subtitle chip */}
            <motion.span
              className="inline-block px-4 py-1.5 rounded-full bg-primary/8 text-primary text-[10px] font-bold tracking-[0.12em] mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {current.subtitle}
            </motion.span>

            {/* Title */}
            <motion.h1
              className="text-[28px] font-extrabold text-foreground mb-3 tracking-tight leading-tight"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {current.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              className="text-muted-foreground text-[14px] leading-relaxed whitespace-pre-line max-w-[280px]"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {current.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section: buttons */}
      <div className="flex-shrink-0 pb-12 pt-4 flex flex-col items-center gap-3 px-8">
        <motion.button
          onClick={next}
          className={cn(
            "w-full max-w-[320px] flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-[15px]",
            "bg-primary text-primary-foreground",
            "shadow-lg shadow-primary/25",
            "hover:shadow-xl hover:shadow-primary/30 active:scale-[0.97]",
            "transition-all duration-200"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          whileTap={{ scale: 0.96 }}
        >
          {isLast ? "Get Started" : "Continue"}
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ArrowRight size={17} />
          </motion.div>
        </motion.button>

        {!isLast && (
          <motion.button
            onClick={onComplete}
            className="text-[12px] text-muted-foreground/50 hover:text-muted-foreground transition-colors duration-200 py-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            Skip intro
          </motion.button>
        )}

        {/* Step counter */}
        <motion.span
          className="text-[10px] text-muted-foreground/30 font-semibold tabular-nums mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {step + 1} / {steps.length}
        </motion.span>
      </div>
    </div>
  );
};

export default OnboardingFlow;
