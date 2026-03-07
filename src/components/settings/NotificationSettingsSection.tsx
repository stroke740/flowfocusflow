import { usePreferences, useUpdatePreferences } from "@/hooks/use-preferences";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const NotificationSettingsSection = () => {
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
      {/* Channels */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Notification Channels</h3>

        <div className="flex items-center justify-between max-w-sm">
          <div>
            <Label className="text-sm">In-App Notifications</Label>
            <p className="text-xs text-muted-foreground">Bell icon and notification center</p>
          </div>
          <Switch checked={prefs.in_app_notifications} onCheckedChange={(v) => update("in_app_notifications", v)} />
        </div>

        <div className="flex items-center justify-between max-w-sm">
          <div>
            <Label className="text-sm">Push Notifications</Label>
            <p className="text-xs text-muted-foreground">Browser push notifications</p>
          </div>
          <Switch checked={prefs.push_notifications} onCheckedChange={(v) => update("push_notifications", v)} />
        </div>

        <div className="flex items-center justify-between max-w-sm">
          <div>
            <Label className="text-sm">Email Reminders</Label>
            <p className="text-xs text-muted-foreground">Due date reminders via email</p>
          </div>
          <Switch checked={prefs.email_reminders} onCheckedChange={(v) => update("email_reminders", v)} />
        </div>
      </div>

      {/* Daily Digest */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Daily Digest</h3>

        <div className="flex items-center justify-between max-w-sm">
          <div>
            <Label className="text-sm">Enable Daily Digest</Label>
            <p className="text-xs text-muted-foreground">Morning summary of your tasks</p>
          </div>
          <Switch checked={prefs.daily_digest} onCheckedChange={(v) => update("daily_digest", v)} />
        </div>

        {prefs.daily_digest && (
          <div className="space-y-2 pl-1">
            <Label className="text-sm">Digest Time</Label>
            <Input
              type="time"
              value={prefs.daily_digest_time}
              onChange={(e) => update("daily_digest_time", e.target.value)}
              className="w-32"
            />
          </div>
        )}
      </div>

      {/* Quiet Hours */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Quiet Hours</h3>

        <div className="flex items-center justify-between max-w-sm">
          <div>
            <Label className="text-sm">Do Not Disturb</Label>
            <p className="text-xs text-muted-foreground">Silence notifications during set hours</p>
          </div>
          <Switch checked={prefs.quiet_hours_enabled} onCheckedChange={(v) => update("quiet_hours_enabled", v)} />
        </div>

        {prefs.quiet_hours_enabled && (
          <div className="flex items-center gap-3 pl-1">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input type="time" value={prefs.quiet_hours_start} onChange={(e) => update("quiet_hours_start", e.target.value)} className="w-28" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input type="time" value={prefs.quiet_hours_end} onChange={(e) => update("quiet_hours_end", e.target.value)} className="w-28" />
            </div>
          </div>
        )}
      </div>

      {/* Overdue Alerts */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Overdue Alerts</h3>

        <div className="flex items-center justify-between max-w-sm">
          <div>
            <Label className="text-sm">Enable Overdue Alerts</Label>
            <p className="text-xs text-muted-foreground">Get notified about overdue tasks</p>
          </div>
          <Switch checked={prefs.overdue_alerts} onCheckedChange={(v) => update("overdue_alerts", v)} />
        </div>
      </div>

      {/* Default Reminder */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Default Reminder</h3>
        <Select value={String(prefs.reminder_default_minutes)} onValueChange={(v) => update("reminder_default_minutes", Number(v))}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="15">15 minutes before</SelectItem>
            <SelectItem value="30">30 minutes before</SelectItem>
            <SelectItem value="60">1 hour before</SelectItem>
            <SelectItem value="1440">1 day before</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default NotificationSettingsSection;
