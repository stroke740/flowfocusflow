import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Star } from "lucide-react";
import { motion } from "framer-motion";
import HeroMockup from "./HeroMockup";

const wordVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.4, ease: "easeOut" as const },
  }),
};

const HeroSection = () => {
  const headline = "Your todo list, finally under control.";
  const words = headline.split(" ");

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center mb-12">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            {words.map((word, i) => (
              <motion.span
                key={i}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={wordVariants}
                className="inline-block mr-[0.3em]"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            FocusFlow brings radical clarity to how you capture, prioritize, and
            complete tasks — beautifully simple, deeply powerful.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4"
          >
            <Button
              size="lg"
              className="rounded-full h-[52px] px-8 text-base font-semibold hover:scale-[1.02] hover:shadow-layered-hover transition-all duration-200"
              asChild
            >
              <Link to="/signup">Get Started Free</Link>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full h-[52px] px-8 text-base font-medium gap-2"
            >
              <Play size={18} className="fill-current" />
              Watch 90s Demo
            </Button>
          </motion.div>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-muted-foreground mb-8"
          >
            Free forever. No credit card required. Works on all devices.
          </motion.p>

          {/* Trust signals */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center justify-center gap-6 text-sm text-muted-foreground flex-wrap"
          >
            <span className="flex items-center gap-1">
              <Star size={14} className="fill-warning text-warning" />
              4.9★ App Store
            </span>
            <span className="hidden sm:inline text-border">|</span>
            <span>50,000+ users</span>
            <span className="hidden sm:inline text-border">|</span>
            <span>Featured by Product Hunt</span>
          </motion.div>
        </div>

        {/* Product mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <HeroMockup />
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
