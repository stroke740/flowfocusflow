import { motion } from "framer-motion";

interface Props {
  completed: number;
  total: number;
}

const DailyProgressRing = ({ completed, total }: Props) => {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const radius = 40;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center py-4">
      <div className="relative w-[100px] h-[100px]">
        <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={stroke}
          />
          <motion.circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{pct}%</span>
          <span className="text-[11px] text-muted-foreground">
            {completed}/{total} today
          </span>
        </div>
      </div>
    </div>
  );
};

export default DailyProgressRing;
