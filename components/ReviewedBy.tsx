/**
 * ReviewedBy — editorial trust signal.
 * Displays a "Reviewed by" banner linking to the author page.
 * Server component.
 */

interface Props {
  /** author slug, e.g. "finance-editor" */
  authorSlug?: string;
  /** Display name shown in the banner */
  authorName?: string;
  /** Short credential line */
  credential?: string;
}

export default function ReviewedBy({
  authorSlug = "finance-editor",
  authorName = "Finance Editor",
  credential = "CPA, 10+ years in personal finance",
}: Props) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 px-5 py-4 text-sm">
      {/* Avatar placeholder */}
      <div className="shrink-0 w-9 h-9 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-base">
        {authorName.charAt(0)}
      </div>
      <div>
        <p className="text-gray-500 text-xs uppercase tracking-wide font-semibold mb-0.5">
          Reviewed by
        </p>
        <a
          href={`/authors/${authorSlug}`}
          className="font-semibold text-gray-800 hover:text-blue-600 transition-colors"
        >
          {authorName}
        </a>
        <p className="text-gray-500 text-xs mt-0.5">{credential}</p>
      </div>
    </div>
  );
}
