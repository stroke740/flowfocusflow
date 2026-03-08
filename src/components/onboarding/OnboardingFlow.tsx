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
    description: "Build better habits, one day at a time.\nLet's set up your daily routine in under a minute.",
    bg: "from-primary/10 to-primary/5",
  },
  {
    icon: Target,
    emoji: "🎯",
    title: "Capture Everything",
    description: "Quickly add tasks with natural language.\nSet priorities, due dates, and tags in one line.",
    bg: "from-success/10 to-success/5",
  },
  {
    icon: Zap,
    emoji: "⚡",
    title: "Stay Focused",
    description: "Use Focus Timer to power through tasks.\nTrack streaks and celebrate your progress.",
    bg: "from-warning/10 to-warning/5",
  },
  {
    icon: CheckCircle2,
    emoji: "🚀",
    title: "You're All Set!",
    description: "Start adding tasks and build momentum.\nYour productivity journey begins now.",
    bg: "from-primary/10 to-primary/5",
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
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Step indicators */}
      <div className="absolute top-8 flex items-center gap-2">
        {steps.map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/40" : "w-2 bg-muted-foreground/20"
            )}
            layout
          />
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center px-8 max-w-sm"
        >
          {/* Icon */}
          <motion.div
            className={cn(
              "w-24 h-24 rounded-3xl flex items-center justify-center mb-8 bg-gradient-to-br",
              current.bg
            )}
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
          >
            <span className="text-4xl">{current.emoji}</span>
          </motion.div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-3 font-heading">
            {current.title}
          </h1>

          {/* Description */}
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
            {current.description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* CTA Button */}
      <motion.button
        onClick={next}
        className={cn(
          "mt-12 flex items-center justify-center gap-2 px-10 py-4 rounded-2xl font-semibold text-sm",
          "bg-primary text-primary-foreground shadow-lg",
          "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        )}
        whileTap={{ scale: 0.96 }}
      >
        {isLast ? "Get Started" : "Continue"}
        <ArrowRight size={16} />
      </motion.button>

      {/* Skip */}
      {!isLast && (
        <button
          onClick={onComplete}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip intro
        </button>
      )}
    </div>
  );
};

export default OnboardingFlow;
