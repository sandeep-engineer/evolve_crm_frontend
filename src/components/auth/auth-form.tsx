"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveSession } from "@/lib/session";

type FormState = "idle" | "submitting" | "success" | "error";

export function AuthForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    try {
      const session = await login({ email, password });
      saveSession(session.accessToken, session.user);
      setState("success");
      setMessage(`Signed in as ${session.user.name}`);
      router.push("/dashboard");
    } catch (error) {
      setState("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to continue. Please try again.",
      );
    }
  }

  const isSubmitting = state === "submitting";

  return (
    <div className="grid gap-[var(--space-5)]">
      <form className="grid gap-[var(--space-5)]" onSubmit={handleSubmit}>
        <Input
          autoComplete="email"
          id="email"
          label="Email"
          name="email"
          placeholder="you@evolve.com"
          required
          type="email"
        />
        <Input
          autoComplete="current-password"
          id="password"
          label="Password"
          name="password"
          placeholder="Enter password"
          required
          type="password"
        />

        {message ? (
          <div
            className="rounded-[var(--radius-md)] border px-[var(--space-3)] py-[var(--space-2)] text-sm"
            data-status={state === "success" ? "active" : "lost"}
            role={state === "error" ? "alert" : "status"}
            style={{
              background: "var(--status-background)",
              borderColor: "var(--status-border)",
              color: "var(--status-color)",
            }}
          >
            {message}
          </div>
        ) : null}

        <Button
          className="h-[var(--control-height-lg)] w-full"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
