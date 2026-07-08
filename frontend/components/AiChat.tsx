"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot, User, Sparkles, Loader2, ChevronDown } from "lucide-react";
import { authService } from "@/lib/authService";
import Axios from "axios";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const aiApi = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8083",
  headers: { "Content-Type": "application/json" },
});

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #4A3FD1, #5B4FE5)" }}>
        <Bot className="h-4 w-4 text-white" />
      </div>
      <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1"
        style={{ backgroundColor: "var(--color-neutral-100)" }}>
        {[0, 1, 2].map((i) => (
          <motion.span key={i}
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: "#5B4FE5" }}
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: isUser
            ? "linear-gradient(135deg, #5B4FE5, #7B6FF0)"
            : "linear-gradient(135deg, #4A3FD1, #5B4FE5)",
        }}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
      </div>

      {/* Bubble */}
      <div
        className="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
        style={{
          backgroundColor: isUser ? "#5B4FE5" : "var(--color-neutral-100)",
          color: isUser ? "#ffffff" : "var(--color-foreground)",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        }}>
        {msg.content}
      </div>
    </motion.div>
  );
}

interface AiChatProps {
  open: boolean;
  onClose: () => void;
}

export default function AiChat({ open, onClose }: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [role, setRole]         = useState<string>("WORKER");
  const [userId, setUserId]     = useState<string | undefined>(undefined);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const scrollRef  = useRef<HTMLDivElement>(null);

  // Read session client-side only (localStorage is not available during SSR)
  useEffect(() => {
    const session = authService.getSession();
    if (session) {
      setRole(session.role);
      setUserId(session.userId);
    }
  }, []);

  const greeting = role === "WORKER"
    ? "Hi! I'm your SSFRS AI assistant. Ask me about available projects, any field you're skilled in, career advice, or anything else you'd like to know."
    : "Hi! I'm your SSFRS AI assistant. Ask me about available workers in any specialization, hiring advice, project management, or anything else you need.";

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: "assistant", content: greeting }]);
    }
  }, [open]); // eslint-disable-line

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await aiApi.post<{ response: string }>("/api/ai/chat", {
        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        user_role: role,
        user_id:   userId,
      });
      setMessages(prev => [...prev, { role: "assistant", content: res.data.response }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden shadow-2xl"
            style={{
              width: "min(420px, calc(100vw - 3rem))",
              height: "min(620px, calc(100vh - 5rem))",
              borderRadius: "24px",
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
            }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #4A3FD1 0%, #5B4FE5 60%, #7B6FF0 100%)",
              }}>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }}>
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">SSFRS AI Assistant</p>
                  <p className="text-white/70 text-xs">Powered by Groq</p>
                </div>
              </div>
              <button onClick={onClose}
                className="h-8 w-8 rounded-full flex items-center justify-center transition hover:bg-white/20">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
              style={{ backgroundColor: "var(--color-background)" }}>
              {messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            {/* Scroll to bottom */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={scrollToBottom}
                  className="absolute bottom-20 right-4 h-8 w-8 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: "#5B4FE5" }}>
                  <ChevronDown className="h-4 w-4 text-white" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="px-4 pb-4 pt-3 flex-shrink-0"
              style={{ borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-card)" }}>
              <div className="flex items-end gap-2 rounded-2xl border px-3 py-2"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  rows={1}
                  placeholder="Ask me anything…"
                  className="flex-1 resize-none text-sm focus:outline-none bg-transparent"
                  style={{
                    color: "var(--color-foreground)",
                    maxHeight: "120px",
                    lineHeight: "1.5",
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 transition disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #4A3FD1, #5B4FE5)" }}>
                  {loading
                    ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                    : <Send className="h-4 w-4 text-white" />}
                </button>
              </div>
              <p className="text-center text-[10px] mt-2" style={{ color: "var(--color-muted-foreground)" }}>
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
