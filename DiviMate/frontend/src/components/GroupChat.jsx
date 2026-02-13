import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getGroupMessages } from "../services/api";
import { io } from "socket.io-client";
import { FiSend } from "react-icons/fi";
import "../styles/chat.css";

const SOCKET_URL = "http://localhost:5000";

const GroupChat = ({ groupId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

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
    inputRef.current?.focus();
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

  // Group messages by date
  const getDateKey = (dateStr) => new Date(dateStr).toDateString();

  if (loading) return <div className="chat-loading">Loading chat...</div>;

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe =
              (msg.sender?._id || msg.sender) === userId;
            const showDate =
              idx === 0 ||
              getDateKey(msg.createdAt) !==
                getDateKey(messages[idx - 1].createdAt);

            return (
              <div key={msg._id || idx}>
                {showDate && (
                  <div className="chat-date-separator">
                    <span>{formatDateSeparator(msg.createdAt)}</span>
                  </div>
                )}
                <div className={`chat-bubble-row ${isMe ? "me" : "other"}`}>
                  {!isMe && (
                    <div className="chat-avatar">
                      {(msg.sender?.name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={`chat-bubble ${isMe ? "me" : "other"}`}>
                    {!isMe && (
                      <span className="chat-sender-name">
                        {msg.sender?.name || "Unknown"}
                      </span>
                    )}
                    <p className="chat-text">{msg.text}</p>
                    <span className="chat-time">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          autoFocus
        />
        <button type="submit" className="chat-send-btn" disabled={!text.trim()}>
          <FiSend />
        </button>
      </form>
    </div>
  );
};

export default GroupChat;
