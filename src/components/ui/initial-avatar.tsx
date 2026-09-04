import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InitialAvatarProps = HTMLAttributes<HTMLDivElement> & {
  name: string;
  tone?: "blue" | "green" | "orange" | "purple" | "red" | "teal";
};

const tones = {
  blue: "bg-[var(--blue-100)] text-[var(--blue-700)]",
  green: "bg-[var(--green-100)] text-[var(--green-700)]",
  orange: "bg-[var(--amber-100)] text-[var(--amber-700)]",
  purple: "bg-[var(--violet-100)] text-[var(--violet-700)]",
  red: "bg-[var(--red-100)] text-[var(--red-700)]",
  teal: "bg-[var(--color-info-surface)] text-[var(--color-info)]",
};

export function InitialAvatar({
  className,
  name,
  tone = "blue",
  ...props
}: InitialAvatarProps) {
  return (
    <div
      className={cn(
        "grid size-9 place-items-center rounded-[var(--radius-full)] text-xs font-bold",
        tones[tone],
        className,
      )}
      {...props}
    >
      {initials(name)}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
