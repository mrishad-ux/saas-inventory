"use client";

import { ArrowLeftToLine, ArrowRightToLine, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Navigation from "./components/navigation";
import User from "./components/user";
import VisActor from "./components/visactor";

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  // Hooks MUST be called before early return
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || pathname === "/login") return;

    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUser(d.data.user);
      })
      .catch(() => {});
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("token");
    router.push("/login");
  }

  // Hide sidebar on login page (after hooks)
  if (pathname === "/login") return null;

  return (
    <>
      <button
        className={cn(
          "fixed left-0 top-12 z-50 rounded-r-md bg-slate-200 px-2 py-1.5 text-primary-foreground shadow-md hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 tablet:hidden",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-44" : "translate-x-0",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ArrowLeftToLine size={16} /> : <ArrowRightToLine size={16} />}
      </button>
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-40 flex h-[100dvh] w-44 shrink-0 flex-col border-r border-border bg-slate-100 dark:bg-slate-900 tablet:sticky tablet:translate-x-0",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <User user={user} />
        <Navigation userRole={user?.role} />
        {user && (
          <div className="mt-auto border-t border-border p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        )}
        <VisActor />
      </aside>
    </>
  );
}