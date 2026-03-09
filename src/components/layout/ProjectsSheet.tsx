import { Plus, Calendar, Grid3X3, CheckCircle2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Project } from "@/hooks/use-projects";

interface ProjectsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  taskCounts: Map<string, { total: number; completed: number }>;
  onSelectProject: (id: string) => void;
  onAddProject: () => void;
  onNavigate: (view: string) => void;
}

export function ProjectsSheet({
  open,
  onOpenChange,
  projects,
  taskCounts,
  onSelectProject,
  onAddProject,
  onNavigate,
}: ProjectsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh]">
        <div className="w-8 h-1 rounded-full bg-muted-foreground/20 mx-auto mt-1 mb-3" />
        <SheetHeader>
          <SheetTitle className="text-left text-base">Projects</SheetTitle>
        </SheetHeader>
        <div className="mt-3 space-y-0.5">
          {projects.map((project) => {
            const counts = taskCounts.get(project.id);
            const activeCount = counts ? counts.total - counts.completed : 0;
            return (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted active:bg-muted transition-colors"
              >
                <span
                  className="w-3 h-3 rounded-[5px] flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="flex-1 text-left text-[13px] font-medium">{project.name}</span>
                {activeCount > 0 && (
                  <span className="text-[11px] text-muted-foreground tabular-nums bg-muted px-1.5 py-0.5 rounded-md">
                    {activeCount}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={onAddProject}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-primary hover:bg-muted transition-colors"
          >
            <Plus size={14} />
            <span className="text-[13px] font-medium">Add project</span>
          </button>

          <div className="pt-3 border-t border-border mt-3 space-y-0.5">
            {[
              { icon: Calendar, label: "Calendar", view: "calendar" },
              { icon: Grid3X3, label: "Priority Matrix", view: "matrix" },
              { icon: Calendar, label: "Upcoming", view: "upcoming" },
              { icon: CheckCircle2, label: "Completed", view: "completed" },
            ].map(({ icon: Icon, label, view }) => (
              <button
                key={label}
                onClick={() => onNavigate(view)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-muted transition-colors"
              >
                <Icon size={16} />
                <span className="text-[13px] font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
