"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Expense {
  id: number;
  title: string;
  category: string;
  amount: number;
  paid_amount: number;
  pending_amount: number;
  payment_status: string;
  expense_date: string;
  supplier_id: number | null;
  supplier_name?: string;
  notes: string | null;
}

interface PaymentInfo {
  id: number;
  amount: number;
  payment_date: string;
  notes: string | null;
}

function formatCurrency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

function statusBadge(status: string) {
  const base = "inline-flex px-2 py-0.5 rounded text-xs font-medium";
  if (status === "paid") return `${base} bg-green-600/20 text-green-400`;
  if (status === "partial") return `${base} bg-yellow-600/20 text-yellow-400`;
  return `${base} bg-red-600/20 text-red-400`;
}

function PaymentModal({
  expenseId,
  onClose,
  onSaved,
}: {
  expenseId: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          expense_id: expenseId,
          amount: parseFloat(form.amount),
          payment_date: form.payment_date,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
        onClose();
      } else {
        setError(data.error || "Failed to add payment");
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
          Add Payment
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              value={form.payment_date}
              onChange={(e) =>
                setForm({ ...form, payment_date: e.target.value })
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
              {loading ? "Saving..." : "Add Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExpenseModal({
  expense,
  categories,
  suppliers,
  onClose,
  onSaved,
}: {
  expense?: Expense | null;
  categories: string[];
  suppliers: { id: number; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: "",
    category: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    supplier_id: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title,
        category: expense.category,
        amount: String(expense.amount),
        expense_date: expense.expense_date?.split("T")[0] || "",
        supplier_id: expense.supplier_id ? String(expense.supplier_id) : "",
        notes: expense.notes || "",
      });
    }
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const body = {
      title: form.title,
      category: form.category,
      amount: parseFloat(form.amount),
      expense_date: form.expense_date,
      supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
      notes: form.notes || null,
    };
    try {
      const url = expense ? `/api/expenses/${expense.id}` : "/api/expenses";
      const method = expense ? "PUT" : "POST";
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
        setError(data.error || "Failed to save expense");
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
          {expense ? "Edit Expense" : "Add Expense"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Date</label>
            <input
              type="date"
              value={form.expense_date}
              onChange={(e) =>
                setForm({ ...form, expense_date: e.target.value })
              }
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Supplier
            </label>
            <select
              value={form.supplier_id}
              onChange={(e) =>
                setForm({ ...form, supplier_id: e.target.value })
              }
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {suppliers.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
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
              {loading ? "Saving..." : expense ? "Update" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingExpenseId, setPayingExpenseId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      let url = "/api/expenses";
      const params = new URLSearchParams();
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const qs = params.toString();
      if (qs) url += "?" + qs;
      const [expRes, catRes, supRes] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/expense-categories", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/suppliers", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const expData = await expRes.json();
      const catData = await catRes.json();
      const supData = await supRes.json();
      if (expData.success) setExpenses(Array.isArray(expData.data) ? expData.data : (expData.data.expenses || []));
      if (catData.success) setCategories(Array.isArray(catData.data) ? catData.data : (catData.data.categories || []));
      if (supData.success)
        setSuppliers(
          supData.data.suppliers?.map((s: any) => ({
            id: s.id,
            name: s.name,
          })) || []
        );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch {
      // ignore
    }
  };

  const toggleExpand = async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setPaymentInfo([]);
      return;
    }
    setExpandedId(id);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/expenses/${id}/payment-info`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPaymentInfo(data.data.payments || []);
    } catch {
      setPaymentInfo([]);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Expenses</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm"
        >
          Add Expense
        </button>
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
              <th className="text-left px-4 py-3">Title</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-right px-4 py-3">Amount (₹)</th>
              <th className="text-right px-4 py-3">Paid (₹)</th>
              <th className="text-right px-4 py-3">Pending (₹)</th>
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
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-500">
                  No expenses found
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr
                  key={exp.id}
                  className="bg-slate-900/50 border-b border-slate-700/50 hover:bg-slate-800/50 cursor-pointer"
                  onClick={() => toggleExpand(exp.id)}
                >
                  <td className="px-4 py-3 text-slate-300">
                    {exp.expense_date?.split("T")[0]}
                  </td>
                  <td className="px-4 py-3 text-slate-100 font-medium">
                    {exp.title}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-700/50 text-slate-300">
                      {exp.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatCurrency(exp.paid_amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatCurrency(exp.pending_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(exp.payment_status)}>
                      {exp.payment_status.charAt(0).toUpperCase() + exp.payment_status.slice(1)}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        setEditing(exp);
                        setShowModal(true);
                      }}
                      className="text-amber-400 hover:text-amber-300 text-xs mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
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

      {/* Expanded payment info */}
      {expandedId !== null && (
        <div className="mt-4 bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-300">
              Payment Info
            </h3>
            <button
              onClick={() => {
                setPayingExpenseId(expandedId);
                setShowPaymentModal(true);
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs"
            >
              Add Payment
            </button>
          </div>
          {paymentInfo.length === 0 ? (
            <p className="text-slate-500 text-xs">No payments recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-right px-3 py-2">Amount (₹)</th>
                    <th className="text-left px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentInfo.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-slate-700/30 hover:bg-slate-800/30"
                    >
                      <td className="px-3 py-2 text-slate-300">
                        {p.payment_date?.split("T")[0]}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-300">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-3 py-2 text-slate-400">
                        {p.notes || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <ExpenseModal
          expense={editing}
          categories={categories}
          suppliers={suppliers}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSaved={fetchData}
        />
      )}

      {showPaymentModal && payingExpenseId !== null && (
        <PaymentModal
          expenseId={payingExpenseId}
          onClose={() => {
            setShowPaymentModal(false);
            setPayingExpenseId(null);
          }}
          onSaved={() => {
            if (expandedId) toggleExpand(expandedId);
            fetchData();
          }}
        />
      )}
    </div>
  );
}