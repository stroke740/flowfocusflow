import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Plus, Trash2, X, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTaskMutations } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";

interface TaskTemplate {
  id: string;
  name: string;
  tasks: { title: string; priority: string }[];
}

function getTemplates(): TaskTemplate[] {
  try { return JSON.parse(localStorage.getItem("focusflow_templates") || "[]"); }
  catch { return []; }
}

function saveTemplates(templates: TaskTemplate[]) {
  localStorage.setItem("focusflow_templates", JSON.stringify(templates));
}

const PRESET_TEMPLATES: TaskTemplate[] = [
  { id: "morning", name: "🌅 Morning Routine", tasks: [
    { title: "Review today's calendar", priority: "p2" },
    { title: "Check urgent emails", priority: "p1" },
    { title: "Plan top 3 priorities", priority: "p2" },
  ]},
  { id: "weekly", name: "📋 Weekly Review", tasks: [
    { title: "Review completed tasks", priority: "p3" },
    { title: "Process inbox to zero", priority: "p2" },
    { title: "Plan next week's goals", priority: "p2" },
    { title: "Update project statuses", priority: "p3" },
  ]},
  { id: "meeting", name: "🤝 Meeting Prep", tasks: [
    { title: "Prepare agenda", priority: "p2" },
    { title: "Review previous notes", priority: "p3" },
    { title: "Send follow-up action items", priority: "p2" },
  ]},
];

interface TaskTemplatesProps {
  open: boolean;
  onClose: () => void;
}

const TaskTemplates = ({ open, onClose }: TaskTemplatesProps) => {
  const [templates, setTemplatesState] = useState<TaskTemplate[]>(getTemplates());
  const [newName, setNewName] = useState("");
  const [newTasks, setNewTasks] = useState<string[]>([""]);
  const [creating, setCreating] = useState(false);
  const { addTask } = useTaskMutations();

  const allTemplates = useMemo(() => [...PRESET_TEMPLATES, ...templates], [templates]);

  const handleUseTemplate = async (template: TaskTemplate) => {
    for (const t of template.tasks) {
      await addTask.mutateAsync({ title: t.title, priority: t.priority as any });
    }
    onClose();
  };

  const handleSaveTemplate = () => {
    const validTasks = newTasks.filter((t) => t.trim());
    if (!newName.trim() || validTasks.length === 0) return;
    const template: TaskTemplate = {
      id: crypto.randomUUID(),
      name: newName,
      tasks: validTasks.map((t) => ({ title: t, priority: "p4" })),
    };
    const updated = [...templates, template];
    setTemplatesState(updated);
    saveTemplates(updated);
    setNewName("");
    setNewTasks([""]);
    setCreating(false);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter((t) => t.id !== id);
    setTemplatesState(updated);
    saveTemplates(updated);
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background overflow-y-auto"
    >
      <div className="px-5 py-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Layout size={18} className="text-primary" />
            <h2 className="text-lg font-bold">Task Templates</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted"><X size={20} /></button>
        </div>

        <div className="space-y-2.5 mb-6">
          {allTemplates.map((template) => (
            <motion.div
              key={template.id}
              whileTap={{ scale: 0.98 }}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-semibold">{template.name}</h3>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1" onClick={() => handleUseTemplate(template)}>
                    <Copy size={12} /> Use
                  </Button>
                  {!PRESET_TEMPLATES.find((p) => p.id === template.id) && (
                    <button onClick={() => handleDeleteTemplate(template.id)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-0.5">
                {template.tasks.map((t, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground">• {t.title}</p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {creating ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-primary/20 bg-card p-4 space-y-3"
          >
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Template name"
              className="text-sm"
            />
            {newTasks.map((t, i) => (
              <Input
                key={i}
                value={t}
                onChange={(e) => {
                  const updated = [...newTasks];
                  updated[i] = e.target.value;
                  setNewTasks(updated);
                }}
                placeholder={`Task ${i + 1}`}
                className="text-sm"
              />
            ))}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setNewTasks([...newTasks, ""])} className="text-[11px]">
                + Task
              </Button>
              <div className="flex-1" />
              <Button size="sm" variant="outline" onClick={() => setCreating(false)} className="text-[11px]">Cancel</Button>
              <Button size="sm" onClick={handleSaveTemplate} className="text-[11px]">Save</Button>
            </div>
          </motion.div>
        ) : (
          <Button variant="outline" className="w-full gap-2 rounded-xl" onClick={() => setCreating(true)}>
            <Plus size={14} /> Create Template
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default TaskTemplates;
