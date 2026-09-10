"use client";

import { useEffect, useLayoutEffect, useId, useRef } from "react";
import type React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type DialogProps = {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
  description?: string;
  title: string;
};

const focusableSelector =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Dialog({
  children,
  className,
  description,
  isOpen,
  onClose,
  title,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    const content = contentRef.current;
    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const initialFocus =
      content?.querySelector<HTMLElement>("[data-dialog-initial-focus]") ??
      content?.querySelector<HTMLElement>(focusableSelector) ??
      dialog?.querySelector<HTMLElement>(focusableSelector);
    initialFocus?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      const openDialogs = Array.from(
        document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]'),
      );
      if (openDialogs.at(-1) !== dialog) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      );
      if (!focusableElements.length) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      const restoreFocusTarget = restoreFocusRef.current;
      if (restoreFocusTarget?.isConnected) {
        restoreFocusTarget.focus();
      }
      restoreFocusRef.current = null;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-[var(--space-4)]">
      <div
        ref={dialogRef}
        className={cn(
          "max-h-[90vh] w-full overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)]",
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
      >
        <div className="flex h-14 items-center justify-between border-b border-[var(--color-divider)] px-[var(--space-5)]">
          <h2 className="text-base font-bold text-[var(--color-text)]" id={titleId}>{title}</h2>
          <button
            aria-label="Close dialog"
            className="grid size-9 place-items-center rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
            onClick={onClose}
            type="button"
          >
            <X className="size-[var(--icon-sm)]" />
          </button>
        </div>
        <div ref={contentRef} className="max-h-[calc(90vh-3.5rem)] overflow-y-auto p-[var(--space-5)]">
          {description ? <p className="sr-only" id={descriptionId}>{description}</p> : null}
          {children}
        </div>
      </div>
    </div>
  );
}
