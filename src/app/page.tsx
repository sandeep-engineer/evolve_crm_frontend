import { AuthForm } from "@/components/auth/auth-form";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { AuthCard } from "@/components/ui/auth-card";

export default function Home() {
  return (
    <main className="flex min-h-dvh bg-[var(--color-canvas)] text-[var(--color-text)]">
      <section className="hidden min-h-dvh flex-1 border-r border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-10)] py-[var(--space-8)] lg:flex lg:flex-col">
        <BrandLockup />

        <div className="mt-auto max-w-[34rem]">
          <p className="text-sm font-semibold uppercase tracking-[var(--tracking-label)] text-[var(--color-primary)]">
            Lead to member workflow
          </p>
          <h1 className="mt-[var(--space-3)] text-3xl font-bold leading-tight tracking-[var(--tracking-tight)] text-[var(--color-text)]">
            Sign in to manage Evolve trials, memberships, attendance, and collections.
          </h1>
          <div className="mt-[var(--space-8)] grid grid-cols-3 gap-[var(--grid-gap)]">
            {[
              ["24", "CRM tables"],
              ["111", "API endpoints"],
              ["3", "Access roles"],
            ].map(([value, label]) => (
              <div
                className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-[var(--space-4)]"
                key={label}
              >
                <p className="text-2xl font-bold text-[var(--color-text)]">
                  {value}
                </p>
                <p className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-dvh w-full items-center justify-center px-[var(--space-4)] py-[var(--space-8)] lg:w-[34rem]">
        <AuthCard>
          <div className="mb-[var(--space-6)]">
            <div className="mb-[var(--space-5)] flex items-center gap-[var(--space-3)] lg:hidden">
              <BrandLockup />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[var(--tracking-label)] text-[var(--color-text-muted)]">
              Secure access
            </p>
            <h2 className="mt-[var(--space-2)] text-2xl font-bold leading-tight tracking-[var(--tracking-tight)] text-[var(--color-text)]">
              Access your account
            </h2>
            <p className="mt-[var(--space-2)] text-sm leading-[var(--leading-normal)] text-[var(--color-text-secondary)]">
              Sign in with the account created for your organization.
            </p>
          </div>
          <AuthForm />
        </AuthCard>
      </section>
    </main>
  );
}
