import { useState, useEffect } from "react";
import { getMySettlements } from "../services/api";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { CheckCircle2, ArrowRight, Wallet, History } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-8">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Wallet className="h-8 w-8 text-primary" />
          Settlements
        </h1>
        <p className="text-muted-foreground">History of payments between you and your friends.</p>
      </div>

      {settlements.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
          <div className="rounded-full bg-muted p-4 mb-4">
            <History className="h-8 w-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-lg font-medium">No settlements found</h3>
          <p className="text-muted-foreground text-sm max-w-xs mt-1">
            When you or your friends settle up expenses, the records will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {settlements.map((s, idx) => {
            const isPayer = s.from?._id === (user?.id || user?._id);
            return (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={cn(
                  "overflow-hidden transition-all hover:shadow-md border-l-4",
                  isPayer ? "border-l-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-900/10" : "border-l-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10"
                )}>
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        isPayer ? "bg-rose-100 text-rose-600 dark:bg-rose-900/20" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20"
                      )}>
                        <CheckCircle2 className="h-5 w-5" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-base font-medium flex-wrap">
                          <span className={cn(isPayer && "font-bold")}>{s.from?.name}</span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className={cn(!isPayer && "font-bold")}>{s.to?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="bg-secondary px-2 py-0.5 rounded text-secondary-foreground font-medium">
                            {s.group?.name || "Personal"}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(s.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={cn(
                      "text-xl font-bold self-end sm:self-center",
                      isPayer ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {isPayer ? "-" : "+"}₹{s.amount?.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Settlements;
