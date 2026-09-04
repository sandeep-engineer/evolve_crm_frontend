import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
};

export function AuthCard({ children }: AuthCardProps) {
  return (
    <section className="w-full max-w-[28rem] rounded-[var(--card-radius)] border border-[var(--card-border)] bg-[var(--card-background)] p-[var(--space-6)] shadow-[var(--shadow-md)]">
      {children}
    </section>
  );
}
