"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Sale {
  id: number;
  sale_date: string;
  sale_type: string;
  platform: string | null;
  gross_amount: number;
  commission_percent: number | null;
  commission_amount: number | null;
  net_amount: number | null;
  settlement_status: string;
  notes: string | null;
  expected_settlement_date: string | null;
}

const saleTypes = ["cash", "gp", "swiggy", "zomato"];
const platforms = ["swiggy", "zomato"];

function formatCurrency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

function SaleModal({
  sale,
  onClose,
  onSaved,
}: {
  sale?: Sale | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    sale_date: "",
    sale_type: "cash",
    platform: "",
    gross_amount: "",
    commission_percent: "31",
    expected_settlement_date: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sale) {
      setForm({
        sale_date: sale.sale_date?.split("T")[0] || "",
        sale_type: sale.sale_type,
        platform: sale.platform || "",
        gross_amount: String(sale.gross_amount),
        commission_percent: String(sale.commission_percent ?? 31),
        expected_settlement_date: sale.expected_settlement_date?.split("T")[0] || "",
        notes: sale.notes || "",
      });
    } else {
      setForm({
        sale_date: new Date().toISOString().split("T")[0],
        sale_type: "cash",
        platform: "",
        gross_amount: "",
        commission_percent: "31",
        expected_settlement_date: "",
        notes: "",
      });
    }
  }, [sale]);

  const isOnline = form.sale_type === "swiggy" || form.sale_type === "zomato";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    const body: any = {
      sale_date: form.sale_date,
      sale_type: form.sale_type,
      gross_amount: parseFloat(form.gross_amount),
      notes: form.notes || null,
    };
    if (isOnline) {
      body.platform = form.platform;
      body.commission_percent = parseFloat(form.commission_percent);
      body.expected_settlement_date = form.expected_settlement_date || null;
    }

    try {
      const url = sale
        ? `/api/sales/${sale.id}`
        : "/api/sales";
      const method = sale ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
        onClose();
      } else {
        setError(data.error || "Failed to save sale");
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
          {sale ? "Edit Sale" : "Add Sale"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Date</label>
            <input
              type="date"
              value={form.sale_date}
              onChange={(e) => setForm({ ...form, sale_date: e.target.value })}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Type</label>
            <select
              value={form.sale_type}
              onChange={(e) => setForm({ ...form, sale_type: e.target.value })}
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            >
              {saleTypes.map((t) => (
                <option key={t} value={t}>
                  {t.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          {isOnline && (
            <>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Platform</label>
                <select
                  value={form.platform}
                  onChange={(e) => setForm({ ...form, platform: e.target.value })}
                  required
                  className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
                >
                  <option value="">Select platform</option>
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Commission %</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.commission_percent}
                  onChange={(e) =>
                    setForm({ ...form, commission_percent: e.target.value })
                  }
                  className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Expected Settlement Date
                </label>
                <input
                  type="date"
                  value={form.expected_settlement_date}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      expected_settlement_date: e.target.value,
                    })
                  }
                  className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Gross Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.gross_amount}
              onChange={(e) =>
                setForm({ ...form, gross_amount: e.target.value })
              }
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Notes</label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
              {loading ? "Saving..." : sale ? "Update" : "Add Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkEntryModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    cash: "",
    gp: "",
    swiggy: "",
    zomato: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");
    const entries: any[] = [];
    const typeFields: [string, string][] = [
      ["cash", form.cash],
      ["gp", form.gp],
      ["swiggy", form.swiggy],
      ["zomato", form.zomato],
    ];
    for (const [type, val] of typeFields) {
      const amt = parseFloat(val);
      if (!isNaN(amt) && amt > 0) {
        entries.push({
          sale_date: form.date,
          sale_type: type,
          gross_amount: amt,
          platform: type === "swiggy" || type === "zomato" ? type : null,
        });
      }
    }
    if (entries.length === 0) {
      setError("Enter at least one amount");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/sales/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ entries }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
        onClose();
      } else {
        setError(data.error || "Bulk entry failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/50 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Bulk Entry
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          {["cash", "gp", "swiggy", "zomato"].map((type) => (
            <div key={type}>
              <label className="block text-sm text-slate-400 mb-1">
                {type.charAt(0).toUpperCase() + type.slice(1)} (₹)
              </label>
              <input
                type="number"
                step="0.01"
                value={(form as any)[type]}
                onChange={(e) =>
                  setForm({ ...form, [type]: e.target.value })
                }
                placeholder="0.00"
                className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
              />
            </div>
          ))}
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
              {loading ? "Saving..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  const fetchSales = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      let url = "/api/sales";
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const qs = params.toString();
      if (qs) url += "?" + qs;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSales(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this sale?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/sales/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchSales();
    } catch {
      // ignore
    }
  };

  const typeBadge = (type: string) => {
    const base = "inline-flex px-2 py-0.5 rounded text-xs font-medium";
    if (type === "cash")
      return `${base} bg-green-600/20 text-green-400`;
    if (type === "gp")
      return `${base} bg-blue-600/20 text-blue-400`;
    return `${base} bg-orange-600/20 text-orange-400`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Sales</h1>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setEditing(null);
              setShowBulk(true);
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm"
          >
            Bulk Entry
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm"
          >
            Add Sale
          </button>
        </div>
      </div>

      {/* Date filters */}
      <div className="flex gap-4 mb-6 items-end">
        <div>
          <label className="block text-xs text-slate-400 mb-1">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
          />
        </div>
        {(fromDate || toDate) && (
          <button
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
            className="px-3 py-2 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-left px-4 py-3">Platform</th>
              <th className="text-right px-4 py-3">Gross (₹)</th>
              <th className="text-right px-4 py-3">Commission (₹)</th>
              <th className="text-right px-4 py-3">Net (₹)</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-500">
                  No sales found
                </td>
              </tr>
            ) : (
              sales.map((s) => (
                <tr
                  key={s.id}
                  className="bg-slate-900/50 border-b border-slate-700/50 hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3 text-slate-300">
                    {s.sale_date?.split("T")[0]}
                  </td>
                  <td className="px-4 py-3">
                    <span className={typeBadge(s.sale_type)}>
                      {s.sale_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {s.platform || "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatCurrency(s.gross_amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {s.commission_amount != null
                      ? formatCurrency(s.commission_amount)
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {s.net_amount != null
                      ? formatCurrency(s.net_amount)
                      : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-400 text-xs">{s.settlement_status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setEditing(s);
                        setShowModal(true);
                      }}
                      className="text-amber-400 hover:text-amber-300 text-xs mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <SaleModal
          sale={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSaved={fetchSales}
        />
      )}
      {showBulk && (
        <BulkEntryModal
          onClose={() => setShowBulk(false)}
          onSaved={fetchSales}
        />
      )}
    </div>
  );
}