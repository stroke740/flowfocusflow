import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ProjectColorIconPicker from "./ProjectColorIconPicker";
import { Project } from "@/hooks/use-projects";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSave: (data: { name: string; color: string; icon: string }) => void;
  isPending?: boolean;
}

const ProjectFormDialog = ({ open, onOpenChange, project, onSave, isPending }: Props) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [icon, setIcon] = useState("📁");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setColor(project.color);
      setIcon(project.icon);
    } else {
      setName("");
      setColor("#6366f1");
      setIcon("📁");
    }
  }, [project, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color, icon });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{project ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
              style={{ backgroundColor: color + "20" }}
            >
              {icon}
            </div>
            <div className="flex-1">
              <Label htmlFor="project-name" className="text-xs text-muted-foreground">Name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                className="h-9"
                autoFocus
              />
            </div>
          </div>

          <ProjectColorIconPicker
            color={color}
            icon={icon}
            onColorChange={setColor}
            onIconChange={setIcon}
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {project ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFormDialog;
