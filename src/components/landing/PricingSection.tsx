import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    desc: "For individuals getting started",
    features: [
      "Up to 5 projects",
      "50 tasks/month",
      "Basic reminders",
      "2 integrations",
    ],
    cta: "Get Started Free",
    highlighted: false,
  },
  {
    name: "Pro",
    monthlyPrice: 6,
    yearlyPrice: 48,
    desc: "For power users who want it all",
    features: [
      "Unlimited projects & tasks",
      "AI scheduling",
      "Focus Mode",
      "Recurring tasks",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Team",
    monthlyPrice: 12,
    yearlyPrice: 96,
    desc: "For teams that ship together",
    features: [
      "All Pro features",
      "Shared projects",
      "Comments & activity log",
      "Admin controls",
      "SSO & security",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const PricingSection = () => {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-20 md:py-28 bg-surface-alt">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Start free, upgrade when you're ready.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-card border border-border rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                !annual ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                annual ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Annual
              <AnimatePresence>
                {annual && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      Save 33%
                    </Badge>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className={`rounded-xl border p-6 flex flex-col ${
                plan.highlighted
                  ? "border-primary bg-card shadow-layered relative"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlighted && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  Most Popular
                </Badge>
              )}
              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-extrabold">
                  ${annual ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice}
                </span>
                {plan.monthlyPrice > 0 && (
                  <span className="text-muted-foreground text-sm">
                    /{annual ? "mo (billed yearly)" : "month"}
                  </span>
                )}
                {plan.monthlyPrice === 0 && (
                  <span className="text-muted-foreground text-sm"> / forever</span>
                )}
              </div>
              <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={16} className="text-success mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`rounded-full w-full ${plan.highlighted ? "" : ""}`}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
