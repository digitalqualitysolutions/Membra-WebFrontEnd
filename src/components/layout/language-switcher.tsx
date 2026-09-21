"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { locales, localeNames, type Locale } from "@/config/locales";
import { cn } from "@/lib/utils";

/** Swap the leading locale segment of the current path, keep the rest. */
function pathForLocale(pathname: string, locale: Locale) {
  const segments = pathname.split("/");
  segments[1] = locale;
  return segments.join("/") || `/${locale}`;
}

export function LanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className="inline-flex items-center rounded-lg bg-track p-0.5"
    >
      {locales.map((option) => {
        const active = option === locale;

        return (
          <Link
            key={option}
            href={pathForLocale(pathname, option)}
            lang={option}
            hrefLang={option}
            aria-current={active ? "true" : undefined}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
              active ? "bg-ink text-on-ink" : "text-subtle hover:text-ink",
            )}
          >
            {localeNames[option]}
          </Link>
        );
      })}
    </nav>
  );
}
