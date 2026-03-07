import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager at Stripe",
    initials: "SC",
    quote: "FocusFlow replaced three apps for me. The Smart Today View alone saves me 30 minutes every morning.",
    stars: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Freelance Designer",
    initials: "MJ",
    quote: "I've tried every todo app. FocusFlow is the first one that actually stuck. The focus mode is a game-changer.",
    stars: 5,
  },
  {
    name: "Elena Rodriguez",
    role: "Engineering Lead at Vercel",
    initials: "ER",
    quote: "Our team switched to FocusFlow and our sprint completion rate went up 40%. The simplicity is the feature.",
    stars: 5,
  },
];

const stats = [
  { value: "50,000+", label: "tasks completed today" },
  { value: "4.9★", label: "average rating" },
  { value: "98%", label: "reminder delivery rate" },
];

const pressLogos = ["Product Hunt", "The Verge", "Lifehacker", "AppAdvice"];

const SocialProofSection = () => (
  <section id="social-proof" className="py-20 md:py-28">
    <div className="container">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          Loved by 50,000+ focused people
        </h2>
        <p className="text-muted-foreground text-lg">
          Join the productivity revolution.
        </p>
      </div>

      {/* Testimonials */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="bg-card rounded-xl border border-border p-6 shadow-sm"
          >
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: t.stars }).map((_, j) => (
                <Star key={j} size={14} className="fill-warning text-warning" />
              ))}
            </div>
            <p className="text-sm text-foreground mb-4 leading-relaxed">"{t.quote}"</p>
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {t.initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-12 mb-14">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Press logos */}
      <div className="flex items-center justify-center gap-8 flex-wrap opacity-50">
        {pressLogos.map((name) => (
          <span key={name} className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
            {name}
          </span>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProofSection;
