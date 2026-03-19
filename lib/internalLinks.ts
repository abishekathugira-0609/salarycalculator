export type LinkCategory =
  | "salary"
  | "comparison"
  | "city"
  | "job"
  | "state"
  | "ranking";

export interface InternalLink {
  href: string;
  label: string;
  category: LinkCategory;
}

// ── Constants ──────────────────────────────────────────────────────────────
const SALARY_BUCKETS = [
  40000, 50000, 60000, 75000, 100000,
  125000, 150000, 175000, 200000, 250000, 300000,
];

const POPULAR_STATES = [
  "california", "texas", "florida", "new-york", "washington",
  "illinois", "massachusetts", "georgia", "arizona", "colorado",
];

const POPULAR_CITIES = [
  "new-york-city", "los-angeles", "chicago", "houston", "phoenix",
  "philadelphia", "san-antonio", "san-diego", "dallas", "san-jose",
  "austin", "seattle", "denver", "nashville", "miami",
];

const POPULAR_JOBS = [
  "software-engineer", "registered-nurse", "teacher", "accountant",
  "financial-analyst", "data-scientist", "product-manager",
  "marketing-manager", "civil-engineer", "operations-manager",
];

// ── Helpers ────────────────────────────────────────────────────────────────
function titleCase(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatSalary(n: number) {
  return n >= 1000 ? `$${n / 1000}k` : `$${n}`;
}

/** Nearest salary buckets above and below a given value. */
function nearbyBuckets(salary: number, count = 3): number[] {
  const sorted = [...SALARY_BUCKETS].sort(
    (a, b) => Math.abs(a - salary) - Math.abs(b - salary)
  );
  return sorted
    .filter((s) => s !== salary)
    .slice(0, count);
}

// ── Main API ───────────────────────────────────────────────────────────────
interface LinkOptions {
  salary?: number;
  state?: string;
  city?: string;
  job?: string;
  /** How many links to return (default 18) */
  limit?: number;
}

/**
 * Returns 15–20 contextual internal links for a page.
 * Categories: salary, comparison, city, job, state, ranking.
 */
export function getInternalLinks({
  salary,
  state,
  city,
  job,
  limit = 18,
}: LinkOptions): InternalLink[] {
  const links: InternalLink[] = [];

  // ── 1. Salary ladder pages ─────────────────────────────────────────────
  if (salary && state) {
    const stateSlug = state.toLowerCase();
    const nearby = nearbyBuckets(salary, 4);
    for (const s of nearby) {
      links.push({
        href: `/salary/${s}-${stateSlug}-2026`,
        label: `${formatSalary(s)} salary in ${titleCase(stateSlug)}`,
        category: "salary",
      });
    }
    // Exact salary in other states
    const otherStates = POPULAR_STATES.filter(
      (s) => s !== stateSlug
    ).slice(0, 3);
    for (const st of otherStates) {
      links.push({
        href: `/salary/${salary}-${st}-2026`,
        label: `${formatSalary(salary)} salary in ${titleCase(st)}`,
        category: "salary",
      });
    }
  } else if (salary) {
    for (const st of POPULAR_STATES.slice(0, 4)) {
      links.push({
        href: `/salary/${salary}-${st}-2026`,
        label: `${formatSalary(salary)} salary in ${titleCase(st)}`,
        category: "salary",
      });
    }
  }

  // ── 2. State salary guides ─────────────────────────────────────────────
  if (state) {
    const stateSlug = state.toLowerCase();
    links.push({
      href: `/${stateSlug}-salary-guide`,
      label: `${titleCase(stateSlug)} Salary Guide`,
      category: "state",
    });
    links.push({
      href: `/states/${stateSlug}`,
      label: `Living in ${titleCase(stateSlug)}`,
      category: "state",
    });
  }
  // Add 1–2 other popular state guides regardless
  const otherStateGuides = POPULAR_STATES.filter(
    (s) => s !== state?.toLowerCase()
  ).slice(0, 2);
  for (const s of otherStateGuides) {
    links.push({
      href: `/${s}-salary-guide`,
      label: `${titleCase(s)} Salary Guide`,
      category: "state",
    });
  }

  // ── 3. City comparison pages ───────────────────────────────────────────
  if (city) {
    const citySlug = city.toLowerCase();
    const compareCities = POPULAR_CITIES.filter(
      (c) => c !== citySlug
    ).slice(0, 3);
    for (const c of compareCities) {
      links.push({
        href: `/compare/${citySlug}-vs-${c}`,
        label: `${titleCase(citySlug)} vs ${titleCase(c)} cost of living`,
        category: "comparison",
      });
    }
  } else {
    // Generic city comparisons when no city context
    links.push({
      href: "/compare/new-york-city-vs-los-angeles",
      label: "New York City vs Los Angeles cost of living",
      category: "comparison",
    });
    links.push({
      href: "/compare/austin-vs-seattle",
      label: "Austin vs Seattle cost of living",
      category: "comparison",
    });
  }

  // ── 4. City cost-of-living pages ───────────────────────────────────────
  if (city) {
    links.push({
      href: `/city-living/${city.toLowerCase()}`,
      label: `Cost of living in ${titleCase(city)}`,
      category: "city",
    });
    if (salary) {
      links.push({
        href: `/is-salary-good/${salary}/${city.toLowerCase()}`,
        label: `Is ${formatSalary(salary)} a good salary in ${titleCase(city)}?`,
        category: "city",
      });
    }
  }
  // Add a couple of popular city COL pages
  const colCities = POPULAR_CITIES.filter(
    (c) => c !== city?.toLowerCase()
  ).slice(0, 2);
  for (const c of colCities) {
    links.push({
      href: `/city-living/${c}`,
      label: `Cost of living in ${titleCase(c)}`,
      category: "city",
    });
  }

  // ── 5. Job salary pages ────────────────────────────────────────────────
  if (job) {
    const targetCity = city ?? "new-york-city";
    links.push({
      href: `/job-salary/${job}/${targetCity}`,
      label: `${titleCase(job)} salary in ${titleCase(targetCity)}`,
      category: "job",
    });
    // Same job, other cities
    const otherCities = POPULAR_CITIES.filter(
      (c) => c !== targetCity
    ).slice(0, 2);
    for (const c of otherCities) {
      links.push({
        href: `/job-salary/${job}/${c}`,
        label: `${titleCase(job)} salary in ${titleCase(c)}`,
        category: "job",
      });
    }
  }
  // Always add a couple of popular job pages
  const otherJobs = POPULAR_JOBS.filter((j) => j !== job).slice(0, 2);
  const jobCity = city ?? "new-york-city";
  for (const j of otherJobs) {
    links.push({
      href: `/job-salary/${j}/${jobCity}`,
      label: `${titleCase(j)} salary in ${titleCase(jobCity)}`,
      category: "job",
    });
  }

  // ── 6. Rankings / leaderboards ─────────────────────────────────────────
  if (salary) {
    links.push({
      href: `/rankings/${salary}`,
      label: `Where does ${formatSalary(salary)} rank nationally?`,
      category: "ranking",
    });
    links.push({
      href: `/salary-leaderboards/${salary}`,
      label: `${formatSalary(salary)} salary leaderboard`,
      category: "ranking",
    });
  } else {
    links.push({
      href: `/rankings/100000`,
      label: "Where does $100k rank nationally?",
      category: "ranking",
    });
  }

  // ── 7. Best cities page ────────────────────────────────────────────────
  if (salary && state) {
    links.push({
      href: `/best-cities/${state.toLowerCase()}/${salary}`,
      label: `Best cities in ${titleCase(state)} for ${formatSalary(salary)}`,
      category: "city",
    });
  }

  // Deduplicate by href and apply limit
  const seen = new Set<string>();
  const unique = links.filter((l) => {
    if (seen.has(l.href)) return false;
    seen.add(l.href);
    return true;
  });

  return unique.slice(0, limit);
}

/**
 * Grouped version — returns links split by category, useful for sidebar/footer layouts.
 */
export function getInternalLinksByCategory(
  options: LinkOptions
): Record<LinkCategory, InternalLink[]> {
  const all = getInternalLinks({ ...options, limit: 30 });
  const grouped: Record<LinkCategory, InternalLink[]> = {
    salary: [],
    comparison: [],
    city: [],
    job: [],
    state: [],
    ranking: [],
  };
  for (const link of all) {
    grouped[link.category].push(link);
  }
  return grouped;
}

// Keep the original thin export so existing callers don't break
export function getRelatedLinks(
  city: string,
  salary: number,
  job?: string
): string[] {
  return getInternalLinks({ salary, city, job })
    .map((l) => l.href);
}
