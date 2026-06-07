import bcrypt from "bcryptjs";

// ─── Types ───────────────────────────────────────────────────────────
export interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string; // admin | manager | accounts
  created_at: string;
  updated_at: string;
}

export interface SupplierRow {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  product_supplied: string;
  outstanding_balance: number;
  created_at: string;
  updated_at: string;
}

export interface StaffRow {
  id: number;
  name: string;
  role: string;
  phone: string;
  salary_type: "daily" | "monthly";
  salary_amount: number;
  joining_date: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface PayrollRow {
  id: number;
  staff_id: number;
  payment_date: string;
  days_worked: number;
  basic_amount: number;
  bonus: number;
  deduction: number;
  net_amount: number;
  status: "paid" | "unpaid";
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItemRow {
  id: number;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  unit_price: number;
  supplier_id: number | null;
  minimum_stock_qty: number;
  is_mayo: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryLogRow {
  id: number;
  inventory_item_id: number;
  log_date: string;
  opening: number;
  opening_source: string;
  purchased: number;
  total: number;
  consumption: number;
  wastage: number;
  closing: number;
  mayo_oil_qty: number | null;
  mayo_milk_qty: number | null;
  mayo_bottles: number | null;
  notes: string;
  gas_changed: boolean;
  electricity_reading: number | null;
  oil_l1_packets: number | null;
  oil_l2_packets: number | null;
  oil_r1_packets: number | null;
  oil_r2_packets: number | null;
  oil_mayo_packets: number | null;
  oil_sauces_packets: number | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseRow {
  id: number;
  title: string;
  category: string;
  amount: number;
  paid_amount: number;
  expense_date: string;
  supplier_id: number | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseCategoryRow {
  id: number;
  label: string;
  value: string;
  is_custom: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: number;
  expense_id: number;
  amount: number;
  payment_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SaleRow {
  id: number;
  sale_date: string;
  sale_type: "cash" | "gp" | "swiggy" | "zomato" | "other";
  platform: string;
  gross_amount: number;
  commission_percent: number;
  commission_amount: number;
  net_amount: number;
  settlement_status: "not_applicable" | "pending" | "received";
  expected_settlement_date: string | null;
  actual_settlement_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformSettlementRow {
  id: number;
  platform: "swiggy" | "zomato";
  period_from: string;
  period_to: string;
  expected_credit_date: string;
  actual_credit_date: string | null;
  gross_amount: number;
  estimated_commission: number;
  estimated_net: number;
  actual_amount_received: number | null;
  actual_commission: number | null;
  status: "pending" | "received" | "disputed";
  notes: string;
  created_at: string;
  updated_at: string;
}

interface DbStore {
  users: UserRow[];
  suppliers: SupplierRow[];
  staff: StaffRow[];
  payroll: PayrollRow[];
  inventory_items: InventoryItemRow[];
  inventory_logs: InventoryLogRow[];
  expenses: ExpenseRow[];
  expense_categories: ExpenseCategoryRow[];
  payments: PaymentRow[];
  sales: SaleRow[];
  platform_settlements: PlatformSettlementRow[];
  nextId: {
    users: number;
    suppliers: number;
    staff: number;
    payroll: number;
    inventory_items: number;
    inventory_logs: number;
    expenses: number;
    expense_categories: number;
    payments: number;
    sales: number;
    platform_settlements: number;
  };
}

// ─── Persistence ─────────────────────────────────────────────────────
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function loadDb(): DbStore {
  try {
    if (fs.existsSync(DB_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
      // Merge with empty store to fill missing keys (e.g. when JSON was saved before schema updates)
      const empty = emptyStore();
      for (const key of Object.keys(empty)) {
        if (!(key in parsed)) {
          (parsed as any)[key] = (empty as any)[key];
        }
      }
      return parsed;
    }
  } catch {
    // corrupted, reset
  }
  return emptyStore();
}

function emptyStore(): DbStore {
  return {
    users: [],
    suppliers: [],
    staff: [],
    payroll: [],
    inventory_items: [],
    inventory_logs: [],
    expenses: [],
    expense_categories: [],
    payments: [],
    sales: [],
    platform_settlements: [],
    nextId: {
      users: 1, suppliers: 1, staff: 1, payroll: 1,
      inventory_items: 1, inventory_logs: 1, expenses: 1,
      expense_categories: 1, payments: 1, sales: 1,
      platform_settlements: 1,
    },
  };
}

function saveDb(store: DbStore): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2));
}

const store: { current: DbStore | null } = { current: null };

// ─── Seed Data ───────────────────────────────────────────────────────
const DEFAULT_CATEGORIES: Array<{ label: string; value: string }> = [
  { label: "Rent", value: "rent" },
  { label: "Electricity", value: "electricity" },
  { label: "Water", value: "water" },
  { label: "Gas", value: "gas" },
  { label: "Salary", value: "salary" },
  { label: "Raw Material", value: "raw_material" },
  { label: "Packaging", value: "packaging" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Marketing", value: "marketing" },
  { label: "Other", value: "other" },
];

const DEFAULT_INVENTORY_CATEGORIES = [
  { name: "Chicken & Fish", key: "chicken_fish", items: ["Chicken Breast Boneless", "Chicken Thigh", "Fish Fillet", "Shawarma Chicken"] },
  { name: "Marination", key: "shawarma_marination", items: ["Shawarma Mix", "BBQ Sauce", "Peri Peri Marinade"] },
  { name: "Mayo, Masala & Sauces", key: "mayo_masala_sauces", items: ["Mayonnaise 4kg", "Chilli Sauce", "Tomato Ketchup", "Garlic Mayo", "Peri Peri Sauce"] },
  { name: "Bun, Bakery & Grocery", key: "bun_bakery", items: ["Bun", "Pita Bread", "Lettuce", "Tomato", "Onion", "Cucumber", "French Fries", "Cheese Slice"] },
  { name: "Other", key: "other", items: ["Packing Box", "Tissue Paper", "Gloves", "Oil"] },
];

function seedData(s: DbStore): void {
  // Seed expense categories
  if (s.expense_categories.length === 0) {
    DEFAULT_CATEGORIES.forEach((cat, i) => {
      s.expense_categories.push({
        id: s.nextId.expense_categories++,
        label: cat.label,
        value: cat.value,
        is_custom: false,
        sort_order: i,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }

  // Seed inventory items
  if (s.inventory_items.length === 0) {
    DEFAULT_INVENTORY_CATEGORIES.forEach((cat) => {
      cat.items.forEach((itemName, idx) => {
        s.inventory_items.push({
          id: s.nextId.inventory_items++,
          name: itemName,
          category: cat.key,
          unit: "kg",
          current_stock: parseFloat((Math.random() * 20 + 1).toFixed(2)),
          minimum_stock: 2,
          unit_price: parseFloat((Math.random() * 500 + 50).toFixed(2)),
          supplier_id: null,
          minimum_stock_qty: 2,
          is_mayo: itemName.toLowerCase().includes("mayo"),
          sort_order: idx,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    });
  }

  // Seed today's inventory logs
  const today = new Date().toISOString().split("T")[0];
  if (s.inventory_logs.filter((l) => l.log_date === today).length === 0) {
    s.inventory_items.forEach((item) => {
      const opening = parseFloat((Math.random() * 10 + 0.5).toFixed(2));
      const purchased = Math.random() > 0.6 ? parseFloat((Math.random() * 15 + 1).toFixed(2)) : 0;
      const consumption = parseFloat((Math.random() * 5).toFixed(2));
      const wastage = Math.random() > 0.8 ? parseFloat((Math.random() * 0.5).toFixed(2)) : 0;
      const closing = parseFloat((opening + purchased - consumption - wastage).toFixed(2));

      s.inventory_logs.push({
        id: s.nextId.inventory_logs++,
        inventory_item_id: item.id,
        log_date: today,
        opening,
        opening_source: "default",
        purchased,
        total: opening + purchased,
        consumption,
        wastage,
        closing,
        mayo_oil_qty: item.is_mayo ? parseFloat((Math.random() * 3).toFixed(2)) : null,
        mayo_milk_qty: item.is_mayo ? parseFloat((Math.random() * 2).toFixed(2)) : null,
        mayo_bottles: item.is_mayo ? parseFloat((Math.random() * 5).toFixed(1)) : null,
        notes: "",
        gas_changed: false,
        electricity_reading: null,
        oil_l1_packets: null,
        oil_l2_packets: null,
        oil_r1_packets: null,
        oil_r2_packets: null,
        oil_mayo_packets: null,
        oil_sauces_packets: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }

  // Seed some suppliers
  if (s.suppliers.length === 0) {
    const supplierNames = [
      { name: "Fresh Foods Co.", product: "Chicken & Fish", phone: "+91-9876543210" },
      { name: "Spice World", product: "Marination Mixes & Sauces", phone: "+91-9876543211" },
      { name: "Bakery Fresh", product: "Bun & Pita Bread", phone: "+91-9876543212" },
      { name: "Mayo Masters", product: "Mayonnaise & Sauces", phone: "+91-9876543213" },
      { name: "Green Valley", product: "Vegetables & Lettuce", phone: "+91-9876543214" },
    ];
    supplierNames.forEach((sName) => {
      s.suppliers.push({
        id: s.nextId.suppliers++,
        name: sName.name,
        phone: sName.phone,
        email: "",
        address: "Kerala, India",
        product_supplied: sName.product,
        outstanding_balance: parseFloat((Math.random() * 5000).toFixed(2)),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }

  // Seed staff
  if (s.staff.length === 0) {
    const staffMembers = [
      { name: "Rahul S.", role: "Cook", salary_type: "monthly" as const, salary_amount: 12000 },
      { name: "Vijay K.", role: "Cook", salary_type: "monthly" as const, salary_amount: 12000 },
      { name: "Anoop M.", role: "Helper", salary_type: "daily" as const, salary_amount: 500 },
      { name: "Suresh P.", role: "Helper", salary_type: "daily" as const, salary_amount: 500 },
      { name: "Biju T.", role: "Delivery", salary_type: "monthly" as const, salary_amount: 8000 },
    ];
    staffMembers.forEach((staff) => {
      s.staff.push({
        id: s.nextId.staff++,
        name: staff.name,
        role: staff.role,
        phone: "+91-" + String(9000000000 + Math.floor(Math.random() * 100000000)),
        salary_type: staff.salary_type,
        salary_amount: staff.salary_amount,
        joining_date: "2025-01-01",
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }

  // Seed sales (last 30 days)
  if (s.sales.length === 0) {
    const saleTypes = ["cash", "gp", "swiggy", "zomato"] as const;
    for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().split("T")[0];

      saleTypes.forEach((type) => {
        const gross = parseFloat((Math.random() * 8000 + 500).toFixed(2));
        const isOnline = type === "swiggy" || type === "zomato";
        const commission = isOnline ? parseFloat((gross * (0.28 + Math.random() * 0.06)).toFixed(2)) : 0;
        const net = gross - commission;
        s.sales.push({
          id: s.nextId.sales++,
          sale_date: dateStr,
          sale_type: type,
          platform: type === "swiggy" ? "Swiggy" : type === "zomato" ? "Zomato" : "",
          gross_amount: gross,
          commission_percent: isOnline ? 31 : 0,
          commission_amount: commission,
          net_amount: net,
          settlement_status: isOnline ? "pending" : "not_applicable",
          expected_settlement_date: isOnline ? dateStr : null,
          actual_settlement_date: null,
          notes: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    }
  }

  // Seed expenses (last 30 days)
  if (s.expenses.length === 0) {
    for (let daysAgo = 0; daysAgo < 20; daysAgo++) {
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      const dateStr = date.toISOString().split("T")[0];
      const cat = DEFAULT_CATEGORIES[Math.floor(Math.random() * DEFAULT_CATEGORIES.length)];
      const amount = parseFloat((Math.random() * 3000 + 200).toFixed(2));
      s.expenses.push({
        id: s.nextId.expenses++,
        title: `${cat.label} - ${dateStr}`,
        category: cat.value,
        amount,
        paid_amount: Math.random() > 0.3 ? amount : parseFloat((amount * 0.5).toFixed(2)),
        expense_date: dateStr,
        supplier_id: null,
        notes: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  // Seed platform settlements
  if (s.platform_settlements.length === 0) {
    const platforms = ["swiggy", "zomato"] as const;
    platforms.forEach((platform) => {
      s.platform_settlements.push({
        id: s.nextId.platform_settlements++,
        platform,
        period_from: "2026-05-01",
        period_to: "2026-05-07",
        expected_credit_date: "2026-05-10",
        actual_credit_date: "2026-05-09",
        gross_amount: parseFloat((Math.random() * 50000 + 10000).toFixed(2)),
        estimated_commission: parseFloat((Math.random() * 15000 + 3000).toFixed(2)),
        estimated_net: parseFloat((Math.random() * 35000 + 7000).toFixed(2)),
        actual_amount_received: parseFloat((Math.random() * 35000 + 7000).toFixed(2)),
        actual_commission: parseFloat((Math.random() * 15000 + 3000).toFixed(2)),
        status: "received",
        notes: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  }
}

// ─── Public API ──────────────────────────────────────────────────────
export function initDb(): void {
  if (store.current) return;

  store.current = loadDb();

  // Seed demo users if empty
  if (store.current.users.length === 0) {
    const adminPw = bcrypt.hashSync("admin123", 10);
    const managerPw = bcrypt.hashSync("manager123", 10);
    const accountsPw = bcrypt.hashSync("accounts123", 10);

    const now = new Date().toISOString();
    store.current.users.push(
      { id: store.current.nextId.users++, name: "Admin", email: "admin@rishart.com", password: adminPw, role: "admin", created_at: now, updated_at: now },
      { id: store.current.nextId.users++, name: "Manager", email: "manager@rishart.com", password: managerPw, role: "manager", created_at: now, updated_at: now },
      { id: store.current.nextId.users++, name: "Accounts", email: "accounts@rishart.com", password: accountsPw, role: "accounts", created_at: now, updated_at: now },
    );
  }

  seedData(store.current);
  saveDb(store.current as DbStore);
}

export function dbQuery<T = any>(table: string, predicate?: (row: T) => boolean): T[] {
  if (!store.current) return [];
  const rows = (store.current as any)[table] as T[];
  if (!rows) return [];
  if (predicate) return rows.filter(predicate);
  return [...rows];
}

export function dbGet<T = any>(table: string, predicate: (row: T) => boolean): T | null {
  return dbQuery<T>(table, predicate)[0] || null;
}

export function dbFirst<T = any>(table: string): T | null {
  const rows = dbQuery<T>(table);
  return rows[0] || null;
}

export function dbCreate(table: string, data: Record<string, any>): any {
  if (!store.current) throw new Error("DB not initialized");
  const rows = (store.current as any)[table] as any[];
  if (!rows) throw new Error(`Unknown table: ${table}`);

  const nextKey = `nextId` as keyof typeof store.current.nextId;
  const nextIdVal = (store.current.nextId as any)[table] || 1;
  (store.current.nextId as any)[table] = nextIdVal + 1;

  const now = new Date().toISOString();
  const row = { id: nextIdVal, ...data, created_at: now, updated_at: now };
  rows.push(row);
  saveDb(store.current as DbStore);
  return row;
}

export function dbUpdate(table: string, id: number, data: Record<string, any>): any | null {
  if (!store.current) return null;
  const rows = (store.current as any)[table] as any[];
  if (!rows) return null;

  const idx = rows.findIndex((r: any) => r.id === id);
  if (idx === -1) return null;

  rows[idx] = { ...rows[idx], ...data, updated_at: new Date().toISOString() };
  saveDb(store.current as DbStore);
  return rows[idx];
}

export function dbDelete(table: string, id: number): boolean {
  if (!store.current) return false;
  const rows = (store.current as any)[table] as any[];
  if (!rows) return false;

  const idx = rows.findIndex((r: any) => r.id === id);
  if (idx === -1) return false;

  rows.splice(idx, 1);
  saveDb(store.current as DbStore);
  return true;
}

export function dbUpsert(table: string, match: Record<string, any>, data: Record<string, any>): any {
  if (!store.current) throw new Error("DB not initialized");
  const rows = (store.current as any)[table] as any[];

  const existing = rows.find((r: any) =>
    Object.entries(match).every(([k, v]) => r[k] === v)
  );

  if (existing) {
    return dbUpdate(table, existing.id, data);
  }

  return dbCreate(table, { ...match, ...data });
}

export function dbCount(table: string, predicate?: (row: any) => boolean): number {
  return dbQuery(table, predicate).length;
}

export function dbSum(table: string, field: string, predicate?: (row: any) => boolean): number {
  return dbQuery(table, predicate).reduce((sum, row: any) => sum + (Number(row[field]) || 0), 0);
}

// ─── Expose db for backup ────────────────────────────────────────────
export function exportDb(): string {
  return JSON.stringify(store.current, null, 2);
}

export function importDb(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (!data.users || !data.nextId) return false;
    store.current = data;
        saveDb(store.current as DbStore);
        return true;
  } catch {
    return false;
  }
}
