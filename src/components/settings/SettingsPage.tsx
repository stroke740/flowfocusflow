import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Palette, Bell, ListTodo, Database, Tag,
  Shield, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ProfileSection from "./ProfileSection";
import AppearanceSection from "./AppearanceSection";
import NotificationSettingsSection from "./NotificationSettingsSection";
import TaskSettingsSection from "./TaskSettingsSection";
import DataSection from "./DataSection";
import TagManagementSection from "./TagManagementSection";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User, description: "Name and avatar" },
  { id: "appearance", label: "Appearance", icon: Palette, description: "Theme, colors, and layout" },
  { id: "tasks", label: "Task Behavior", icon: ListTodo, description: "Defaults, completion, and sorting" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Alerts, reminders, and digest" },
  { id: "tags", label: "Tags", icon: Tag, description: "Create and manage tags" },
  { id: "data", label: "Data & Privacy", icon: Shield, description: "Export and delete data" },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

const SettingsPage = () => {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);

  const renderContent = () => {
    switch (activeSection) {
      case "profile": return <ProfileSection />;
      case "appearance": return <AppearanceSection />;
      case "tasks": return <TaskSettingsSection />;
      case "notifications": return <NotificationSettingsSection />;
      case "tags": return <TagManagementSection />;
      case "data": return <DataSection />;
      default: return null;
    }
  };

  const activeInfo = SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="space-y-4 pb-20">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your preferences.</p>
      </div>

      <AnimatePresence mode="wait">
        {!activeSection ? (
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
                onClick={() => setActiveSection(section.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
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
              onClick={() => setActiveSection(null)}
              className="flex items-center gap-1.5 text-sm text-primary font-medium mb-4 -ml-1"
            >
              <ChevronRight size={16} className="rotate-180" />
              Back
            </button>
            <h2 className="text-lg font-semibold mb-1">{activeInfo?.label}</h2>
            <p className="text-xs text-muted-foreground mb-5">{activeInfo?.description}</p>
            {renderContent()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
