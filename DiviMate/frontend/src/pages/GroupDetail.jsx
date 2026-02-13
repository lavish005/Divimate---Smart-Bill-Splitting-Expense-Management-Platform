import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  getGroupExpenses,
  addExpense,
  addMember,
  inviteMemberByEmail,
  getGroupSettlements,
  createSettlement,
  getGroupChartData,
  blockMember,
  unblockMember,
} from "../services/api";
import { getMyGroups } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiUserPlus,
  FiDollarSign,
  FiCheckCircle,
  FiMessageSquare,
  FiTrendingUp,
  FiBarChart2,
  FiUsers,
  FiSlash,
  FiRefreshCw,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import GroupChat from "../components/GroupChat";
import "../styles/groupDetail.css";

const CHART_COLORS = ["#6c5ce7", "#00cec9", "#ff6b6b", "#fdcb6e", "#a29bfe", "#55efc4"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        <p className="chart-tooltip-value">₹{payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

const GroupDetail = () => {
  const { groupId } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [tab, setTab] = useState("expenses");
  const [chartView, setChartView] = useState("weekly");

  // Add expense modal
  const [showExpense, setShowExpense] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  // Add member modal
  const [showMember, setShowMember] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [inviteTab, setInviteTab] = useState("email");
  const [memberUserId, setMemberUserId] = useState("");

  // Settle modal
  const [showSettle, setShowSettle] = useState(false);
  const [settleTo, setSettleTo] = useState("");
  const [settleAmount, setSettleAmount] = useState("");

  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [grpRes, expRes, setRes, chartRes] = await Promise.all([
        getMyGroups(),
        getGroupExpenses(groupId),
        getGroupSettlements(groupId),
        getGroupChartData(groupId),
      ]);
      const grp = grpRes.data.find((g) => g._id === groupId);
      setGroup(grp);
      setExpenses(expRes.data);
      setSettlements(setRes.data);
      setChartData(chartRes.data);
    } catch (err) {
      toast.error("Failed to load group data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await addExpense({
        groupId,
        title,
        amount: Number(amount),
        paidBy: user.id || user._id,
      });
      toast.success("Expense added!");
      setShowExpense(false);
      setTitle("");
      setAmount("");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to add expense");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      if (inviteTab === "email") {
        const res = await inviteMemberByEmail({ groupId, email: memberEmail });
        toast.success(res.data.msg);
        setMemberEmail("");
      } else {
        await addMember({ groupId, userId: memberUserId });
        toast.success("Member added!");
        setMemberUserId("");
      }
      setShowMember(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to add member");
    }
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    try {
      await createSettlement({
        groupId,
        to: settleTo,
        amount: Number(settleAmount),
      });
      toast.success("Settlement recorded!");
      setShowSettle(false);
      setSettleTo("");
      setSettleAmount("");
      fetchData();
    } catch (err) {
    

  const handleBlockMember = async (memberId) => {
    try {
      await blockMember({ groupId, memberId });
      toast.success("Member blocked");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to block member");
    }
  };

  const handleUnblockMember = async (memberId) => {
    try {
      await unblockMember({ groupId, memberId });
      toast.success("Member unblocked");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to unblock member");
    }
  };  toast.error(err.response?.data?.msg || "Failed to settle");
    }
  };

  if (loading)
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
        <p>Loading group...</p>
      </div>
    );
  if (!group) return <div className="page-loader">Group not found</div>;

  const isAdmin =
    group.admin?._id === (user?.id || user?._id) ||
    group.admin === (user?.id || user?._id);

  const totalGroupSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const { weeklyData, monthlyData, memberData } = chartData || {};

  return (
    <div className="group-detail-page">
      {/* ── Hero Header ── */}
      <motion.div
        className="gd-hero"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="gd-hero-left">
          <h1>{group.name}</h1>
          {group.description && <p className="gd-desc">{group.description}</p>}
          <div className="gd-stats-row">
            <div className="gd-mini-stat">
              <FiUsers size={14} />
              <span>{group.members?.length || 0} members</span>
            </div>
            <div className="gd-mini-stat">
              <FiDollarSign size={14} />
              <span>₹{totalGroupSpent.toFixed(2)} total</span>
            </div>
            <div className="gd-mini-stat">
              <FiCheckCircle size={14} />
              <span>{settlements.length} settlements</span>
            </div>
          </div>
        </div>
        <div className="gd-actions">
          {isAdmin && (
            <button className="btn-outline" onClick={() => setShowMember(true)}>
              <FiUserPlus /> Add Member
            </button>
          )}
          <button className="btn-primary" onClick={() => setShowExpense(true)}>
            <FiPlus /> Add Expense
          </button>
          <button className="btn-settle" onClick={() => setShowSettle(true)}>
            <FiCheckCircle /> Settle Up
          </button>
        </div>
      </motion.div>

      {/* Members */}
      <div className="members-strip">
        {group.members?.map((m) => {
          const currentUserId = user?.id || user?._id;
          const mUserId = m.userId?._id || m.userId;
          const isCurrentUserAdmin = isAdmin;
          const isSelf = mUserId === currentUserId;

          return (
            <span
              key={mUserId}
              className={`member-chip ${m.blocked ? "blocked" : ""}`}
            >
              <span className="member-avatar">
                {(m.name || "?").charAt(0).toUpperCase()}
              </span>
              {m.name}
              <span className={`diet-dot ${m.type === "Veg" ? "veg" : "nonveg"}`} />
              {m.blocked && <span className="blocked-badge">Blocked</span>}
              {isCurrentUserAdmin && !isSelf && (
                <button
                  className="member-action-btn"
                  onClick={() =>
                    m.blocked
                      ? handleUnblockMember(mUserId)
                      : handleBlockMember(mUserId)
                  }
                  title={m.blocked ? "Unblock member" : "Block member"}
                >
                  {m.blocked ? <FiRefreshCw size={14} /> : <FiSlash size={14} />}
                </button>
              )}
            </span>
          );
        })}
      </div>

      {/* ── Charts Section ── */}
      <div className="gd-charts-section">
        <div className="chart-card gd-main-chart">
          <div className="chart-header">
            <div className="chart-title-row">
              <FiTrendingUp className="chart-title-icon" />
              <h3>Group Spending</h3>
            </div>
            <div className="chart-toggle">
              <button
                className={`toggle-btn ${chartView === "weekly" ? "active" : ""}`}
                onClick={() => setChartView("weekly")}
              >
                Weekly
              </button>
              <button
                className={`toggle-btn ${chartView === "monthly" ? "active" : ""}`}
                onClick={() => setChartView("monthly")}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="chart-body">
            {chartView === "weekly" ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={weeklyData || []}>
                  <defs>
                    <linearGradient id="colorGrp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00cec9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00cec9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" stroke="#8b8fa3" fontSize={12} tickLine={false} />
                  <YAxis stroke="#8b8fa3" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#00cec9"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorGrp)"
                    dot={{ fill: "#00cec9", r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, stroke: "#00cec9", strokeWidth: 2, fill: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#8b8fa3" fontSize={12} tickLine={false} />
                  <YAxis stroke="#8b8fa3" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {(monthlyData || []).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Per-member Breakdown */}
        {memberData && memberData.length > 0 && (
          <div className="chart-card gd-side-chart">
            <div className="chart-header">
              <div className="chart-title-row">
                <FiBarChart2 className="chart-title-icon" />
                <h3>Per Member</h3>
              </div>
            </div>
            <div className="chart-body pie-body">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={memberData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {memberData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => `₹${val.toFixed(2)}`}
                    contentStyle={{
                      background: "#1a1d28",
                      border: "1px solid #2a2e3f",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {memberData.map((m, i) => (
                  <div key={m.name} className="pie-legend-item">
                    <span
                      className="pie-dot"
                      style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="pie-label">{m.name}</span>
                    <span className="pie-val">₹{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${tab === "expenses" ? "active" : ""}`}
          onClick={() => setTab("expenses")}
        >
          <FiDollarSign /> Expenses
          <span className="tab-count">{expenses.length}</span>
        </button>
        <button
          className={`tab ${tab === "settlements" ? "active" : ""}`}
          onClick={() => setTab("settlements")}
        >
          <FiCheckCircle /> Settlements
          <span className="tab-count">{settlements.length}</span>
        </button>
        <button
          className={`tab ${tab === "chat" ? "active" : ""}`}
          onClick={() => setTab("chat")}
        >
          <FiMessageSquare /> Chat
        </button>
      </div>

      {/* Expenses Tab */}
      {tab === "expenses" && (
        <div className="expense-list">
          {expenses.length === 0 ? (
            <div className="empty-state">
              <FiDollarSign size={40} />
              <p>No expenses yet. Add one to get started!</p>
            </div>
          ) : (
            expenses.map((exp, idx) => (
              <motion.div
                key={exp._id}
                className="expense-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <div className="exp-icon-wrap">
                  <FiDollarSign />
                </div>
                <div className="exp-left">
                  <h4>{exp.title}</h4>
                  <p className="exp-date">
                    {new Date(exp.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
                <div className="exp-right">
                  <p className="exp-amount">₹{exp.amount?.toFixed(2)}</p>
                  <p className="exp-payer">
                    Paid by {exp.paidBy?.name || "Unknown"}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Settlements Tab */}
      {tab === "settlements" && (
        <div className="settlement-list">
          {settlements.length === 0 ? (
            <div className="empty-state">
              <FiCheckCircle size={40} />
              <p>No settlements yet.</p>
            </div>
          ) : (
            settlements.map((s, idx) => (
              <motion.div
                key={s._id}
                className="settlement-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <div className="settle-icon-wrap">
                  <FiCheckCircle />
                </div>
                <div className="settle-info">
                  <p>
                    <strong>{s.from?.name}</strong> paid{" "}
                    <strong>₹{s.amount?.toFixed(2)}</strong> to{" "}
                    <strong>{s.to?.name}</strong>
                  </p>
                  <span className="settle-date">
                    {new Date(s.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Chat Tab */}
      {tab === "chat" && <GroupChat groupId={groupId} />}

      {/* ── Modals ── */}
      <AnimatePresence>
        {showExpense && (
          <Modal onClose={() => setShowExpense(false)} title="Add Expense">
            <form onSubmit={handleAddExpense}>
              <input
                placeholder="Expense title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
              <input
                type="number"
                placeholder="Amount (₹)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                required
              />
              <p className="modal-note">You are the payer</p>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowExpense(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add</button>
              </div>
            </form>
          </Modal>
        )}

        {showMember && (
          <Modal onClose={() => setShowMember(false)} title="Add Member">
            <div className="invite-tabs">
              <button
                className={`invite-tab ${inviteTab === "email" ? "active" : ""}`}
                onClick={() => setInviteTab("email")}
                type="button"
              >
                Invite by Email
              </button>
              <button
                className={`invite-tab ${inviteTab === "id" ? "active" : ""}`}
                onClick={() => setInviteTab("id")}
                type="button"
              >
                Add by ID
              </button>
            </div>
            <form onSubmit={handleAddMember}>
              {inviteTab === "email" ? (
                <>
                  <input
                    type="email"
                    placeholder="Enter their email address"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="modal-note">
                    If they're on DiviMate, they'll be added instantly. Otherwise an invite email will be sent.
                  </p>
                </>
              ) : (
                <>
                  <input
                    placeholder="DiviMate User ID"
                    value={memberUserId}
                    onChange={(e) => setMemberUserId(e.target.value)}
                    required
                    autoFocus
                  />
                  <p className="modal-note">
                    Ask them to copy their ID from Profile page
                  </p>
                </>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowMember(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {inviteTab === "email" ? "Send Invite" : "Add"}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {showSettle && (
          <Modal onClose={() => setShowSettle(false)} title="Settle Up">
            <form onSubmit={handleSettle}>
              <select
                value={settleTo}
                onChange={(e) => setSettleTo(e.target.value)}
                required
              >
                <option value="">Select who you're paying</option>
                {group.members
                  ?.filter(
                    (m) =>
                      (m.userId?._id || m.userId) !== (user?.id || user?._id)
                  )
                  .map((m) => (
                    <option key={m.userId?._id || m.userId} value={m.userId?._id || m.userId}>
                      {m.name}
                    </option>
                  ))}
              </select>
              <input
                type="number"
                placeholder="Amount (₹)"
                value={settleAmount}
                onChange={(e) => setSettleAmount(e.target.value)}
                min="1"
                required
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowSettle(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Settle</button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Reusable Modal ── */
const Modal = ({ children, onClose, title }) => (
  <motion.div
    className="modal-overlay"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
  >
    <motion.div
      className="modal"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
    >
      <h2>{title}</h2>
      {children}
    </motion.div>
  </motion.div>
);

export default GroupDetail;
