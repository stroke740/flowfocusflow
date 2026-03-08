import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const steps = [
  {
    icon: Sparkles,
    emoji: "🌱",
    title: "Welcome to FocusFlow",
    subtitle: "Your productivity companion",
    description: "Build better habits, one day at a time.\nLet's set up your daily routine in under a minute.",
    bg: "from-primary/12 via-primary/6 to-transparent",
    iconBg: "bg-primary/10",
    accent: "shadow-primary/20",
  },
  {
    icon: Target,
    emoji: "🎯",
    title: "Capture Everything",
    subtitle: "Never forget a task",
    description: "Quickly add tasks with natural language.\nSet priorities, due dates, and tags in one line.",
    bg: "from-success/12 via-success/6 to-transparent",
    iconBg: "bg-success/10",
    accent: "shadow-success/20",
  },
  {
    icon: Zap,
    emoji: "⚡",
    title: "Stay Focused",
    subtitle: "Deep work, made easy",
    description: "Use Focus Timer to power through tasks.\nTrack streaks and celebrate your progress.",
    bg: "from-warning/12 via-warning/6 to-transparent",
    iconBg: "bg-warning/10",
    accent: "shadow-warning/20",
  },
  {
    icon: CheckCircle2,
    emoji: "🚀",
    title: "You're All Set!",
    subtitle: "Let's get productive",
    description: "Start adding tasks and build momentum.\nYour productivity journey begins now.",
    bg: "from-primary/12 via-primary/6 to-transparent",
    iconBg: "bg-primary/10",
    accent: "shadow-primary/20",
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Ambient background glow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`bg-${step}`}
          className={cn(
            "absolute inset-0 bg-gradient-to-b opacity-60",
            current.bg
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      </AnimatePresence>

      {/* Decorative circles */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-3xl"
        animate={{
          x: [0, 30, -20, 0],
          y: [0, -20, 30, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: "-10%", right: "-15%" }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-primary/[0.02] blur-3xl"
        animate={{
          x: [0, -20, 30, 0],
          y: [0, 30, -20, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ bottom: "-5%", left: "-10%" }}
      />

      {/* Step indicators */}
      <div className="absolute top-10 flex items-center gap-2.5">
        {steps.map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              i === step
                ? "w-10 bg-primary"
                : i < step
                ? "w-3 bg-primary/50"
                : "w-3 bg-muted-foreground/15"
            )}
            layout
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col items-center text-center px-8 max-w-sm"
        >
          {/* Icon container with glow */}
          <motion.div
            className={cn(
              "relative w-28 h-28 rounded-[2rem] flex items-center justify-center mb-10",
              current.iconBg
            )}
            initial={{ rotate: -12, scale: 0.7 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            {/* Glow ring */}
            <motion.div
              className={cn("absolute inset-[-4px] rounded-[2.25rem] bg-gradient-to-br opacity-40", current.bg)}
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="text-5xl relative z-10">{current.emoji}</span>
          </motion.div>

          {/* Subtitle chip */}
          <motion.span
            className="inline-block px-3.5 py-1 rounded-full bg-primary/8 text-primary text-[11px] font-semibold tracking-wide uppercase mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            {current.subtitle}
          </motion.span>

          {/* Title */}
          <motion.h1
            className="text-[26px] font-bold text-foreground mb-3 tracking-tight leading-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            {current.title}
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-muted-foreground text-[14px] leading-relaxed whitespace-pre-line max-w-[280px]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {current.description}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* CTA Button */}
      <motion.button
        onClick={next}
        className={cn(
          "mt-14 flex items-center justify-center gap-2.5 px-12 py-4 rounded-2xl font-semibold text-[15px]",
          "bg-primary text-primary-foreground",
          "shadow-lg shadow-primary/25",
          "hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.97]",
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

      {/* Skip */}
      {!isLast && (
        <motion.button
          onClick={onComplete}
          className="mt-5 text-[12px] text-muted-foreground/60 hover:text-muted-foreground transition-colors duration-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          Skip intro
        </motion.button>
      )}

      {/* Step counter */}
      <motion.div
        className="absolute bottom-8 text-[11px] text-muted-foreground/40 font-medium tabular-nums"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {step + 1} of {steps.length}
      </motion.div>
    </div>
  );
};

export default OnboardingFlow;
