import { Icon } from "@/components/icons";

export function ConsentBadge({ children }: { children: string }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1 text-[12px] text-ink-muted shadow-badge sm:text-[13px]">
      <Icon name="consentLock" size="sm" className="text-lock" />
      {children}
    </p>
  );
}
