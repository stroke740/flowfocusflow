import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, X, Timer, Coffee,
  Volume2, VolumeX, CheckCircle2, SkipForward,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { useTaskMutations } from "@/hooks/use-tasks";

const PRESETS = {
  pomodoro: { work: 25 * 60, break: 5 * 60, longBreak: 15 * 60, sessionsBeforeLong: 4 },
  short: { work: 15 * 60, break: 3 * 60, longBreak: 10 * 60, sessionsBeforeLong: 4 },
  long: { work: 50 * 60, break: 10 * 60, longBreak: 20 * 60, sessionsBeforeLong: 2 },
};

type Phase = "work" | "break" | "longBreak";

interface FocusModeProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

const FocusMode = ({ open, onClose, task, tasks, onSelectTask }: FocusModeProps) => {
  const [preset, setPreset] = useState<keyof typeof PRESETS>("pomodoro");
  const [phase, setPhase] = useState<Phase>("work");
  const [timeLeft, setTimeLeft] = useState(PRESETS.pomodoro.work);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { completeTask } = useTaskMutations();

  const config = PRESETS[preset];

  // Reset timer when preset changes
  useEffect(() => {
    setTimeLeft(config.work);
    setPhase("work");
    setRunning(false);
    setSessionCount(0);
  }, [preset]);

  // Timer tick
  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Phase complete
          if (soundOn) {
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = phase === "work" ? 800 : 600;
              gain.gain.value = 0.3;
              osc.start();
              setTimeout(() => { osc.stop(); ctx.close(); }, 300);
            } catch {}
          }

          if (phase === "work") {
            const newCount = sessionCount + 1;
            setSessionCount(newCount);
            if (newCount % config.sessionsBeforeLong === 0) {
              setPhase("longBreak");
              return config.longBreak;
            } else {
              setPhase("break");
              return config.break;
            }
          } else {
            setPhase("work");
            return config.work;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, phase, sessionCount, config, soundOn]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress = (() => {
    const total = phase === "work" ? config.work : phase === "break" ? config.break : config.longBreak;
    return ((total - timeLeft) / total) * 100;
  })();

  const reset = () => {
    setRunning(false);
    setTimeLeft(phase === "work" ? config.work : phase === "break" ? config.break : config.longBreak);
  };

  const skipPhase = () => {
    setRunning(false);
    if (phase === "work") {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);
      if (newCount % config.sessionsBeforeLong === 0) {
        setPhase("longBreak");
        setTimeLeft(config.longBreak);
      } else {
        setPhase("break");
        setTimeLeft(config.break);
      }
    } else {
      setPhase("work");
      setTimeLeft(config.work);
    }
  };

  const handleCompleteTask = async () => {
    if (task) {
      await completeTask.mutateAsync(task.id);
      onClose();
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center"
      >
        {/* Close button */}
        <button
          onClick={() => { setRunning(false); onClose(); }}
          className="absolute top-6 right-6 p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
        >
          <X size={20} />
        </button>

        {/* Preset selector */}
        <div className="flex gap-2 mb-8">
          {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                preset === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {p === "pomodoro" ? "25/5" : p === "short" ? "15/3" : "50/10"}
            </button>
          ))}
        </div>

        {/* Phase indicator */}
        <div className="flex items-center gap-2 mb-4">
          {phase === "work" ? (
            <Timer size={18} className="text-primary" />
          ) : (
            <Coffee size={18} className="text-success" />
          )}
          <span className={cn(
            "text-sm font-semibold uppercase tracking-wider",
            phase === "work" ? "text-primary" : "text-success"
          )}>
            {phase === "work" ? "Focus" : phase === "break" ? "Short Break" : "Long Break"}
          </span>
        </div>

        {/* Timer circle */}
        <div className="relative w-64 h-64 mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3"
            />
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={phase === "work" ? "hsl(var(--primary))" : "hsl(var(--success))"}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold tracking-tight font-mono">
              {formatTime(timeLeft)}
            </span>
            <span className="text-xs text-muted-foreground mt-2">
              Session {sessionCount + 1}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={reset}
            className="p-3 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
            title="Reset"
          >
            <RotateCcw size={20} />
          </button>

          <button
            onClick={() => setRunning(!running)}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg",
              phase === "work"
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-success text-success-foreground hover:bg-success/90"
            )}
          >
            {running ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>

          <button
            onClick={skipPhase}
            className="p-3 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
            title="Skip phase"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => setSoundOn(!soundOn)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          {soundOn ? "Sound on" : "Sound off"}
        </button>

        {/* Current task */}
        <div className="w-full max-w-sm">
          {task ? (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Working on</p>
                <p className="text-sm font-medium truncate">{task.title}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={handleCompleteTask}>
                <CheckCircle2 size={16} className="mr-1" /> Done
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowTaskPicker(!showTaskPicker)}
              className="w-full px-4 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              + Link a task to this session
            </button>
          )}

          {/* Task picker */}
          {showTaskPicker && !task && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-border bg-card">
              {tasks.filter((t) => t.status === "active").slice(0, 10).map((t) => (
                <button
                  key={t.id}
                  onClick={() => { onSelectTask(t); setShowTaskPicker(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors border-b border-border last:border-0 truncate"
                >
                  {t.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Session dots */}
        <div className="flex items-center gap-2 mt-8">
          {Array.from({ length: config.sessionsBeforeLong }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-colors",
                i < (sessionCount % config.sessionsBeforeLong) ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FocusMode;
