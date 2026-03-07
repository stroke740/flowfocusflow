import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Palette, Bell, ListTodo, Database, Tag, Keyboard,
  Shield, Globe, Zap, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileSection from "./ProfileSection";
import AppearanceSection from "./AppearanceSection";
import NotificationSettingsSection from "./NotificationSettingsSection";
import TaskSettingsSection from "./TaskSettingsSection";
import DataSection from "./DataSection";
import TagManagementSection from "./TagManagementSection";
import { useIsMobile } from "@/hooks/use-mobile";

const SHORTCUTS = [
  { keys: "Q", desc: "Quick add task" },
  { keys: "⌘ K", desc: "Open search / command palette" },
  { keys: "⌘ ⇧ P", desc: "New project" },
  { keys: "Alt+1–4", desc: "Set priority while adding task" },
  { keys: "↑ ↓", desc: "Navigate search results" },
  { keys: "Enter", desc: "Select / submit" },
  { keys: "Esc", desc: "Close panel / dialog" },
];

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User, description: "Name, avatar, and account" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme, colors, and layout" },
  { id: "tasks", label: "Task Behavior", icon: ListTodo, description: "Defaults, completion, and sorting" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alerts, reminders, and digest" },
  { id: "tags", label: "Tags", icon: Tag, description: "Create and manage tags" },
  { id: "shortcuts", label: "Keyboard Shortcuts", icon: Keyboard, description: "View all shortcuts" },
  { id: "data", label: "Data & Privacy", icon: Shield, description: "Export, import, and delete" },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const isMobile = useIsMobile();
  const [mobileShowContent, setMobileShowContent] = useState(false);

  const handleSelectSection = (id: SectionId) => {
    setActiveSection(id);
    if (isMobile) setMobileShowContent(true);
  };

  const renderContent = () => {
    switch (activeSection) {
      case "profile": return <ProfileSection />;
      case "appearance": return <AppearanceSection />;
      case "tasks": return <TaskSettingsSection />;
      case "notifications": return <NotificationSettingsSection />;
      case "tags": return <TagManagementSection />;
      case "data": return <DataSection />;
      case "shortcuts":
        return (
          <div className="space-y-1">
            {SHORTCUTS.map((s) => (
              <div key={s.keys} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <span className="text-sm">{s.desc}</span>
                <kbd className="px-2.5 py-1 rounded-lg bg-muted text-xs font-mono text-muted-foreground">{s.keys}</kbd>
              </div>
            ))}
          </div>
        );
      default: return null;
    }
  };

  const activeInfo = SECTIONS.find((s) => s.id === activeSection)!;

  // Mobile: show nav list or content
  if (isMobile) {
    return (
      <div className="space-y-4 pb-20">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your preferences.</p>
        </div>

        <AnimatePresence mode="wait">
          {!mobileShowContent ? (
            <motion.div
              key="nav"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.15 }}
              className="space-y-1"
            >
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSelectSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors text-left",
                    activeSection === section.id ? "bg-primary/10" : "hover:bg-muted"
                  )}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    activeSection === section.id ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <section.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{section.label}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                  <ChevronRight size={16} className="text-muted-foreground/40 flex-shrink-0" />
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.15 }}
            >
              <button
                onClick={() => setMobileShowContent(false)}
                className="flex items-center gap-1.5 text-sm text-primary font-medium mb-4 -ml-1"
              >
                <ChevronRight size={16} className="rotate-180" />
                Back
              </button>
              <h2 className="text-lg font-semibold mb-1">{activeInfo.label}</h2>
              <p className="text-xs text-muted-foreground mb-5">{activeInfo.description}</p>
              {renderContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Desktop: side nav + content
  return (
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile, preferences, and data.</p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar nav */}
        <nav className="w-56 flex-shrink-0 space-y-0.5">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                activeSection === section.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <section.icon size={16} className="flex-shrink-0" />
              {section.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0 max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-5">
                <h2 className="text-lg font-semibold">{activeInfo.label}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{activeInfo.description}</p>
              </div>
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
