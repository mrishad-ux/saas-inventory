"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChevronRight, Flame, Zap, Droplets } from "lucide-react";

const categoryGroups = [
  { key: "chicken_fish", label: "Chicken & Fish" },
  { key: "shawarma_marination", label: "Marination" },
  { key: "mayo_masala_sauces", label: "Mayo & Sauces" },
  { key: "bun_bakery", label: "Bun & Grocery" },
  { key: "other", label: "Other" },
];

interface Item {
  id: number;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
}

interface LogEntry {
  id: number;
  inventory_item_id: number;
  log_date: string;
  opening: number;
  purchased: number;
  total: number;
  consumption: number;
  wastage: number;
  closing: number;
  notes: string;
  gas_changed?: boolean;
  electricity_reading?: number | null;
  oil_l1_packets?: number | null;
  oil_l2_packets?: number | null;
  oil_r1_packets?: number | null;
  oil_r2_packets?: number | null;
  oil_mayo_packets?: number | null;
  oil_sauces_packets?: number | null;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function InventoryDailyPage() {
  const today = getToday();
  const [items, setItems] = useState<Item[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Local editing state for each item's log fields
  const [edits, setEdits] = useState<
    Record<
      number,
      {
        opening: string;
        purchased: string;
        consumption: string;
        wastage: string;
        closing: string;
      }
    >
  >({});

  // Utility logs (gas, electricity, oil)
  const [utilityLog, setUtilityLog] = useState<LogEntry | null>(null);
  const [gasChanged, setGasChanged] = useState(false);
  const [electricityReading, setElectricityReading] = useState("");
  const [oilFields, setOilFields] = useState({
    l1: "",
    l2: "",
    r1: "",
    r2: "",
    mayo: "",
    sauces: "",
  });

  const [savingGas, setSavingGas] = useState(false);
  const [savingElectricity, setSavingElectricity] = useState(false);
  const [savingOil, setSavingOil] = useState(false);

  const fetchData = useCallback(() => {
    Promise.all([
      fetch("/api/inventory/items").then((r) => r.json()),
      fetch(`/api/inventory/logs?date=${today}`).then((r) => r.json()),
    ]).then(([itemsRes, logsRes]) => {
      if (itemsRes.success) setItems(itemsRes.data);
      if (logsRes.success) {
        const logsData = logsRes.data;
        setLogs(logsData);

        // Find utility logs
        const gasLog = logsData.find((l: LogEntry) => l.inventory_item_id === 0);
        const elecLog = logsData.find(
          (l: LogEntry) => l.inventory_item_id === -1
        );
        const oilLog = logsData.find(
          (l: LogEntry) => l.inventory_item_id === -2
        );

        setGasChanged(gasLog?.gas_changed || false);
        setElectricityReading(elecLog?.electricity_reading ? String(elecLog.electricity_reading) : "");
        setOilFields({
          l1: oilLog?.oil_l1_packets ? String(oilLog.oil_l1_packets) : "",
          l2: oilLog?.oil_l2_packets ? String(oilLog.oil_l2_packets) : "",
          r1: oilLog?.oil_r1_packets ? String(oilLog.oil_r1_packets) : "",
          r2: oilLog?.oil_r2_packets ? String(oilLog.oil_r2_packets) : "",
          mayo: oilLog?.oil_mayo_packets ? String(oilLog.oil_mayo_packets) : "",
          sauces: oilLog?.oil_sauces_packets ? String(oilLog.oil_sauces_packets) : "",
        });
      }
    });
  }, [today]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initialize edit state from logs or defaults
  useEffect(() => {
    const newEdits: Record<
      number,
      {
        opening: string;
        purchased: string;
        consumption: string;
        wastage: string;
        closing: string;
      }
    > = {};
    items.forEach((item) => {
      const existing = logs.find(
        (l) => l.inventory_item_id === item.id && l.log_date === today
      );
      newEdits[item.id] = {
        opening: existing ? String(existing.opening) : "0",
        purchased: existing ? String(existing.purchased) : "0",
        consumption: existing ? String(existing.consumption) : "0",
        wastage: existing ? String(existing.wastage) : "0",
        closing: existing ? String(existing.closing) : String(item.current_stock),
      };
    });
    setEdits(newEdits);
  }, [items, logs, today]);

  // Auto-calculate closing
  const updateField = (
    itemId: number,
    field: string,
    value: string
  ) => {
    setEdits((prev) => {
      const current = prev[itemId] || {
        opening: "0",
        purchased: "0",
        consumption: "0",
        wastage: "0",
        closing: "0",
      };
      const updated = { ...current, [field]: value };
      if (field !== "closing") {
        const opening = parseFloat(updated.opening) || 0;
        const purchased = parseFloat(updated.purchased) || 0;
        const consumption = parseFloat(updated.consumption) || 0;
        const wastage = parseFloat(updated.wastage) || 0;
        updated.closing = String(
          Math.max(0, parseFloat((opening + purchased - consumption - wastage).toFixed(2)))
        );
      }
      return { ...prev, [itemId]: updated };
    });
  };

  const saveLog = async (itemId: number) => {
    const e = edits[itemId];
    if (!e) return;
    setSaving((prev) => ({ ...prev, [`item_${itemId}`]: true }));
    try {
      const payload = {
        inventory_item_id: itemId,
        log_date: today,
        opening: parseFloat(e.opening) || 0,
        purchased: parseFloat(e.purchased) || 0,
        consumption: parseFloat(e.consumption) || 0,
        wastage: parseFloat(e.wastage) || 0,
        closing: parseFloat(e.closing) || 0,
        notes: "",
      };
      const res = await fetch("/api/inventory/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch {}
    setSaving((prev) => ({ ...prev, [`item_${itemId}`]: false }));
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Utility handlers
  const handleGasToggle = async () => {
    setSavingGas(true);
    try {
      await fetch("/api/inventory/save-gas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log_date: today, gas_changed: !gasChanged }),
      });
      setGasChanged(!gasChanged);
    } catch {}
    setSavingGas(false);
  };

  const handleSaveElectricity = async () => {
    setSavingElectricity(true);
    try {
      await fetch("/api/inventory/save-electricity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          log_date: today,
          electricity_reading: parseFloat(electricityReading) || 0,
        }),
      });
    } catch {}
    setSavingElectricity(false);
  };

  const handleSaveOil = async () => {
    setSavingOil(true);
    try {
      await fetch("/api/inventory/save-oil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          log_date: today,
          l1: parseFloat(oilFields.l1) || 0,
          l2: parseFloat(oilFields.l2) || 0,
          r1: parseFloat(oilFields.r1) || 0,
          r2: parseFloat(oilFields.r2) || 0,
          mayo: parseFloat(oilFields.mayo) || 0,
          sauces: parseFloat(oilFields.sauces) || 0,
        }),
      });
    } catch {}
    setSavingOil(false);
  };

  const getItemsForCategory = (catKey: string) =>
    items.filter((i) => i.category === catKey);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-slate-100">Daily Stock</h1>
      <p className="text-sm text-slate-400">
        Date:{" "}
        <span className="text-slate-300 font-medium">{today}</span>
      </p>

      {/* Inventory Sections */}
      {categoryGroups.map((group) => {
        const catItems = getItemsForCategory(group.key);
        if (catItems.length === 0) return null;
        const isExpanded = expandedSections[group.key] !== false; // default expanded

        return (
          <div
            key={group.key}
            className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden"
          >
            {/* Collapsible Header */}
            <button
              onClick={() => toggleSection(group.key)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-750 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-sm font-semibold text-slate-100">
                  {group.label}
                </span>
                <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
                  {catItems.length}
                </span>
              </div>
            </button>

            {/* Table */}
            {isExpanded && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="px-3 py-2 text-left min-w-[160px]">
                        Item
                      </th>
                      <th className="px-3 py-2 text-right">Opening</th>
                      <th className="px-3 py-2 text-right">Purchased</th>
                      <th className="px-3 py-2 text-right">Total</th>
                      <th className="px-3 py-2 text-right">Consumption</th>
                      <th className="px-3 py-2 text-right">Wastage</th>
                      <th className="px-3 py-2 text-right">Closing</th>
                      <th className="px-3 py-2 text-center">Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catItems.map((item) => {
                      const e = edits[item.id] || {
                        opening: "0",
                        purchased: "0",
                        consumption: "0",
                        wastage: "0",
                        closing: "0",
                      };
                      const total =
                        (parseFloat(e.opening) || 0) +
                        (parseFloat(e.purchased) || 0);
                      const isSaving = saving[`item_${item.id}`];

                      return (
                        <tr
                          key={item.id}
                          className="bg-slate-900/50 border-b border-slate-700/50 hover:bg-slate-800/50"
                        >
                          <td className="px-3 py-2 text-sm text-slate-100 font-medium">
                            {item.name}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={e.opening}
                              onChange={(ev) =>
                                updateField(item.id, "opening", ev.target.value)
                              }
                              className="w-20 bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-2 py-1 text-sm text-right font-mono focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={e.purchased}
                              onChange={(ev) =>
                                updateField(
                                  item.id,
                                  "purchased",
                                  ev.target.value
                                )
                              }
                              className="w-20 bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-2 py-1 text-sm text-right font-mono focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-slate-300 text-right font-mono">
                            {total.toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={e.consumption}
                              onChange={(ev) =>
                                updateField(
                                  item.id,
                                  "consumption",
                                  ev.target.value
                                )
                              }
                              className="w-20 bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-2 py-1 text-sm text-right font-mono focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={e.wastage}
                              onChange={(ev) =>
                                updateField(
                                  item.id,
                                  "wastage",
                                  ev.target.value
                                )
                              }
                              className="w-20 bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-2 py-1 text-sm text-right font-mono focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              step="0.01"
                              value={e.closing}
                              onChange={(ev) =>
                                updateField(item.id, "closing", ev.target.value)
                              }
                              className="w-20 bg-slate-700/50 border border-slate-600 text-amber-400 rounded px-2 py-1 text-sm text-right font-mono focus:outline-none focus:border-amber-500"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              onClick={() => saveLog(item.id)}
                              disabled={isSaving}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-white text-xs rounded transition-colors"
                            >
                              {isSaving ? "..." : "Save"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Gas, Electricity, Oil Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gas */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-5 h-5 text-orange-400" />
            <h3 className="text-sm font-semibold text-slate-100">Gas</h3>
          </div>
          <button
            onClick={handleGasToggle}
            disabled={savingGas}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              gasChanged
                ? "bg-green-600 hover:bg-green-500 text-white"
                : "bg-slate-700 hover:bg-slate-600 text-slate-300"
            }`}
          >
            {gasChanged ? "✓ Gas Changed Today" : "Gas Changed Today"}
          </button>
        </div>

        {/* Electricity */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Electricity
            </h3>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={electricityReading}
              onChange={(e) => setElectricityReading(e.target.value)}
              placeholder="Reading"
              className="flex-1 bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleSaveElectricity}
              disabled={savingElectricity}
              className="px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {savingElectricity ? "..." : "Save"}
            </button>
          </div>
        </div>

        {/* Oil */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-slate-100">Oil</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-xs text-slate-500 mb-0.5">
                L1 Packets
              </label>
              <input
                type="number"
                step="0.01"
                value={oilFields.l1}
                onChange={(e) =>
                  setOilFields({ ...oilFields, l1: e.target.value })
                }
                className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-0.5">
                L2 Packets
              </label>
              <input
                type="number"
                step="0.01"
                value={oilFields.l2}
                onChange={(e) =>
                  setOilFields({ ...oilFields, l2: e.target.value })
                }
                className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-0.5">
                R1 Packets
              </label>
              <input
                type="number"
                step="0.01"
                value={oilFields.r1}
                onChange={(e) =>
                  setOilFields({ ...oilFields, r1: e.target.value })
                }
                className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-0.5">
                R2 Packets
              </label>
              <input
                type="number"
                step="0.01"
                value={oilFields.r2}
                onChange={(e) =>
                  setOilFields({ ...oilFields, r2: e.target.value })
                }
                className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-0.5">
                Mayo Packets
              </label>
              <input
                type="number"
                step="0.01"
                value={oilFields.mayo}
                onChange={(e) =>
                  setOilFields({ ...oilFields, mayo: e.target.value })
                }
                className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-0.5">
                Sauces Packets
              </label>
              <input
                type="number"
                step="0.01"
                value={oilFields.sauces}
                onChange={(e) =>
                  setOilFields({ ...oilFields, sauces: e.target.value })
                }
                className="w-full bg-slate-700/50 border border-slate-600 text-slate-100 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          <button
            onClick={handleSaveOil}
            disabled={savingOil}
            className="w-full px-3 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {savingOil ? "..." : "Save Oil"}
          </button>
        </div>
      </div>
    </div>
  );
}