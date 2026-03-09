import { useEffect, useCallback } from "react";
import { useTasks } from "./use-tasks";
import { usePreferences } from "./use-preferences";
import { isBefore, startOfDay, differenceInMinutes } from "date-fns";

// Safe check for Notification API
const hasNotificationAPI = typeof window !== "undefined" && typeof window.Notification !== "undefined";

function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!hasNotificationAPI) return "unsupported";
  try {
    return Notification.permission;
  } catch {
    return "unsupported";
  }
}

export function usePushNotifications() {
  const { data: prefs } = usePreferences();
  const { data: tasks = [] } = useTasks("active");

  const requestPermission = useCallback(async () => {
    if (!hasNotificationAPI) return false;
    try {
      const permission = getNotificationPermission();
      if (permission === "granted") return true;
      if (permission === "denied" || permission === "unsupported") return false;
      const result = await Notification.requestPermission();
      return result === "granted";
    } catch {
      return false;
    }
  }, []);

  const sendNotification = useCallback((title: string, body?: string) => {
    if (!hasNotificationAPI) return;
    const permission = getNotificationPermission();
    if (permission !== "granted") return;
    
    try {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        silent: false,
      });
    } catch {
      // SW fallback for mobile
      navigator.serviceWorker?.ready?.then((reg) => {
        reg.showNotification(title, { body, icon: "/favicon.ico" });
      }).catch(() => {});
    }
  }, []);

  // Check for overdue tasks and send reminders
  useEffect(() => {
    if (!prefs?.push_notifications || !prefs?.overdue_alerts) return;
    if (!hasNotificationAPI) return;
    
    const permission = getNotificationPermission();
    if (permission !== "granted") return;

    const interval = setInterval(() => {
      const now = new Date();
      const overdue = tasks.filter(
        (t) => t.due_date && isBefore(new Date(t.due_date), startOfDay(now)) && t.status === "active"
      );
      
      // Check for tasks due within reminder window
      tasks.forEach((t) => {
        if (!t.due_date || !t.reminder_minutes?.length) return;
        const dueDate = new Date(t.due_date);
        const minsUntilDue = differenceInMinutes(dueDate, now);
        
        t.reminder_minutes.forEach((mins) => {
          if (Math.abs(minsUntilDue - mins) < 1) {
            const notifKey = `notif_${t.id}_${mins}`;
            if (!sessionStorage.getItem(notifKey)) {
              sendNotification(`⏰ ${t.title}`, `Due in ${mins} minutes`);
              sessionStorage.setItem(notifKey, "1");
            }
          }
        });
      });

      // Overdue batch notification (once per session)
      if (overdue.length > 0 && !sessionStorage.getItem("overdue_notif_sent")) {
        sendNotification(
          `⚠️ ${overdue.length} overdue task${overdue.length > 1 ? "s" : ""}`,
          overdue.slice(0, 3).map((t) => t.title).join(", ")
        );
        sessionStorage.setItem("overdue_notif_sent", "1");
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [tasks, prefs, sendNotification]);

  return { requestPermission, sendNotification };
}
