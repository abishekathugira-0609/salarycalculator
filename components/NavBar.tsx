/**
 * Global top navigation — included in every page via app/layout.tsx.
 * Links: Home · Calculator · Job Offer Reality Check · More tools
 */

import Link from "next/link";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="bg-indigo-100 text-indigo-600 rounded-lg w-7 h-7 flex items-center justify-center text-sm font-black">$</span>
          <span className="font-bold text-gray-800 text-sm hidden sm:inline">Know Your Pay</span>
        </Link>

        {/* Primary nav links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link href="/"
            className="text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-900 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">
            Home
          </Link>
          <Link href="/calculator"
            className="text-xs sm:text-sm font-medium text-indigo-600 hover:text-indigo-800 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition flex items-center gap-1">
            <span>⚡</span>
            <span className="hidden sm:inline">Calculator</span>
            <span className="sm:hidden">Calc</span>
          </Link>
          <Link href="/job-offer-reality-check"
            className="text-xs sm:text-sm font-medium text-violet-600 hover:text-violet-800 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-violet-50 transition flex items-center gap-1">
            <span>📋</span>
            <span className="hidden sm:inline">Job Offer Check</span>
            <span className="sm:hidden">Offer</span>
          </Link>
          <Link href="/cities"
            className="text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-900 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition hidden md:inline-flex">
            Cities
          </Link>
          <Link href="/guides"
            className="text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-900 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition hidden md:inline-flex">
            Guides
          </Link>
          <Link href="/faq"
            className="text-xs sm:text-sm font-medium text-gray-500 hover:text-gray-900 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-gray-100 transition hidden lg:inline-flex">
            FAQ
          </Link>
        </nav>

        {/* CTA */}
        <Link href="/calculator"
          className="flex-shrink-0 bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-200 transition hidden sm:inline-flex">
          Calculate →
        </Link>

      </div>
    </header>
  );
}
