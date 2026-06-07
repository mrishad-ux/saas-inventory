"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus } from "lucide-react";

interface Payment {
  id: number;
  expense_id: number;
  amount: number;
  payment_date: string;
  notes: string;
  created_at: string;
}

interface ExpenseOption {
  id: number;
  title: string;
  amount: number;
  paid_amount: number;
  pending_amount: number;
  payment_status: string;
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

function AddPaymentModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [expenses, setExpenses] = useState<ExpenseOption[]>([]);
  const [form, setForm] = useState({
    expense_id: "",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setExpenses(d.data);
      });
  }, []);

  const selectedExpense = expenses.find((e) => e.id === Number(form.expense_id));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          expense_id: Number(form.expense_id),
          amount: parseFloat(form.amount),
          payment_date: form.payment_date,
          notes: form.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSaved();
        onClose();
      } else {
        setError(data.error || "Failed to create payment");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Record Payment</h2>
        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Expense *</label>
            <select
              value={form.expense_id}
              onChange={(e) => setForm({ ...form, expense_id: e.target.value })}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select an expense...</option>
              {expenses.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.title} — Due: {formatCurrency(exp.pending_amount)}
                </option>
              ))}
            </select>
            {selectedExpense && (
              <div className="mt-2 flex gap-3 text-xs text-slate-400">
                <span>Total: {formatCurrency(selectedExpense.amount)}</span>
                <span>Paid: {formatCurrency(selectedExpense.paid_amount)}</span>
                <span className="text-amber-400">Pending: {formatCurrency(selectedExpense.pending_amount)}</span>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm"
              placeholder="0.00"
            />
            {selectedExpense && form.amount && Number(form.amount) > selectedExpense.pending_amount && (
              <p className="text-yellow-400 text-xs mt-1">
                Amount exceeds pending balance (₹{selectedExpense.pending_amount.toFixed(2)})
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Payment Date</label>
            <input
              type="date"
              value={form.payment_date}
              onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
              {loading ? "Saving..." : "Record Payment"}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/payments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPayments(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this payment? This will adjust the expense balance.")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/payments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchPayments();
    } catch {
      // ignore
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-100">Payments</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Plus size={16} />
          Record Payment
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Expense</th>
              <th className="text-right px-4 py-3">Amount (₹)</th>
              <th className="text-left px-4 py-3">Notes</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-slate-500">No payments recorded yet</td></tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="bg-slate-900/50 border-b border-slate-700/50 hover:bg-slate-800/50">
                  <td className="px-4 py-3 text-slate-300">{p.payment_date?.split("T")[0]}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {p.expense_title || `Expense #${p.expense_id}`}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {p.notes || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-400 hover:text-red-300 text-xs"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <AddPaymentModal
          onClose={() => setShowModal(false)}
          onSaved={fetchPayments}
        />
      )}
    </div>
  );
}