"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Bell,
  AlertTriangle,
  Award,
  ShieldCheck,
  Users,
  Coins,
  FileText,
  Zap,
  CheckCheck,
  ExternalLink,
  RefreshCw,
  X,
} from "lucide-react";
import {
  NotificationType,
  NotificationPriority,
} from "@/lib/models/Notification";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  read: boolean;
  actionUrl?: string;
  relatedIssueId?: string;
  recipientRole: string;
  createdAt: string;
}

interface NotificationCenterProps {
  compact?: boolean;
}

export default function NotificationCenter({
  compact = false,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "critical">(
    "all",
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [criticalCount, setCriticalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications?limit=25`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
          setCriticalCount(data.criticalCount || 0);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch operational alerts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll notifications on mount and every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Handle outside click & escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
    } catch (err) {
      console.warn("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setIsMarkingAll(true);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      setCriticalCount(0);

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (err) {
      console.warn("Failed to mark all as read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffSec = Math.floor(
        (Date.now() - new Date(dateStr).getTime()) / 1000,
      );
      if (diffSec < 45) return "just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return `${Math.floor(diffSec / 86400)}d ago`;
    } catch {
      return "recently";
    }
  };

  const renderTypeIcon = (
    type: NotificationType,
    priority: NotificationPriority,
  ) => {
    const isCritical =
      priority === "CRITICAL" || type === "CIRCUIT_BREAKER_DISASTER";
    if (isCritical) {
      return (
        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 text-rose-600 border border-rose-300">
          <AlertTriangle className="w-4 h-4 animate-pulse" />
        </div>
      );
    }

    switch (type) {
      case "PANEL_DECISION":
      case "RUNNER_UP_PROMOTED":
        return (
          <div className="w-8 h-8 rounded-full bg-[#FFEFD3] flex items-center justify-center flex-shrink-0 text-[#001B2E] border border-[#FFC49B]">
            <Award className="w-4 h-4 text-[#001B2E]" />
          </div>
        );
      case "MILESTONE_PAYOUT_RELEASED":
        return (
          <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
          </div>
        );
      case "L3_SUBCONTRACT_INVITE":
      case "DIRECT_NOMINATION_REQUEST":
        return (
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 text-[#294C60] border border-blue-200">
            <Users className="w-4 h-4" />
          </div>
        );
      case "CSR_PLEDGE_RECEIVED":
        return (
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-700 border border-amber-200">
            <Coins className="w-4 h-4" />
          </div>
        );
      case "UNCLAIMED_ESCALATION_STAGE":
        return (
          <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 text-orange-600 border border-orange-200">
            <Zap className="w-4 h-4" />
          </div>
        );
      case "PROPOSAL_SUBMITTED":
        return (
          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0 text-purple-700 border border-purple-200">
            <FileText className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-slate-600 border border-slate-200">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "unread") return !item.read;
    if (activeTab === "critical")
      return (
        item.priority === "CRITICAL" || item.type === "CIRCUIT_BREAKER_DISASTER"
      );
    return true;
  });

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Nav Bell Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open Operational Notifications"
        className={`relative p-2 rounded-lg transition-colors flex items-center justify-center ${
          isOpen
            ? "bg-civic-primary text-white"
            : "text-civic-primary hover:bg-slate-100 hover:text-civic-primaryHover"
        }`}
      >
        <Bell className="w-5 h-5" />

        {/* Dynamic Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-[18px] h-[18px] bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Pulsing Red Dot for Critical Alerts */}
        {criticalCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600" />
          </span>
        )}
      </button>

      {/* Slide-out / Dropdown Flyout Panel */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 z-50 bg-white border border-civic-border rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 ${
            compact ? "w-80" : "w-88 sm:w-96"
          }`}
          style={{ maxHeight: "calc(100vh - 100px)" }}
        >
          {/* Header */}
          <div className="bg-civic-primary text-white p-4 border-b border-civic-primaryHover flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-civic-accent">
                  Live Alert Stream
                </span>
                {criticalCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-bold rounded">
                    {criticalCount} Critical
                  </span>
                )}
              </div>
              <h3 className="text-base font-serif font-bold text-white">
                Operational Notifications
              </h3>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={fetchNotifications}
                disabled={loading}
                title="Refresh notifications"
                className="p-1.5 rounded text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs & Quick Action */}
          <div className="bg-slate-50 px-3 py-2 border-b border-civic-border flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  activeTab === "all"
                    ? "bg-civic-primary text-white shadow-xs"
                    : "text-civic-textDark hover:bg-white"
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("unread")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                  activeTab === "unread"
                    ? "bg-civic-primary text-white shadow-xs"
                    : "text-civic-textDark hover:bg-white"
                }`}
              >
                Unread ({unreadCount})
              </button>
              {criticalCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab("critical")}
                  className={`px-2 py-1 rounded-md font-bold transition-colors ${
                    activeTab === "critical"
                      ? "bg-rose-700 text-white"
                      : "text-rose-700 bg-rose-100/70 hover:bg-rose-100"
                  }`}
                >
                  Critical ({criticalCount})
                </button>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAll}
                className="text-[11px] font-semibold text-civic-primary hover:text-civic-primaryHover hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Scrollable Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[380px]">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-civic-textMuted">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-civic-primary mb-2" />
                <span>Syncing live state alert feed...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-civic-textMuted">
                <ShieldCheck className="w-7 h-7 mx-auto text-emerald-600 mb-2 opacity-80" />
                <p className="font-semibold text-civic-textDark">
                  All caught up!
                </p>
                <p className="text-[11px] text-civic-textMuted mt-0.5">
                  {activeTab === "unread"
                    ? "No unread operational notifications."
                    : activeTab === "critical"
                      ? "No critical hazard alerts."
                      : "Zero pending alerts in this portal."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isCritical =
                  item.priority === "CRITICAL" ||
                  item.type === "CIRCUIT_BREAKER_DISASTER";

                return (
                  <div
                    key={item._id}
                    onClick={() => {
                      if (!item.read) handleMarkAsRead(item._id);
                    }}
                    className={`p-3.5 transition-colors text-xs flex gap-3 items-start ${
                      isCritical
                        ? "bg-rose-50/90 border-l-4 border-rose-600 text-rose-950"
                        : item.priority === "HIGH"
                          ? "bg-amber-50/40 border-l-4 border-amber-500"
                          : item.read
                            ? "bg-white hover:bg-slate-50 text-civic-textDark"
                            : "bg-blue-50/50 hover:bg-blue-50/80 text-civic-textDark border-l-4 border-civic-primary"
                    }`}
                  >
                    {renderTypeIcon(item.type, item.priority)}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <span
                          className={`font-semibold leading-tight line-clamp-1 ${
                            isCritical
                              ? "text-rose-950 font-bold"
                              : "text-civic-textDark"
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="text-[10px] text-civic-textMuted whitespace-nowrap ml-1 flex-shrink-0">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      <p
                        className={`text-[11.5px] leading-relaxed line-clamp-2 ${
                          isCritical ? "text-rose-900" : "text-civic-textMuted"
                        }`}
                      >
                        {item.message}
                      </p>

                      {/* Action Link & Meta Tags */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {item.actionUrl ? (
                          <Link
                            href={item.actionUrl}
                            suppressHydrationWarning={true}
                            onClick={() => {
                              handleMarkAsRead(item._id);
                              setIsOpen(false);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-civic-primary hover:text-civic-primaryHover hover:underline"
                          >
                            <span>Open Task</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span className="text-[10px] font-mono text-civic-textMuted">
                            {item.recipientRole} • {item.type}
                          </span>
                        )}

                        {!item.read && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(item._id);
                            }}
                            className="text-[10px] font-semibold text-civic-textMuted hover:text-civic-textDark cursor-pointer"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-civic-border text-center text-[10.5px] text-civic-textMuted">
            <span>
              Operational State Machine Alerts • Governed under SIH PS 26043
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
