import { useState, useEffect, useRef } from "react";
import { getNotifications, markNotificationsRead } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import { FiBell, FiX, FiCheckCircle } from "react-icons/fi";
import "../styles/notifications.css";

const Notifications = () => {
  const [notes, setNotes] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const unread = notes.filter((n) => !n.isRead).length;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

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
    try {
      await markNotificationsRead();
      setNotes((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  };

  return (
    <div className="notif-wrapper" ref={wrapperRef}>
      <button className="notif-bell" onClick={() => setOpen(!open)}>
        <FiBell />
        {unread > 0 && <span className="notif-badge">{unread}</span>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="notif-panel"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="notif-header">
              <h3>Notifications</h3>
              <div className="notif-header-actions">
                {unread > 0 && (
                  <button className="mark-read-btn" onClick={handleMarkRead}>
                    <FiCheckCircle /> Mark all read
                  </button>
                )}
                <button className="close-btn" onClick={() => setOpen(false)}>
                  <FiX />
                </button>
              </div>
            </div>

            <div className="notif-list">
              {notes.length === 0 ? (
                <p className="notif-empty">No notifications</p>
              ) : (
                notes.map((n) => (
                  <div
                    key={n._id}
                    className={`notif-item ${n.isRead ? "" : "unread"}`}
                  >
                    <p>{n.message}</p>
                    <span className="notif-time">
                      {new Date(n.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;
