"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";

const categoryOptions = [
  { value: "chicken_fish", label: "Chicken & Fish" },
  { value: "shawarma_marination", label: "Marination" },
  { value: "mayo_masala_sauces", label: "Mayo & Sauces" },
  { value: "bun_bakery", label: "Bun & Grocery" },
  { value: "other", label: "Other" },
];

const categoryLabels: Record<string, string> = {
  chicken_fish: "Chicken & Fish",
  shawarma_marination: "Marination",
  mayo_masala_sauces: "Mayo & Sauces",
  bun_bakery: "Bun & Grocery",
  other: "Other",
};

interface Item {
  id: number;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  unit_price: number;
  supplier_id: number | null;
}

interface Supplier {
  id: number;
  name: string;
}

export default function InventoryMasterPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "chicken_fish",
    unit: "kg",
    current_stock: "",
    minimum_stock: "",
    unit_price: "",
    supplier_id: "",
  });

  const fetchItems = () => {
    fetch("/api/inventory/items")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setItems(d.data);
      })
      .catch(() => {});
  };

  const fetchSuppliers = () => {
    fetch("/api/suppliers")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSuppliers(d.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchItems();
    fetchSuppliers();
  }, []);

  const filteredItems =
    activeCategory === "all"
      ? items
      : items.filter((i) => i.category === activeCategory);

  const resetForm = () => {
    setForm({
      name: "",
      category: "chicken_fish",
      unit: "kg",
      current_stock: "",
      minimum_stock: "",
      unit_price: "",
      supplier_id: "",
    });
    setEditingItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      unit: item.unit,
      current_stock: String(item.current_stock),
      minimum_stock: String(item.minimum_stock),
      unit_price: String(item.unit_price),
      supplier_id: item.supplier_id ? String(item.supplier_id) : "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      current_stock: parseFloat(form.current_stock) || 0,
      minimum_stock: parseFloat(form.minimum_stock) || 0,
      unit_price: parseFloat(form.unit_price) || 0,
      supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
    };

    const url = editingItem
      ? `/api/inventory/items/${editingItem.id}`
      : "/api/inventory/items";
    const method = editingItem ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        resetForm();
        fetchItems();
      }
    } catch {}
  };

  const handleDelete = async (item: Item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      const res = await fetch(`/api/inventory/items/${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) fetchItems();
    } catch {}
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Item Master</h1>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New Item
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeCategory === "all"
              ? "bg-amber-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          All
        </button>
        {categoryOptions.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.value
                ? "bg-amber-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Unit</th>
                <th className="px-4 py-3 text-right">Stock</th>
                <th className="px-4 py-3 text-right">Min</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-sm text-slate-500 text-center"
                  >
                    No items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className="bg-slate-900/50 border-b border-slate-700/50 hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 text-sm text-slate-100 font-medium">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {categoryLabels[item.category] || item.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {item.unit}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-mono ${
                        item.current_stock >= item.minimum_stock
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {item.current_stock}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right font-mono">
                      {item.minimum_stock}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300 text-right font-mono">
                      ₹{Number(item.unit_price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {item.supplier_id
                        ? suppliers.find((s) => s.id === item.supplier_id)
                            ?.name || "N/A"
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg bg-red-900/50 hover:bg-red-800/50 text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-800 border border-slate-700/50 rounded-lg w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">
                {editingItem ? "Edit Item" : "Add New Item"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                >
                  {categoryOptions.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) =>
                      setForm({ ...form, unit: e.target.value })
                    }
                    className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Unit Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.unit_price}
                    onChange={(e) =>
                      setForm({ ...form, unit_price: e.target.value })
                    }
                    className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.current_stock}
                    onChange={(e) =>
                      setForm({ ...form, current_stock: e.target.value })
                    }
                    className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Minimum Stock
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.minimum_stock}
                    onChange={(e) =>
                      setForm({ ...form, minimum_stock: e.target.value })
                    }
                    className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
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
                  className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">No Supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={String(s.id)}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {editingItem ? "Update" : "Add Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}