import { useEffect } from "react";
import { usePreferences, useUpdatePreferences } from "@/hooks/use-preferences";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENT_COLORS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Emerald", value: "#10b981" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Purple", value: "#a855f7" },
  { label: "Orange", value: "#f97316" },
];

const PreferencesSection = () => {
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
      // system
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
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors",
                prefs.theme === t.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Accent Color</Label>
        <div className="flex gap-2 flex-wrap">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => update("accent_color", c.value)}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                prefs.accent_color === c.value ? "border-foreground scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
        </div>
      </div>

      {/* Start of week */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Start of Week</Label>
        <Select value={prefs.start_of_week} onValueChange={(v) => update("start_of_week", v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monday">Monday</SelectItem>
            <SelectItem value="sunday">Sunday</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task input position */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Task Input Position</Label>
        <Select value={prefs.task_input_position} onValueChange={(v) => update("task_input_position", v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top of list</SelectItem>
            <SelectItem value="bottom">Bottom of list</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Completed task behavior */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Completed Tasks</Label>
        <Select value={prefs.completed_task_behavior} onValueChange={(v) => update("completed_task_behavior", v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="move_bottom">Move to bottom</SelectItem>
            <SelectItem value="hide">Hide immediately</SelectItem>
            <SelectItem value="keep">Keep in place</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Language</Label>
        <Select value={prefs.language} onValueChange={(v) => update("language", v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Español</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
            <SelectItem value="de">Deutsch</SelectItem>
            <SelectItem value="ja">日本語</SelectItem>
            <SelectItem value="pt">Português</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Language support coming soon — this saves your preference.</p>
      </div>

      {/* Auto-complete subtasks */}
      <div className="flex items-center justify-between max-w-sm">
        <div>
          <Label className="text-sm font-semibold">Auto-complete Subtasks</Label>
          <p className="text-xs text-muted-foreground">Complete parent when all subtasks are done</p>
        </div>
        <Switch checked={prefs.auto_complete_subtasks} onCheckedChange={(v) => update("auto_complete_subtasks", v)} />
      </div>

      {/* Sound effects */}
      <div className="flex items-center justify-between max-w-sm">
        <Label className="text-sm font-semibold">Sound Effects</Label>
        <Switch checked={prefs.sound_effects} onCheckedChange={(v) => update("sound_effects", v)} />
      </div>
    </div>
  );
};

export default PreferencesSection;
