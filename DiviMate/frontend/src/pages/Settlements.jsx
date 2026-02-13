import { useState, useEffect } from "react";
import { getMySettlements } from "../services/api";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { FiCheckCircle, FiArrowRight } from "react-icons/fi";
import "../styles/settlements.css";

const Settlements = () => {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getMySettlements();
        setSettlements(data);
      } catch {
        console.error("Failed to load settlements");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="page-loader">Loading settlements...</div>;

  return (
    <div className="settlements-page">
      <h1 className="page-title">
        <FiCheckCircle /> Your Settlements
      </h1>

      {settlements.length === 0 ? (
        <div className="empty-state">No settlements yet.</div>
      ) : (
        <div className="settlement-list">
          {settlements.map((s) => {
            const isPayer =
              s.from?._id === (user?.id || user?._id);
            return (
              <motion.div
                key={s._id}
                className={`settlement-card ${isPayer ? "paid" : "received"}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="settle-info">
                  <span className="settle-from">{s.from?.name}</span>
                  <FiArrowRight className="arrow" />
                  <span className="settle-to">{s.to?.name}</span>
                </div>
                <div className="settle-meta">
                  <span className="settle-amount">₹{s.amount?.toFixed(2)}</span>
                  <span className="settle-group">{s.group?.name}</span>
                  <span className="settle-date">
                    {new Date(s.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Settlements;
