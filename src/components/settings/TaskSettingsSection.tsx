import { usePreferences, useUpdatePreferences } from "@/hooks/use-preferences";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="space-y-8 max-w-md">
      {/* Start of Week */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Start of Week</Label>
        <p className="text-xs text-muted-foreground">Choose which day your week begins.</p>
        <div className="flex gap-2">
          {([
            { id: "monday", label: "Monday" },
            { id: "sunday", label: "Sunday" },
          ] as const).map((d) => (
            <button
              key={d.id}
              onClick={() => update("start_of_week", d.id)}
              className={cn(
                "flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors",
                prefs.start_of_week === d.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Default Priority */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Default Priority</Label>
        <p className="text-xs text-muted-foreground">Priority assigned to new tasks by default.</p>
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
                "flex-1 py-2 rounded-xl border text-xs font-medium transition-colors",
                prefs.task_input_position === p.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-complete subtasks */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">Auto-complete Parent Task</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Automatically complete parent task when all subtasks are done.</p>
        </div>
        <Switch checked={prefs.auto_complete_subtasks} onCheckedChange={(v) => update("auto_complete_subtasks", v)} />
      </div>

      {/* Completed task behavior */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">When Task is Completed</Label>
        <p className="text-xs text-muted-foreground">What happens to tasks after completion.</p>
        <Select value={prefs.completed_task_behavior} onValueChange={(v) => update("completed_task_behavior", v)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="move_bottom">Move to bottom of list</SelectItem>
            <SelectItem value="hide">Hide immediately</SelectItem>
            <SelectItem value="keep">Keep in place</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sound effects */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">Sound Effects</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Play sounds on task completion and actions.</p>
        </div>
        <Switch checked={prefs.sound_effects} onCheckedChange={(v) => update("sound_effects", v)} />
      </div>
    </div>
  );
};

export default TaskSettingsSection;
