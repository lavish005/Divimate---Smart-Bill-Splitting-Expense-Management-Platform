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
  getMyGroups,
  getGroupBalances,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  Plus,
  UserPlus,
  DollarSign,
  CheckCircle2,
  MessageSquare,
  TrendingUp,
  BarChart2,
  Users,
  Ban,
  RefreshCw,
  MoreVertical,
  Wallet,
  ArrowRight
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
} from "recharts";
import GroupChat from "../components/GroupChat";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["#8b5cf6", "#10b981", "#f43f5e", "#f59e0b", "#a78bfa", "#34d399"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-primary">₹{payload[0].value.toFixed(2)}</p>
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
  const [balances, setBalances] = useState({ youOwe: [], youAreOwed: [], allBalances: [] });
  const [chartData, setChartData] = useState(null);
  const [chartView, setChartView] = useState("weekly");

  // Modals state
  const [showExpense, setShowExpense] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [showSettle, setShowSettle] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");

  const [memberEmail, setMemberEmail] = useState("");
  const [inviteTab, setInviteTab] = useState("email");
  const [memberUserId, setMemberUserId] = useState("");

  const [settleTo, setSettleTo] = useState("");
  const [settleAmount, setSettleAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [grpRes, expRes, setRes, chartRes, balRes] = await Promise.all([
        getMyGroups(),
        getGroupExpenses(groupId),
        getGroupSettlements(groupId),
        getGroupChartData(groupId),
        getGroupBalances(groupId),
      ]);
      const grp = grpRes.data.find((g) => g._id === groupId);
      setGroup(grp);
      setExpenses(expRes.data);
      setSettlements(setRes.data);
      setChartData(chartRes.data);
      setBalances(balRes.data);
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
    setActionLoading(true);
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
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setActionLoading(true);
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
    } finally {
      setActionLoading(false);
    }
  };

  const handleSettle = async (e) => {
    e.preventDefault();
    setActionLoading(true);
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
      toast.error(err.response?.data?.msg || "Failed to settle");
    } finally {
      setActionLoading(false);
    }
  };

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
  };

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );

  if (!group) return <div className="text-center py-10">Group not found</div>;

  const isAdmin =
    group.admin?._id === (user?.id || user?._id) ||
    group.admin === (user?.id || user?._id);

  const totalGroupSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const { weeklyData, monthlyData, memberData } = chartData || {};

  return (
    <div className="space-y-6 pb-10 animate-in fade-in zoom-in-95 duration-500">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-emerald-400 to-primary" />
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{group.name}</h1>
              <p className="text-muted-foreground">{group.description || "No description provided."}</p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-1.5 text-sm font-medium bg-secondary px-2.5 py-1 rounded-md">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{group.members?.length || 0} members</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium bg-secondary px-2.5 py-1 rounded-md">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span>₹{totalGroupSpent.toFixed(2)} total spent</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm font-medium bg-secondary px-2.5 py-1 rounded-md">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span>{settlements.length} settlements</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => setShowMember(true)}>
                  <UserPlus className="mr-2 h-4 w-4" /> Add Member
                </Button>
              )}
              <Button size="sm" onClick={() => setShowExpense(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setShowSettle(true)} className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400">
                <CheckCircle2 className="mr-2 h-4 w-4" /> Settle Up
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Members Strip */}
      <div className="flex flex-wrap gap-2">
        {group.members?.map((m) => {
          const currentUserId = user?.id || user?._id;
          const mUserId = m.userId?._id || m.userId;
          const isCurrentUserAdmin = isAdmin;
          const isSelf = mUserId === currentUserId;

          return (
            <div
              key={mUserId}
              className={cn(
                "group relative flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm shadow-sm transition-all hover:border-primary/50",
                m.blocked && "opacity-60 bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30"
              )}
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-400 text-[10px] font-bold text-white">
                {(m.name || "?").charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{m.name}</span>
              <span className={cn(
                "h-2 w-2 rounded-full",
                m.type === "Veg" ? "bg-emerald-500" : "bg-rose-500"
              )} title={m.type} />

              {m.blocked && <span className="text-[10px] font-bold text-rose-500 uppercase ml-1">Blocked</span>}

              {isCurrentUserAdmin && !isSelf && (
                <button
                  className="ml-1 rounded p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => m.blocked ? handleUnblockMember(mUserId) : handleBlockMember(mUserId)}
                  title={m.blocked ? "Unblock member" : "Block member"}
                >
                  {m.blocked ? <RefreshCw className="h-3 w-3" /> : <Ban className="h-3 w-3" />}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Charts Section ── */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Spending Trend
              </CardTitle>
            </div>
            <div className="flex items-center rounded-lg border bg-muted p-1 text-muted-foreground">
              <button
                onClick={() => setChartView("weekly")}
                className={cn("rounded px-2 py-0.5 text-xs font-medium transition-all", chartView === "weekly" && "bg-background text-foreground shadow-sm")}
              >
                Weekly
              </button>
              <button
                onClick={() => setChartView("monthly")}
                className={cn("rounded px-2 py-0.5 text-xs font-medium transition-all", chartView === "monthly" && "bg-background text-foreground shadow-sm")}
              >
                Monthly
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-4 px-0">
            <div className="h-[250px] w-full">
              {chartView === "weekly" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData || []} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGrp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                    <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorGrp)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData || []} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {memberData && memberData.length > 0 && (
          <Card className="md:col-span-3">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-primary" />
                Per Member
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={memberData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {memberData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => `₹${val.toFixed(2)}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {memberData.map((m, i) => (
                    <div key={m.name} className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="truncate text-muted-foreground">{m.name}</span>
                      <span className="ml-auto font-medium">₹{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs defaultValue="balances" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
        </TabsList>

        {/* ── Balances Tab ── */}
        <TabsContent value="balances" className="mt-4 space-y-6">
          {/* What You Owe */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ArrowRight className="h-5 w-5" />
              You Owe
            </h3>
            {balances.youOwe?.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                  <p>You're all settled up! 🎉</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {balances.youOwe?.map((debt, idx) => (
                  <motion.div
                    key={`owe-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="border-l-4 border-l-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/10 transition-colors">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 shrink-0">
                            <span className="font-bold text-sm">{debt.toName?.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium">
                              Pay <span className="font-bold">{debt.toName}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">Pending payment</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-rose-600 dark:text-rose-400">
                            ₹{debt.amount.toFixed(2)}
                          </span>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => {
                              setSettleTo(debt.to);
                              setSettleAmount(debt.amount.toString());
                              setShowSettle(true);
                            }}
                          >
                            Settle
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* What You're Owed */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Wallet className="h-5 w-5" />
              You're Owed
            </h3>
            {balances.youAreOwed?.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No one owes you anything in this group.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {balances.youAreOwed?.map((credit, idx) => (
                  <motion.div
                    key={`owed-${idx}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="border-l-4 border-l-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 shrink-0">
                            <span className="font-bold text-sm">{credit.fromName?.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium">
                              <span className="font-bold">{credit.fromName}</span> owes you
                            </p>
                            <p className="text-xs text-muted-foreground">Waiting for payment</p>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{credit.amount.toFixed(2)}
                        </span>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4 space-y-4">
          {expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No expenses recorded yet.</p>
              <Button variant="link" onClick={() => setShowExpense(true)}>Add your first expense</Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {expenses.map((exp, idx) => {
                const currentUserId = user?.id || user?._id;
                const isPayer = (exp.paidBy?._id || exp.paidBy) === currentUserId;
                const myShare = exp.participants?.find(
                  (p) => (p.userId?._id || p.userId) === currentUserId
                )?.share || 0;
                const totalMembers = exp.participants?.length || 1;

                return (
                  <motion.div
                    key={exp._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card className={cn(
                      "overflow-hidden transition-colors border-l-4",
                      isPayer 
                        ? "border-l-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10" 
                        : "border-l-primary hover:bg-accent/50"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                              isPayer ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30" : "bg-primary/10 text-primary"
                            )}>
                              <DollarSign className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-semibold">{exp.title}</h4>
                              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="bg-secondary px-1.5 py-0.5 rounded font-medium">
                                  {isPayer ? "You paid" : `${exp.paidBy?.name || "Unknown"} paid`}
                                </span>
                                <span>•</span>
                                <span>Split among {totalMembers} people</span>
                                <span>•</span>
                                <span>
                                  {new Date(exp.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                </span>
                              </div>
                              <div className="text-xs mt-1">
                                {isPayer ? (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    You get back ₹{(exp.amount - myShare).toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-rose-600 dark:text-rose-400 font-medium">
                                    Your share: ₹{myShare.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-lg">₹{exp.amount?.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground">total</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settlements" className="mt-4 space-y-4">
          {settlements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No settlements recorded yet.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {settlements.map((s, idx) => (
                <motion.div
                  key={s._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className="overflow-hidden hover:bg-emerald-500/5 transition-colors border-l-4 border-l-emerald-500">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 text-sm">
                          <span className="font-semibold">{s.from?.name}</span>
                          <span className="text-muted-foreground">paid</span>
                          <span className="font-semibold">{s.to?.name}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600">₹{s.amount?.toFixed(2)}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(s.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="chat" className="mt-4">
          <GroupChat groupId={groupId} />
        </TabsContent>
      </Tabs>

      {/* ── Add Expense Dialog ── */}
      <Dialog open={showExpense} onOpenChange={setShowExpense}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Add a new expense to split with the group.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddExpense}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Dinner, Taxi"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    className="pl-7"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Paid by <span className="font-medium text-foreground">{user?.name}</span> and split equally.
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? "Adding..." : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add Member Dialog ── */}
      <Dialog open={showMember} onOpenChange={setShowMember}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>Invite friends to this group.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="email" className="w-full" onValueChange={(val) => setInviteTab(val)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">By Email</TabsTrigger>
              <TabsTrigger value="id">By ID</TabsTrigger>
            </TabsList>
            <form onSubmit={handleAddMember}>
              <TabsContent value="email" className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="friend@example.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    required={inviteTab === "email"}
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send an invite link if they aren't on DiviMate yet.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="id" className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label>User ID</Label>
                  <Input
                    placeholder="Paste User ID here"
                    value={memberUserId}
                    onChange={(e) => setMemberUserId(e.target.value)}
                    required={inviteTab === "id"}
                  />
                  <p className="text-xs text-muted-foreground">
                    Found in their Profile page.
                  </p>
                </div>
              </TabsContent>
              <DialogFooter>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? "Sending..." : (inviteTab === "email" ? "Send Invite" : "Add Member")}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* ── Settle Up Dialog ── */}
      <Dialog open={showSettle} onOpenChange={setShowSettle}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settle Up</DialogTitle>
            <DialogDescription>Record a payment to settle your dues.</DialogDescription>
          </DialogHeader>
          
          {/* Quick Settle Suggestions */}
          {balances.youOwe?.length > 0 && (
            <div className="space-y-2 pb-2 border-b">
              <p className="text-xs font-medium text-muted-foreground">Quick settle your dues:</p>
              <div className="flex flex-wrap gap-2">
                {balances.youOwe.map((debt) => (
                  <Button
                    key={debt.to}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "text-xs",
                      settleTo === debt.to && "border-primary bg-primary/10"
                    )}
                    onClick={() => {
                      setSettleTo(debt.to);
                      setSettleAmount(debt.amount.toString());
                    }}
                  >
                    {debt.toName}: ₹{debt.amount.toFixed(2)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSettle}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Pay to</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={settleTo}
                  onChange={(e) => {
                    setSettleTo(e.target.value);
                    // Auto-fill amount if user owes this person
                    const debt = balances.youOwe?.find(d => d.to === e.target.value);
                    if (debt) {
                      setSettleAmount(debt.amount.toString());
                    }
                  }}
                  required
                >
                  <option value="">Select member</option>
                  {group.members
                    ?.filter(m => (m.userId?._id || m.userId) !== (user?.id || user?._id))
                    .map(m => {
                      const memberId = m.userId?._id || m.userId;
                      const debt = balances.youOwe?.find(d => d.to === memberId);
                      return (
                        <option key={memberId} value={memberId}>
                          {m.name} {debt ? `(You owe ₹${debt.amount.toFixed(2)})` : ""}
                        </option>
                      );
                    })
                  }
                </select>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    className="pl-7"
                    placeholder="0.00"
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                {settleTo && balances.youOwe?.find(d => d.to === settleTo) && (
                  <p className="text-xs text-muted-foreground">
                    Max owed: ₹{balances.youOwe.find(d => d.to === settleTo).amount.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={actionLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {actionLoading ? "Recording..." : "Record Settlement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupDetail;
