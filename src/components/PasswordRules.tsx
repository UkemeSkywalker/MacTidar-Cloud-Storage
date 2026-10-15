import { passwordRules } from "@/lib/passwords";
import { Icon } from "./Icon";

export function PasswordRules({ password }: { password: string }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-surface-container-low/60 p-2.5">
      {passwordRules.map((rule) => {
        const ok = rule.test(password);
        return (
          <div key={rule.label} className="flex items-center gap-1.5">
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${ok ? "bg-file-sheet/15 text-file-sheet" : "bg-surface-container-high text-outline"}`}
            >
              <Icon name={ok ? "check" : "remove"} className="text-[12px] font-bold" />
            </span>
            <span className={`font-label-sm text-label-sm ${ok ? "text-file-sheet" : "text-text-secondary"}`}>{rule.label}</span>
          </div>
        );
      })}
    </div>
  );
}
