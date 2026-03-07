import { usePreferences, useUpdatePreferences } from "@/hooks/use-preferences";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const TaskSettingsSection = () => {
  const { data: prefs, isLoading } = usePreferences();
  const updatePrefs = useUpdatePreferences();

  const update = async (key: string, value: any) => {
    try {
      await updatePrefs.mutateAsync({ [key]: value } as any);
    } catch {
      toast.error("Failed to save setting");
    }
  };

  if (isLoading || !prefs) {
    return <div className="animate-pulse space-y-4"><div className="h-10 bg-muted rounded-xl" /><div className="h-10 bg-muted rounded-xl" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Start of Week */}
      <SettingRow
        label="Start of Week"
        description="Choose which day your week begins on."
      >
        <div className="flex gap-2">
          {([
            { id: "monday", label: "Monday" },
            { id: "sunday", label: "Sunday" },
            { id: "saturday", label: "Saturday" },
          ] as const).map((d) => (
            <button
              key={d.id}
              onClick={() => update("start_of_week", d.id)}
              className={cn(
                "flex-1 py-2 rounded-xl border text-sm font-medium transition-colors",
                prefs.start_of_week === d.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </SettingRow>

      {/* Default Priority */}
      <SettingRow
        label="Default Priority"
        description="Priority assigned to new tasks by default."
      >
        <div className="flex gap-1.5">
          {([
            { id: "p1", label: "🔴 P1", name: "Urgent" },
            { id: "p2", label: "🟠 P2", name: "High" },
            { id: "p3", label: "🟡 P3", name: "Medium" },
            { id: "p4", label: "⚪ P4", name: "Low" },
          ] as const).map((p) => (
            <button
              key={p.id}
              onClick={() => update("task_input_position", p.id)}
              className={cn(
                "flex-1 py-2 rounded-xl border text-xs font-medium transition-colors text-center",
                prefs.task_input_position === p.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              <span className="block text-base leading-none mb-0.5">{p.label.split(" ")[0]}</span>
              <span className="text-[10px] opacity-70">{p.name}</span>
            </button>
          ))}
        </div>
      </SettingRow>

      {/* When task is completed */}
      <SettingRow
        label="When Task is Completed"
        description="What happens to tasks after completion."
      >
        <Select value={prefs.completed_task_behavior} onValueChange={(v) => update("completed_task_behavior", v)}>
          <SelectTrigger className="w-full rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="move_bottom">Move to bottom of list</SelectItem>
            <SelectItem value="hide">Hide immediately</SelectItem>
            <SelectItem value="keep">Keep in place (with strikethrough)</SelectItem>
            <SelectItem value="fade_after_delay">Fade away after 2 seconds</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>

      {/* Default reminder */}
      <SettingRow
        label="Default Reminder"
        description={`Remind ${prefs.reminder_default_minutes} minutes before due.`}
      >
        <div className="pt-1">
          <Slider
            value={[prefs.reminder_default_minutes]}
            onValueChange={([v]) => update("reminder_default_minutes", v)}
            min={0}
            max={1440}
            step={15}
            className="w-full"
          />
          <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
            <span>None</span>
            <span>15m</span>
            <span>1h</span>
            <span>4h</span>
            <span>1 day</span>
          </div>
        </div>
      </SettingRow>

      {/* Toggles */}
      <div className="space-y-4 pt-2">
        <ToggleRow
          label="Auto-complete Parent Task"
          description="Automatically complete parent when all subtasks are done."
          checked={prefs.auto_complete_subtasks}
          onChange={(v) => update("auto_complete_subtasks", v)}
        />
        <ToggleRow
          label="Sound Effects"
          description="Play a sound on task completion and timer events."
          checked={prefs.sound_effects}
          onChange={(v) => update("sound_effects", v)}
        />
        <ToggleRow
          label="Confetti Celebrations"
          description="Show confetti every 5 completed tasks."
          checked={true}
          onChange={() => toast.info("This is always on — you deserve the joy!")}
        />
      </div>
    </div>
  );
};

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
      <div className="min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export default TaskSettingsSection;
