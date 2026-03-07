import { motion } from "framer-motion";
import { Zap, Target, Bell, FolderOpen, Repeat, Moon } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Capture",
    desc: "Add tasks with natural language in under 2 seconds. Type 'Call dentist Thursday 3pm' and FocusFlow handles the rest.",
  },
  {
    icon: Target,
    title: "Smart Today View",
    desc: "AI surfaces your highest-priority tasks for the day, balancing deadlines, energy, and focus time.",
  },
  {
    icon: Bell,
    title: "Reliable Reminders",
    desc: "Push + email reminders that actually arrive. Set once, forget about tracking.",
  },
  {
    icon: FolderOpen,
    title: "Projects & Lists",
    desc: "Group tasks into color-coded projects. Track progress with visual completion bars.",
  },
  {
    icon: Repeat,
    title: "Recurring Tasks",
    desc: "Flexible recurrence: daily, weekly, monthly, custom intervals — all powered by natural language.",
  },
  {
    icon: Moon,
    title: "Focus Mode",
    desc: "Block distractions and work on one task at a time with ambient audio and Pomodoro timer.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: "easeOut" },
  }),
};

const FeaturesSection = () => (
  <section id="features" className="py-20 md:py-28 bg-surface-alt">
    <div className="container">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Everything you need, nothing you don't
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Powerful features that stay out of your way until you need them.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={cardVariants}
            className="bg-card rounded-xl border border-border p-6 shadow-sm hover:-translate-y-1 hover:shadow-layered transition-all duration-200 group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <f.icon size={20} className="text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
