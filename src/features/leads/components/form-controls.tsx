import { dayOptions } from "../constants";
import { cn } from "@/lib/utils";

export function SelectField({
  disabled,
  label,
  onChange,
  options,
  required,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
      <span>{label}</span>
      <select
        className="h-[var(--control-height-lg)] rounded-[var(--control-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--control-padding-x)] text-sm shadow-[var(--shadow-xs)] outline-none focus:border-[var(--color-focus)] focus:shadow-[var(--focus-ring)] disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-text-disabled)]"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      >
        {options.map((option) => (
          <option key={option.value || option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MultiSelect({
  label,
  onChange,
  options,
  values,
}: {
  label: string;
  onChange: (values: string[]) => void;
  options: Array<{ label: string; value: string }>;
  values: string[];
}) {
  function toggle(value: string) {
    onChange(values.includes(value) ? values.filter((id) => id !== value) : [...values, value]);
  }

  return (
    <fieldset className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
      <legend className="px-1 text-sm font-bold text-[var(--color-text)]">
        {label}
      </legend>
      {options.length ? (
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <label
              className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]"
              key={option.value}
            >
              <input
                checked={values.includes(option.value)}
                onChange={() => toggle(option.value)}
                type="checkbox"
              />
              <span className="min-w-0 truncate">{option.label}</span>
            </label>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          No active {label.toLowerCase()} available.
        </p>
      )}
    </fieldset>
  );
}

export function DayPicker({
  onChange,
  values,
}: {
  onChange: (values: number[]) => void;
  values: number[];
}) {
  function toggle(value: number) {
    onChange(
      values.includes(value)
        ? values.filter((day) => day !== value)
        : [...values, value].sort((first, second) => first - second),
    );
  }

  return (
    <fieldset className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
      <legend className="px-1 text-sm font-bold text-[var(--color-text)]">
        Preferred days
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {dayOptions.map((day) => (
          <button
            className={cn(
              "h-9 min-w-12 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text-secondary)]",
              values.includes(day.value) &&
                "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]",
            )}
            key={day.value}
            onClick={() => toggle(day.value)}
            type="button"
          >
            {day.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
