"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Search, Send, ArrowLeft, User, Loader2, Sparkles } from "lucide-react";
import { ContentChecker } from "@/components/ui/ai-assist";
import { createClient } from "@/lib/supabase/client";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "@/lib/actions/messages";

interface Conversation {
  id: string;
  otherUser: { id: string; first_name: string; last_initial: string } | null;
  jobTitle: string | null;
  lastMessage: string | null;
  lastMessageAt: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [userId, setUserId] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [suggestingReply, setSuggestingReply] = useState(false);
  const [isElite, setIsElite] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const suggestionsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load conversations and check subscription tier
  useEffect(() => {
    async function load() {
      const result = await getConversations();
      setConversations(result.conversations);
      setUserId(result.userId ?? "");
      setLoading(false);

      // Check if user is Elite tier
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: subs } = await supabase
          .from("nexgigs_subscriptions")
          .select("tier, status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1);
        if (subs && subs.length > 0 && subs[0].tier === "elite") {
          setIsElite(true);
        }
      }
    }
    load();
  }, []);

  // Load messages for selected conversation
  useEffect(() => {
    if (!selectedConvo) return;

    async function loadMessages() {
      const result = await getMessages(selectedConvo!);
      setMessages(result.messages as Message[]);
      setUserId(result.userId);
    }
    loadMessages();
  }, [selectedConvo]);

  // Supabase Realtime subscription for new messages
  useEffect(() => {
    if (!selectedConvo) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${selectedConvo}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "nexgigs_messages",
          filter: `conversation_id=eq.${selectedConvo}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConvo]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const activeConvo = conversations.find((c) => c.id === selectedConvo);

  // Clear suggestions when conversation changes
  useEffect(() => {
    setAiSuggestions([]);
    if (suggestionsTimerRef.current) {
      clearTimeout(suggestionsTimerRef.current);
      suggestionsTimerRef.current = null;
    }
  }, [selectedConvo]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (suggestionsTimerRef.current) {
        clearTimeout(suggestionsTimerRef.current);
      }
    };
  }, []);

  const handleAiSuggest = useCallback(async () => {
    if (suggestingReply || messages.length === 0) return;
    setSuggestingReply(true);
    setAiSuggestions([]);

    // Build conversation context from last 5 messages
    const recentMessages = messages.slice(-5).map((msg) => {
      const isMe = msg.sender_id === userId;
      return `${isMe ? "Me" : "Them"}: ${msg.content}`;
    });

    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reply",
          conversationContext: recentMessages.join("\n"),
          userRole: "gigger",
          jobTitle: activeConvo?.jobTitle || undefined,
        }),
      });
      const data = await res.json();
      if (data.suggestions && Array.isArray(data.suggestions)) {
        setAiSuggestions(data.suggestions);
        // Auto-dismiss after 30 seconds
        suggestionsTimerRef.current = setTimeout(() => {
          setAiSuggestions([]);
          suggestionsTimerRef.current = null;
        }, 30000);
      }
    } catch {
      // Silently fail — AI is optional
    } finally {
      setSuggestingReply(false);
    }
  }, [suggestingReply, messages, userId, activeConvo]);

  function handleSelectSuggestion(suggestion: string) {
    setNewMessage(suggestion);
    setAiSuggestions([]);
    if (suggestionsTimerRef.current) {
      clearTimeout(suggestionsTimerRef.current);
      suggestionsTimerRef.current = null;
    }
  }

  async function handleSend() {
    if (!newMessage.trim() || !selectedConvo || sendingMsg) return;
    setSendingMsg(true);

    const result = await sendMessage(selectedConvo, newMessage);
    if (!result.error) {
      setNewMessage("");
    }
    setSendingMsg(false);
  }

  function formatTime(date: string) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return d.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  // Conversation list
  if (!selectedConvo) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4">
        <h1 className="text-xl font-black text-white mb-4">Messages</h1>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50"
          />
        </div>

        {conversations.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-zinc-500">No messages yet.</p>
            <p className="text-xs text-zinc-600 mt-1">
              Start a conversation from a job listing or profile page.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelectedConvo(convo.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-card transition-colors text-left"
              >
                <div className="w-11 h-11 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">
                      {convo.otherUser
                        ? `${convo.otherUser.first_name} ${convo.otherUser.last_initial}.`
                        : "Unknown"}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatTime(convo.lastMessageAt)}
                    </span>
                  </div>
                  {convo.jobTitle && (
                    <p className="text-xs text-zinc-500 truncate">
                      {convo.jobTitle}
                    </p>
                  )}
                  <p className="text-sm text-zinc-400 truncate">
                    {convo.lastMessage ?? "No messages yet"}
                  </p>
                </div>
                {Number(convo.unread) > 0 && (
                  <div className="w-5 h-5 rounded-full bg-brand-orange text-white text-xs flex items-center justify-center flex-shrink-0">
                    {convo.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Message thread
  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
        <button
          onClick={() => setSelectedConvo(null)}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center">
          <User className="w-4 h-4 text-zinc-400" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">
            {activeConvo?.otherUser
              ? `${activeConvo.otherUser.first_name} ${activeConvo.otherUser.last_initial}.`
              : "Unknown"}
          </div>
          {activeConvo?.jobTitle && (
            <div className="text-xs text-zinc-500">{activeConvo.jobTitle}</div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-zinc-600 py-8">
            No messages yet. Say hello!
          </p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === userId;
          return (
            <div
              key={msg.id}
              className={cn("max-w-[80%]", isMe ? "ml-auto" : "mr-auto")}
            >
              <div
                className={cn(
                  "px-3 py-2 rounded-2xl text-sm",
                  isMe
                    ? "bg-brand-orange text-white rounded-br-md"
                    : "bg-card text-zinc-200 border border-zinc-800 rounded-bl-md"
                )}
              >
                {msg.content}
              </div>
              <span
                className={cn(
                  "text-xs text-zinc-600 mt-0.5 block",
                  isMe ? "text-right" : ""
                )}
              >
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="px-4 py-3 border-t border-zinc-800">
        <ContentChecker content={newMessage} className="mb-1" />

        {/* AI Suggestion pills */}
        {aiSuggestions.length > 0 && (
          <div className="flex flex-col gap-1.5 mb-2">
            <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Suggestions — tap to use
            </span>
            {aiSuggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="text-left text-xs px-3 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50 text-zinc-300 hover:bg-zinc-700/60 hover:border-brand-orange/30 transition-colors line-clamp-2"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {isElite && (
            <button
              onClick={handleAiSuggest}
              disabled={suggestingReply || messages.length === 0}
              title="AI Suggest Reply"
              className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-brand-orange hover:border-brand-orange/50 transition-colors disabled:opacity-50"
            >
              {suggestingReply ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </button>
          )}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50"
          />
          <button
            onClick={handleSend}
            disabled={sendingMsg || !newMessage.trim()}
            className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
