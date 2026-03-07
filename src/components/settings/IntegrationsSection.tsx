import { Calendar, MessageSquare, Zap, FileText, Download, Upload, Github, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const INTEGRATIONS = [
  {
    name: "Google Calendar",
    desc: "Two-way sync: tasks with due dates appear as calendar events",
    icon: Calendar,
    status: "coming_soon" as const,
  },
  {
    name: "Slack",
    desc: "Task creation from messages, daily digest in DM",
    icon: MessageSquare,
    status: "coming_soon" as const,
  },
  {
    name: "Zapier / Make",
    desc: "Trigger and action hooks for 5000+ apps",
    icon: Zap,
    status: "pro" as const,
  },
  {
    name: "Notion",
    desc: "Import tasks from Notion databases",
    icon: FileText,
    status: "coming_soon" as const,
  },
  {
    name: "Apple Calendar / iCloud",
    desc: "CalDAV sync for iOS/macOS native Calendar",
    icon: Apple,
    status: "coming_soon" as const,
  },
  {
    name: "GitHub Issues",
    desc: "Link tasks to GitHub issues with status sync",
    icon: Github,
    status: "coming_soon" as const,
  },
];

const IntegrationsSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold">Integrations</h3>
        <p className="text-xs text-muted-foreground mt-1">Connect FocusFlow with your favorite tools.</p>
      </div>

      <div className="space-y-3">
        {INTEGRATIONS.map((integration) => (
          <div
            key={integration.name}
            className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
              <integration.icon size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">{integration.name}</p>
                {integration.status === "pro" && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">PRO</Badge>
                )}
                {integration.status === "coming_soon" && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">Coming Soon</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{integration.desc}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={integration.status === "coming_soon"}
              className="flex-shrink-0"
            >
              {integration.status === "coming_soon" ? "Notify Me" : "Connect"}
            </Button>
          </div>
        ))}
      </div>

      {/* CSV Import/Export */}
      <div className="pt-4 border-t border-border space-y-3">
        <h3 className="text-sm font-semibold">CSV Import / Export</h3>
        <p className="text-xs text-muted-foreground">Universal import from any todo app or export your complete task history.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            <Upload size={14} className="mr-2" /> Import CSV
            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">Coming Soon</Badge>
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download size={14} className="mr-2" /> Export CSV
            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">Coming Soon</Badge>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsSection;
