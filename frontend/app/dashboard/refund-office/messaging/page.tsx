"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, Search, Send, Loader2, CheckCircle, Users,
} from "lucide-react";
import { toast } from "react-toastify";
import { userService, type UserProfile } from "@/lib/userService";

interface Contact {
  id: string;
  name: string;
  email: string;
}

export default function RefundOfficeMessagingPage() {
  const [evaluators, setEvaluators]   = useState<Contact[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState<Contact | null>(null);
  const [subject, setSubject]         = useState("");
  const [message, setMessage]         = useState("");
  const [sending, setSending]         = useState(false);
  const [sentTo, setSentTo]           = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const users: UserProfile[] = await userService.getUsersByRole("EVALUATOR");
      setEvaluators(users.map(u => ({ id: u.id, name: u.fullName, email: u.email })));
    } catch {
      toast.error("Failed to load evaluator contacts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = evaluators.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
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
    <div className="space-y-5 h-full flex flex-col">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Messaging</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Send messages to evaluators to follow up on claim decisions or refund considerations.
        </p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0" style={{ height: "calc(100vh - 240px)" }}>
        {/* Evaluator list */}
        <div className="w-72 flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="p-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: "var(--color-muted-foreground)" }} />
              <input type="text" placeholder="Search evaluators…" value={search}
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
                <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>No evaluators found</p>
              </div>
            ) : filtered.map(e => {
              const isSel = selected?.id === e.id;
              return (
                <button key={e.id}
                  onClick={() => { setSelected(e); setSentTo(null); }}
                  className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors"
                  style={{
                    backgroundColor: isSel ? "var(--color-accent)" : "transparent",
                    borderBottom: "1px solid var(--color-border)",
                  }}>
                  <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
                    {initials(e.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--color-foreground)" }}>{e.name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>{e.email}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-primary)" }}>Evaluator</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compose panel */}
        <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="h-14 w-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--color-muted)" }}>
                <MessageSquare className="h-6 w-6" style={{ color: "var(--color-muted-foreground)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                Select an evaluator to message
              </p>
              <p className="text-xs text-center max-w-xs" style={{ color: "var(--color-muted-foreground)" }}>
                Reach out to an evaluator to follow up on a pending claim or remind them of an urgent case.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 p-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}>
                  {initials(selected.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>{selected.name}</p>
                  <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>{selected.email} · Evaluator</p>
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
                  <input type="text" placeholder="e.g. Follow-up on Claim #XYZ…" value={subject}
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
                    Delivered as notification + email to{" "}
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
    </div>
  );
}
