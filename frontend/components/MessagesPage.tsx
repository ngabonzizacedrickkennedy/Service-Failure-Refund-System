"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Search, Paperclip, Smile, Loader2 } from "lucide-react";
import { authService } from "@/lib/authService";
import { messageService, type MessageResponse } from "@/lib/messageService";
import { projectService, type ProjectResponse } from "@/lib/projectService";
import { workerCvService } from "@/lib/workerCvService";
import { userService } from "@/lib/userService";

interface Contact {
  userId: string;
  name: string;
  projectName: string;
  projectStatus: string;
  profileImageUrl: string | null;
  online: boolean;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const initials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const colorForId = (id: string) => {
  const colors = ["#18181B", "#27272A", "#3F3F46", "#52525B", "#71717A", "#A1A1AA"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % colors.length;
  return colors[h];
};

/* Avatar component — shows photo if available, otherwise colored initials */
function Avatar({
  name,
  userId,
  profileImageUrl,
  size = 10,
}: {
  name: string;
  userId: string;
  profileImageUrl: string | null;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const dim = `h-${size} w-${size}`;

  return (
    <div
      className={`${dim} rounded-full overflow-hidden flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{
        backgroundColor: colorForId(userId),
        fontSize: size <= 9 ? "0.75rem" : "1rem",
      }}
    >
      {profileImageUrl && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profileImageUrl}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}

export default function MessagesPage({ role }: { role: "PROVIDER" | "WORKER" }) {
  const [myId, setMyId] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const s = authService.getSession();
    if (s) setMyId(s.userId);
  }, []);

  /* Build contact list — resolve real names and profile pictures from APIs */
  useEffect(() => {
    if (!myId) return;

    const buildContacts = async () => {
      try {
        let projects: ProjectResponse[] = [];
        if (role === "PROVIDER") {
          projects = await projectService.getMyProjects();
        } else {
          projects = await projectService.getAssignedProjects();
        }

        const seen = new Set<string>();
        const list: Contact[] = [];

        await Promise.allSettled(
          projects
            .filter((p) => p.status === "ASSIGNED" || p.status === "COMPLETED" || p.status === "FAILED")
            .map(async (p) => {
              const otherId =
                role === "PROVIDER" ? p.assignedWorkerId : p.providerId;
              if (!otherId || seen.has(otherId)) return;
              seen.add(otherId);

              let resolvedName = role === "PROVIDER" ? "Worker" : "Provider";
              let profileImageUrl: string | null = null;

              if (role === "PROVIDER") {
                /* Get name from CV, profile picture from user service */
                await Promise.allSettled([
                  workerCvService.getWorkerCv(otherId).then((cv) => {
                    resolvedName = cv.workerName;
                  }),
                  userService.getUser(otherId).then((u) => {
                    profileImageUrl = u.profileImageUrl ?? null;
                  }),
                ]);
              } else {
                /* Provider — both name and picture come from user service */
                await userService.getUser(otherId).then((u) => {
                  resolvedName = u.fullName;
                  profileImageUrl = u.profileImageUrl ?? null;
                }).catch(() => { /* ok */ });
              }

              list.push({
                userId: otherId,
                name: resolvedName,
                projectName: p.title,
                projectStatus: p.status,
                profileImageUrl,
                online: false,
              });
            })
        );

        setContacts(list);
      } catch { /* ok */ } finally {
        setLoadingContacts(false);
      }
    };

    buildContacts();
  }, [myId, role]);

  const loadMessages = useCallback(async (contact: Contact) => {
    setLoadingMessages(true);
    try {
      const msgs = await messageService.getConversation(contact.userId);
      setMessages(msgs);
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const selectContact = (contact: Contact) => {
    setActiveContact(contact);
    if (pollRef.current) clearInterval(pollRef.current);
    loadMessages(contact);
    pollRef.current = setInterval(() => loadMessages(contact), 5000);
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !activeContact || sending) return;
    setSending(true);
    try {
      const msg = await messageService.sendMessage(activeContact.userId, input.trim());
      setMessages((prev) => [...prev, msg]);
      setInput("");
    } catch { /* toast if needed */ } finally {
      setSending(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const filteredContacts = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.projectName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="flex rounded-2xl overflow-hidden border"
      style={{
        height: "calc(100vh - 88px)",
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
      }}
    >
      {/* ── Contact list ── */}
      <div className="w-80 flex-shrink-0 flex flex-col border-r" style={{ borderColor: "var(--color-border)" }}>
        <div className="p-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <h5 className="font-semibold mb-3" style={{ color: "var(--color-foreground)" }}>Messages</h5>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--color-muted-foreground)" }} />
            <input
              type="text"
              placeholder="Search contacts…"
              className="w-full rounded-full border pl-8 pr-3 py-1.5 text-xs focus:outline-none"
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)", color: "var(--color-foreground)" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingContacts ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#5B4FE5" }} />
            </div>
          ) : filteredContacts.length === 0 ? (
            <p className="text-center text-xs py-8 px-4" style={{ color: "var(--color-muted-foreground)" }}>
              No contacts yet. Contacts appear once a project is assigned.
            </p>
          ) : (
            filteredContacts.map((c) => {
              const isActive = activeContact?.userId === c.userId;
              return (
                <button
                  key={c.userId}
                  onClick={() => selectContact(c)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 transition text-left border-b"
                  style={{
                    backgroundColor: isActive ? "var(--color-neutral-100)" : "transparent",
                    borderColor: "var(--color-border)",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "var(--color-neutral-50)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <Avatar
                    name={c.name}
                    userId={c.userId}
                    profileImageUrl={c.profileImageUrl}
                    size={10}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--color-foreground)" }}>
                        {c.name}
                      </p>
                      {(c.projectStatus === "COMPLETED" || c.projectStatus === "FAILED") && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                          style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}
                        >
                          Former
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                      [{c.projectName}]
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeContact ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b" style={{ borderColor: "var(--color-border)" }}>
              <Avatar
                name={activeContact.name}
                userId={activeContact.userId}
                profileImageUrl={activeContact.profileImageUrl}
                size={9}
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-foreground)" }}>
                  {activeContact.name}
                </p>
                <p className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
                  [{activeContact.projectName}]
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ backgroundColor: "var(--color-background)" }}>
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#5B4FE5" }} />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
                    No messages yet. Say hello!
                  </p>
                </div>
              ) : null}

              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isMe = msg.senderId === myId;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.18 }}
                      className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      {/* Received — show contact avatar beside the bubble */}
                      {!isMe && (
                        <Avatar
                          name={activeContact.name}
                          userId={activeContact.userId}
                          profileImageUrl={activeContact.profileImageUrl}
                          size={7}
                        />
                      )}

                      <div className="max-w-[70%] space-y-0.5">
                        {!isMe && (
                          <p className="text-xs font-medium ml-1" style={{ color: "var(--color-muted-foreground)" }}>
                            {msg.senderName}
                          </p>
                        )}
                        <div
                          className="rounded-2xl px-4 py-2.5 text-sm"
                          style={{
                            backgroundColor: isMe ? "#5B4FE5" : "var(--color-card)",
                            color: isMe ? "#ffffff" : "var(--color-foreground)",
                            borderBottomRightRadius: isMe ? "4px" : undefined,
                            borderBottomLeftRadius: !isMe ? "4px" : undefined,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                          }}
                        >
                          {msg.text}
                        </div>
                        <p
                          className={`text-xs ${isMe ? "text-right pr-1" : "text-left pl-1"}`}
                          style={{ color: "var(--color-muted-foreground)" }}
                        >
                          {formatTime(msg.sentAt)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 border-t" style={{ borderColor: "var(--color-border)" }}>
              <div
                className="flex items-end gap-2 rounded-2xl border px-4 py-2"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}
              >
                <button className="flex-shrink-0 mb-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                  <Smile className="h-5 w-5" />
                </button>
                <textarea
                  rows={1}
                  className="flex-1 text-sm resize-none focus:outline-none bg-transparent"
                  style={{ color: "var(--color-foreground)", maxHeight: "120px" }}
                  placeholder={`Message ${activeContact.name}…`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                />
                <button className="flex-shrink-0 mb-0.5" style={{ color: "var(--color-muted-foreground)" }}>
                  <Paperclip className="h-5 w-5" />
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition disabled:opacity-40"
                  style={{ backgroundColor: "#5B4FE5" }}
                >
                  {sending
                    ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                    : <Send className="h-4 w-4 text-white" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: "var(--color-neutral-100)" }}
              >
                <Send className="h-7 w-7" style={{ color: "var(--color-neutral-400)" }} />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                Select a conversation
              </p>
              <p className="text-xs max-w-xs" style={{ color: "var(--color-muted-foreground)" }}>
                {contacts.length === 0
                  ? "Contacts appear once a project is assigned to you."
                  : "Choose a contact from the left to start chatting."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
