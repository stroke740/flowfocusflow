import { useState } from "react";
import { Bell, Check, CheckCheck, Trash2, X, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications, useUnreadCount, useNotificationMutations } from "@/hooks/use-notifications";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  onNavigateToTask?: (taskId: string) => void;
}

const NotificationCenter = ({ onNavigateToTask }: Props) => {
  const { user } = useAuth();
  const { data: notifications = [] } = useNotifications();
  const unreadCount = useUnreadCount();
  const { markRead, markAllRead, deleteNotification } = useNotificationMutations();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-xl hover:bg-muted transition-colors" title="Notifications">
          <Bell size={18} className="text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && user && (
            <button
              onClick={() => markAllRead.mutate(user.id)}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck size={12} />
              Mark all read
            </button>
          )}
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="text-center py-8 px-4">
              <Bell size={28} className="mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "px-4 py-3 flex gap-3 items-start hover:bg-muted/50 transition-colors cursor-pointer",
                    !notif.read && "bg-primary/5"
                  )}
                  onClick={() => {
                    if (!notif.read) markRead.mutate(notif.id);
                    if (notif.task_id && onNavigateToTask) {
                      onNavigateToTask(notif.task_id);
                      setOpen(false);
                    }
                  }}
                >
                  <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", notif.read ? "bg-transparent" : "bg-primary")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{notif.title}</p>
                    {notif.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>}
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification.mutate(notif.id); }}
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground/40 hover:text-muted-foreground flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
