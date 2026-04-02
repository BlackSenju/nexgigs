"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Send, ArrowLeft, User } from "lucide-react";

const SAMPLE_CONVERSATIONS = [
  {
    id: "1",
    name: "Sarah M.",
    lastMessage: "Sounds good! I'll be there at 9am Saturday.",
    time: "30m ago",
    unread: 1,
    job: "Lawn mowed + hedges trimmed",
  },
  {
    id: "2",
    name: "Marcus J.",
    lastMessage: "Can you send some examples of similar logos?",
    time: "2h ago",
    unread: 0,
    job: "Logo design for food truck",
  },
  {
    id: "3",
    name: "Tanya R.",
    lastMessage: "Perfect, thanks for confirming the time.",
    time: "1d ago",
    unread: 0,
    job: "Help moving furniture",
  },
  {
    id: "4",
    name: "David L.",
    lastMessage: "I already bought the Eero system. Just need setup help.",
    time: "2d ago",
    unread: 0,
    job: "WiFi + smart home install",
  },
];

const SAMPLE_MESSAGES = [
  {
    id: "m1",
    sender: "them",
    text: "Hey! I saw your application for the lawn job. Your profile looks great.",
    time: "10:30 AM",
  },
  {
    id: "m2",
    sender: "me",
    text: "Thanks Sarah! I've done a lot of yard work in the Bay View area. I have my own mower if that helps.",
    time: "10:32 AM",
  },
  {
    id: "m3",
    sender: "them",
    text: "Oh perfect, I do have equipment but good to know you have your own too. Can you do this Saturday morning?",
    time: "10:35 AM",
  },
  {
    id: "m4",
    sender: "me",
    text: "Saturday works! I can be there at 9am. Should take about 2 hours for the mowing and hedges.",
    time: "10:38 AM",
  },
  {
    id: "m5",
    sender: "them",
    text: "Sounds good! I'll be there at 9am Saturday.",
    time: "10:40 AM",
  },
];

export default function MessagesPage() {
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  const activeConvo = SAMPLE_CONVERSATIONS.find((c) => c.id === selectedConvo);

  function handleSend() {
    if (!newMessage.trim()) return;
    setNewMessage("");
  }

  // Conversation list
  if (!selectedConvo) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4">
        <h1 className="text-xl font-black text-white mb-4">Messages</h1>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50"
          />
        </div>

        {/* Conversation list */}
        <div className="space-y-1">
          {SAMPLE_CONVERSATIONS.map((convo) => (
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
                    {convo.name}
                  </span>
                  <span className="text-xs text-zinc-500">{convo.time}</span>
                </div>
                <p className="text-xs text-zinc-500 truncate">{convo.job}</p>
                <p className="text-sm text-zinc-400 truncate">
                  {convo.lastMessage}
                </p>
              </div>
              {convo.unread > 0 && (
                <div className="w-5 h-5 rounded-full bg-brand-orange text-white text-xs flex items-center justify-center flex-shrink-0">
                  {convo.unread}
                </div>
              )}
            </button>
          ))}
        </div>
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
            {activeConvo?.name}
          </div>
          <div className="text-xs text-zinc-500">{activeConvo?.job}</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {SAMPLE_MESSAGES.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "max-w-[80%]",
              msg.sender === "me" ? "ml-auto" : "mr-auto"
            )}
          >
            <div
              className={cn(
                "px-3 py-2 rounded-2xl text-sm",
                msg.sender === "me"
                  ? "bg-brand-orange text-white rounded-br-md"
                  : "bg-card text-zinc-200 border border-zinc-800 rounded-bl-md"
              )}
            >
              {msg.text}
            </div>
            <span
              className={cn(
                "text-xs text-zinc-600 mt-0.5 block",
                msg.sender === "me" ? "text-right" : ""
              )}
            >
              {msg.time}
            </span>
          </div>
        ))}
      </div>

      {/* Message input */}
      <div className="px-4 py-3 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-zinc-800 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange/50"
          />
          <button
            onClick={handleSend}
            className="w-10 h-10 rounded-xl bg-brand-orange flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
