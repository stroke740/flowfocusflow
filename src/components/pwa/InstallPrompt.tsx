import { Download, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { useState, useEffect } from "react";

export function InstallPrompt() {
  const { isInstallable, promptInstall, isInstalled } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session or already installed
    if (sessionStorage.getItem("pwa_prompt_dismissed") || isInstalled) {
      setDismissed(true);
      return;
    }

    // Show prompt after 30 seconds of use
    const timer = setTimeout(() => {
      if (isInstallable) setShow(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled]);

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShow(false);
    }
  };

  if (dismissed || !isInstallable || isInstalled) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-24 left-4 right-4 z-50 bg-card border border-border rounded-2xl p-4 shadow-lg"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm mb-1">Install FocusFlow</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Add to your home screen for quick access and offline use
              </p>
              <Button size="sm" onClick={handleInstall} className="w-full">
                Install App
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
