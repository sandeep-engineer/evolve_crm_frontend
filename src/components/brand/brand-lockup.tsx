import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLockupProps = {
  compact?: boolean;
};

export function BrandMark() {
  return (
    <div className="relative size-10 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xs)]">
      <Image
        alt="Evolve - MMA and Calisthenics logo"
        className="object-cover"
        fill
        priority
        sizes="40px"
        src="/evolve.png"
      />
    </div>
  );
}

export function BrandLockup({ compact = false }: BrandLockupProps) {
  return (
    <div className="flex min-w-0 items-center gap-[var(--space-3)]">
      <BrandMark />
      <div className={cn("min-w-0", compact && "hidden xl:block")}>
        <p className="truncate text-lg font-bold leading-tight text-[var(--color-text)]">
          Evolve
        </p>
        <p className="truncate text-xs font-medium uppercase tracking-[var(--tracking-label)] text-[var(--color-text-muted)]">
          MMA and Calisthenics
        </p>
      </div>
    </div>
  );
}
