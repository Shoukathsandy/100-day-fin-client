import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: React.ReactNode
  iconColor?: string
  children: React.ReactNode
  maxWidth?: string
}

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  iconColor = "bg-primary/10 text-primary",
  children,
  maxWidth = "max-w-md",
}: ModalProps) {
  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full bg-background rounded-2xl shadow-2xl",
          "flex flex-col max-h-[90vh]",
          "animate-in zoom-in-95 fade-in duration-200",
          maxWidth
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-5 border-b border-border/40">
          {icon && (
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              iconColor
            )}>
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0 pt-0.5">
            <h2 className="text-base font-semibold leading-tight text-foreground">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  )
}

/* ── Confirm modal ─────────────────────────────────────────────────────────── */

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  confirmVariant?: "destructive" | "default"
  loading?: boolean
  icon?: React.ReactNode
  iconColor?: string
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "default",
  loading = false,
  icon,
  iconColor,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      iconColor={iconColor}
      maxWidth="max-w-sm"
    >
      <div className="flex gap-3 pt-1">
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            "flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            confirmVariant === "destructive"
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {loading && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          )}
          {confirmLabel}
        </button>
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}
