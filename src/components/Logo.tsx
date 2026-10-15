import { Icon } from "./Icon";

export function Logo({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container text-on-primary shadow-sm">
        <Icon name="cloud" className="text-[22px]" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-text-primary">MacTidar</span>
        {subtitle && <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">{subtitle}</span>}
      </div>
    </div>
  );
}
