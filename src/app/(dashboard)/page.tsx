"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  TrendingUp,
  Receipt,
  Package,
  Users,
  DollarSign,
} from "lucide-react";

function CurrencyFormat(value: number) {
  return "₹" + value.toLocaleString("en-IN", { minimumFractionDigits: 2 });
}

const categoryLabels: Record<string, string> = {
  rent: "Rent",
  electricity: "Electricity",
  water: "Water",
  gas: "Gas",
  salary: "Salary",
  raw_material: "Raw Material",
  packaging: "Packaging",
  maintenance: "Maintenance",
  marketing: "Marketing",
  other: "Other",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data);
      })
      .catch(() => {});
  }, []);

  const statCards = [
    {
      label: "Today's Sales",
      value: stats ? CurrencyFormat(stats.todaySalesTotal) : "—",
      icon: ShoppingCart,
    },
    {
      label: "Monthly Sales",
      value: stats ? CurrencyFormat(stats.monthSalesTotal) : "—",
      icon: TrendingUp,
    },
    {
      label: "Pending Expenses",
      value: stats ? String(stats.pendingExpensesCount) : "—",
      icon: Receipt,
    },
    {
      label: "Low Stock Items",
      value: stats ? String(stats.lowStockCount) : "—",
      icon: Package,
    },
    {
      label: "Active Staff",
      value: stats ? String(stats.activeStaff) : "—",
      icon: Users,
    },
    {
      label: "Today's Expenses",
      value: stats ? CurrencyFormat(stats.todayExpensesTotal) : "—",
      icon: DollarSign,
    },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{card.label}</span>
                <Icon className="w-5 h-5 text-slate-500" />
              </div>
              <div className="text-3xl font-bold text-amber-400">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Recent Sales
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-right">Gross</th>
                  <th className="px-3 py-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentSales?.length ? (
                  stats.recentSales.map((sale: any) => (
                    <tr
                      key={sale.id}
                      className="bg-slate-900/50 border-b border-slate-700/50 hover:bg-slate-800/50"
                    >
                      <td className="px-3 py-2 text-sm text-slate-300">
                        {sale.sale_date}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-300 capitalize">
                        {sale.sale_type}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-300 text-right">
                        {CurrencyFormat(sale.gross_amount)}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-300 text-right">
                        {CurrencyFormat(sale.net_amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-sm text-slate-500 text-center"
                    >
                      No sales data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Recent Expenses
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Category</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentExpenses?.length ? (
                  stats.recentExpenses.map((exp: any) => (
                    <tr
                      key={exp.id}
                      className="bg-slate-900/50 border-b border-slate-700/50 hover:bg-slate-800/50"
                    >
                      <td className="px-3 py-2 text-sm text-slate-300">
                        {exp.expense_date}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-300">
                        {exp.title}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-300 capitalize">
                        {categoryLabels[exp.category] || exp.category}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-300 text-right">
                        {CurrencyFormat(exp.amount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-sm text-slate-500 text-center"
                    >
                      No expense data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}