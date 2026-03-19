/**
 * DataSourceBadges — inline trust signal for data-driven pages.
 * Shows the authoritative sources used on a given page.
 * Keep this a server component (no "use client").
 */

type Source = {
  label: string;
  name: string;
  href: string;
};

const ALL_SOURCES: Record<string, Source> = {
  bls: {
    label: "Salary data",
    name: "Bureau of Labor Statistics",
    href: "https://www.bls.gov/oes/",
  },
  hud: {
    label: "Rent data",
    name: "HUD Fair Market Rents",
    href: "https://www.huduser.gov/portal/datasets/fmr.html",
  },
  irs: {
    label: "Tax calculations",
    name: "IRS federal tax tables",
    href: "https://www.irs.gov/tax-professionals/tax-code-regulations-and-official-guidance",
  },
  ssa: {
    label: "Payroll taxes",
    name: "Social Security Administration",
    href: "https://www.ssa.gov/oact/cola/cbb.html",
  },
  col: {
    label: "Cost-of-living index",
    name: "C2ER / ACCRA Cost of Living Index",
    href: "https://www.coli.org/",
  },
};

interface Props {
  sources?: Array<keyof typeof ALL_SOURCES>;
  /** Show the last-updated line (default: true) */
  showUpdated?: boolean;
}

export default function DataSourceBadges({
  sources = ["bls", "hud", "irs"],
  showUpdated = true,
}: Props) {
  const selected = sources.map((k) => ALL_SOURCES[k]).filter(Boolean);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 text-xs text-gray-600 space-y-2">
      <p className="font-semibold text-gray-700 uppercase tracking-wide text-[10px]">
        Data Sources
      </p>
      <ul className="space-y-1">
        {selected.map((s) => (
          <li key={s.href} className="flex items-start gap-1.5">
            <span className="shrink-0 text-gray-400">•</span>
            <span>
              <span className="text-gray-500">{s.label}: </span>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {s.name}
              </a>
            </span>
          </li>
        ))}
      </ul>
      {showUpdated && (
        <p className="text-gray-400 pt-1">
          Data updated monthly using government datasets.
        </p>
      )}
    </div>
  );
}
