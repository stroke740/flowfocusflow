import { useEffect } from "react";
import { usePreferences, useUpdatePreferences } from "@/hooks/use-preferences";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Moon, Sun, Monitor, Type, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENT_COLORS = [
  { label: "Indigo", value: "#4F46E5" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Orange", value: "#f97316" },
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
    <div className="space-y-8">
      {/* Theme */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Theme</Label>
        <p className="text-xs text-muted-foreground">Choose how FocusFlow looks to you.</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: "light", icon: Sun, label: "Light", preview: "bg-white border-border" },
            { id: "dark", icon: Moon, label: "Dark", preview: "bg-[#1a1d2b] border-[#2a2d3e]" },
            { id: "system", icon: Monitor, label: "System", preview: "bg-gradient-to-r from-white to-[#1a1d2b] border-border" },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => update("theme", t.id)}
              className={cn(
                "flex flex-col items-center gap-2.5 px-3 py-4 rounded-xl border text-sm font-medium transition-all",
                prefs.theme === t.id
                  ? "border-primary bg-primary/5 text-primary ring-1 ring-primary/20"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className={cn("w-full h-8 rounded-lg border", t.preview)} />
              <div className="flex items-center gap-1.5">
                <t.icon size={14} />
                {t.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Accent Color</Label>
        <p className="text-xs text-muted-foreground">Pick a color for highlights and interactive elements.</p>
        <div className="flex gap-2.5 flex-wrap">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => update("accent_color", c.value)}
              className={cn(
                "w-10 h-10 rounded-full border-2 transition-all hover:scale-110 relative group",
                prefs.accent_color === c.value ? "border-foreground scale-110 shadow-md" : "border-transparent"
              )}
              style={{ backgroundColor: c.value }}
              title={c.label}
            >
              {prefs.accent_color === c.value && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow-sm">✓</span>
              )}
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Visual extras */}
      <div className="space-y-3 pt-2">
        <Label className="text-sm font-semibold">Visual Preferences</Label>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
            <div>
              <Label className="text-sm font-medium">Compact Mode</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Reduce spacing for denser task lists.</p>
            </div>
            <Switch checked={false} onCheckedChange={() => toast.info("Coming soon!")} />
          </div>
          <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
            <div>
              <Label className="text-sm font-medium">Animations</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Enable smooth transitions and effects.</p>
            </div>
            <Switch checked={true} onCheckedChange={() => toast.info("Coming soon!")} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSection;
