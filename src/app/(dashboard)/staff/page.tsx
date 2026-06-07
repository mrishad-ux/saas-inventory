"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface StaffMember {
  id: number;
  name: string;
  role: string;
  phone: string;
  salary_type: string;
  salary_amount: number;
  status: string;
  joining_date: string;
}

function formatCurrency(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

function StaffModal({
  staff,
  onClose,
  onSaved,
}: {
  staff?: StaffMember | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    role: "",
    phone: "",
    salary_type: "monthly",
    salary_amount: "",
    joining_date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (staff) {
      setForm({
        name: staff.name,
        role: staff.role,
        phone: staff.phone,
        salary_type: staff.salary_type,
        salary_amount: String(staff.salary_amount),
        joining_date: staff.joining_date?.split("T")[0] || "",
      });
    }
  }, [staff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const body = {
      name: form.name,
      role: form.role,
      phone: form.phone,
      salary_type: form.salary_type,
      salary_amount: parseFloat(form.salary_amount),
      joining_date: form.joining_date,
    };
    try {
      const url = staff ? `/api/staff/${staff.id}` : "/api/staff";
      const method = staff ? "PUT" : "POST";
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
        setError(data.error || "Failed to save staff");
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
          {staff ? "Edit Staff" : "Add Staff"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Role</label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Phone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Salary Type
            </label>
            <select
              value={form.salary_type}
              onChange={(e) =>
                setForm({ ...form, salary_type: e.target.value })
              }
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Salary Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.salary_amount}
              onChange={(e) =>
                setForm({ ...form, salary_amount: e.target.value })
              }
              required
              className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">
              Joining Date
            </label>
            <input
              type="date"
              value={form.joining_date}
              onChange={(e) =>
                setForm({ ...form, joining_date: e.target.value })
              }
              required
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
              {loading ? "Saving..." : staff ? "Update" : "Add Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
  }, [router]);

  const fetchStaff = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      let url = "/api/staff";
      if (statusFilter !== "all") url += `?status=${statusFilter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setStaff(data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchStaff();
    } catch {
      // ignore
    }
  };

  const handleReactivate = async (id: number) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "active" }),
      });
      const data = await res.json();
      if (data.success) fetchStaff();
    } catch {
      // ignore
    }
  };

  const tabs = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "inactive", label: "Inactive" },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Staff</h1>
        <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm"
        >
          Add Staff
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-4 py-1.5 rounded text-sm ${
              statusFilter === tab.key
                ? "bg-amber-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Salary Type</th>
              <th className="text-right px-4 py-3">Salary Amount (₹)</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Since</th>
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
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-500">
                  No staff found
                </td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr
                  key={s.id}
                  className="bg-slate-900/50 border-b border-slate-700/50 hover:bg-slate-800/50"
                >
                  <td className="px-4 py-3 text-slate-100 font-medium">
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{s.role}</td>
                  <td className="px-4 py-3 text-slate-300">{s.phone}</td>
                  <td className="px-4 py-3 text-slate-300">
                    <span className="capitalize">{s.salary_type}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatCurrency(s.salary_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        s.status === "active"
                          ? "bg-green-600/20 text-green-400"
                          : "bg-red-600/20 text-red-400"
                      }`}
                    >
                      {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {s.joining_date?.split("T")[0]}
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
                    {s.status === "active" ? (
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(s.id)}
                        className="text-green-400 hover:text-green-300 text-xs"
                      >
                        Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <StaffModal
          staff={editing}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
          onSaved={fetchStaff}
        />
      )}
    </div>
  );
}