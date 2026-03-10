import { useState, useEffect } from "react";
import { getNotifications, markNotificationsRead } from "../services/api";
import { Bell, Check, X, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const Notifications = () => {
  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const unread = notes.filter((n) => !n.isRead).length;

  const fetchNotes = async () => {
    try {
      const { data } = await getNotifications();
      setNotes(data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    fetchNotes();
    const interval = setInterval(fetchNotes, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async () => {
    setLoading(true);
    try {
      await markNotificationsRead();
      setNotes((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-destructive ring-1 ring-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="font-semibold leading-none">Notifications</h4>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 text-xs text-primary hover:text-primary/80"
              onClick={handleMarkRead}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="mr-1 h-3 w-3" />}
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[300px]">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="grid">
              {notes.map((n) => (
                <div
                  key={n._id}
                  className={cn(
                    "flex flex-col gap-1 p-4 text-sm border-b last:border-0 hover:bg-muted/50 transition-colors",
                    !n.isRead && "bg-primary/5 border-l-2 border-l-primary leading-none"
                  )}
                >
                  <p className={cn("leading-snug", !n.isRead && "font-medium")}>{n.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default Notifications;
