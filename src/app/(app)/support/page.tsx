"use client";

import { useState, useEffect } from "react";
import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Loader2,
  CheckCircle,
  Clock,
  HelpCircle,
  Send,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import {
  createTicket,
  getMyTickets,
  getMyPriority,
} from "@/lib/actions/support";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "payment", label: "Payment" },
  { value: "account", label: "Account" },
  { value: "technical", label: "Technical" },
  { value: "report_user", label: "Report User" },
  { value: "other", label: "Other" },
];

const PRIORITY_COLORS: Record<string, string> = {
  vip: "text-yellow-400",
  urgent: "text-purple-400",
  high: "text-blue-400",
  normal: "text-zinc-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  vip: "VIP",
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-yellow-900/30 text-yellow-400",
  in_progress: "bg-blue-900/30 text-blue-400",
  resolved: "bg-green-900/30 text-green-400",
};

export default function SupportPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<Array<Record<string, unknown>>>([]);
  const [priorityInfo, setPriorityInfo] = useState<{
    priority: string;
    responseTime: string;
    tier: string;
  }>({ priority: "normal", responseTime: "48 hours", tier: "free" });

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("general");
  const [description, setDescription] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function load() {
      const [ticketsData, priorityData] = await Promise.all([
        getMyTickets(),
        getMyPriority(),
      ]);
      setTickets(ticketsData);
      setPriorityInfo(priorityData);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit() {
    if (!subject.trim() || !description.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    const result = await createTicket({ subject, description, category });

    if (result.error) {
      setErrorMsg(result.error);
    } else {
      setSuccessMsg(
        `Ticket submitted! Expected response time: ${result.responseTime}`
      );
      setSubject("");
      setCategory("general");
      setDescription("");
      // Refresh tickets immutably
      const updated = await getMyTickets();
      setTickets(updated);
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-4">
      <BackButton fallbackHref="/settings" />
      <div className="flex items-center gap-2 mb-6">
        <HelpCircle className="w-5 h-5 text-brand-orange" />
        <h1 className="text-xl font-black text-white">Support</h1>
      </div>

      {/* Priority indicator */}
      <div className="p-3 rounded-xl bg-card border border-zinc-800 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">
              Your priority:{" "}
              <span
                className={cn(
                  "font-bold",
                  PRIORITY_COLORS[priorityInfo.priority] ?? "text-zinc-400"
                )}
              >
                {PRIORITY_LABELS[priorityInfo.priority] ?? "Normal"}
              </span>
            </span>
          </div>
          <span className="text-xs text-zinc-500">
            Response: {priorityInfo.responseTime}
          </span>
        </div>
        {priorityInfo.tier === "free" && (
          <Link
            href="/subscription"
            className="block mt-2 text-xs text-brand-orange hover:underline"
          >
            Upgrade to Pro for faster support
          </Link>
        )}
      </div>

      {/* New Ticket Form */}
      <div className="p-4 rounded-xl bg-card border border-zinc-800 mb-6">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Send className="w-4 h-4 text-brand-orange" /> New Ticket
        </h2>
        <div className="space-y-3">
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary of your issue"
          />
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-background text-white text-sm focus:outline-none focus:border-brand-orange"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-zinc-700 bg-background text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-orange resize-none"
              placeholder="Describe your issue in detail..."
            />
          </div>

          {errorMsg && (
            <div className="p-2 rounded-lg bg-brand-red/10 border border-brand-red/30 text-xs text-red-300">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-2 rounded-lg bg-green-900/20 border border-green-700/30 text-xs text-green-300 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {successMsg}
            </div>
          )}

          <Button
            className="w-full"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />{" "}
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1" /> Submit Ticket
              </>
            )}
          </Button>
        </div>
      </div>

      {/* My Tickets */}
      <div>
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand-orange" /> My Tickets
        </h2>
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <div
              key={ticket.id as string}
              className="p-3 rounded-xl bg-card border border-zinc-800"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white truncate pr-2">
                  {ticket.subject as string}
                </span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap",
                    STATUS_STYLES[ticket.status as string] ??
                      "bg-zinc-800 text-zinc-400"
                  )}
                >
                  {(ticket.status as string).replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  {CATEGORIES.find((c) => c.value === ticket.category)?.label ??
                    (ticket.category as string)}
                </span>
                <span>
                  {new Date(ticket.created_at as string).toLocaleDateString()}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-zinc-400 line-clamp-2">
                {ticket.description as string}
              </p>
              {Boolean(ticket.admin_response) && (
                <div className="mt-2 p-2 rounded-lg bg-green-900/10 border border-green-800/30">
                  <div className="flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] font-medium text-green-400">
                      Admin Response
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    {ticket.admin_response as string}
                  </p>
                </div>
              )}
            </div>
          ))}
          {tickets.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">
              No tickets yet. Submit one above if you need help.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
