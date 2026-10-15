"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function PasswordInput({
  id,
  value,
  onChange,
  invalid,
  leadingIcon,
  autoComplete = "current-password",
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  invalid?: boolean;
  leadingIcon?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      {leadingIcon && (
        <Icon name={leadingIcon} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[18px] text-outline" />
      )}
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={`h-11 w-full rounded-lg bg-surface ${leadingIcon ? "pl-10" : "pl-3.5"} pr-11 font-body-md text-body-md text-text-primary outline-none transition-all placeholder:text-text-secondary focus:ring-2 ${invalid ? "focus:ring-danger/20" : "focus:ring-primary-container/20"}`}
        style={{ boxShadow: `inset 0 0 0 1px ${invalid ? "#DC2626" : "#E5E7EB"}` }}
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-text-secondary hover:text-text-primary"
      >
        <Icon name={show ? "visibility" : "visibility_off"} className="text-[20px]" />
      </button>
    </div>
  );
}

export const inputClass =
  "h-11 w-full rounded-lg bg-surface px-3.5 font-body-md text-body-md text-text-primary outline-none transition-all placeholder:text-text-secondary focus:ring-2 focus:ring-primary-container/20 shadow-[inset_0_0_0_1px_#E5E7EB]";
