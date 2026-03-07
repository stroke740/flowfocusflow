import { usePreferences, useUpdatePreferences } from "@/hooks/use-preferences";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, BellOff, Clock, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const REMINDER_OPTIONS = [
  { value: 5, label: "5 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 1440, label: "1 day" },
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
    <div className="space-y-8">
      {/* Browser Notifications */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Browser Notifications</Label>
        <p className="text-xs text-muted-foreground">Get notified about due tasks and reminders.</p>

        {browserPermission === "granted" ? (
          <div className="flex items-center justify-between p-4 rounded-xl border border-success/30 bg-success/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
                <Bell size={16} className="text-success" />
              </div>
              <div>
                <span className="text-sm font-medium">Notifications enabled</span>
                <p className="text-[11px] text-muted-foreground">You'll receive browser alerts.</p>
              </div>
            </div>
            <Switch checked={prefs.push_notifications} onCheckedChange={(v) => update("push_notifications", v)} />
          </div>
        ) : browserPermission === "denied" ? (
          <div className="flex items-center gap-2.5 p-4 rounded-xl border border-destructive/30 bg-destructive/5">
            <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center">
              <BellOff size={16} className="text-destructive" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-medium text-destructive">Notifications blocked</span>
              <p className="text-[11px] text-muted-foreground">Enable them in your browser settings.</p>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={requestBrowserPermission} className="gap-2 rounded-xl">
            <Bell size={14} />
            Enable Browser Notifications
          </Button>
        )}
      </div>

      {/* Toggle settings */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Notification Types</Label>
        <div className="space-y-2">
          <ToggleCard
            label="In-App Notifications"
            description="Show notification bell and badge count."
            checked={prefs.in_app_notifications}
            onChange={(v) => update("in_app_notifications", v)}
          />
          <ToggleCard
            label="Overdue Alerts"
            description="Get notified when tasks become overdue."
            checked={prefs.overdue_alerts}
            onChange={(v) => update("overdue_alerts", v)}
          />
          <ToggleCard
            label="Email Reminders"
            description="Receive email notifications for upcoming tasks."
            checked={prefs.email_reminders}
            onChange={(v) => update("email_reminders", v)}
          />
        </div>
      </div>

      {/* Default Reminder */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Default Reminder Time</Label>
        <p className="text-xs text-muted-foreground">When to remind you before a task is due.</p>
        <div className="flex gap-1.5 flex-wrap">
          {REMINDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update("reminder_default_minutes", opt.value)}
              className={cn(
                "px-3 py-2 rounded-xl border text-xs font-medium transition-colors",
                prefs.reminder_default_minutes === opt.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2.5">
            <Moon size={16} className="text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">Quiet Hours</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Silence all notifications during set hours.</p>
            </div>
          </div>
          <Switch checked={prefs.quiet_hours_enabled} onCheckedChange={(v) => update("quiet_hours_enabled", v)} />
        </div>

        {prefs.quiet_hours_enabled && (
          <div className="flex items-center gap-3 pl-4 ml-4 border-l-2 border-border">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input type="time" value={prefs.quiet_hours_start} onChange={(e) => update("quiet_hours_start", e.target.value)} className="w-28 h-9 rounded-lg" />
            </div>
            <span className="text-muted-foreground mt-4">→</span>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input type="time" value={prefs.quiet_hours_end} onChange={(e) => update("quiet_hours_end", e.target.value)} className="w-28 h-9 rounded-lg" />
            </div>
          </div>
        )}
      </div>

      {/* Daily Digest */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4 py-3 px-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-2.5">
            <Clock size={16} className="text-muted-foreground" />
            <div>
              <Label className="text-sm font-medium">Daily Digest</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Morning summary of your tasks for the day.</p>
            </div>
          </div>
          <Switch checked={prefs.daily_digest} onCheckedChange={(v) => update("daily_digest", v)} />
        </div>

        {prefs.daily_digest && (
          <div className="pl-4 ml-4 border-l-2 border-border">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Digest Time</Label>
              <Input
                type="time"
                value={prefs.daily_digest_time}
                onChange={(e) => update("daily_digest_time", e.target.value)}
                className="w-32 h-9 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function ToggleCard({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) {
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

export default NotificationSettingsSection;
