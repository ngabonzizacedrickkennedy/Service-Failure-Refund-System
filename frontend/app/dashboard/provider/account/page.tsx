"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, DollarSign, Lock, ChevronDown, ChevronUp,
  Plus, Pencil, Trash2, Star, StarOff, Landmark,
  Smartphone, CheckCircle2, XCircle,
} from "lucide-react";
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

export default function ProviderAccountPage() {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [allProjects, setAllProjects] = useState<ProjectResponse[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // deposit state
  const [depositOpen, setDepositOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [payerMsisdn, setPayerMsisdn] = useState("");
  const [depositStatus, setDepositStatus] = useState<"idle" | "pending" | "success" | "failed">("idle");
  const [depositReferenceId, setDepositReferenceId] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  // bank account form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BankAccountRequest>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      accountService.getAccount(),
      projectService.getMyProjects(),
      accountService.getBankAccounts(),
    ]).then(([acc, projs, banks]) => {
      setAccount(acc);
      setAllProjects(projs);
      setBankAccounts(banks);
      const def = banks.find(b => b.defaultAccount);
      if (def) setSelectedBankAccountId(def.id);
    }).catch(() => toast.error("Failed to load account."))
      .finally(() => setLoading(false));
  }, []);

  const projects = allProjects.filter(p => p.status === "OPEN" && !p.funded);
  const availableBalance = account?.balance ?? 0;
  const lockedTotal = account?.pendingBalance ?? 0;

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const DEPOSIT_POLL_INTERVAL_MS = 3000;
  const DEPOSIT_POLL_TIMEOUT_MS = 60000;

  const resetDepositForm = () => {
    setDepositStatus("idle");
    setDepositReferenceId(null);
    setDepositError(null);
    setSelectedProjectId("");
    setPayerMsisdn("");
  };

  const pollDepositStatus = async (referenceId: string, project: ProjectResponse) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < DEPOSIT_POLL_TIMEOUT_MS) {
      const result = await accountService.getDepositStatus(referenceId);

      if (result.status === "SUCCESSFUL") {
        if (result.account) setAccount(result.account);
        setAllProjects(prev => prev.map(p => p.id === project.id ? { ...p, funded: true } : p));
        setDepositStatus("success");
        toast.success(`Successfully deposited $${project.budget} for "${project.title}".`);
        return;
      }
      if (result.status === "FAILED") {
        setDepositStatus("failed");
        setDepositError(result.failureReason || "MoMo payment failed.");
        toast.error(result.failureReason || "MoMo payment failed.");
        return;
      }
      await new Promise(r => setTimeout(r, DEPOSIT_POLL_INTERVAL_MS));
    }
    setDepositStatus("failed");
    setDepositError("Timed out waiting for MoMo confirmation.");
  };

  const handleDeposit = async () => {
    const project = selectedProject;
    if (!project) { toast.error("Select a project to fund."); return; }
    if (!/^\d{9,15}$/.test(payerMsisdn.trim())) { toast.error("Enter a valid MoMo phone number."); return; }
    setDepositLoading(true);
    setDepositStatus("pending");
    setDepositError(null);
    try {
      const { referenceId } = await accountService.initiateDeposit(project.id, project.budget, payerMsisdn.trim());
      setDepositReferenceId(referenceId);
      await pollDepositStatus(referenceId, project);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || "Deposit failed.";
      setDepositStatus("failed");
      setDepositError(msg);
      toast.error(msg);
    } finally {
      setDepositLoading(false);
    }
  };

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
        if (bankAccounts.length === 0) setSelectedBankAccountId(created.id);
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
      const remaining = bankAccounts.filter(b => b.id !== id);
      setBankAccounts(remaining);
      if (selectedBankAccountId === id) {
        const next = remaining.find(b => b.defaultAccount) ?? remaining[0];
        setSelectedBankAccountId(next?.id ?? "");
      }
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
      setSelectedBankAccountId(id);
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
          Manage your bank accounts and deposit funds for your projects.
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
              ${Number(availableBalance).toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border p-4"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Lock className="h-4 w-4" style={{ color: "#f59e0b" }} />
              <p className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Locked in Projects</p>
            </div>
            <p className="text-xl font-bold" style={{ color: "var(--color-foreground)" }}>
              ${Number(lockedTotal).toFixed(2)}
            </p>
          </div>
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
              No bank accounts added yet. Add one to start funding projects.
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
                      <p className="text-xs flex-1" style={{ color: "#ef4444" }}>
                        Remove this account?
                      </p>
                      <button onClick={() => handleDelete(b.id)} disabled={deleteLoading}
                        className="text-xs px-3 py-1 rounded-lg font-medium text-white transition disabled:opacity-50"
                        style={{ backgroundColor: "#ef4444" }}>
                        {deleteLoading ? "Removing…" : "Yes, remove"}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)}
                        className="text-xs px-3 py-1 rounded-lg font-medium transition"
                        style={{ borderColor: "var(--color-border)", border: "1px solid", color: "var(--color-foreground)" }}>
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

      {/* Deposit section */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-xl border overflow-hidden"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
        <button type="button" onClick={() => setDepositOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-left transition hover:opacity-80"
          style={{ backgroundColor: "var(--color-neutral-50)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
            Deposit Funds for a Project
          </span>
          {depositOpen
            ? <ChevronUp className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />
            : <ChevronDown className="h-4 w-4" style={{ color: "var(--color-muted-foreground)" }} />}
        </button>

        <AnimatePresence>
          {depositOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="overflow-hidden">
              <div className="px-5 pb-5 pt-4 space-y-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                {depositStatus === "pending" ? (
                  <div className="rounded-lg border px-4 py-5 space-y-3 text-center"
                    style={{ borderColor: "var(--color-primary-200)", backgroundColor: "color-mix(in srgb, var(--color-primary-50) 60%, transparent)" }}>
                    <span className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin mx-auto block"
                      style={{ borderColor: "var(--color-primary)" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                      Approve the payment of ${selectedProject?.budget.toFixed(2)} on {payerMsisdn}…
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      Waiting for MoMo confirmation. Reference: <span className="font-mono">{depositReferenceId}</span>
                    </p>
                  </div>
                ) : depositStatus === "success" ? (
                  <div className="rounded-lg border px-4 py-5 space-y-2 text-center"
                    style={{ borderColor: "#16a34a40", backgroundColor: "#f0fdf4" }}>
                    <CheckCircle2 className="h-8 w-8 mx-auto" style={{ color: "#16a34a" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Payment confirmed</p>
                    <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      Reference: <span className="font-mono">{depositReferenceId}</span>
                    </p>
                    <button onClick={() => { resetDepositForm(); setDepositOpen(false); }}
                      className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition mt-2"
                      style={{ backgroundColor: "var(--color-primary)" }}>
                      Done
                    </button>
                  </div>
                ) : depositStatus === "failed" ? (
                  <div className="rounded-lg border px-4 py-5 space-y-2 text-center"
                    style={{ borderColor: "#ef444440", backgroundColor: "#fef2f2" }}>
                    <XCircle className="h-8 w-8 mx-auto" style={{ color: "#ef4444" }} />
                    <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Payment failed</p>
                    <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{depositError}</p>
                    <button onClick={() => { setDepositStatus("idle"); setDepositError(null); }}
                      className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition mt-2"
                      style={{ backgroundColor: "var(--color-primary)" }}>
                      Try Again
                    </button>
                  </div>
                ) : projects.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                    No unfunded open projects available.
                  </p>
                ) : (
                  <>
                    <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                      Select a project and the MoMo phone number to pay from (MTN MoMo sandbox — no real money moves).
                    </p>

                    {/* Project selector */}
                    <div className="relative">
                      <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)}
                        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none appearance-none pr-8"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }}>
                        <option value="">— Select a project —</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.title} (${p.budget})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                        style={{ color: "var(--color-muted-foreground)" }} />
                    </div>

                    {/* MoMo phone number */}
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
                        style={{ color: "var(--color-muted-foreground)" }} />
                      <input
                        placeholder="MoMo phone number (e.g. 2507XXXXXXXX)"
                        value={payerMsisdn}
                        onChange={e => setPayerMsisdn(e.target.value.replace(/\D/g, ""))}
                        className="w-full rounded-lg border pl-9 pr-3 py-2 text-sm focus:outline-none"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }}
                      />
                    </div>

                    {selectedProject && (
                      <div className="rounded-lg border px-4 py-3 space-y-1"
                        style={{ borderColor: "var(--color-primary-200)", backgroundColor: "color-mix(in srgb, var(--color-primary-50) 60%, transparent)" }}>
                        <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>Deposit Amount</p>
                        <p className="text-2xl font-bold" style={{ color: "var(--color-primary-700)" }}>
                          ${selectedProject.budget.toFixed(2)}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                          This exact amount will be locked until the project is completed.
                        </p>
                      </div>
                    )}

                    <button onClick={handleDeposit}
                      disabled={!selectedProject || !/^\d{9,15}$/.test(payerMsisdn) || depositLoading}
                      className="w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
                      style={{ backgroundColor: "var(--color-primary)" }}>
                      Pay with MoMo
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
