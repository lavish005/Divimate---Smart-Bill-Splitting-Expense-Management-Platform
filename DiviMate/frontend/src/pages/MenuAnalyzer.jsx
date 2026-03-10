import { useState, useEffect } from "react";
import { analyzeMenu, addExpense } from "../services/api";
import { getMyGroups } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Upload, Cpu, Receipt, Check, AlertCircle, ChefHat, Wallet, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge"; // We need to create Badge or use utils
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const MenuAnalyzer = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [groupId, setGroupId] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyGroups().then((r) => setGroups(r.data)).catch(() => { });
  }, []);

  // Auto-set paidBy to current user when group is selected
  useEffect(() => {
    if (groupId && user) {
      setPaidBy(user.id || user._id);
    }
  }, [groupId, user]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) return toast.error("Upload a menu image");
    if (!groupId) return toast.error("Select a group");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("menuImage", file);
      formData.append("groupId", groupId);

      // Find payer name for the backend
      const selectedGroup = groups.find((g) => g._id === groupId);
      const payerMember = selectedGroup?.members?.find(
        (m) => (m.userId?._id || m.userId) === paidBy
      );

      formData.append("paidByUserId", paidBy);
      if (payerMember) {
        formData.append("paidByName", payerMember.name);
      }

      const { data } = await analyzeMenu(formData);
      setResult(data);
      toast.success("Menu analyzed!");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const selectedGroup = groups.find((g) => g._id === groupId);

  const handleSaveExpense = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await addExpense({
        groupId,
        title: `AI Split — ${result.group}`,
        amount: result.paymentSummary?.totalBill || 0,
        paidBy,
      });
      toast.success("Expense saved to the group!");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
          <Cpu className="h-8 w-8 text-primary" /> AI Menu Analyzer
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Upload a restaurant menu image and we'll automatically detect items, categorize them (Veg/Non-Veg), and split the bill among group members!
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-12">
        {/* Upload Form */}
        <div className={cn("space-y-6", result ? "md:col-span-5" : "md:col-span-8 md:col-start-3")}>
          <Card>
            <CardHeader>
              <CardTitle>Upload Menu</CardTitle>
              <CardDescription>Select group and payee details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors hover:bg-muted/50 relative overflow-hidden",
                    preview ? "border-primary/50" : "border-muted-foreground/25"
                  )}
                  onClick={() => document.getElementById("menuInput").click()}
                >
                  {preview ? (
                    <div className="relative h-48 w-full flex items-center justify-center">
                      <img src={preview} alt="Menu preview" className="max-h-full max-w-full object-contain rounded-md shadow-sm" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white font-medium flex items-center gap-2"><Upload className="h-4 w-4" /> Change Image</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Upload className="h-6 w-6" />
                      </div>
                      <p className="font-medium">Click to upload menu image</p>
                      <p className="text-xs">Supports JPG, PNG</p>
                    </div>
                  )}
                  <input
                    id="menuInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFile}
                    hidden
                  />
                </div>

                <div className="space-y-2">
                  <Label>Group</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    required
                  >
                    <option value="">Select a group</option>
                    {groups.map((g) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {groupId && selectedGroup && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <Label>Who paid?</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value)}
                      required
                    >
                      <option value="">Select member</option>
                      {selectedGroup.members?.map((m) => (
                        <option key={m.userId?._id || m.userId} value={m.userId?._id || m.userId}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze & Split"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {result && (
          <motion.div
            className="md:col-span-7 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Results</h2>
              <Badge variant="outline" className="text-sm font-medium px-3 py-1">
                {result.group}
              </Badge>
            </div>

            {/* Detected Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" /> Detected Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.items?.map((item, i) => (
                    <div
                      key={i}
                      className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border",
                        item.category === "Veg" ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400" :
                          item.category === "Non-Veg" ? "bg-rose-500/10 text-rose-700 border-rose-500/20 dark:text-rose-400" :
                            "bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400"
                      )}
                    >
                      <span>{item.item}</span>
                      <span className="font-semibold">₹{item.price}</span>
                      {item.category && <span className="text-[10px] uppercase font-bold opacity-70 border-l pl-2 ml-1 border-current">{item.category}</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Split Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ChefHat className="h-4 w-4 text-primary" /> Split Breakdown
                </CardTitle>
                <CardDescription className="flex gap-4 text-xs mt-1">
                  <span>Veg Total: <span className="font-medium text-foreground">₹{result.split?.totalVeg}</span></span>
                  <span>Non-Veg Total: <span className="font-medium text-foreground">₹{result.split?.totalNonVeg}</span></span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.split?.details?.map((d, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                        {d.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{d.name}</p>
                        <div className={cn(
                          "text-[10px] px-1.5 rounded-md inline-block font-medium",
                          d.type === "Veg" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                        )}>
                          {d.type}
                        </div>
                      </div>
                    </div>
                    <div className="font-bold">₹{d.amountOwed.toFixed(2)}</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Transactions */}
            {result.paymentSummary?.transactions?.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" /> Final Settlement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.paymentSummary.transactions.map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-sm p-2 border-b last:border-0 border-dashed">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.from}</span>
                        <span className="text-muted-foreground text-xs">pays</span>
                        <span className="font-medium">{t.to}</span>
                      </div>
                      <span className="font-bold text-primary">₹{t.amount}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Button
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSaveExpense}
              disabled={saving}
            >
              {saving ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" /> : <Check className="mr-2 h-5 w-5" />}
              Save as Group Expense
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MenuAnalyzer;
