"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Settlement {
  id: number;
  platform: string;
  period_from: string;
  period_to: string;
  expected_credit: number | null;
  actual_credit: number | null;
  gross_amount: number;
  estimated_commission: number | null;
  estimated_net: number | null;
  actual_amount_received: number | null;
  actual_commission: number | null;
  actual_credit_date: string | null;
  status: string;
  notes: string | null;
}

function formatCurrency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

function platformBadge(platform: string) {
  const base = "inline-flex px-2 py-0.5 rounded text-xs font-medium";
  if (platform.toLowerCase() === "swiggy")
    return `${base} bg-orange-600/20 text-orange-400`;
  if (platform.toLowerCase() === "zomato")
    return `${base} bg-red-600/20 text-red-400`;
  return `${base} bg-slate-600/20 text-slate-400`;
}

function statusBadge(status: string) {
  const base = "inline-flex px-2 py-0.5 rounded text-xs font-medium";
  if (status === "settled") return `${base} bg-green-600/20 text-green-400`;
  if (status === "pending") return `${base} bg-yellow-600/20 text-yellow-400`;
  if (status === "partial") return `${base} bg-blue-600/20 text-blue-400`;
  return `${base} bg-red-600/20 text-red-400`;
}

function SettlementEditModal({
  settlement,
  onClose,
  onSaved,
}: {
  settlement: Settlement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    status: settlement.status,
    actual_amount_received: settlement.actual_amount_received
      ? String(settlement.actual_amount_received)
      : "",
    actual_commission: settlement.actual_commission
      ? String(settlement.actual_commission)
      : "",
    actual_credit_date: settlement.actual_credit_date
      ? settlement.actual_credit_date.split("T")[0]
      : "",
    notes: settlement.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/settlements/${settlement.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: form.status,
          actual_amount_received: form.actual_amount_received
            ? parseFloat(form.actual_amount_received)
            : null,
          actual_commission: form.actual_commission
            ? parseFloat(form.actual_commission)
            : null,
          actual_credit_date: form.actual_credit_date || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
        onClose();
      } else {
        setError(data.error || "Failed to update settlement");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Edit Settlement
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            >
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="settled">Settled</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Actual Amount Received (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.actual_amount_received}
              onChange={(e) =>
                setForm({ ...form, actual_amount_received: e.target.value })
              }
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Actual Commission (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.actual_commission}
              onChange={(e) =>
                setForm({ ...form, actual_commission: e.target.value })
              }
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Actual Credit Date
            </label>
            <input
              type="date"
              value={form.actual_credit_date}
              onChange={(e) =>
                setForm({ ...form, actual_credit_date: e.target.value })
              }
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 text-slate-200 rounded text-sm hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SettlementsPage() {
  const router = useRouter();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState<Settlement | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  const fetchSettlements = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/settlements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSettlements(data.data.settlements || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const handleGenerate = async () => {
    if (
      !confirm(
        "Generate settlements from pending sales? This will create new settlement records."
      )
    )
      return;
    setGenerating(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/settlements/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchSettlements();
      else alert(data.error || "Generation failed");
    } catch {
      alert("Network error");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Settlements</h1>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Platform</th>
              <th className="text-left px-4 py-3">Period</th>
              <th className="text-right px-4 py-3">Expected Credit</th>
              <th className="text-right px-4 py-3">Actual Credit</th>
              <th className="text-right px-4 py-3">Gross (₹)</th>
              <th className="text-right px-4 py-3">Est. Commission (₹)</th>
              <th className="text-right px-4 py-3">Est. Net (₹)</th>
              <th className="text-right px-4 py-3">Actual Received (₹)</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Notes</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : settlements.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-slate-500">
                  No settlements found. Click "Generate" to create from pending
                  sales.
                </td>
              </tr>
            ) : (
              settlements.map((s) => (
                <tr
                  key={s.id}
                  className="bg-slate-900/50 border-b border-slate-700/50 hover:bg-slate-800/50 cursor-pointer"
                  onClick={() => setEditing(s)}
                >
                  <td className="px-4 py-3">
                    <span className={platformBadge(s.platform)}>
                      {s.platform}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-xs">
                    {s.period_from?.split("T")[0]} →{" "}
                    {s.period_to?.split("T")[0]}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {s.expected_credit != null
                      ? formatCurrency(s.expected_credit)
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {s.actual_credit != null
                      ? formatCurrency(s.actual_credit)
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatCurrency(s.gross_amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {s.estimated_commission != null
                      ? formatCurrency(s.estimated_commission)
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-100 font-semibold">
                    {s.estimated_net != null
                      ? formatCurrency(s.estimated_net)
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {s.actual_amount_received != null
                      ? formatCurrency(s.actual_amount_received)
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(s.status)}>
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {s.notes || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <SettlementEditModal
          settlement={editing}
          onClose={() => setEditing(null)}
          onSaved={fetchSettlements}
        />
      )}
    </div>
  );
}