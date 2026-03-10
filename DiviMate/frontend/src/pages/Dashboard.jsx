import { useState, useEffect } from "react";
import { getDashboard, getDashboardChartData } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart2,
  Calendar
} from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }} className="text-xs">
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

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
        </div>
        <div className="grid gap-4 md:grid-cols-7">
          <Skeleton className="col-span-4 h-[350px] rounded-xl" />
          <Skeleton className="col-span-3 h-[350px] rounded-xl" />
        </div>
      </div>
    );
  }

  const { totals, transactionHistory } = data || {};
  const { weeklyData, monthlyData, summaryData } = chartData || {};

  const netBalance = (totals?.totalGetBack || 0) - (totals?.totalOwe || 0);

  const sortedTransactions = [...(transactionHistory || [])].sort((a, b) => {
    switch (sortBy) {
      case "date-asc": return new Date(a.createdAt) - new Date(b.createdAt);
      case "date-desc": return new Date(b.createdAt) - new Date(a.createdAt);
      case "amount-high": return b.amount - a.amount;
      case "amount-low": return a.amount - b.amount;
      case "balance-high": return b.balance - a.balance;
      case "balance-low": return a.balance - b.balance;
      default: return 0;
    }
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Overview
          </h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}. Here's your financial summary.
          </p>
        </div>
        <div className={cn(
          "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          netBalance >= 0
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
        )}>
          {netBalance >= 0 ? "+" : ""}₹{Math.abs(netBalance).toFixed(2)} Net Balance
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totals?.totalSpent?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all groups
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">You Owe</CardTitle>
            <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">₹{totals?.totalOwe?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              To friends
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">You Get Back</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">₹{totals?.totalGetBack?.toFixed(2) || "0.00"}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From settlements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-7">
        {/* Main Chart */}
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1.5">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Spending Activity
              </CardTitle>
              <CardDescription>Visual breakdown of your expenses</CardDescription>
            </div>
            <div className="flex items-center rounded-lg border bg-muted p-1 text-muted-foreground">
              <button
                onClick={() => setChartView("weekly")}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition-all",
                  chartView === "weekly" && "bg-background text-foreground shadow-sm"
                )}
              >
                Weekly
              </button>
              <button
                onClick={() => setChartView("monthly")}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition-all",
                  chartView === "monthly" && "bg-background text-foreground shadow-sm"
                )}
              >
                Monthly
              </button>
            </div>
          </CardHeader>
          <CardContent className="pl-0">
            <div className="h-[300px] w-full">
              {chartView === "weekly" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradSpent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradOwe" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradGetback" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                    <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="spent" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#gradSpent)" />
                    <Area type="monotone" dataKey="owe" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#gradOwe)" />
                    <Area type="monotone" dataKey="getback" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#gradGetback)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="spent" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="owe" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="getback" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Overview Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Distribution
            </CardTitle>
            <CardDescription>Spending vs Income split</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full flex items-center justify-center">
              {summaryData && summaryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summaryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {summaryData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.name === "Your Spending" ? "#8b5cf6" :
                              entry.name === "You Owe" ? "#f43f5e" : "#10b981"
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val) => `₹${val.toFixed(2)}`}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground text-sm">No data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Transactions
            </CardTitle>
            <CardDescription>
              {transactionHistory?.length || 0} transactions in total
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline-block">Sort by:</span>
            <select
              className="h-8 w-[140px] rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="amount-high">Amt: High-Low</option>
              <option value="amount-low">Amt: Low-High</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {sortedTransactions.length > 0 ? (
            <div className="space-y-4">
              {sortedTransactions.map((tx) => (
                <div key={tx.expenseId} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors gap-3">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{tx.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
                          {tx.group || "Personal"}
                        </span>
                        <span>
                          {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end">
                    <span className="font-bold text-sm">₹{tx.amount?.toFixed(2)}</span>
                    <span className={cn(
                      "text-xs font-medium",
                      tx.balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                    )}>
                      {tx.balance >= 0 ? "+" : "-"}₹{Math.abs(tx.balance).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <BarChart2 className="h-12 w-12 opacity-20 mb-4" />
              <p className="text-sm">No transactions found</p>
              <p className="text-xs">Create a group and add expenses to see them here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
