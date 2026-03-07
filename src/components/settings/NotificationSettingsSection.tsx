import { usePreferences, useUpdatePreferences } from "@/hooks/use-preferences";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const REMINDER_OPTIONS = [
  { value: "15", label: "15 minutes before" },
  { value: "60", label: "1 hour before" },
  { value: "1440", label: "1 day before" },
];

const NotificationSettingsSection = () => {
  const { data: prefs, isLoading } = usePreferences();
  const updatePrefs = useUpdatePreferences();
  const [browserPermission, setBrowserPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  const update = async (key: string, value: any) => {
    try {
      await updatePrefs.mutateAsync({ [key]: value } as any);
    } catch {
      toast.error("Failed to save setting");
    }
  };

  const requestBrowserPermission = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Browser notifications are not supported");
      return;
    }
    const result = await Notification.requestPermission();
    setBrowserPermission(result);
    if (result === "granted") {
      await update("push_notifications", true);
      toast.success("Browser notifications enabled");
      new Notification("FocusFlow", { body: "Notifications are now enabled! 🎉" });
    } else {
      toast.error("Permission denied. You can enable it in browser settings.");
    }
  };

  if (isLoading || !prefs) {
    return <div className="animate-pulse space-y-4"><div className="h-10 bg-muted rounded-xl" /><div className="h-10 bg-muted rounded-xl" /></div>;
  }

  return (
    <div className="space-y-8 max-w-md">
      {/* Browser Notifications */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Browser Notifications</Label>
        <p className="text-xs text-muted-foreground">Get notified about due tasks and reminders.</p>

        {browserPermission === "granted" ? (
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-success/5">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-success" />
              <span className="text-sm font-medium">Notifications enabled</span>
            </div>
            <Switch checked={prefs.push_notifications} onCheckedChange={(v) => update("push_notifications", v)} />
          </div>
        ) : browserPermission === "denied" ? (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-border bg-destructive/5">
            <BellOff size={16} className="text-destructive" />
            <div className="flex-1">
              <span className="text-sm font-medium text-destructive">Notifications blocked</span>
              <p className="text-xs text-muted-foreground">Enable them in your browser settings.</p>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={requestBrowserPermission} className="gap-2">
            <Bell size={14} />
            Enable Browser Notifications
          </Button>
        )}
      </div>

      {/* In-app Notifications */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">In-App Notifications</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Show notification bell and badge count.</p>
        </div>
        <Switch checked={prefs.in_app_notifications} onCheckedChange={(v) => update("in_app_notifications", v)} />
      </div>

      {/* Default Reminder */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Default Reminder</Label>
        <p className="text-xs text-muted-foreground">When to remind you before a task is due.</p>
        <div className="flex gap-2">
          {REMINDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update("reminder_default_minutes", Number(opt.value))}
              className={cn(
                "flex-1 py-2 rounded-xl border text-xs font-medium transition-colors",
                String(prefs.reminder_default_minutes) === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overdue Alerts */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-semibold">Overdue Alerts</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Get notified when tasks become overdue.</p>
        </div>
        <Switch checked={prefs.overdue_alerts} onCheckedChange={(v) => update("overdue_alerts", v)} />
      </div>

      {/* Quiet Hours */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Quiet Hours</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Silence all notifications during set hours.</p>
          </div>
          <Switch checked={prefs.quiet_hours_enabled} onCheckedChange={(v) => update("quiet_hours_enabled", v)} />
        </div>

        {prefs.quiet_hours_enabled && (
          <div className="flex items-center gap-3 pl-1">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input type="time" value={prefs.quiet_hours_start} onChange={(e) => update("quiet_hours_start", e.target.value)} className="w-28 h-9" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input type="time" value={prefs.quiet_hours_end} onChange={(e) => update("quiet_hours_end", e.target.value)} className="w-28 h-9" />
            </div>
          </div>
        )}
      </div>

      {/* Daily Digest */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-semibold">Daily Digest</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Morning summary of your tasks.</p>
          </div>
          <Switch checked={prefs.daily_digest} onCheckedChange={(v) => update("daily_digest", v)} />
        </div>

        {prefs.daily_digest && (
          <div className="space-y-1 pl-1">
            <Label className="text-xs text-muted-foreground">Digest Time</Label>
            <Input
              type="time"
              value={prefs.daily_digest_time}
              onChange={(e) => update("daily_digest_time", e.target.value)}
              className="w-32 h-9"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettingsSection;
