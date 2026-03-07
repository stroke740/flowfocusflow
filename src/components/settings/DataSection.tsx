import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, Trash2, AlertTriangle, Loader2 } from "lucide-react";
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
  const { user, signOut } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all user data
      const [tasksRes, projectsRes, tagsRes, notifRes] = await Promise.all([
        supabase.from("tasks").select("*").eq("user_id", user!.id),
        supabase.from("projects").select("*").eq("user_id", user!.id),
        supabase.from("tags").select("*").eq("user_id", user!.id),
        supabase.from("notifications").select("*").eq("user_id", user!.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_email: user?.email,
        tasks: tasksRes.data || [],
        projects: projectsRes.data || [],
        tags: tagsRes.data || [],
        notifications: notifRes.data || [],
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `focusflow-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // Also create CSV for tasks
      if (exportData.tasks.length > 0) {
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

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      // Delete all user data
      await Promise.all([
        supabase.from("notifications").delete().eq("user_id", user!.id),
        supabase.from("task_tags").delete().in(
          "task_id",
          (await supabase.from("tasks").select("id").eq("user_id", user!.id)).data?.map((t) => t.id) || []
        ),
      ]);
      await supabase.from("tasks").delete().eq("user_id", user!.id);
      await supabase.from("projects").delete().eq("user_id", user!.id);
      await supabase.from("tags").delete().eq("user_id", user!.id);
      await supabase.from("user_preferences").delete().eq("user_id", user!.id);
      await supabase.from("profiles").delete().eq("id", user!.id);

      await signOut();
      toast.success("Account data deleted. You have been signed out.");
    } catch {
      toast.error("Failed to delete account data");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Export */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold">Export Data</h3>
        <p className="text-xs text-muted-foreground">
          Download all your tasks, projects, tags, and notifications as JSON and CSV files.
        </p>
        <Button variant="outline" onClick={handleExport} disabled={exporting}>
          {exporting ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Download size={14} className="mr-2" />}
          Export All Data
        </Button>
      </div>

      {/* Delete Account */}
      <div className="space-y-3 pt-6 border-t border-border">
        <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
          <AlertTriangle size={14} />
          Danger Zone
        </h3>
        <p className="text-xs text-muted-foreground">
          Permanently delete all your data. This action cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 size={14} className="mr-2" />
              Delete All Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your tasks, projects, tags, preferences, and profile data.
                Type <strong>DELETE</strong> to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="mt-2"
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirm("")}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "DELETE" || deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
