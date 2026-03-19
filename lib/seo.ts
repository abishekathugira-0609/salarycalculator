import type { Metadata } from "next";

export const BASE_URL = "https://know-your-pay.com";
export const SITE_NAME = "Know Your Pay";

interface PageMetaOpts {
  title: string;
  description: string;
  /** Absolute path starting with "/" */
  canonical: string;
}

/**
 * Returns a full Next.js Metadata object with title, description,
 * canonical, OpenGraph, Twitter card, and robots directives.
 */
export function buildPageMeta({ title, description, canonical }: PageMetaOpts): Metadata {
  const url = `${BASE_URL}${canonical}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

// ── Shared seed constants (used by generateStaticParams in all routes) ────────

import { CITY_COSTS } from "@/data/city-costs";
import jobsList from "@/data/jobs.json";
import { cityToSlug } from "@/lib/stateCodeMap";

/** Top 50 city slugs ranked by SEO weight. */
export const SEED_CITIES: string[] = Object.values(CITY_COSTS)
  .flat()
  .sort((a, b) => b.seoWeight - a.seoWeight)
  .slice(0, 50)
  .map((c) => cityToSlug(c.city));

/** Top 150 city slugs ranked by SEO weight — used in sitemap generation. */
export const PRIORITY_CITIES: string[] = Object.values(CITY_COSTS)
  .flat()
  .sort((a, b) => b.seoWeight - a.seoWeight)
  .slice(0, 150)
  .map((c) => cityToSlug(c.city));

/** Top 10 job slugs — highest-demand roles for sitemap priority targeting. */
export const PRIORITY_JOBS: string[] = (jobsList as string[]).slice(0, 10);

/** Top 20 job slugs by array order (high-demand roles first). */
export const SEED_JOBS: string[] = (jobsList as string[]).slice(0, 20);

/** Salary levels for seed generation — covers all major search buckets. */
export const SEED_SALARIES: number[] = [
  40000, 50000, 60000, 75000, 80000, 100000,
  125000, 150000, 175000, 200000, 250000, 300000,
];

/** Priority salary ranges targeting highest search-volume buckets. */
export const PRIORITY_SALARIES: number[] = [
  60000, 70000, 80000, 90000, 100000, 120000, 150000,
];

/** Extended salary buckets used in rankings + sitemaps. */
export const ALL_SALARY_BUCKETS: number[] = [
  40000, 50000, 60000, 75000, 80000, 100000,
  125000, 150000, 175000, 200000, 250000, 300000,
];
