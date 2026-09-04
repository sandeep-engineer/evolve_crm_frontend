"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login, registerFirstUser } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { saveSession } from "@/lib/session";

type AuthMode = "login" | "register";
type FormState = "idle" | "submitting" | "success" | "error";

const modeCopy = {
  login: {
    action: "Sign in",
    pending: "Signing in...",
    successPrefix: "Signed in as",
  },
  register: {
    action: "Create first account",
    pending: "Creating account...",
    successPrefix: "Created account for",
  },
};

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setState("idle");
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "");

    try {
      if (mode === "register") {
        const user = await registerFirstUser({ name, email, password });
        setState("success");
        setMessage(`${modeCopy.register.successPrefix} ${user.name}. You can sign in now.`);
        setMode("login");
        return;
      }

      const session = await login({ email, password });
      saveSession(session.accessToken, session.user);
      setState("success");
      setMessage(`${modeCopy.login.successPrefix} ${session.user.name}`);
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
      <div className="grid grid-cols-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1">
        {(["login", "register"] as const).map((item) => (
          <button
            className={cn(
              "h-[var(--control-height-sm)] rounded-[var(--radius-sm)] text-sm font-semibold text-[var(--color-text-secondary)] transition duration-[var(--duration-normal)] ease-[var(--ease-standard)]",
              mode === item &&
                "bg-[var(--color-surface)] text-[var(--color-text)] shadow-[var(--shadow-xs)]",
            )}
            key={item}
            onClick={() => switchMode(item)}
            type="button"
          >
            {item === "login" ? "Login" : "Register"}
          </button>
        ))}
      </div>

      <form className="grid gap-[var(--space-5)]" onSubmit={handleSubmit}>
        {mode === "register" ? (
          <Input
            autoComplete="name"
            id="name"
            label="Full name"
            name="name"
            placeholder="Your name"
            required
            type="text"
          />
        ) : null}

        <Input
          autoComplete="email"
          defaultValue={mode === "login" ? "admin@fitcrm.com" : ""}
          id="email"
          label="Email"
          name="email"
          placeholder="you@evolve.com"
          required
          type="email"
        />
        <Input
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          defaultValue={mode === "login" ? "Password@123" : ""}
          id="password"
          label="Password"
          name="password"
          placeholder="Enter password"
          required
          type="password"
        />

        {mode === "register" ? (
          <p className="text-xs leading-[var(--leading-normal)] text-[var(--color-text-muted)]">
            Registration creates the first super-admin account only on a fresh setup.
          </p>
        ) : null}

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
          {isSubmitting ? modeCopy[mode].pending : modeCopy[mode].action}
        </Button>
      </form>
    </div>
  );
}
