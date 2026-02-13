import { useState, useEffect } from "react";
import { getMyGroups, createGroup } from "../services/api";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FiPlus, FiUsers, FiChevronRight } from "react-icons/fi";
import "../styles/groups.css";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      const { data } = await getMyGroups();
      setGroups(data);
    } catch (err) {
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Group name is required");
    try {
      await createGroup({ name, description });
      toast.success("Group created!");
      setShowModal(false);
      setName("");
      setDescription("");
      fetchGroups();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to create group");
    }
  };

  if (loading) return <div className="page-loader">Loading groups...</div>;

  return (
    <div className="groups-page">
      <div className="page-header">
        <h1 className="page-title">Your Groups</h1>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus /> New Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <FiUsers size={48} />
          <p>No groups yet. Create one to start splitting!</p>
        </div>
      ) : (
        <div className="group-grid">
          {groups.map((g) => (
            <motion.div
              key={g._id}
              className="group-card"
              onClick={() => navigate(`/groups/${g._id}`)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="group-card-top">
                <h3>{g.name}</h3>
                <FiChevronRight />
              </div>
              <p className="group-desc">{g.description || "No description"}</p>
              <div className="group-meta">
                <span className="member-count">
                  <FiUsers /> {g.members?.length || 0} members
                </span>
                <span className="admin-badge">
                  Admin: {g.admin?.name || "You"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Create New Group</h2>
              <form onSubmit={handleCreate}>
                <input
                  type="text"
                  placeholder="Group name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Groups;
