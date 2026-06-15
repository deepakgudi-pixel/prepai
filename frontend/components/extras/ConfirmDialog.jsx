"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  onCancel,
  onConfirm,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[240] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={onCancel}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            initial={{ y: 28, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 18, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-t-[28px] border border-[#D5D3CE] bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
                <AlertTriangle className="size-5" />
              </span>
              <button
                type="button"
                onClick={onCancel}
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-[#777] transition-colors hover:bg-[#EAE8E3] hover:text-[#111]"
                aria-label="Cancel action"
              >
                <X className="size-5" />
              </button>
            </div>

            <h2 id="confirm-dialog-title" className="mb-3 font-display text-3xl leading-none text-[#111]">
              {title}
            </h2>
            <p id="confirm-dialog-description" className="text-sm leading-6 text-[#555]">
              {description}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="glass-pill flex flex-1 items-center justify-center gap-2 bg-red-700 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-red-800 disabled:opacity-70"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                {confirmLabel}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="glass-pill flex-1 px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#555] transition-colors hover:text-[#111] disabled:opacity-70"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
