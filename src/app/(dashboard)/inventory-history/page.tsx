"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

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
  item_name?: string;
  item_category?: string;
}

const categoryLabels: Record<string, string> = {
  chicken_fish: "Chicken & Fish",
  shawarma_marination: "Marination",
  mayo_masala_sauces: "Mayo & Sauces",
  bun_bakery: "Bun & Grocery",
  other: "Other",
};

export default function InventoryHistoryPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  function fetchLogs() {
    setLoading(true);
    fetch(`/api/inventory/logs/history?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setLogs(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchLogs(); }, []);

  // Group logs by date
  const groupedByDate: Record<string, LogEntry[]> = {};
  logs.forEach((log) => {
    if (!groupedByDate[log.log_date]) groupedByDate[log.log_date] = [];
    groupedByDate[log.log_date].push(log);
  });

  const sortedDates = Object.keys(groupedByDate).sort().reverse();
  const [searchTerm, setSearchTerm] = useState("");

  function toggleDate(date: string) {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }

  function toggleItem(id: number) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function filteredLogsForDate(date: string) {
    if (!searchTerm) return groupedByDate[date];
    return groupedByDate[date].filter(
      (l) =>
        l.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.item_category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Stock History</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-400 mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-700/50 border border-slate-600 text-slate-100 rounded-lg px-3 py-2 text-sm placeholder-slate-500 min-w-[200px]"
        />
        <button
          onClick={fetchLogs}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Filter
        </button>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12">Loading history...</div>
      ) : sortedDates.length === 0 ? (
        <div className="text-center text-slate-500 py-12">
          No history found for the selected date range
        </div>
      ) : (
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const entries = filteredLogsForDate(date);
            const isExpanded = expandedDates.has(date);
            const totalConsumption = entries.reduce((s, e) => s + e.consumption, 0);
            const totalPurchased = entries.reduce((s, e) => s + e.purchased, 0);

            return (
              <div
                key={date}
                className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden"
              >
                {/* Date Header */}
                <button
                  onClick={() => toggleDate(date)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-slate-400" />
                    ) : (
                      <ChevronRight size={16} className="text-slate-400" />
                    )}
                    <span className="text-sm font-medium text-slate-100">{date}</span>
                    <span className="text-xs text-slate-500">
                      {entries.length} items
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-400">
                    <span>Purchased: {totalPurchased.toFixed(2)}</span>
                    <span>Used: {totalConsumption.toFixed(2)}</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-800/80 text-slate-400 text-xs uppercase tracking-wider">
                          <th className="px-3 py-2 text-left">Item</th>
                          <th className="px-3 py-2 text-left">Category</th>
                          <th className="px-3 py-2 text-right">Opening</th>
                          <th className="px-3 py-2 text-right">Purchased</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="px-3 py-2 text-right">Consumption</th>
                          <th className="px-3 py-2 text-right">Wastage</th>
                          <th className="px-3 py-2 text-right">Closing</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((log) => {
                          const isItemExpanded = expandedItems.has(log.id);
                          return (
                            <>
                              <tr
                                key={log.id}
                                onClick={() => toggleItem(log.id)}
                                className="bg-slate-900/50 border-b border-slate-700/50 hover:bg-slate-800/50 cursor-pointer"
                              >
                                <td className="px-3 py-2 text-sm text-slate-300">
                                  {log.item_name || `Item #${log.inventory_item_id}`}
                                </td>
                                <td className="px-3 py-2 text-sm text-slate-400 capitalize">
                                  {categoryLabels[log.item_category || ""] || log.item_category || "—"}
                                </td>
                                <td className="px-3 py-2 text-sm text-slate-300 text-right">
                                  {log.opening.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-sm text-slate-300 text-right">
                                  {log.purchased.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-sm text-slate-300 text-right font-medium">
                                  {log.total.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-sm text-slate-300 text-right">
                                  {log.consumption.toFixed(2)}
                                </td>
                                <td className="px-3 py-2 text-sm text-red-400 text-right">
                                  {log.wastage > 0 ? log.wastage.toFixed(2) : "—"}
                                </td>
                                <td className="px-3 py-2 text-sm text-slate-300 text-right font-medium">
                                  {log.closing.toFixed(2)}
                                </td>
                              </tr>
                              {isItemExpanded && log.notes && (
                                <tr className="bg-slate-800/30">
                                  <td
                                    colSpan={8}
                                    className="px-3 py-2 text-xs text-slate-500 italic"
                                  >
                                    Notes: {log.notes}
                                  </td>
                                </tr>
                              )}
                            </>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}