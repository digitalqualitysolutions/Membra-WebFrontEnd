import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Navy rounded tile, as used in the header. */
export function LogoTile({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-xl bg-ink text-on-ink [--logo-gap:var(--color-ink)]",
        className,
      )}
    >
      <Icon name="brand" size="xl" />
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <LogoTile />
      <span className="text-[18px] font-bold tracking-tight text-ink sm:text-[22px]">
        Membra
      </span>
    </span>
  );
}
