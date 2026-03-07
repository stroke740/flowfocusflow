import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Project } from "@/hooks/use-projects";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  taskCount: number;
  onConfirm: (deleteTasks: boolean) => void;
}

const DeleteProjectDialog = ({ open, onOpenChange, project, taskCount, onConfirm }: Props) => {
  if (!project) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete "{project.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            {taskCount > 0
              ? `This project has ${taskCount} task${taskCount !== 1 ? "s" : ""}. What would you like to do with them?`
              : "This project has no tasks. It will be permanently deleted."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {taskCount > 0 && (
            <AlertDialogAction
              onClick={() => onConfirm(false)}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Move tasks to Inbox
            </AlertDialogAction>
          )}
          <AlertDialogAction
            onClick={() => onConfirm(taskCount > 0)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {taskCount > 0 ? "Delete all" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteProjectDialog;
