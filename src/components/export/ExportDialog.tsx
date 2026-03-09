import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Table2, X, FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Task } from "@/types/task";
import { format } from "date-fns";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  activeTasks: Task[];
  completedTasks: Task[];
}

const ExportDialog = ({ open, onClose, activeTasks, completedTasks }: ExportDialogProps) => {
  const [exportingPdf, setExportingPdf] = useState(false);
  const allTasks = [...activeTasks, ...completedTasks];

  const exportCSV = () => {
    const headers = ["Title", "Status", "Priority", "Due Date", "Created", "Completed", "Description"];
    const rows = allTasks.map((t) => [
      `"${t.title.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.due_date ? format(new Date(t.due_date), "yyyy-MM-dd") : "",
      format(new Date(t.created_at), "yyyy-MM-dd"),
      t.completed_at ? format(new Date(t.completed_at), "yyyy-MM-dd") : "",
      `"${(t.description || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadFile(csv, "focusflow-tasks.csv", "text/csv");
  };

  const exportJSON = () => {
    const data = allTasks.map((t) => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      created_at: t.created_at,
      completed_at: t.completed_at,
      description: t.description,
      tags: t.tags?.map((tag) => tag.name) || [],
    }));
    downloadFile(JSON.stringify(data, null, 2), "focusflow-tasks.json", "application/json");
  };

  const exportPDF = async () => {
    setExportingPdf(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const now = format(new Date(), "MMM d, yyyy");

      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("FocusFlow — Task Report", 14, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Generated on ${now}`, 14, 28);
      doc.text(`${activeTasks.length} active · ${completedTasks.length} completed · ${allTasks.length} total`, 14, 34);

      // Summary box
      doc.setDrawColor(200);
      doc.setFillColor(248, 248, 250);
      doc.roundedRect(14, 40, 182, 18, 3, 3, "FD");
      doc.setTextColor(60);
      doc.setFontSize(9);
      doc.text(`Active: ${activeTasks.length}`, 22, 50);
      doc.text(`Completed: ${completedTasks.length}`, 62, 50);
      doc.text(`P1 Urgent: ${allTasks.filter((t) => t.priority === "p1").length}`, 112, 50);
      doc.text(`P2 High: ${allTasks.filter((t) => t.priority === "p2").length}`, 152, 50);

      // Table
      const priorityLabels: Record<string, string> = { p1: "🔴 Urgent", p2: "🟠 High", p3: "🟡 Medium", p4: "Low" };

      autoTable(doc, {
        startY: 64,
        head: [["Title", "Status", "Priority", "Due Date", "Created"]],
        body: allTasks.map((t) => [
          t.title,
          t.status === "completed" ? "✅ Done" : "⏳ Active",
          priorityLabels[t.priority] || t.priority,
          t.due_date ? format(new Date(t.due_date), "MMM d, yyyy") : "—",
          format(new Date(t.created_at), "MMM d, yyyy"),
        ]),
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 248, 252] },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`FocusFlow Report · Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
      }

      doc.save(`focusflow-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      onClose();
    } catch {
      console.error("PDF export failed");
    } finally {
      setExportingPdf(false);
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Download size={18} className="text-primary" />
            <h3 className="text-[15px] font-bold">Export Tasks</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
        </div>

        <p className="text-[12px] text-muted-foreground mb-4">
          {allTasks.length} tasks ({activeTasks.length} active, {completedTasks.length} completed)
        </p>

        <div className="space-y-2">
          <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl" onClick={exportCSV}>
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center">
              <Table2 size={16} className="text-success" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-medium">CSV</p>
              <p className="text-[10px] text-muted-foreground">Spreadsheet compatible</p>
            </div>
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl" onClick={exportJSON}>
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText size={16} className="text-primary" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-medium">JSON</p>
              <p className="text-[10px] text-muted-foreground">Full data export</p>
            </div>
          </Button>
          <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl" onClick={exportPDF} disabled={exportingPdf}>
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
              {exportingPdf ? <Loader2 size={16} className="text-destructive animate-spin" /> : <FileDown size={16} className="text-destructive" />}
            </div>
            <div className="text-left">
              <p className="text-[13px] font-medium">PDF</p>
              <p className="text-[10px] text-muted-foreground">Professional report</p>
            </div>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ExportDialog;
