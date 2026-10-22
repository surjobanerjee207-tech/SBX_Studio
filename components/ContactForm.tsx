"use client";

import { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

export function ContactForm() {
  const [s, setS] = useState<"idle" | "sending" | "ok" | "err">("idle");
  const [deadlineErr, setDeadlineErr] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const { minDate, maxDate } = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const min = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const max = `${now.getFullYear() + 2}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    return { minDate: min, maxDate: max };
  }, []);

  function validateDeadline(val: string): string | null {
    if (!val) return null;
    // Check YYYY-MM-DD format (blocks 5-digit years)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      return "Please choose a date within the next 2 years";
    }
    const [y, m, d] = val.split("-").map(Number);
    const selected = new Date(y, m - 1, d);
    if (
      isNaN(selected.getTime()) ||
      selected.getFullYear() !== y ||
      selected.getMonth() !== m - 1 ||
      selected.getDate() !== d
    ) {
      return "Please choose a date within the next 2 years";
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const max = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
    max.setHours(23, 59, 59, 999);

    if (selected < today || selected > max) {
      return "Please choose a date within the next 2 years";
    }
    return null;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const deadlineVal = (formData.get("deadline") as string)?.trim() || "";

    const localErr = validateDeadline(deadlineVal);
    if (localErr) {
      setDeadlineErr(localErr);
      setS("err");
      return;
    }
    setDeadlineErr(null);

    setS("sending");
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          Object.fromEntries(Array.from(formData.entries()))
        ),
      });

      if (!r.ok) {
        const data = await r.json().catch(() => null);
        const serverDeadlineErr =
          data?.fieldErrors?.deadline?.[0] ||
          (data?.error?.includes("date") || data?.error?.includes("year")
            ? data.error
            : null);

        if (serverDeadlineErr) {
          setDeadlineErr(serverDeadlineErr);
        }
        setS("err");
        return;
      }

      setS("ok");
    } catch {
      setS("err");
    }
  }

  const f = "w-full bg-panel border border-white/10 px-4 py-3 focus:border-red";

  return (
    <form onSubmit={submit} className="grid gap-5 max-w-xl">
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
      />
      <label>
        Name
        <input required name="name" maxLength={80} className={f} />
      </label>
      <label>
        Email
        <input required type="email" name="email" maxLength={120} className={f} />
      </label>
      <label>
        Project type
        <select name="projectType" className={f}>
          <option>Short-form</option>
          <option>YouTube</option>
          <option>Promotional</option>
          <option>Cinematic / Event</option>
        </select>
      </label>
      <label>
        Estimated budget (optional)
        <input name="budget" maxLength={40} className={f} />
      </label>
      <label>
        Project description
        <textarea
          required
          name="description"
          rows={5}
          minLength={10}
          maxLength={2000}
          className={f}
        />
      </label>
      <label>
        Preferred deadline (optional)
        <input
          name="deadline"
          type="date"
          min={minDate}
          max={maxDate}
          onChange={(e) => {
            if (deadlineErr) {
              setDeadlineErr(validateDeadline(e.target.value));
            }
          }}
          className={`${f} [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 ${
            deadlineErr ? "!border-red" : ""
          }`}
        />
        {deadlineErr ? (
          <p className="text-xs text-red mt-1.5 font-medium">{deadlineErr}</p>
        ) : (
          <p className="text-xs text-mute/70 mt-1">Within the next 2 years</p>
        )}
      </label>
      <button
        disabled={s === "sending"}
        className="bg-red px-6 py-3 hover:bg-cherry transition-colors"
      >
        {s === "sending" ? "Sending…" : "Send Project Inquiry"}
      </button>

      {/* Success / Error Status Announcement */}
      {s === "ok" && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="inline-flex items-center gap-3 text-bone text-base font-normal pt-1"
        >
          <span className="text-bone font-medium">Thanks — your inquiry was sent.</span>
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22C55E"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[22px] h-[22px] shrink-0 text-[#22C55E]"
            aria-hidden="true"
            initial={shouldReduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { delay: 0.15, type: "spring", stiffness: 280, damping: 20 }
            }
          >
            <circle cx="12" cy="12" r="10" />
            <motion.path
              d="m9 12 2 2 4-4"
              initial={shouldReduceMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { delay: 0.28, duration: 0.4, ease: "easeOut" }
              }
            />
          </motion.svg>
        </motion.div>
      )}

      {s === "err" && !deadlineErr && (
        <p role="status" aria-live="polite" className="text-mute">
          Could not send. Check the fields and try again.
        </p>
      )}
    </form>
  );
}
