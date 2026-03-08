import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { format, subDays, isSameDay, eachDayOfInterval } from "date-fns";
import { Plus, Flame, Check, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Habit {
  id: string;
  name: string;
  emoji: string;
  completions: string[]; // ISO date strings
}

function getHabits(): Habit[] {
  try { return JSON.parse(localStorage.getItem("focusflow_habits") || "[]"); }
  catch { return []; }
}

function saveHabits(habits: Habit[]) {
  localStorage.setItem("focusflow_habits", JSON.stringify(habits));
}

const EMOJIS = ["💪", "📚", "🧘", "🏃", "💧", "🎯", "✍️", "🧠"];

interface HabitTrackerProps {
  open: boolean;
  onClose: () => void;
}

const HabitTracker = ({ open, onClose }: HabitTrackerProps) => {
  const [habits, setHabitsState] = useState<Habit[]>(getHabits());
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("💪");

  const today = format(new Date(), "yyyy-MM-dd");
  const last7 = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });

  const updateHabits = (h: Habit[]) => { setHabitsState(h); saveHabits(h); };

  const toggleToday = (habitId: string) => {
    const updated = habits.map((h) => {
      if (h.id !== habitId) return h;
      const has = h.completions.includes(today);
      return { ...h, completions: has ? h.completions.filter((d) => d !== today) : [...h.completions, today] };
    });
    updateHabits(updated);
  };

  const addHabit = () => {
    if (!newName.trim()) return;
    updateHabits([...habits, { id: crypto.randomUUID(), name: newName, emoji: newEmoji, completions: [] }]);
    setNewName(""); setNewEmoji("💪"); setAdding(false);
  };

  const deleteHabit = (id: string) => updateHabits(habits.filter((h) => h.id !== id));

  const getStreak = (habit: Habit): number => {
    let count = 0;
    let day = new Date();
    if (!habit.completions.includes(format(day, "yyyy-MM-dd"))) {
      day = subDays(day, 1);
    }
    while (habit.completions.includes(format(day, "yyyy-MM-dd"))) {
      count++; day = subDays(day, 1);
    }
    return count;
  };

  const allDoneToday = habits.length > 0 && habits.every((h) => h.completions.includes(today));

  if (!open) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="px-5 py-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-warning" />
            <h2 className="text-lg font-bold">Habits</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><X size={20} /></button>
        </div>

        {allDoneToday && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-3 rounded-xl bg-success/10 border border-success/20 text-center"
          >
            <p className="text-[13px] font-semibold text-success">🎉 All habits completed today!</p>
          </motion.div>
        )}

        <div className="space-y-3 mb-6">
          {habits.map((habit) => {
            const streak = getStreak(habit);
            const doneToday = habit.completions.includes(today);

            return (
              <motion.div
                key={habit.id}
                layout
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{habit.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate">{habit.name}</p>
                    {streak > 0 && (
                      <p className="text-[10px] text-warning flex items-center gap-1">
                        <Flame size={10} /> {streak} day streak
                      </p>
                    )}
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => toggleToday(habit.id)}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      doneToday ? "bg-success text-success-foreground" : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {doneToday ? <Check size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/20" />}
                  </motion.button>
                </div>

                {/* 7-day dots */}
                <div className="flex items-center gap-1.5">
                  {last7.map((day, i) => {
                    const done = habit.completions.includes(format(day, "yyyy-MM-dd"));
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className={cn(
                          "w-full aspect-square rounded-lg transition-colors",
                          done ? "bg-success/30" : "bg-muted"
                        )} />
                        <span className="text-[8px] text-muted-foreground">{format(day, "E")[0]}</span>
                      </div>
                    );
                  })}
                </div>

                <button onClick={() => deleteHabit(habit.id)} className="text-[10px] text-muted-foreground hover:text-destructive mt-2 transition-colors">
                  Remove
                </button>
              </motion.div>
            );
          })}
        </div>

        {adding ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/20 bg-card p-4 space-y-3">
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-lg", newEmoji === e ? "bg-primary/10 ring-2 ring-primary" : "bg-muted")}
                >
                  {e}
                </button>
              ))}
            </div>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Habit name" className="text-sm" />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              <Button size="sm" onClick={addHabit}>Add Habit</Button>
            </div>
          </motion.div>
        ) : (
          <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={() => setAdding(true)}>
            <Plus size={14} /> Add Habit
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default HabitTracker;
