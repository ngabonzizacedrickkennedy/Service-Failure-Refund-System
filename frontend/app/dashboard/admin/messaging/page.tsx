"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Search, Send, Loader2, User, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { userService, type UserProfile, type AdminMessagePayload } from "@/lib/userService";

export default function AdminMessagingPage() {
  const [providers, setProviders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    userService
      .getProviders()
      .then(setProviders)
      .catch(() => toast.error("Failed to load providers."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = providers.filter(
    (p) =>
      p.fullName.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!selected) return;
    if (!subject.trim()) { toast.error("Please enter a subject."); return; }
    if (!message.trim()) { toast.error("Please enter a message."); return; }

    setSending(true);
    try {
      const payload: AdminMessagePayload = {
        providerId: selected.id,
        subject: subject.trim(),
        message: message.trim(),
      };
      await userService.sendAdminMessage(payload);
      setSentTo(selected.fullName);
      setSubject("");
      setMessage("");
      toast.success(`Message sent to ${selected.fullName}`);
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div>
        <h3 style={{ color: "var(--color-primary-800)" }}>Messaging</h3>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Send a direct message to a project provider. They will receive a notification and an email.
        </p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0" style={{ height: "calc(100vh - 220px)" }}>
        {/* Provider list */}
        <div
          className="w-72 flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <div className="p-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
                style={{ color: "var(--color-muted-foreground)" }}
              />
              <input
                type="text"
                placeholder="Search providers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg pl-8 pr-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-input)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-muted-foreground)" }} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <User className="h-8 w-8" style={{ color: "var(--color-muted-foreground)" }} />
                <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  No providers found
                </p>
              </div>
            ) : (
              filtered.map((p) => {
                const isSelected = selected?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => { setSelected(p); setSentTo(null); }}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left transition-colors"
                    style={{
                      backgroundColor: isSelected ? "var(--color-accent)" : "transparent",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden text-sm font-bold"
                      style={{ backgroundColor: "var(--color-muted)", color: "var(--color-foreground)" }}
                    >
                      {p.profileImageUrl && !imgErrors[p.id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.profileImageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={() => setImgErrors((prev) => ({ ...prev, [p.id]: true }))}
                        />
                      ) : (
                        initials(p.fullName)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--color-foreground)" }}
                      >
                        {p.fullName}
                      </p>
                      <p className="text-xs truncate" style={{ color: "var(--color-muted-foreground)" }}>
                        {p.email}
                      </p>
                    </div>
                    {!p.active && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ backgroundColor: "#f59e0b22", color: "#f59e0b" }}
                      >
                        inactive
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Compose panel */}
        <div className="flex-1 flex flex-col rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}>
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--color-muted)" }}
              >
                <MessageSquare className="h-6 w-6" style={{ color: "var(--color-muted-foreground)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                Select a provider to message
              </p>
              <p className="text-xs text-center max-w-xs" style={{ color: "var(--color-muted-foreground)" }}>
                Choose a provider from the list on the left. Your message will appear as a notification and be sent to their email.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Provider header */}
              <div
                className="flex items-center gap-3 p-4"
                style={{ borderBottom: "1px solid var(--color-border)" }}
              >
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden text-sm font-bold"
                  style={{ backgroundColor: "var(--color-muted)", color: "var(--color-foreground)" }}
                >
                  {selected.profileImageUrl && !imgErrors[selected.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.profileImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={() => setImgErrors((prev) => ({ ...prev, [selected.id]: true }))}
                    />
                  ) : (
                    initials(selected.fullName)
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                    {selected.fullName}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                    {selected.email}
                  </p>
                </div>
                {sentTo === selected.fullName && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "#22c55e22", color: "#22c55e" }}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Message sent
                  </motion.div>
                )}
              </div>

              {/* Compose form */}
              <div className="flex-1 flex flex-col gap-4 p-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                    Subject
                  </label>
                  <input
                    type="text"
                    placeholder="Enter message subject…"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="rounded-lg px-3 py-2.5 text-sm outline-none"
                    style={{
                      backgroundColor: "var(--color-input)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-foreground)",
                    }}
                  />
                </div>

                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-medium" style={{ color: "var(--color-muted-foreground)" }}>
                    Message
                  </label>
                  <textarea
                    placeholder={`Write your message to ${selected.fullName}…`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                    style={{
                      backgroundColor: "var(--color-input)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-foreground)",
                      minHeight: "180px",
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                    This will be delivered as a notification and to{" "}
                    <span style={{ color: "var(--color-foreground)" }}>{selected.email}</span>
                  </p>
                  <button
                    onClick={handleSend}
                    disabled={sending || !subject.trim() || !message.trim()}
                    className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
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
