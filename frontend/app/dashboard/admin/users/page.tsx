"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, UserPlus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/api";

interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  active: boolean;
  locked: boolean;
  createdAt: string;
}

const ROLE_OPTIONS = ["ALL", "ADMIN", "PROVIDER", "WORKER", "EVALUATOR", "REFUND_OFFICE"];

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  PROVIDER: "Provider",
  WORKER: "Worker",
  EVALUATOR: "Evaluator",
  REFUND_OFFICE: "Refund Office",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className="px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: "var(--color-neutral-100)",
        color: "var(--color-neutral-600)",
      }}
    >
      {roleLabel[role] || role}
    </span>
  );
}

function StatusBadge({ active, locked }: { active: boolean; locked: boolean }) {
  if (locked) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
        Locked
      </span>
    );
  }
  if (active) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Active
      </span>
    );
  }
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      Inactive
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const applyFilters = useCallback(
    (list: User[], q: string, role: string) => {
      let r = list;
      if (role !== "ALL") r = r.filter((u) => u.role === role);
      if (q.trim()) {
        const lq = q.toLowerCase();
        r = r.filter(
          (u) =>
            u.fullName.toLowerCase().includes(lq) ||
            u.email.toLowerCase().includes(lq) ||
            u.phone?.toLowerCase().includes(lq)
        );
      }
      setFiltered(r);
    },
    []
  );

  async function fetchUsers() {
    try {
      const res = await api.get<User[]>("/api/admin/users");
      setUsers(res.data);
      applyFilters(res.data, search, roleFilter);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []); // eslint-disable-line

  useEffect(() => {
    applyFilters(users, search, roleFilter);
  }, [search, roleFilter, users, applyFilters]);

  async function toggleActive(user: User) {
    setActionLoading(user.id);
    try {
      const endpoint = user.active
        ? `/api/admin/users/${user.id}/deactivate`
        : `/api/admin/users/${user.id}/activate`;
      await api.patch(endpoint);
      toast.success(`${user.fullName} ${user.active ? "deactivated" : "activated"}`);
      fetchUsers();
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUser(user: User) {
    if (!confirm(`Permanently delete ${user.fullName}? This cannot be undone.`)) return;
    setActionLoading(user.id);
    try {
      await api.delete(`/api/admin/users/${user.id}`);
      toast.success(`${user.fullName} deleted`);
      fetchUsers();
    } catch {
      toast.error("Delete failed");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 style={{ color: "var(--color-primary-800)" }}>User Management</h3>
          <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
            View, search, filter and manage all platform accounts.
          </p>
        </div>
        <a
          href="/dashboard/admin/users/create"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <UserPlus className="h-4 w-4" />
          Create Account
        </a>
      </div>

      <div
        className="rounded-xl border p-4 space-y-4"
        style={{
          backgroundColor: "var(--color-card)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: "var(--color-neutral-400)" }}
            />
            <input
              type="text"
              placeholder="Search by name, email or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 pl-9 text-sm focus:outline-none focus:ring-2 transition"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-foreground)",
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                style={{
                  backgroundColor:
                    roleFilter === r ? "var(--color-primary)" : "var(--color-background)",
                  color: roleFilter === r ? "#ffffff" : "var(--color-neutral-600)",
                  borderColor:
                    roleFilter === r ? "var(--color-primary)" : "var(--color-border)",
                }}
              >
                {r === "ALL" ? "All Roles" : roleLabel[r] || r}
              </button>
            ))}
          </div>

          <span
            className="text-xs flex-shrink-0"
            style={{ color: "var(--color-muted-foreground)" }}
          >
            {filtered.length} {filtered.length === 1 ? "user" : "users"}
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--color-border)" }}>
          <table className="w-full">
            <thead style={{ backgroundColor: "var(--color-neutral-50)" }}>
              <tr>
                {["Name", "Email", "Phone", "Role", "Status", "Joined", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--color-neutral-500)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span
                        className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: "var(--color-primary)" }}
                      />
                      <span className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                        Loading users…
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                      No users found.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-t transition-colors"
                    style={{ borderColor: "var(--color-border)" }}
                  >
                    <td
                      className="px-4 py-3 text-sm font-medium"
                      style={{ color: "var(--color-foreground)" }}
                    >
                      {user.fullName}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--color-foreground)" }}
                    >
                      {user.email}
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--color-foreground)" }}
                    >
                      {user.phone || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={user.active} locked={user.locked} />
                    </td>
                    <td
                      className="px-4 py-3 text-sm"
                      style={{ color: "var(--color-muted-foreground)" }}
                    >
                      {new Date(user.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={actionLoading === user.id}
                          className="px-3 py-1 rounded-lg border text-xs font-medium transition"
                          style={{
                            borderColor: "var(--color-border)",
                            color: user.active ? "#d97706" : "#16a34a",
                            backgroundColor: "transparent",
                          }}
                        >
                          {user.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          disabled={actionLoading === user.id}
                          className="h-8 w-8 flex items-center justify-center rounded-lg border transition"
                          style={{
                            borderColor: "#fecaca",
                            color: "#ef4444",
                            backgroundColor: "transparent",
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}