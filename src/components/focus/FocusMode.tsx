import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, X, Timer, Coffee,
  Volume2, VolumeX, CheckCircle2, SkipForward,
  Clock, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Task } from "@/types/task";
import { Button } from "@/components/ui/button";
import { useTaskMutations } from "@/hooks/use-tasks";

const PRESETS = {
  pomodoro: { work: 25 * 60, break: 5 * 60, longBreak: 15 * 60, sessionsBeforeLong: 4, label: "25/5" },
  short: { work: 15 * 60, break: 3 * 60, longBreak: 10 * 60, sessionsBeforeLong: 4, label: "15/3" },
  long: { work: 50 * 60, break: 10 * 60, longBreak: 20 * 60, sessionsBeforeLong: 2, label: "50/10" },
};

type Phase = "work" | "break" | "longBreak";

interface FocusModeProps {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

// Persist sessions in localStorage
function getSessionHistory(): { date: string; minutes: number; sessions: number }[] {
  try {
    return JSON.parse(localStorage.getItem("focusflow_focus_sessions") || "[]");
  } catch { return []; }
}

function addSession(minutes: number) {
  const history = getSessionHistory();
  const today = new Date().toISOString().split("T")[0];
  const existing = history.find((h) => h.date === today);
  if (existing) {
    existing.minutes += minutes;
    existing.sessions += 1;
  } else {
    history.push({ date: today, minutes, sessions: 1 });
  }
  // Keep last 30 days
  const trimmed = history.slice(-30);
  localStorage.setItem("focusflow_focus_sessions", JSON.stringify(trimmed));
}

function getTodayStats() {
  const today = new Date().toISOString().split("T")[0];
  const history = getSessionHistory();
  return history.find((h) => h.date === today) || { minutes: 0, sessions: 0 };
}

const FocusMode = ({ open, onClose, task, tasks, onSelectTask }: FocusModeProps) => {
  const [preset, setPreset] = useState<keyof typeof PRESETS>("pomodoro");
  const [phase, setPhase] = useState<Phase>("work");
  const [timeLeft, setTimeLeft] = useState(PRESETS.pomodoro.work);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [todayStats, setTodayStats] = useState(getTodayStats());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { completeTask } = useTaskMutations();

  const config = PRESETS[preset];

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
          // Play sound
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
            // Log session
            addSession(Math.round(config.work / 60));
            setTodayStats(getTodayStats());
            
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

  const phaseColor = phase === "work" ? "primary" : "success";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6"
      >
        {/* Close */}
        <button
          onClick={() => { setRunning(false); onClose(); }}
          className="absolute top-6 right-6 p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
        >
          <X size={20} />
        </button>

        {/* Today stats pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6 px-4 py-2 rounded-xl bg-muted/50"
        >
          <div className="flex items-center gap-1.5 text-[12px]">
            <Clock size={12} className="text-muted-foreground" />
            <span className="text-muted-foreground">Today:</span>
            <span className="font-semibold">{todayStats.minutes}m</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px]">
            <Zap size={12} className="text-warning" />
            <span className="font-semibold">{todayStats.sessions}</span>
            <span className="text-muted-foreground">sessions</span>
          </div>
        </motion.div>

        {/* Presets */}
        <div className="flex gap-2 mb-6">
          {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                preset === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {PRESETS[p].label}
            </button>
          ))}
        </div>

        {/* Phase */}
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

        {/* Timer */}
        <div className="relative w-64 h-64 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="2.5" />
            <motion.circle
              cx="50" cy="50" r="45" fill="none"
              stroke={`hsl(var(--${phaseColor}))`}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={timeLeft}
              className="text-5xl font-bold tracking-tight font-mono"
              initial={false}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 0.3 }}
            >
              {formatTime(timeLeft)}
            </motion.span>
            <span className="text-xs text-muted-foreground mt-2">
              Session {sessionCount + 1}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={reset} className="p-3 rounded-xl hover:bg-muted text-muted-foreground transition-colors" title="Reset">
            <RotateCcw size={20} />
          </button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setRunning(!running)}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg",
              phase === "work"
                ? "bg-primary text-primary-foreground"
                : "bg-success text-success-foreground"
            )}
          >
            {running ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </motion.button>
          <button onClick={skipPhase} className="p-3 rounded-xl hover:bg-muted text-muted-foreground transition-colors" title="Skip">
            <SkipForward size={20} />
          </button>
        </div>

        {/* Sound */}
        <button
          onClick={() => setSoundOn(!soundOn)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          {soundOn ? "Sound on" : "Sound off"}
        </button>

        {/* Ambient Sounds */}
        <div className="w-full max-w-sm mb-6">
          <AmbientSoundsSection />
        </div>

        {/* Current task */}
        <div className="w-full max-w-sm">
          {task ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Working on</p>
                <p className="text-sm font-medium truncate">{task.title}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={handleCompleteTask}>
                <CheckCircle2 size={16} className="mr-1" /> Done
              </Button>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowTaskPicker(!showTaskPicker)}
              className="w-full px-4 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              + Link a task to this session
            </button>
          )}

          {showTaskPicker && !task && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-border bg-card"
            >
              {tasks.filter((t) => t.status === "active").slice(0, 10).map((t) => (
                <button
                  key={t.id}
                  onClick={() => { onSelectTask(t); setShowTaskPicker(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors border-b border-border last:border-0 truncate"
                >
                  {t.title}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Session dots */}
        <div className="flex items-center gap-2 mt-6">
          {Array.from({ length: config.sessionsBeforeLong }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
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
