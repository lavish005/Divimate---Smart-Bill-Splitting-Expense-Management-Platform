import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getGroupMessages } from "../services/api";
import { io } from "socket.io-client";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Make sure to use environment variable in production
const SOCKET_URL = "http://localhost:5000";

const GroupChat = ({ groupId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  const userId = user?._id || user?.id;

  // Scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await getGroupMessages(groupId);
        setMessages(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [groupId]);

  // Socket connection
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit("joinGroup", groupId);

    socket.on("newMessage", (msg) => {
      setMessages((prev) => {
        // Avoid dupes
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [groupId]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !socketRef.current) return;

    socketRef.current.emit("sendMessage", {
      groupId,
      senderId: userId,
      text: trimmed,
    });

    setText("");
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateSeparator = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDateKey = (dateStr) => new Date(dateStr).toDateString();

  if (loading) return (
    <div className="flex h-[500px] items-center justify-center rounded-md border bg-muted/20">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Loading chat history...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[600px] w-full border rounded-lg overflow-hidden bg-background shadow-sm">
      <ScrollArea className="flex-1 p-4 bg-muted/10" ref={scrollAreaRef}>
        <div className="flex flex-col gap-4 pb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
              <p>No messages yet.</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = (msg.sender?._id || msg.sender) === userId;
              const showDate =
                idx === 0 ||
                getDateKey(msg.createdAt) !==
                getDateKey(messages[idx - 1].createdAt);

              return (
                <div key={msg._id || idx} className="space-y-4">
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full uppercase tracking-wider">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                    </div>
                  )}
                  <div className={cn("flex items-end gap-2", isMe ? "flex-row-reverse" : "flex-row")}>
                    {!isMe && (
                      <Avatar className="h-8 w-8 border">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {(msg.sender?.name || "?").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn(
                      "flex flex-col max-w-[70%]",
                      isMe ? "items-end" : "items-start"
                    )}>
                      {!isMe && (
                        <span className="text-[10px] text-muted-foreground ml-1 mb-1">
                          {msg.sender?.name || "Unknown"}
                        </span>
                      )}
                      <div className={cn(
                        "px-4 py-2 rounded-2xl text-sm shadow-sm",
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-white dark:bg-card border text-card-foreground rounded-bl-none"
                      )}>
                        <p>{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 mx-1 block">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-card border-t">
        <form className="flex gap-2" onSubmit={handleSend}>
          <Input
            className="flex-1 rounded-full bg-muted/50 focus:bg-background transition-colors"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full h-10 w-10 shrink-0"
            disabled={!text.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default GroupChat;
