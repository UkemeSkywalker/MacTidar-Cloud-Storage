import { avatarColor, initials } from "@/lib/format";

export function Avatar({ name, id, size = "h-8 w-8 text-[12px]" }: { name: string; id: string; size?: string }) {
  return (
    <div className={`${size} ${avatarColor(id)} flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}>
      {initials(name)}
    </div>
  );
}
