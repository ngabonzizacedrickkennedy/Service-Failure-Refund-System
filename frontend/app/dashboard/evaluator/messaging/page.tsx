"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, Search, Send, Loader2, User, CheckCircle, Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { userService, type UserProfile } from "@/lib/userService";
import { evaluatorService, type EvaluatorClaimResponse } from "@/lib/evaluatorService";

type Tab = "refund-office" | "providers";

interface Contact {
  id: string;
  name: string;
  email: string;
  subtitle?: string;
}

function MessagingPanel({
  contacts,
  searchPlaceholder,
  emptyLabel,
  loading,
}: {
  contacts: Contact[];
  searchPlaceholder: string;
  emptyLabel: string;
  loading: boolean;
}) {
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<Contact | null>(null);
  const [subject, setSubject]       = useState("");
  const [message, setMessage]       = useState("");
  const [sending, setSending]       = useState(false);
  const [sentTo, setSentTo]         = useState<string | null>(null);

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!selected) return;
    if (!subject.trim()) { toast.error("Please enter a subject."); return; }
    if (!message.trim()) { toast.error("Please enter a message."); return; }
    setSending(true);
    try {
      await userService.sendStaffMessage(selected.id, subject.trim(), message.trim());
      setSentTo(selected.name);
      setSubject("");
      setMessage("");
      toast.success(`Message sent to ${selected.name}.`);
    } catch {
      toast.error("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const initials = (n: string) => n.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="flex gap-4 flex-1 min-h-0" style={{ height: "calc(100vh - 280px)" }}>
      {/* Contact list */}
      <div className="w-72 flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="p-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
              style={{ color: "var(--color-muted-foreground)" }} />
            <input type="text" placeholder={searchPlaceholder} value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
              style={{ backgroundColor: "var(--color-input)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-muted-foreground)" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2">
              <Users className="h-8 w-8" style={{ color: "var(--color-muted-foreground)" }} />
              <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{emptyLabel}</p>
            </div>
          ) : filtered.map(c => {
            const isSel = selected?.id === c.id;
            return (
              <button key={c.id}
                onClick={() => { setSelected(c); setSentTo(null); }}
                className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors"
                style={{
                  backgroundColor: isSel ? "var(--color-accent)" : "transparent",
                  borderBottom: "1px solid var(--color-border)",
                }}>
                <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ backgroundColor: "var(--color-muted)", color: "var(--color-foreground)" }}>
                  {initials(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>{c.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>{c.email}</p>
                  {c.subtitle && (
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-primary)" }}>{c.subtitle}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Compose */}
      <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <div className="h-14 w-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--color-muted)" }}>
              <MessageSquare className="h-6 w-6" style={{ color: "var(--color-muted-foreground)" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>Select a contact to message</p>
            <p className="text-xs text-center max-w-xs" style={{ color: "var(--color-muted-foreground)" }}>
              Choose from the list on the left. They will receive a notification and an email.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                style={{ backgroundColor: "var(--color-muted)", color: "var(--color-foreground)" }}>
                {initials(selected.name)}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{selected.name}</p>
                <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{selected.email}</p>
              </div>
              {sentTo === selected.name && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "#22c55e22", color: "#22c55e" }}>
                  <CheckCircle className="h-3.5 w-3.5" /> Message sent
                </motion.div>
              )}
            </div>
            <div className="flex-1 flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Subject</label>
                <input type="text" placeholder="Enter subject…" value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="rounded-lg px-3 py-2.5 text-sm outline-none"
                  style={{ backgroundColor: "var(--color-input)", border: "1px solid var(--color-border)", color: "var(--color-foreground)" }} />
              </div>
              <div className="flex flex-col gap-1.5 flex-1">
                <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>Message</label>
                <textarea placeholder={`Write your message to ${selected.name}…`}
                  value={message} onChange={e => setMessage(e.target.value)}
                  className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                  style={{ backgroundColor: "var(--color-input)", border: "1px solid var(--color-border)", color: "var(--color-foreground)", minHeight: "160px" }} />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  Will be delivered as notification + email to{" "}
                  <span style={{ color: "var(--color-foreground)" }}>{selected.email}</span>
                </p>
                <button onClick={handleSend}
                  disabled={sending || !subject.trim() || !message.trim()}
                  className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? "Sending…" : "Send Message"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function EvaluatorMessagingPage() {
  const [tab, setTab]                   = useState<Tab>("refund-office");
  const [refundOfficeUsers, setRefund]  = useState<Contact[]>([]);
  const [providerContacts, setProviders] = useState<Contact[]>([]);
  const [loadingRefund, setLR]          = useState(true);
  const [loadingProviders, setLP]       = useState(true);

  const loadRefundOffice = useCallback(async () => {
    setLR(true);
    try {
      const users: UserProfile[] = await userService.getUsersByRole("REFUND_OFFICE");
      setRefund(users.map(u => ({ id: u.id, name: u.fullName, email: u.email, subtitle: "Refund Office" })));
    } catch {
      toast.error("Failed to load refund office contacts.");
    } finally {
      setLR(false);
    }
  }, []);

  const loadProviders = useCallback(async () => {
    setLP(true);
    try {
      const claims: EvaluatorClaimResponse[] = await evaluatorService.getAllClaims();
      const seen = new Set<string>();
      const contacts: Contact[] = [];
      for (const c of claims) {
        if (!seen.has(c.providerId)) {
          seen.add(c.providerId);
          contacts.push({
            id: c.providerId,
            name: `Provider ${c.providerId.slice(0, 8)}…`,
            email: "",
            subtitle: c.projectTitle ?? `Project ${c.projectId.slice(0, 8)}…`,
          });
        }
      }
      // enrich with real names from user service
      const enriched = await Promise.all(
        contacts.map(async ct => {
          try {
            const u: UserProfile = await userService.getUser(ct.id);
            return { ...ct, name: u.fullName, email: u.email };
          } catch {
            return ct;
          }
        })
      );
      setProviders(enriched);
    } catch {
      toast.error("Failed to load providers.");
    } finally {
      setLP(false);
    }
  }, []);

  useEffect(() => {
    loadRefundOffice();
    loadProviders();
  }, [loadRefundOffice, loadProviders]);

  return (
    <div className="space-y-5 h-full flex flex-col">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Messaging</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Send messages to Refund Office staff or to providers who submitted claims.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1 w-fit"
        style={{ backgroundColor: "var(--color-neutral-100)" }}>
        <button onClick={() => setTab("refund-office")}
          className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition"
          style={{
            backgroundColor: tab === "refund-office" ? "var(--color-card)" : "transparent",
            color: tab === "refund-office" ? "var(--color-foreground)" : "var(--color-muted-foreground)",
            boxShadow: tab === "refund-office" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}>
          <User className="h-4 w-4" /> Refund Office
        </button>
        <button onClick={() => setTab("providers")}
          className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition"
          style={{
            backgroundColor: tab === "providers" ? "var(--color-card)" : "transparent",
            color: tab === "providers" ? "var(--color-foreground)" : "var(--color-muted-foreground)",
            boxShadow: tab === "providers" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
          }}>
          <Users className="h-4 w-4" /> Providers with Claims
        </button>
      </div>

      {tab === "refund-office" ? (
        <MessagingPanel
          contacts={refundOfficeUsers}
          searchPlaceholder="Search refund office staff…"
          emptyLabel="No refund office staff found"
          loading={loadingRefund}
        />
      ) : (
        <MessagingPanel
          contacts={providerContacts}
          searchPlaceholder="Search providers…"
          emptyLabel="No providers with claims found"
          loading={loadingProviders}
        />
      )}
    </div>
  );
}
