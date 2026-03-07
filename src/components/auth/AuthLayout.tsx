import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  step?: { current: number; total: number };
}

const AuthLayout = ({ children, title, subtitle, step }: AuthLayoutProps) => (
  <div className="min-h-screen flex bg-background">
    {/* Left: form */}
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[440px]"
      >
        {step && (
          <div className="flex items-center gap-2 mb-6">
            {Array.from({ length: step.total }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < step.current ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-2">
              Step {step.current} of {step.total}
            </span>
          </div>
        )}

        <div className="mb-8">
          <a href="/" className="text-lg font-bold tracking-tight mb-6 inline-block">
            Focus<span className="text-primary">Flow</span>
          </a>
          <h1 className="text-2xl font-bold tracking-tight mb-2">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
        </div>

        {children}
      </motion.div>
    </div>

    {/* Right: illustration (desktop only) */}
    <div className="hidden lg:flex flex-1 bg-surface-alt items-center justify-center p-12">
      <div className="max-w-sm">
        <div className="bg-card rounded-2xl border border-border shadow-layered p-6 mb-6">
          <h3 className="font-semibold mb-4 text-sm">Why FocusFlow?</h3>
          {[
            "Capture tasks in under 2 seconds",
            "AI-powered smart prioritization",
            "Focus mode with Pomodoro timer",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3 mb-3">
              <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center mt-0.5 flex-shrink-0">
                <Check size={12} className="text-success" />
              </div>
              <p className="text-sm text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Trusted by 50,000+ professionals worldwide
        </p>
      </div>
    </div>
  </div>
);

export default AuthLayout;
