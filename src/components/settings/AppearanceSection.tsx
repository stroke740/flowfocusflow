import { useEffect } from "react";
import { usePreferences, useUpdatePreferences } from "@/hooks/use-preferences";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENT_COLORS = [
  { label: "Indigo", value: "#4F46E5" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
];

const AppearanceSection = () => {
  const { data: prefs, isLoading } = usePreferences();
  const updatePrefs = useUpdatePreferences();

  const update = async (key: string, value: any) => {
    try {
      await updatePrefs.mutateAsync({ [key]: value } as any);
    } catch {
      toast.error("Failed to save preference");
    }
  };

  // Apply theme
  useEffect(() => {
    if (!prefs) return;
    const root = document.documentElement;
    if (prefs.theme === "dark") {
      root.classList.add("dark");
    } else if (prefs.theme === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  }, [prefs?.theme]);

  if (isLoading || !prefs) {
    return <div className="animate-pulse space-y-4"><div className="h-10 bg-muted rounded-xl" /><div className="h-10 bg-muted rounded-xl" /></div>;
  }

  return (
    <div className="space-y-8 max-w-md">
      {/* Theme */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Theme</Label>
        <p className="text-xs text-muted-foreground">Choose how FocusFlow looks to you.</p>
        <div className="flex gap-2">
          {([
            { id: "light", icon: Sun, label: "Light" },
            { id: "dark", icon: Moon, label: "Dark" },
            { id: "system", icon: Monitor, label: "System" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => update("theme", t.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-xl border text-sm font-medium transition-colors",
                prefs.theme === t.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <t.icon size={20} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Accent Color</Label>
        <p className="text-xs text-muted-foreground">Pick a color for highlights and interactive elements.</p>
        <div className="flex gap-3">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => update("accent_color", c.value)}
              className={cn(
                "w-10 h-10 rounded-full border-2 transition-all hover:scale-110 relative",
                prefs.accent_color === c.value ? "border-foreground scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c.value }}
              title={c.label}
            >
              {prefs.accent_color === c.value && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppearanceSection;
