/**
 * LastUpdated — content freshness signal.
 * Displays "Last updated: Month Year" + monthly refresh note.
 * Server component.
 */

interface Props {
  /** Override the displayed month/year, e.g. "January 2026" */
  label?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function LastUpdated({ label }: Props) {
  const now = new Date();
  const display = label ?? `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <p className="text-xs text-gray-400">
      Last updated: <span className="font-medium text-gray-500">{display}</span>
      &nbsp;·&nbsp;Data updated monthly using government datasets.
    </p>
  );
}
