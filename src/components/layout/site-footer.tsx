import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");

  // TODO: point these at the policy pages once they exist.
  const links = [
    t("links.privacy"),
    t("links.terms"),
    t("links.audit"),
    t("links.support"),
  ];

  return (
    <footer className="shrink-0 border-t border-line">
      <div className="flex flex-col items-center gap-4 px-6 py-6 text-[12px] sm:px-8 sm:text-[13px] md:flex-row md:justify-between lg:px-12">
        <p className="text-subtle">{t("version")}</p>

        <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2">
          {links.map((label) => (
            <a
              key={label}
              href="#"
              className="text-ink-muted transition-colors hover:text-ink"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
