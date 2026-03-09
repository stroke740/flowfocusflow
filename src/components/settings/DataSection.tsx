import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Trash2, AlertTriangle, Loader2, FileJson, FileSpreadsheet, HardDriveDownload, FileDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DataSection = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async (format: "json" | "csv" | "both") => {
    if (!userId) return;
    setExporting(true);
    try {
      const [tasksRes, projectsRes, tagsRes, notifRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", userId),
        supabase.from("projects").select("*").eq("user_id", userId),
        supabase.from("tags").select("*").eq("user_id", userId),
        supabase.from("notifications").select("*").eq("user_id", userId),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        tasks: tasksRes.data || [],
        projects: projectsRes.data || [],
        tags: tagsRes.data || [],
        notifications: notifRes.data || [],
      };

      if (format === "json" || format === "both") {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `focusflow-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }

      if ((format === "csv" || format === "both") && exportData.tasks.length > 0) {
        const headers = Object.keys(exportData.tasks[0]);
        const csvRows = [
          headers.join(","),
          ...exportData.tasks.map((t: any) =>
            headers.map((h) => {
              const val = t[h];
              return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val ?? "";
            }).join(",")
          ),
        ];
        const csvBlob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const csvUrl = URL.createObjectURL(csvBlob);
        const csvA = document.createElement("a");
        csvA.href = csvUrl;
        csvA.download = `focusflow-tasks-${new Date().toISOString().split("T")[0]}.csv`;
        csvA.click();
        URL.revokeObjectURL(csvUrl);
      }

      toast.success("Data exported successfully");
    } catch {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (deleteConfirm !== "DELETE" || !userId) return;
    setDeleting(true);
    try {
      await Promise.all([
        supabase.from("notifications").delete().eq("user_id", userId),
        supabase.from("task_tags").delete().in(
          "task_id",
          (await supabase.from("tasks").select("id").eq("user_id", userId)).data?.map((t) => t.id) || []
        ),
      ]);
      await supabase.from("tasks").delete().eq("user_id", userId);
      await supabase.from("projects").delete().eq("user_id", userId);
      await supabase.from("tags").delete().eq("user_id", userId);
      await supabase.from("user_preferences").delete().eq("user_id", userId);

      toast.success("All data deleted. Page will refresh.");
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error("Failed to delete data");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Export */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Export Data</Label>
        <p className="text-xs text-muted-foreground">
          Download all your tasks, projects, tags, and notifications.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button variant="outline" onClick={() => handleExport("json")} disabled={exporting} className="gap-2 rounded-xl justify-start h-auto py-3 px-4">
            <FileJson size={18} className="text-primary flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-medium">JSON</p>
              <p className="text-[10px] text-muted-foreground">Full data backup</p>
            </div>
          </Button>
          <Button variant="outline" onClick={() => handleExport("csv")} disabled={exporting} className="gap-2 rounded-xl justify-start h-auto py-3 px-4">
            <FileSpreadsheet size={18} className="text-success flex-shrink-0" />
            <div className="text-left">
              <p className="text-xs font-medium">CSV</p>
              <p className="text-[10px] text-muted-foreground">Spreadsheet format</p>
            </div>
          </Button>
          <Button variant="outline" onClick={() => handleExport("both")} disabled={exporting} className="gap-2 rounded-xl justify-start h-auto py-3 px-4">
            {exporting ? (
              <Loader2 size={18} className="animate-spin flex-shrink-0" />
            ) : (
              <HardDriveDownload size={18} className="text-accent flex-shrink-0" />
            )}
            <div className="text-left">
              <p className="text-xs font-medium">Both</p>
              <p className="text-[10px] text-muted-foreground">JSON + CSV</p>
            </div>
          </Button>
        </div>
      </div>

      {/* Storage info */}
      <div className="rounded-xl border border-border p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold">Storage Usage</span>
          <span className="text-[10px] text-muted-foreground">Synced in real-time</span>
        </div>
        <p className="text-xs text-muted-foreground">
          All data is securely stored and backed up automatically. Export regularly for your own records.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="space-y-3 pt-4 border-t border-destructive/20">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle size={14} />
          <Label className="text-sm font-semibold text-destructive">Danger Zone</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Permanently delete all your data including tasks, projects, tags, and preferences. This action cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl">
              <Trash2 size={14} className="mr-2" />
              Delete All Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-destructive" />
                Are you absolutely sure?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your tasks, projects, tags, and preferences.
                Type <strong className="text-foreground">DELETE</strong> to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="mt-2 rounded-lg"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirm("")} className="rounded-lg">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAllData}
                disabled={deleteConfirm !== "DELETE" || deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
              >
                {deleting ? <Loader2 size={14} className="mr-2 animate-spin" /> : null}
                Delete Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default DataSection;
