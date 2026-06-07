# SAAS Inventory Management

A complete inventory management SAAS application built with **Next.js 15** — supports admin, manager, and accounts roles with full CRUD operations.

## Features

- **Auth** — JWT + HttpOnly cookies, 3 roles: admin, manager, accounts
- **Dashboard** — 6 stat cards with revenue, expenses, pending amounts, today's stock
- **Inventory** — Item master CRUD with category filters
- **Daily Stock** — Category-collapsible entry with gas, electricity, oil widgets
- **Stock History** — Date range filtering with expand/collapse
- **Sales** — Single/bulk entry, edit/delete, platform tracking (Swiggy, Zomato, GPay, Cash)
- **Expenses** — With payment tracking and pending amount calculation
- **Payments** — Record expenses with part-payment support, expense dropdown with pending balance
- **Staff** — CRUD with active/inactive filter
- **Payroll** — Auto-calculated net amount from salary + allowances - deductions
- **Suppliers** — Full CRUD
- **Settlements** — Generate from pending platform amounts, edit settlements
- **Backup/Restore** — Download/upload JSON database

## Tech Stack

- **Next.js 15** (App Router)
- **JSON File Database** (zero external dependencies)
- **JWT Auth** (jsonwebtoken + bcryptjs)
- **Tailwind CSS** (dark theme)
- **Lucide Icons**

## Getting Started

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build      # production build
pnpm start      # production server
```

## Environment Variables

Required for production (set on Vercel or local):

```bash
JWT_SECRET=your-random-secret-here
```

## Login Credentials (seed data)

| Role     | Email                  | Password  |
|----------|------------------------|-----------|
| Admin    | admin@rishart.com      | admin123  |
| Manager  | manager@rishart.com    | manager123|
| Accounts | accounts@rishart.com   | accounts123|

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mrishad-ux/saas-inventory)