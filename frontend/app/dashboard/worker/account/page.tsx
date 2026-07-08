"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, DollarSign, Lock, Plus, Pencil, Trash2, Star, StarOff, Landmark } from "lucide-react";
import { toast } from "react-toastify";
import {
  accountService,
  type AccountResponse,
  type BankAccountResponse,
  type BankAccountRequest,
} from "@/lib/accountService";
import { projectService, type ProjectResponse } from "@/lib/projectService";

const maskAccount = (num: string) =>
  num.length <= 4 ? num : "•••• " + num.slice(-4);

const emptyForm: BankAccountRequest = { bankName: "", accountNumber: "", accountHolderName: "" };

export default function WorkerAccountPage() {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [assignedProjects, setAssignedProjects] = useState<ProjectResponse[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const pendingTotal = assignedProjects
    .filter(p => p.status === "ASSIGNED")
    .reduce((sum, p) => sum + p.budget, 0);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BankAccountRequest>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      accountService.getAccount(),
      accountService.getBankAccounts(),
      projectService.getAssignedProjects(),
    ]).then(([acc, banks, assigned]) => {
      setAccount(acc);
      setBankAccounts(banks);
      setAssignedProjects(assigned);
    }).catch(() => toast.error("Failed to load account."))
      .finally(() => setLoading(false));
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
    setConfirmDeleteId(null);
  };

  const openEditForm = (b: BankAccountResponse) => {
    setEditingId(b.id);
    setForm({ bankName: b.bankName, accountNumber: b.accountNumber, accountHolderName: b.accountHolderName });
    setFormOpen(true);
    setConfirmDeleteId(null);
  };

  const cancelForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSaveBank = async () => {
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.accountHolderName.trim()) {
      toast.error("All fields are required.");
      return;
    }
    setFormLoading(true);
    try {
      if (editingId) {
        const updated = await accountService.updateBankAccount(editingId, form);
        setBankAccounts(prev => prev.map(b => b.id === editingId ? updated : b));
        toast.success("Bank account updated.");
      } else {
        const created = await accountService.addBankAccount(form);
        setBankAccounts(prev => [created, ...prev]);
        toast.success("Bank account added.");
      }
      cancelForm();
    } catch {
      toast.error("Failed to save bank account.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await accountService.deleteBankAccount(id);
      setBankAccounts(prev => prev.filter(b => b.id !== id));
      setConfirmDeleteId(null);
      toast.success("Bank account removed.");
    } catch {
      toast.error("Failed to delete bank account.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await accountService.setDefaultBankAccount(id);
      setBankAccounts(prev => prev.map(b => ({ ...b, defaultAccount: b.id === id })));
    } catch {
      toast.error("Failed to set default account.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="h-6 w-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--color-primary)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>My Account</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          View your earnings and manage the bank accounts where you receive payments.
        </p>
      </div>

      {/* Balance card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border p-6 space-y-4"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="h-4 w-4" style={{ color: "#22c55e" }} />
              <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Available Balance</p>
            </div>
            <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
              ${account?.balance?.toFixed(2) ?? "0.00"}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
              Earned from completed projects
            </p>
          </div>
          <div className="rounded-lg border p-4"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Lock className="h-4 w-4" style={{ color: "#f59e0b" }} />
              <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Pending Earnings</p>
            </div>
            <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
              ${pendingTotal.toFixed(2)}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-muted-foreground)" }}>
              Locked until project completes
            </p>
          </div>
        </div>

        <div className="rounded-lg border px-4 py-3"
          style={{ borderColor: "var(--color-border)", backgroundColor: "color-mix(in srgb, var(--color-neutral-100) 60%, transparent)" }}>
          <p className="text-xs font-medium mb-1" style={{ color: "var(--color-foreground)" }}>Withdrawal</p>
          <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
            Withdrawals are processed after your project provider marks the project as completed.
            Your pending earnings will then move to your available balance and be sent to your default bank account.
          </p>
        </div>
      </motion.div>

      {/* Bank accounts card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>

        <div className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: bankAccounts.length > 0 || formOpen ? "1px solid var(--color-border)" : undefined }}>
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>Bank Accounts</span>
            {bankAccounts.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: "var(--color-primary-100)", color: "var(--color-primary-700)" }}>
                {bankAccounts.length}
              </span>
            )}
          </div>
          {!formOpen && (
            <button onClick={openAddForm}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition hover:opacity-80"
              style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          )}
        </div>

        {bankAccounts.length === 0 && !formOpen && (
          <div className="px-5 py-8 text-center">
            <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-30" style={{ color: "var(--color-muted-foreground)" }} />
            <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
              No bank accounts added yet. Add one to receive your payments.
            </p>
          </div>
        )}

        <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
          {bankAccounts.map(b => (
            <div key={b.id} className="px-5 py-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                      {b.bankName}
                    </span>
                    {b.defaultAccount && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-mono mt-0.5" style={{ color: "var(--color-foreground)" }}>
                    {maskAccount(b.accountNumber)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                    {b.accountHolderName}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!b.defaultAccount && (
                    <button onClick={() => handleSetDefault(b.id)} title="Set as default"
                      className="p-1.5 rounded-lg transition hover:opacity-70"
                      style={{ color: "var(--color-muted-foreground)" }}>
                      <StarOff className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {b.defaultAccount && (
                    <span className="p-1.5" style={{ color: "#f59e0b" }}>
                      <Star className="h-3.5 w-3.5 fill-current" />
                    </span>
                  )}
                  <button onClick={() => openEditForm(b)} title="Edit"
                    className="p-1.5 rounded-lg transition hover:opacity-70"
                    style={{ color: "var(--color-muted-foreground)" }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setConfirmDeleteId(confirmDeleteId === b.id ? null : b.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg transition hover:opacity-70"
                    style={{ color: "#ef4444" }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {confirmDeleteId === b.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}
                    className="overflow-hidden">
                    <div className="flex items-center gap-2 pt-1">
                      <p className="text-xs flex-1" style={{ color: "#ef4444" }}>Remove this account?</p>
                      <button onClick={() => handleDelete(b.id)} disabled={deleteLoading}
                        className="text-xs px-3 py-1 rounded-lg font-medium text-white transition disabled:opacity-50"
                        style={{ backgroundColor: "#ef4444" }}>
                        {deleteLoading ? "Removing…" : "Yes, remove"}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)}
                        className="text-xs px-3 py-1 rounded-lg font-medium transition"
                        style={{ border: "1px solid var(--color-border)", color: "var(--color-foreground)" }}>
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Add / Edit form */}
        <AnimatePresence>
          {formOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden"
              style={{ borderTop: "1px solid var(--color-border)" }}>
              <div className="px-5 py-4 space-y-3">
                <p className="text-xs font-semibold" style={{ color: "var(--color-foreground)" }}>
                  {editingId ? "Edit Bank Account" : "Add Bank Account"}
                </p>
                <div className="space-y-2">
                  <input
                    placeholder="Bank name (e.g. Bank of Kigali, MTN MoMo)"
                    value={form.bankName}
                    onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }}
                  />
                  <input
                    placeholder="Account number"
                    value={form.accountNumber}
                    onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }}
                  />
                  <input
                    placeholder="Account holder name"
                    value={form.accountHolderName}
                    onChange={e => setForm(f => ({ ...f, accountHolderName: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveBank} disabled={formLoading}
                    className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
                    style={{ backgroundColor: "var(--color-primary)" }}>
                    {formLoading ? "Saving…" : editingId ? "Save Changes" : "Add Account"}
                  </button>
                  <button onClick={cancelForm}
                    className="px-4 py-2 text-sm rounded-lg border transition hover:opacity-70"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-foreground)" }}>
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
