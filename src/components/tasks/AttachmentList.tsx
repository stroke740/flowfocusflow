import { useRef } from "react";
import { Paperclip, Trash2, Download, FileText, Image as ImageIcon, File } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAttachments, useAttachmentMutations, getAttachmentUrl, TaskAttachment } from "@/hooks/use-attachments";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith("image/")) return <ImageIcon size={14} className="text-primary" />;
  if (contentType.includes("pdf")) return <FileText size={14} className="text-destructive" />;
  return <File size={14} className="text-muted-foreground" />;
}

export default function AttachmentList({ taskId }: { taskId: string }) {
  const { data: attachments = [], isLoading } = useAttachments(taskId);
  const { uploadAttachment, deleteAttachment } = useAttachmentMutations();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: "Max 10MB per file", variant: "destructive" });
        continue;
      }
      try {
        await uploadAttachment.mutateAsync({ taskId, file });
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDelete = async (att: TaskAttachment) => {
    await deleteAttachment.mutateAsync({ id: att.id, filePath: att.file_path, taskId });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-[12px] font-semibold text-muted-foreground flex items-center gap-1.5">
          <Paperclip size={12} /> Attachments {attachments.length > 0 && `(${attachments.length})`}
        </h4>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[11px] rounded-lg"
          onClick={() => inputRef.current?.click()}
          disabled={uploadAttachment.isPending}
        >
          {uploadAttachment.isPending ? "Uploading..." : "Add file"}
        </Button>
        <input ref={inputRef} type="file" className="hidden" multiple onChange={handleUpload} />
      </div>

      <AnimatePresence>
        {attachments.map((att) => (
          <motion.div
            key={att.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-card group"
          >
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              {getFileIcon(att.content_type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium truncate">{att.file_name}</p>
              <p className="text-[10px] text-muted-foreground">{formatSize(att.file_size)}</p>
            </div>
            <a
              href={getAttachmentUrl(att.file_path)}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={13} className="text-muted-foreground" />
            </a>
            <button
              onClick={() => handleDelete(att)}
              className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={13} className="text-destructive" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {att.content_type?.startsWith("image/") && attachments.filter(a => a.content_type.startsWith("image/")).length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 mt-2">
          {attachments.filter(a => a.content_type.startsWith("image/")).map((att) => (
            <a key={att.id} href={getAttachmentUrl(att.file_path)} target="_blank" rel="noopener noreferrer">
              <img
                src={getAttachmentUrl(att.file_path)}
                alt={att.file_name}
                className="w-full h-20 object-cover rounded-lg border border-border"
                loading="lazy"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
