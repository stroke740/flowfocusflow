import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Palette, Bell, Keyboard } from "lucide-react";
import ProfileSection from "./ProfileSection";
import PreferencesSection from "./PreferencesSection";
import NotificationSettingsSection from "./NotificationSettingsSection";

const SHORTCUTS = [
  { keys: "⌘ K", desc: "Open search / command palette" },
  { keys: "⌘ ⇧ P", desc: "New project" },
  { keys: "↑ ↓", desc: "Navigate search results" },
  { keys: "Enter", desc: "Select item" },
  { keys: "Esc", desc: "Close panel / dialog" },
];

const SettingsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile, preferences, and notifications.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-4 mb-6">
          <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs">
            <User size={14} /> Profile
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-1.5 text-xs">
            <Palette size={14} /> Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-1.5 text-xs">
            <Bell size={14} /> Notifications
          </TabsTrigger>
          <TabsTrigger value="shortcuts" className="flex items-center gap-1.5 text-xs">
            <Keyboard size={14} /> Shortcuts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSection />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesSection />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettingsSection />
        </TabsContent>

        <TabsContent value="shortcuts">
          <div className="space-y-3 max-w-sm">
            <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
            {SHORTCUTS.map((s) => (
              <div key={s.keys} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{s.desc}</span>
                <kbd className="px-2 py-1 rounded-lg bg-muted text-xs font-mono">{s.keys}</kbd>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
