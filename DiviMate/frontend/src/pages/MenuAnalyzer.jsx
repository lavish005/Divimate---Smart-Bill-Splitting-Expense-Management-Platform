import { useState } from "react";
import { analyzeMenu, addExpense } from "../services/api";
import { getMyGroups } from "../services/api";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiUpload, FiCpu } from "react-icons/fi";
import "../styles/menuAnalyzer.css";

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
    getMyGroups().then((r) => setGroups(r.data)).catch(() => {});
  }, []);

  // Auto-set paidBy to current user when group is selected
  useEffect(() => {
    if (groupId && user) {
      setPaidBy(user.id || user._id);
    }
  }, [groupId, user]);

  useEffect(() => {
    getMyGroups().then((r) => setGroups(r.data)).catch(() => {});
  }, []);

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
      const totalBill = 0; // We let backend calculate from the menu
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
    <div className="analyzer-page">
      <h1 className="page-title">
        <FiCpu /> AI Menu Analyzer
      </h1>
      <p className="page-sub">
        Upload a restaurant menu image and we&apos;ll auto-classify items and split the bill!
      </p>

      <form onSubmit={handleAnalyze} className="analyzer-form">
        <div className="upload-area" onClick={() => document.getElementById("menuInput").click()}>
          {preview ? (
            <img src={preview} alt="Menu preview" className="preview-img" />
          ) : (
            <div className="upload-placeholder">
              <FiUpload size={36} />
              <p>Click to upload menu image</p>
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

        <select value={groupId} onChange={(e) => setGroupId(e.target.value)} required>
          <option value="">Select a group</option>
          {groups.map((g) => (
            <option key={g._id} value={g._id}>
              {g.name}
            </option>
          ))}
        </select>

        {groupId && selectedGroup && (
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} required>
            <option value="">Who paid the bill?</option>
            {selectedGroup.members?.map((m) => (
              <option key={m.userId?._id || m.userId} value={m.userId?._id || m.userId}>
                {m.name}
              </option>
            ))}
          </select>
        )}

        <button type="submit" className="btn-primary full" disabled={loading}>
          {loading ? <span className="spinner" /> : "Analyze & Split"}
        </button>
      </form>

      {result && (
        <motion.div
          className="result-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2>Results for {result.group}</h2>

          <div className="result-block">
            <h3>Detected Items</h3>
            <div className="items-grid">
              {result.items?.map((item, i) => (
                <div key={i} className={`item-chip ${item.category === "Veg" ? "veg" : item.category === "Non-Veg" ? "nonveg" : "unknown"}`}>
                  {item.item} — ₹{item.price}{" "}
                  <span className="cat-badge">{item.category}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="result-block">
            <h3>Split Summary</h3>
            <p>Veg Total: ₹{result.split?.totalVeg} | Non-Veg Total: ₹{result.split?.totalNonVeg}</p>
            <p>Veg Share/Person: ₹{result.split?.vegShare} | Non-Veg Share/Person: ₹{result.split?.nonVegShare}</p>
            <div className="split-details">
              {result.split?.details?.map((d, i) => (
                <div key={i} className="split-row">
                  <span>{d.name}</span>
                  <span className={`diet-tag ${d.type === "Veg" ? "veg" : "nonveg"}`}>{d.type}</span>
                  <span className="split-amount">₹{d.amountOwed}</span>
                </div>
              ))}
            </div>
          </div>

          {result.paymentSummary?.transactions?.length > 0 && (
            <div className="result-block">
              <h3>Who Pays Whom</h3>
              {result.paymentSummary.transactions.map((t, i) => (
                <div key={i} className="pay-row">
                  <strong>{t.from}</strong> pays <strong>₹{t.amount}</strong> to <strong>{t.to}</strong>
                </div>
              ))}
            </div>
          )}

          <button
            className="btn-primary full"
            onClick={handleSaveExpense}
            disabled={saving}
            style={{ marginTop: 16 }}
          >
            {saving ? <span className="spinner" /> : "Save as Expense to Group"}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default MenuAnalyzer;
