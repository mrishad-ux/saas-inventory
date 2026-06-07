"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface PayrollEntry {
  id: number;
  staff_id: number;
  staff_name?: string;
  payment_date: string;
  days_worked: number;
  basic_amount: number;
  bonus: number;
  deduction: number;
  net_amount: number;
  status: string;
  notes: string | null;
}

interface StaffOption {
  id: number;
  name: string;
}

function formatCurrency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

function PayrollModal({
  payroll,
  staffList,
  onClose,
  onSaved,
}: {
  payroll?: PayrollEntry | null;
  staffList: StaffOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    staff_id: "",
    payment_date: new Date().toISOString().split("T")[0],
    days_worked: "",
    basic_amount: "",
    bonus: "0",
    deduction: "0",
    net_amount: "0",
    status: "pending",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (payroll) {
      setForm({
        staff_id: String(payroll.staff_id),
        payment_date: payroll.payment_date?.split("T")[0] || "",
        days_worked: String(payroll.days_worked),
        basic_amount: String(payroll.basic_amount),
        bonus: String(payroll.bonus),
        deduction: String(payroll.deduction),
        net_amount: String(payroll.net_amount),
        status: payroll.status,
        notes: payroll.notes || "",
      });
    }
  }, [payroll]);

  const calcNet = (
    basic: string,
    bonus: string,
    deduction: string
  ): string => {
    const b = parseFloat(basic) || 0;
    const bo = parseFloat(bonus) || 0;
    const d = parseFloat(deduction) || 0;
    return String(b + bo - d);
  };

  const handleChange = (
    field: string,
    value: string
  ) => {
    const updated = { ...form, [field]: value };
    if (field === "basic_amount" || field === "bonus" || field === "deduction") {
      updated.net_amount = calcNet(
        field === "basic_amount" ? value : form.basic_amount,
        field === "bonus" ? value : form.bonus,
        field === "deduction" ? value : form.deduction
      );
    }
    setForm(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const body = {
      staff_id: parseInt(form.staff_id),
      payment_date: form.payment_date,
      days_worked: parseInt(form.days_worked) || 0,
      basic_amount: parseFloat(form.basic_amount) || 0,
      bonus: parseFloat(form.bonus) || 0,
      deduction: parseFloat(form.deduction) || 0,
      net_amount: parseFloat(form.net_amount) || 0,
      status: form.status,
      notes: form.notes || null,
    };
    try {
      const url = payroll
        ? `/api/payroll/${payroll.id}`
        : "/api/payroll";
      const method = payroll ? "PUT" : "POST";
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
        setError(data.error || "Failed to save payroll");
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
          {payroll ? "Edit Payroll" : "Add Payroll"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Staff Member
            </label>
            <select
              value={form.staff_id}
              onChange={(e) => handleChange("staff_id", e.target.value)}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            >
              <option value="">Select staff</option>
              {staffList.map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Date</label>
            <input
              type="date"
              value={form.payment_date}
              onChange={(e) => handleChange("payment_date", e.target.value)}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Days Worked
            </label>
            <input
              type="number"
              value={form.days_worked}
              onChange={(e) => handleChange("days_worked", e.target.value)}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Basic Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.basic_amount}
              onChange={(e) => handleChange("basic_amount", e.target.value)}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Bonus (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.bonus}
              onChange={(e) => handleChange("bonus", e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Deduction (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.deduction}
              onChange={(e) => handleChange("deduction", e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Net Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.net_amount}
              readOnly
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm opacity-70"
            />
            <p className="text-xs text-slate-500 mt-1">Auto-calculated: Basic + Bonus - Deduction</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
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
              {loading ? "Saving..." : payroll ? "Update" : "Add Payroll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PayrollPage() {
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<PayrollEntry[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PayrollEntry | null>(null);
  const [staffFilter, setStaffFilter] = useState("");

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
      let url = "/api/payroll";
      const params = new URLSearchParams();
      if (staffFilter) params.set("staff_id", staffFilter);
      const qs = params.toString();
      if (qs) url += "?" + qs;

      const [payRes, staffRes] = await Promise.all([
        fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/staff", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      const payData = await payRes.json();
      const staffData = await staffRes.json();
      if (payData.success) setPayrolls(payData.data.payrolls || []);
      if (staffData.success)
        setStaffList(
          staffData.data.staff?.map((s: any) => ({
            id: s.id,
            name: s.name,
          })) || []
        );
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [staffFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this payroll entry?"))
      return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchData();
    } catch {
      // ignore
    }
  };

  const statusBadge = (status: string) => {
    const base = "inline-flex px-2 py-0.5 rounded text-xs font-medium";
    if (status === "paid") return `${base} bg-green-600/20 text-green-400`;
    if (status === "pending") return `${base} bg-yellow-600/20 text-yellow-400`;
    return `${base} bg-red-600/20 text-red-400`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Payroll</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm"
        >
          Add Payroll
        </button>
      </div>

      {/* Staff filter */}
      <div className="flex gap-4 mb-6 items-end">
        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Filter by Staff
          </label>
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
          >
            <option value="">All Staff</option>
            {staffList.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {staffFilter && (
          <button
            onClick={() => setStaffFilter("")}
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
              <th className="text-left px-4 py-3">Staff Name</th>
              <th className="text-right px-4 py-3">Days Worked</th>
              <th className="text-right px-4 py-3">Basic (₹)</th>
              <th className="text-right px-4 py-3">Bonus (₹)</th>
              <th className="text-right px-4 py-3">Deduction (₹)</th>
              <th className="text-right px-4 py-3">Net (₹)</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Notes</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-slate-500">
                  Loading...
                </td>
              </tr>
            ) : payrolls.length === 0 ? (
              <tr>
                <td colSpan={10} className="text-center py-8 text-slate-500">
                  No payroll entries found
                </td>
              </tr>
            ) : (
              payrolls.map((p) => (
                <tr
                  key={p.id}
                  className="bg-slate-900/50 border-b border-slate-700/50 hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3 text-slate-300">
                    {p.payment_date?.split("T")[0]}
                  </td>
                  <td className="px-4 py-3 text-slate-100 font-medium">
                    {p.staff_name || `Staff #${p.staff_id}`}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {p.days_worked}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatCurrency(p.basic_amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatCurrency(p.bonus)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatCurrency(p.deduction)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-100 font-semibold">
                    {formatCurrency(p.net_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(p.status)}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {p.notes || "-"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setEditing(p);
                        setShowModal(true);
                      }}
                      className="text-amber-400 hover:text-amber-300 text-xs mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
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
        <PayrollModal
          payroll={editing}
          staffList={staffList}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}