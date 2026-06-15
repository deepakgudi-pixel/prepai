"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { sendChatMessage, getChatHistory, clearChatHistory } from "@/actions/ai-chat.actions";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";

export default function AIChat() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { loading: loadingHistory, fn: fetchHistory } = useFetch(getChatHistory);
  const { loading: sending, fn: sendMessage } = useFetch(sendChatMessage);
  const { loading: clearing, fn: clearHistory } = useFetch(clearChatHistory);

  const authUser = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress || "",
      username: user.username || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      imageUrl: user.imageUrl || "",
    };
  }, [user]);

  // Load chat history when opened
  useEffect(() => {
    if (isOpen && authUser && messages.length === 0) {
      fetchHistory(authUser).then((result) => {
        if (result?.success && result.history) {
          setMessages(result.history);
        }
      });
    }
  }, [isOpen, authUser, messages.length, fetchHistory]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    const shouldFocusInput =
      isOpen &&
      authUser &&
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 640px)").matches;

    if (shouldFocusInput) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [authUser, isOpen]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending || !authUser) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to UI
    const newUserMessage = {
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    // Show typing indicator
    setIsTyping(true);

    // Prepare conversation history (last 10 messages)
    const conversationHistory = messages.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Send to backend
    const formData = new FormData();
    formData.append("message", userMessage);
    formData.append("authUser", JSON.stringify(authUser));
    formData.append("conversationHistory", JSON.stringify(conversationHistory));

    const result = await sendMessage(formData);

    setIsTyping(false);

    if (result?.success) {
      // Add AI response to UI
      const aiMessage = {
        role: "assistant",
        content: result.message,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } else {
      toast.error(result?.message || "Failed to send message");
    }
  }, [input, sending, authUser, messages, sendMessage]);

  const handleClearHistory = useCallback(async () => {
    if (!authUser || clearing) return;

    const formData = new FormData();
    formData.append("authUser", JSON.stringify(authUser));

    const result = await clearHistory(formData);

    if (result?.success) {
      setMessages([]);
      toast.success("Chat history cleared");
    } else {
      toast.error(result?.message || "Failed to clear history");
    }
  }, [authUser, clearing, clearHistory]);

  if (!isLoaded || !isSignedIn || !authUser) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 z-[110] flex size-14 items-center justify-center rounded-full border border-white/10 bg-[#222] text-[#EAE8E3] shadow-2xl transition-colors hover:bg-[#111] sm:bottom-6 sm:right-6 sm:size-16"
            aria-label="Open AI coach"
          >
            <Sparkles className="size-5 sm:size-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              onWheel={(e) => e.preventDefault()}
              className="fixed inset-0 z-[190] bg-black/20"
            />

            {/* Chat Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 280, mass: 0.9 }}
              className="fixed right-0 top-0 z-[200] flex h-[100dvh] w-full flex-col border-l border-[#D5D3CE] bg-[#EAE8E3] shadow-2xl sm:w-[480px]"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 border-b border-[#D5D3CE] bg-[#F4F3F0] p-4 pt-[calc(1rem+env(safe-area-inset-top))] sm:p-6 sm:pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-[#222] sm:size-10">
                    <Sparkles className="size-4 text-[#EAE8E3] sm:size-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl text-[#111] sm:text-2xl">PrepAI Coach</h2>
                    <p className="text-xs text-[#777]">Your AI fitness assistant</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      disabled={clearing}
                      className="flex size-10 items-center justify-center rounded-full text-[#777] transition-colors hover:bg-white/50 hover:text-[#111]"
                      title="Clear history"
                      aria-label="Clear chat history"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-white/50"
                    aria-label="Close AI coach"
                  >
                    <X className="size-5 text-[#111]" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div 
                className={`min-h-0 flex-1 space-y-4 p-4 sm:p-6 ${messages.length > 0 ? 'overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#D5D3CE] [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-[#aaa]' : 'overflow-hidden'}`}
                onWheel={(e) => e.stopPropagation()}
              >
                {messages.length === 0 && !loadingHistory && (
                  <div className="flex h-full flex-col items-center justify-center px-4 text-center sm:px-8">
                    <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-[#222] sm:mb-6 sm:size-20">
                      <Sparkles className="size-8 text-[#EAE8E3] sm:size-10" />
                    </div>
                    <h3 className="mb-3 font-display text-2xl text-[#111] sm:text-3xl">
                      Hey {authUser?.firstName || "there"}.
                    </h3>
                    <p className="text-[#555] font-light">
                      {authUser
                        ? "I\u0027m your AI fitness coach. Ask me anything about nutrition, workouts, or your progress!"
                        : "Sign in to use your AI fitness coach."}
                    </p>
                  </div>
                )}

                {loadingHistory && (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="size-8 animate-spin text-[#111]" />
                  </div>
                )}

                {messages.map((message, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-3xl px-4 py-3 sm:max-w-[80%] sm:px-5 ${
                        message.role === "user"
                          ? "bg-[#222] text-[#EAE8E3]"
                          : "border border-[#D5D3CE] bg-white/70 text-[#111]"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-3xl border border-[#D5D3CE] bg-white/70 px-5 py-3">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                          className="size-2 rounded-full bg-[#111]"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                          className="size-2 rounded-full bg-[#111]"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                          className="size-2 rounded-full bg-[#111]"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-[#D5D3CE] bg-[#F4F3F0] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2 sm:gap-3"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={authUser ? "Ask me anything..." : "Sign in to chat"}
                    disabled={!authUser || sending || isTyping}
                    className="min-w-0 flex-1 rounded-full border border-[#D5D3CE] bg-white px-4 py-3 text-sm text-[#111] placeholder:text-[#aaa] outline-none transition-colors focus:border-[#222] disabled:opacity-50 sm:px-6 sm:py-4"
                  />
                  <button
                    type="submit"
                    disabled={!authUser || !input.trim() || sending || isTyping}
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#222] text-[#EAE8E3] transition-colors hover:bg-[#111] disabled:cursor-not-allowed disabled:opacity-50 sm:size-12"
                    aria-label="Send message"
                  >
                    {sending ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <Send className="size-5" />
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
