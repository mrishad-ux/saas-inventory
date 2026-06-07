"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function BackupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoring, setRestoring] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleDownload = async () => {
    setMessage(null);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const res = await fetch("/api/backup/export", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage({
          type: "error",
          text: data.error || "Download failed",
        });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: "success", text: "Backup downloaded successfully!" });
    } catch {
      setMessage({ type: "error", text: "Network error during download" });
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setMessage({ type: "error", text: "Please select a .json file" });
      return;
    }

    setMessage(null);
    setRestoring(true);

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      setRestoring(false);
      return;
    }

    try {
      const text = await file.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setMessage({
          type: "error",
          text: "Invalid JSON file",
        });
        setRestoring(false);
        return;
      }

      const res = await fetch("/api/backup/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        setMessage({
          type: "success",
          text: "Backup restored successfully!",
        });
      } else {
        setMessage({
          type: "error",
          text: result.error || "Restore failed",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Error reading file" });
    } finally {
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-100 mb-6">Backup</h1>

      {/* Warning */}
      <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-4 mb-8">
        <p className="text-red-400 text-sm font-medium">
          ⚠ Warning: Restoring a backup will replace all current data. This
          action cannot be undone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Download */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">
            Download Backup
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Download all data as a JSON file for safekeeping.
          </p>
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded text-sm font-medium"
          >
            Download Backup
          </button>
        </div>

        {/* Restore */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-2">
            Restore Backup
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Upload a previously downloaded backup JSON file to restore data.
          </p>
          <label className="inline-block">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestore}
              disabled={restoring}
              className="hidden"
            />
            <span className="inline-block px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm font-medium cursor-pointer disabled:opacity-50">
              {restoring ? "Restoring..." : "Choose File & Restore"}
            </span>
          </label>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`mt-6 px-4 py-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-600/20 text-green-400 border border-green-600/30"
              : "bg-red-600/20 text-red-400 border border-red-600/30"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}