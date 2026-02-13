import { useState, useEffect } from "react";
import { getDashboard, getDashboardChartData } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiArrowDownLeft,
  FiArrowUpRight,
  FiClock,
  FiTrendingUp,
  FiBarChart2,
  FiPieChart,
  FiArrowDown,
  FiArrowUp,
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
  Legend,
} from "recharts";
import "../styles/dashboard.css";

const CHART_COLORS = ["#6c5ce7", "#00cec9", "#ff6b6b", "#fdcb6e", "#a29bfe", "#55efc4"];
const LINE_COLORS = { spent: "#6c5ce7", owe: "#ff6b6b", getback: "#00cec9" };

const MultiLineTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color, fontSize: "0.85rem", margin: "2px 0" }}>
            {p.dataKey === "spent" ? "Spent" : p.dataKey === "owe" ? "You Owe" : "Get Back"}: ₹{p.value.toFixed(2)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState("weekly");
  const [sortBy, setSortBy] = useState("date-desc");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashRes, chartRes] = await Promise.all([
          getDashboard(),
          getDashboardChartData(),
        ]);
        setData(dashRes.data);
        setChartData(chartRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading)
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );

  const { totals, transactionHistory } = data || {};
  const { weeklyData, monthlyData, summaryData } = chartData || {};

  const netBalance = (totals?.totalGetBack || 0) - (totals?.totalOwe || 0);

  const sortedTransactions = [...(transactionHistory || [])].sort((a, b) => {
    switch (sortBy) {
      case "date-asc":
        return new Date(a.createdAt) - new Date(b.createdAt);
      case "date-desc":
        return new Date(b.createdAt) - new Date(a.createdAt);
      case "amount-high":
        return b.amount - a.amount;
      case "amount-low":
        return a.amount - b.amount;
      case "balance-high":
        return b.balance - a.balance;
      case "balance-low":
        return a.balance - b.balance;
      default:
        return 0;
    }
  });

  return (
    <div className="dashboard-page">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="page-title">
              Hey, {user?.name || "there"} <span className="wave">👋</span>
            </h1>
            <p className="dash-subtitle">Here's your spending overview</p>
          </div>
          <div className={`net-badge ${netBalance >= 0 ? "positive" : "negative"}`}>
            {netBalance >= 0 ? "+" : ""}₹{Math.abs(netBalance).toFixed(2)} net
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid">
          <motion.div
            className="stat-card spent"
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="stat-icon-wrap spent">
              <FiDollarSign />
            </div>
            <div className="stat-info">
              <span className="stat-label">Total Spent</span>
              <span className="stat-value">₹{totals?.totalSpent?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="stat-glow spent" />
          </motion.div>

          <motion.div
            className="stat-card owe"
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="stat-icon-wrap owe">
              <FiArrowDownLeft />
            </div>
            <div className="stat-info">
              <span className="stat-label">You Owe</span>
              <span className="stat-value red">₹{totals?.totalOwe?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="stat-glow owe" />
          </motion.div>

          <motion.div
            className="stat-card getback"
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="stat-icon-wrap getback">
              <FiArrowUpRight />
            </div>
            <div className="stat-info">
              <span className="stat-label">You Get Back</span>
              <span className="stat-value green">₹{totals?.totalGetBack?.toFixed(2) || "0.00"}</span>
            </div>
            <div className="stat-glow getback" />
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-card main-chart">
            <div className="chart-header">
              <div className="chart-title-row">
                <FiTrendingUp className="chart-title-icon" />
                <h3>Spending Trend</h3>
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
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={weeklyData || []}>
                    <defs>
                      <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6c5ce7" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6c5ce7" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradOwe" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ff6b6b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ff6b6b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradGetback" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00cec9" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#00cec9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="day" stroke="#8b8fa3" fontSize={12} tickLine={false} />
                    <YAxis stroke="#8b8fa3" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<MultiLineTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={32}
                      formatter={(v) => v === "spent" ? "Spent" : v === "owe" ? "You Owe" : "Get Back"}
                    />
                    <Area type="monotone" dataKey="spent" stroke="#6c5ce7" strokeWidth={2} fillOpacity={1} fill="url(#gradSpent)" dot={{ r: 3 }} />
                    <Area type="monotone" dataKey="owe" stroke="#ff6b6b" strokeWidth={2} fillOpacity={1} fill="url(#gradOwe)" dot={{ r: 3 }} />
                    <Area type="monotone" dataKey="getback" stroke="#00cec9" strokeWidth={2} fillOpacity={1} fill="url(#gradGetback)" dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="month" stroke="#8b8fa3" fontSize={12} tickLine={false} />
                    <YAxis stroke="#8b8fa3" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<MultiLineTooltip />} />
                    <Legend
                      verticalAlign="top"
                      height={32}
                      formatter={(v) => v === "spent" ? "Spent" : v === "owe" ? "You Owe" : "Get Back"}
                    />
                    <Bar dataKey="spent" fill="#6c5ce7" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="owe" fill="#ff6b6b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="getback" fill="#00cec9" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Summary Pie Chart */}
          {summaryData && summaryData.length > 0 && (
            <div className="chart-card side-chart">
              <div className="chart-header">
                <div className="chart-title-row">
                  <FiPieChart className="chart-title-icon" />
                  <h3>Overview</h3>
                </div>
              </div>
              <div className="chart-body pie-body">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={summaryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {summaryData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.name === "Your Spending" ? "#6c5ce7" :
                            entry.name === "You Owe" ? "#ff6b6b" : "#00cec9"
                          }
                        />
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
                  {summaryData.map((item) => (
                    <div key={item.name} className="pie-legend-item">
                      <span
                        className="pie-dot"
                        style={{
                          background:
                            item.name === "Your Spending" ? "#6c5ce7" :
                            item.name === "You Owe" ? "#ff6b6b" : "#00cec9"
                        }}
                      />
                      <span className="pie-label">{item.name}</span>
                      <span className="pie-val">₹{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="section-header">
          <FiClock />
          <h2>Recent Transactions</h2>
          <span className="section-count">{transactionHistory?.length || 0}</span>
          <div className="sort-controls">
            <span className="sort-label">Sort by</span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="amount-high">Amount: High → Low</option>
              <option value="amount-low">Amount: Low → High</option>
              <option value="balance-high">Balance: High → Low</option>
              <option value="balance-low">Balance: Low → High</option>
            </select>
          </div>
        </div>

        {sortedTransactions.length ? (
          <div className="transaction-list">
            {sortedTransactions.map((tx, idx) => (
              <motion.div
                key={tx.expenseId}
                className="transaction-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <div className="tx-icon-wrap">
                  <FiDollarSign />
                </div>
                <div className="tx-left">
                  <h4>{tx.title}</h4>
                  <div className="tx-meta">
                    <span className="tx-group-badge">{tx.group || "Unknown group"}</span>
                    <span className="tx-date">
                      {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="tx-right">
                  <p className="tx-amount">₹{tx.amount?.toFixed(2)}</p>
                  <p className={`tx-balance ${tx.balance >= 0 ? "green" : "red"}`}>
                    {tx.balance >= 0
                      ? `+₹${tx.balance.toFixed(2)}`
                      : `-₹${Math.abs(tx.balance).toFixed(2)}`}
                  </p>
                  {tx.paidBy && <p className="tx-payer">Paid by {tx.paidBy.name}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FiBarChart2 size={48} />
            <p>No transactions yet. Create a group and add expenses!</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Dashboard;
