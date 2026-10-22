"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";

export type AlertType = "success" | "error" | "warning" | "info";

export interface AdminAlertProps {
  type?: AlertType;
  message?: React.ReactNode;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  autoClose?: boolean;
  autoCloseDuration?: number;
}

export function AdminAlert({
  type = "info",
  message,
  children,
  onClose,
  className = "",
  autoClose,
  autoCloseDuration = 4000,
}: AdminAlertProps) {
  useEffect(() => {
    // Error messages stay until closed.
    // Success and info messages auto-dismiss after ~4 seconds if onClose is provided.
    if (type === "error") return;
    if (autoClose === false || !onClose) return;

    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDuration);

    return () => clearTimeout(timer);
  }, [type, onClose, autoClose, autoCloseDuration, message, children]);

  const config = {
    success: {
      role: "status" as const,
      style: {
        backgroundColor: "rgba(34, 197, 94, 0.12)",
        border: "1px solid rgba(34, 197, 94, 0.45)",
      },
      iconColor: "#22C55E",
      textColor: "text-[#F0FDF4]",
      icon: (
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      role: "alert" as const,
      style: {
        backgroundColor: "rgba(229, 9, 20, 0.15)",
        border: "1px solid rgba(229, 9, 20, 0.40)",
      },
      iconColor: "#E50914",
      textColor: "text-white",
      icon: (
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      role: "status" as const,
      style: {
        backgroundColor: "rgba(255, 209, 102, 0.12)",
        border: "1px solid rgba(255, 209, 102, 0.45)",
      },
      iconColor: "#FFD166",
      textColor: "text-[#FFFBEB]",
      icon: (
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    info: {
      role: "status" as const,
      style: {
        backgroundColor: "rgba(161, 161, 170, 0.12)",
        border: "1px solid rgba(161, 161, 170, 0.40)",
      },
      iconColor: "#A1A1AA",
      textColor: "text-white",
      icon: (
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  }[type] || {
    role: "status" as const,
    style: {
      backgroundColor: "rgba(161, 161, 170, 0.12)",
      border: "1px solid rgba(161, 161, 170, 0.40)",
    },
    iconColor: "#A1A1AA",
    textColor: "text-white",
    icon: null,
  };

  const rawContent = message ?? children;
  // Clean off any redundant prefix symbols if passed by legacy callers (e.g. "✓ ", "✕ ", "⚠ ")
  const displayContent =
    typeof rawContent === "string" ? rawContent.replace(/^[✓✕⚠!]\s*/, "") : rawContent;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.99 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      role={config.role}
      aria-live={config.role === "alert" ? "assertive" : "polite"}
      className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 shadow-lg font-normal ${config.textColor} ${className}`}
      style={config.style}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <span style={{ color: config.iconColor }} className="flex-shrink-0">
          {config.icon}
        </span>
        <span className="leading-relaxed break-words">{displayContent}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="text-secondary hover:text-white transition-colors p-1 -mr-1 rounded-lg flex-shrink-0 hover:bg-white/10"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.div>
  );
}
