import { motion } from "framer-motion";
import { Check } from "lucide-react";

const tasks = [
  { title: "Review Q1 marketing plan", time: "9:00 AM", done: false },
  { title: "Call with design team", time: "10:30 AM", done: false },
  { title: "Update project roadmap", time: "1:00 PM", completing: true },
  { title: "Send weekly report", time: "3:00 PM", done: true },
];

const TaskRow = ({
  title,
  time,
  done,
  completing,
  delay,
}: {
  title: string;
  time: string;
  done?: boolean;
  completing?: boolean;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors"
  >
    <motion.div
      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
        done || completing
          ? "bg-primary border-primary"
          : "border-border"
      }`}
      animate={
        completing
          ? { scale: [1, 1.2, 1], borderColor: "hsl(243,75%,59%)", backgroundColor: "hsl(243,75%,59%)" }
          : {}
      }
      transition={{ delay: 2, duration: 0.4, repeat: Infinity, repeatDelay: 5 }}
    >
      {(done || completing) && <Check size={12} className="text-primary-foreground" strokeWidth={3} />}
    </motion.div>
    <div className="flex-1 min-w-0">
      <p
        className={`text-sm font-medium truncate ${
          done ? "line-through text-muted-foreground" : "text-foreground"
        }`}
      >
        {title}
      </p>
    </div>
    <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>
  </motion.div>
);

const HeroMockup = () => (
  <div className="relative w-full max-w-2xl mx-auto">
    {/* Desktop frame */}
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.7 }}
      className="bg-card rounded-2xl border border-border shadow-layered overflow-hidden"
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/60" />
          <div className="w-3 h-3 rounded-full bg-warning/60" />
          <div className="w-3 h-3 rounded-full bg-success/60" />
        </div>
        <span className="text-xs text-muted-foreground ml-2 font-medium">Today — 4 tasks</span>
      </div>
      {/* Tasks */}
      <div className="p-2">
        {tasks.map((t, i) => (
          <TaskRow key={t.title} {...t} delay={0.8 + i * 0.12} />
        ))}
      </div>
    </motion.div>

    {/* Mobile frame overlay */}
    <motion.div
      initial={{ opacity: 0, x: 40, y: 20 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ delay: 1, duration: 0.7 }}
      className="absolute -right-4 -bottom-4 w-40 bg-card rounded-2xl border border-border shadow-layered overflow-hidden hidden sm:block"
    >
      <div className="px-3 py-2 border-b border-border">
        <span className="text-[10px] font-semibold text-foreground">Today</span>
      </div>
      <div className="p-1.5 space-y-1">
        {tasks.slice(0, 3).map((t) => (
          <div key={t.title} className="flex items-center gap-1.5 px-1.5 py-1">
            <div
              className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                t.done || t.completing ? "bg-primary border-primary" : "border-border"
              }`}
            >
              {(t.done || t.completing) && (
                <Check size={7} className="text-primary-foreground" strokeWidth={3} />
              )}
            </div>
            <p className="text-[9px] text-foreground truncate">{t.title}</p>
          </div>
        ))}
      </div>
    </motion.div>
  </div>
);

export default HeroMockup;
