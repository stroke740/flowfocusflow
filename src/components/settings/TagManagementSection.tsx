import { useState } from "react";
import { Tag, Pencil, Trash2, X, Plus, Merge } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTags, useTaskMutations } from "@/hooks/use-tasks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const TAG_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#06b6d4", "#3b82f6", "#64748b", "#78716c",
];

const TagManagementSection = () => {
  const { data: tags = [] } = useTags();
  const { addTag } = useTaskMutations();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [editingTag, setEditingTag] = useState<{ id: string; name: string; color: string } | null>(null);
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await addTag.mutateAsync({ name: newTagName.trim(), color: newTagColor });
    setNewTagName("");
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !editingTag.name.trim()) return;
    const { error } = await supabase
      .from("tags")
      .update({ name: editingTag.name.trim(), color: editingTag.color })
      .eq("id", editingTag.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      qc.invalidateQueries({ queryKey: ["tags"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      setEditingTag(null);
    }
  };

  const handleDeleteTag = async () => {
    if (!deleteTagId) return;
    // Remove task_tags first, then delete tag
    await supabase.from("task_tags").delete().eq("tag_id", deleteTagId);
    const { error } = await supabase.from("tags").delete().eq("id", deleteTagId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      qc.invalidateQueries({ queryKey: ["tags"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Tag deleted" });
    }
    setDeleteTagId(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Tags</h3>
      <p className="text-xs text-muted-foreground">Create, edit, and manage your tags.</p>

      {/* Create new tag */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {TAG_COLORS.slice(0, 6).map((c) => (
            <button
              key={c}
              onClick={() => setNewTagColor(c)}
              className={cn(
                "w-5 h-5 rounded-full transition-all",
                newTagColor === c && "ring-2 ring-offset-1 ring-offset-background"
              )}
              style={{ backgroundColor: c, boxShadow: newTagColor === c ? `0 0 0 2px ${c}` : undefined }}
            />
          ))}
        </div>
        <Input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="New tag name…"
          className="h-8 text-sm flex-1"
          onKeyDown={(e) => { if (e.key === "Enter") handleCreateTag(); }}
        />
        <Button size="sm" className="h-8 text-xs" onClick={handleCreateTag} disabled={!newTagName.trim()}>
          <Plus size={14} className="mr-1" /> Add
        </Button>
      </div>

      {/* Existing tags */}
      <div className="space-y-1">
        {tags.length === 0 && (
          <p className="text-xs text-muted-foreground py-4 text-center">No tags created yet.</p>
        )}
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: tag.color }} />
            <span className="text-sm font-medium flex-1">{tag.name}</span>
            <button
              onClick={() => setEditingTag({ id: tag.id, name: tag.name, color: tag.color })}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => setDeleteTagId(tag.id)}
              className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingTag} onOpenChange={(open) => { if (!open) setEditingTag(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          {editingTag && (
            <div className="space-y-3">
              <Input
                value={editingTag.name}
                onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                className="h-9"
                autoFocus
              />
              <div className="flex gap-1.5 flex-wrap">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEditingTag({ ...editingTag, color: c })}
                    className={cn(
                      "w-7 h-7 rounded-lg transition-all",
                      editingTag.color === c && "ring-2 ring-offset-2 ring-offset-background"
                    )}
                    style={{ backgroundColor: c, boxShadow: editingTag.color === c ? `0 0 0 2px ${c}` : undefined }}
                  />
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingTag(null)}>Cancel</Button>
            <Button onClick={handleUpdateTag}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTagId} onOpenChange={(open) => { if (!open) setDeleteTagId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will remove the tag from all tasks. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteTagId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTag}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagManagementSection;
