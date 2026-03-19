import Link from "next/link";
import type { Metadata } from "next";
import { buildPageMeta } from "@/lib/seo";

export const metadata: Metadata = buildPageMeta({
  title: "Salary After Tax Calculator (US) – 2026",
  description:
    "Calculate your 2026 take-home pay after federal and state taxes. Updated for 2026 IRS brackets. Compare salaries, evaluate job offers, and explore cost of living across every US state.",
  canonical: "/",
});

function TaxDonut() {
  const segments = [
    { pct: 18, color: "#bfdbfe" }, // pastel blue
    { pct: 9,  color: "#fed7aa" }, // pastel orange
    { pct: 8,  color: "#e9d5ff" }, // pastel purple
    { pct: 65, color: "#bbf7d0" }, // pastel green
  ];
  const r = 60, cx = 70, cy = 70, strokeW = 22;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="w-36 h-36">
      {segments.map((s, i) => {
        const dash = (s.pct / 100) * circ;
        const gap = circ - dash;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={s.color} strokeWidth={strokeW}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        );
        offset += dash;
        return el;
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="12" fill="#1e3a5f" fontWeight="bold">65%</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#4b6fa5">take-home</text>
    </svg>
  );
}

function BarGraphic() {
  const bars = [
    { label: "$60k",  takehome: 78, color: "bg-teal-200" },
    { label: "$80k",  takehome: 73, color: "bg-emerald-200" },
    { label: "$100k", takehome: 68, color: "bg-blue-200" },
    { label: "$150k", takehome: 62, color: "bg-indigo-200" },
    { label: "$200k", takehome: 56, color: "bg-violet-200" },
  ];
  return (
    <div className="flex items-end gap-2 h-20">
      {bars.map((b) => (
        <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 font-medium">{b.takehome}%</span>
          <div className={`w-full rounded-t ${b.color}`} style={{ height: `${b.takehome * 0.65}px` }} />
          <span className="text-xs text-gray-400">{b.label}</span>
        </div>
      ))}
    </div>
  );
}

const POPULAR_SALARIES = [
  { salary: "50000",  label: "$50,000" },
  { salary: "75000",  label: "$75,000" },
  { salary: "100000", label: "$100,000" },
  { salary: "120000", label: "$120,000" },
  { salary: "150000", label: "$150,000" },
  { salary: "200000", label: "$200,000" },
];

const POPULAR_STATES = [
  { slug: "california", label: "California" },
  { slug: "new-york",   label: "New York" },
  { slug: "texas",      label: "Texas" },
  { slug: "florida",    label: "Florida" },
  { slug: "washington", label: "Washington" },
  { slug: "illinois",   label: "Illinois" },
];

const STATE_GUIDE_CODES = [
  ["california","California"],["texas","Texas"],["florida","Florida"],
  ["new-york","New York"],["washington","Washington"],["illinois","Illinois"],
  ["pennsylvania","Pennsylvania"],["ohio","Ohio"],
];

const POPULAR_JOBS = [
  ["software-engineer","Software Engineer"],["registered-nurse","Registered Nurse"],
  ["teacher","Teacher"],["accountant","Accountant"],
  ["data-scientist","Data Scientist"],["product-manager","Product Manager"],
];

const COMPARE_PAIRS = [
  ["new-york","los-angeles","New York vs Los Angeles"],
  ["san-francisco","austin","San Francisco vs Austin"],
  ["chicago","houston","Chicago vs Houston"],
  ["seattle","denver","Seattle vs Denver"],
];

const IS_GOOD_EXAMPLES = [
  { salary: "80000",  city: "austin",       label: "$80k in Austin" },
  { salary: "120000", city: "san-francisco", label: "$120k in San Francisco" },
  { salary: "65000",  city: "chicago",       label: "$65k in Chicago" },
  { salary: "100000", city: "new-york",      label: "$100k in New York" },
];

const BUDGET_EXAMPLES = [
  { salary: "60000",  city: "phoenix", label: "$60k in Phoenix" },
  { salary: "90000",  city: "denver",  label: "$90k in Denver" },
  { salary: "130000", city: "seattle", label: "$130k in Seattle" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50">

      {/* ── HERO ── */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-100 py-20 px-6 border-b border-indigo-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <span className="inline-block bg-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
                Free · Instant · No signup
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                Know Your Real<br />
                <span className="text-indigo-500">Take-Home Pay</span>
              </h1>
              <p className="text-gray-500 text-lg mb-8 max-w-md">
                Federal, state & payroll taxes calculated instantly. Compare offers, plan your move, and understand every dollar.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/calculator"
                  className="bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold px-6 py-3 rounded-xl hover:bg-indigo-200 transition text-sm">
                  ⚡ Tax Calculator
                </Link>
                <Link href="/job-offer-reality-check"
                  className="bg-violet-100 text-violet-700 border border-violet-200 font-bold px-6 py-3 rounded-xl hover:bg-violet-200 transition text-sm">
                  📋 Evaluate a Job Offer
                </Link>
              </div>
            </div>

            {/* Donut card */}
            <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-3 border border-indigo-100 shadow-sm">
              <TaxDonut />
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-200 inline-block"/>Federal 18%</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-200 inline-block"/>State 9%</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-200 inline-block"/>FICA 8%</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-200 inline-block"/>Keep 65%</span>
              </div>
              <p className="text-xs text-gray-400">$85k · California · Single</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">

        {/* ── TWO TOOLS ── */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Our Tools</h2>
          <div className="grid md:grid-cols-2 gap-6">

            <Link href="/calculator" className="group bg-white rounded-2xl border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 transition p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="bg-blue-100 text-blue-600 rounded-xl p-3 text-2xl">⚡</div>
                <span className="text-xs bg-teal-100 text-teal-700 font-semibold px-2 py-1 rounded-full">Live · No button</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition mb-1">Salary Tax Calculator</h3>
                <p className="text-sm text-gray-400">Enter salary, state, and filing status. Results update instantly with a color-coded breakdown bar and pay-period splits.</p>
              </div>
              <div className="mt-auto">
                <BarGraphic />
                <p className="text-xs text-gray-400 mt-2">Take-home % by income level (CA, single)</p>
              </div>
              <span className="text-blue-500 text-sm font-semibold group-hover:underline">Calculate now →</span>
            </Link>

            <Link href="/job-offer-reality-check" className="group bg-white rounded-2xl border border-violet-100 shadow-sm hover:shadow-md hover:border-violet-200 transition p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="bg-violet-100 text-violet-600 rounded-xl p-3 text-2xl">📋</div>
                <span className="text-xs bg-violet-100 text-violet-700 font-semibold px-2 py-1 rounded-full">3-step wizard</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 group-hover:text-violet-600 transition mb-1">Job Offer Reality Check</h3>
                <p className="text-sm text-gray-400">Step through salary, taxes, rent, and cost of living. Get an A–F grade on every metric and an overall offer verdict.</p>
              </div>
              <div className="flex gap-2 mt-auto">
                {[["A","emerald"],["B","lime"],["C","amber"],["D","orange"]].map(([g, c]) => (
                  <div key={g} className={`w-10 h-10 rounded-xl border-2 border-${c}-200 bg-${c}-50 text-${c}-600 flex items-center justify-center font-black text-lg`}>
                    {g}
                  </div>
                ))}
                <div className="flex flex-col justify-center ml-1">
                  <p className="text-xs text-gray-400 leading-tight">Rent · Tax · COL</p>
                  <p className="text-xs text-gray-300">scored per metric</p>
                </div>
              </div>
              <span className="text-violet-500 text-sm font-semibold group-hover:underline">Evaluate an offer →</span>
            </Link>
          </div>
        </section>

        {/* ── POPULAR SALARY × STATE ── */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">Popular Salary Breakdowns</h2>
          <p className="text-gray-400 text-sm mb-6">Click any combination to see full take-home pay details.</p>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-indigo-50 border-b border-indigo-100">
                    <th className="text-left px-4 py-3 text-indigo-400 font-semibold w-32">Salary</th>
                    {POPULAR_STATES.map((s) => (
                      <th key={s.slug} className="text-left px-4 py-3 text-indigo-400 font-semibold">{s.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {POPULAR_SALARIES.map((row) => (
                    <tr key={row.salary} className="hover:bg-indigo-50 transition">
                      <td className="px-4 py-3 font-semibold text-gray-700">{row.label}</td>
                      {POPULAR_STATES.map((s) => (
                        <td key={s.slug} className="px-4 py-3">
                          <Link href={`/salary/${row.salary}-${s.slug}`} className="text-indigo-400 hover:text-indigo-600 hover:underline">
                            View →
                          </Link>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── STATE TAX AT A GLANCE ── */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">State Tax at a Glance</h2>
          <p className="text-gray-400 text-sm mb-6">Effective rates on a $100k salary (single, 2026). Click to explore.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { code: "CA", rate: 8.1,  bar: "bg-rose-200",   bg: "bg-rose-50",   text: "text-rose-700" },
              { code: "NY", rate: 7.4,  bar: "bg-orange-200", bg: "bg-orange-50", text: "text-orange-700" },
              { code: "IL", rate: 4.95, bar: "bg-amber-200",  bg: "bg-amber-50",  text: "text-amber-700" },
              { code: "TX", rate: 0,    bar: "bg-emerald-200",bg: "bg-emerald-50",text: "text-emerald-700" },
              { code: "FL", rate: 0,    bar: "bg-teal-200",   bg: "bg-teal-50",   text: "text-teal-700" },
              { code: "WA", rate: 0,    bar: "bg-green-200",  bg: "bg-green-50",  text: "text-green-700" },
            ].map((s) => (
              <Link key={s.code} href={`/states/${s.code}`}
                className={`${s.bg} rounded-xl border border-white shadow-sm p-4 hover:shadow-md transition flex flex-col items-center gap-2 text-center`}>
                <div className={`text-2xl font-black ${s.text}`}>{s.code}</div>
                <div className="w-full bg-white rounded-full h-2">
                  <div className={`${s.bar} h-2 rounded-full`} style={{ width: `${Math.max((s.rate / 10) * 100, 6)}%` }} />
                </div>
                <div className={`text-xs ${s.text}`}>{s.rate > 0 ? `${s.rate}% state` : "No state tax"}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── STATE GUIDES ── */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">State Salary Guides</h2>
          <p className="text-gray-400 text-sm mb-6">Deep-dive tax guides, city comparisons, and cost-of-living data by state.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STATE_GUIDE_CODES.map(([slug, name]) => (
              <Link key={slug} href={`/${slug}-salary-guide`}
                className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-sm font-medium text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition flex items-center justify-between">
                {name} <span className="text-gray-300">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── JOBS & COMPARE ── */}
        <section className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Browse by Job</h2>
            <p className="text-gray-400 text-sm mb-4">Typical salary and take-home for popular roles.</p>
            <div className="space-y-2">
              {POPULAR_JOBS.map(([slug, name]) => (
                <Link key={slug} href={`/jobs/${slug}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-sm hover:border-blue-200 hover:bg-blue-50 transition">
                  <span className="font-medium text-gray-700">{name}</span>
                  <span className="text-blue-400 text-xs">Explore →</span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Compare Cities</h2>
            <p className="text-gray-400 text-sm mb-4">Side-by-side salary & cost-of-living comparisons.</p>
            <div className="space-y-2">
              {COMPARE_PAIRS.map(([a, b, label]) => (
                <Link key={label} href={`/compare/${a}-vs-${b}`}
                  className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-sm hover:border-violet-200 hover:bg-violet-50 transition">
                  <span className="font-medium text-gray-700">{label}</span>
                  <span className="text-violet-400 text-xs">Compare →</span>
                </Link>
              ))}
              <Link href="/cities"
                className="flex items-center justify-between bg-violet-50 rounded-xl border border-violet-100 px-4 py-3 text-sm hover:border-violet-200 transition">
                <span className="font-medium text-violet-600">Browse all cities</span>
                <span className="text-violet-400 text-xs">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── MORE TOOLS ── */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">More Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { href:"/faq",                                                   icon:"❓", title:"FAQ",                   desc:"Common questions about US taxes",           bg:"bg-sky-50",     border:"border-sky-100",    hover:"hover:border-sky-200" },
              { href:"/guides",                                                icon:"📖", title:"Salary Guides",          desc:"In-depth guides by salary level",            bg:"bg-indigo-50",  border:"border-indigo-100", hover:"hover:border-indigo-200" },
              { href:"/methodology",                                           icon:"🔬", title:"Methodology",            desc:"How we calculate taxes",                    bg:"bg-teal-50",    border:"border-teal-100",   hover:"hover:border-teal-200" },
              { href:"/cities",                                                icon:"🏙️", title:"All Cities",             desc:"Cost-of-living data for every city",         bg:"bg-blue-50",    border:"border-blue-100",   hover:"hover:border-blue-200" },
              { href:"/all-pages",                                             icon:"🗂️", title:"All Pages",              desc:"Browse every salary page we have",           bg:"bg-purple-50",  border:"border-purple-100", hover:"hover:border-purple-200" },
              { href:"/remote-tax/CA/TX",                                      icon:"🌐", title:"Remote Worker Tax",      desc:"Living in one state, working in another?",  bg:"bg-cyan-50",    border:"border-cyan-100",   hover:"hover:border-cyan-200" },
              { href:"/is-salary-good/100000/austin",                          icon:"✅", title:"Is My Salary Good?",     desc:"Benchmark your salary against local data",  bg:"bg-emerald-50", border:"border-emerald-100",hover:"hover:border-emerald-200" },
              { href:"/monthly-budget-simulation/90000/denver",                icon:"📊", title:"Budget Simulator",       desc:"See where your money goes month by month",  bg:"bg-lime-50",    border:"border-lime-100",   hover:"hover:border-lime-200" },
              { href:"/can-you-afford/100000/400000/seattle",                  icon:"🏠", title:"Can You Afford It?",     desc:"House price affordability by salary & city",bg:"bg-amber-50",   border:"border-amber-100",  hover:"hover:border-amber-200" },
              { href:"/negotiation-insights/software-engineer/san-francisco",  icon:"💬", title:"Negotiation Insights",   desc:"Data-backed salary negotiation tips",       bg:"bg-rose-50",    border:"border-rose-100",   hover:"hover:border-rose-200" },
              { href:"/salary-inflation/software-engineer/new-york",           icon:"📈", title:"Salary vs Inflation",    desc:"Is your raise keeping up with inflation?",  bg:"bg-orange-50",  border:"border-orange-100", hover:"hover:border-orange-200" },
              { href:"/rankings/100000",                                        icon:"🏆", title:"City Rankings",          desc:"Best cities for a given salary",            bg:"bg-yellow-50",  border:"border-yellow-100", hover:"hover:border-yellow-200" },
            ].map(({ href, icon, title, desc, bg, border, hover }) => (
              <Link key={href} href={href}
                className={`${bg} rounded-xl border ${border} shadow-sm p-4 ${hover} hover:shadow-md transition flex gap-3`}>
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-semibold text-gray-700 text-sm">{title}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── IS MY SALARY GOOD ── */}
        <section className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Is My Salary Good?</h2>
          <p className="text-gray-400 text-sm mb-4">See how your salary stacks up in specific cities.</p>
          <div className="flex flex-wrap gap-3">
            {IS_GOOD_EXAMPLES.map(({ salary, city, label }) => (
              <Link key={label} href={`/is-salary-good/${salary}/${city}`}
                className="bg-white text-blue-600 border border-blue-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-100 transition">
                {label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── BUDGET SIMULATION ── */}
        <section className="bg-emerald-50 rounded-2xl border border-emerald-100 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-1">Monthly Budget Simulation</h2>
          <p className="text-gray-400 text-sm mb-4">Rent, food, transport, savings — mapped out for your salary and city.</p>
          <div className="flex flex-wrap gap-3">
            {BUDGET_EXAMPLES.map(({ salary, city, label }) => (
              <Link key={label} href={`/monthly-budget-simulation/${salary}/${city}`}
                className="bg-white text-emerald-600 border border-emerald-200 rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-100 transition">
                {label}
              </Link>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="grid md:grid-cols-3 gap-6">
          {[
            { n:"1", title:"Enter your salary",   body:"Type your annual gross and pick your state. Filing status affects your federal bracket.",          bg:"bg-blue-100",   text:"text-blue-600",   card:"border-blue-100" },
            { n:"2", title:"We calculate taxes",   body:"Federal, state, and payroll taxes applied using 2026 IRS rules. All four filing statuses.", bg:"bg-violet-100", text:"text-violet-600", card:"border-violet-100" },
            { n:"3", title:"See your take-home",   body:"Net pay, effective rate, monthly and weekly breakdowns — with a visual bar so it's instantly clear.",bg:"bg-emerald-100",text:"text-emerald-600",card:"border-emerald-100" },
          ].map(({ n, title, body, bg, text, card }) => (
            <div key={n} className={`bg-white rounded-2xl shadow-sm border ${card} p-6 flex gap-4`}>
              <div className={`${bg} ${text} w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0`}>{n}</div>
              <div>
                <p className="font-semibold text-gray-800 mb-1">{title}</p>
                <p className="text-sm text-gray-400">{body}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── DISCLAIMER ── */}
        <section className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 text-sm text-gray-500">
          <h3 className="font-semibold text-gray-700 mb-2">Estimates only</h3>
          <p>Calculations use 2026 federal and state tax rules with the standard deduction. No dependents, credits, or itemized deductions. Local taxes (except NYC toggle) excluded. See our{" "}
            <Link href="/methodology" className="text-indigo-500 underline">methodology</Link> and{" "}
            <Link href="/disclaimer" className="text-indigo-500 underline">disclaimer</Link>.
          </p>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-gray-100 pt-8 pb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-6 text-sm text-gray-400">
            <div>
              <p className="font-semibold text-gray-700 mb-2">Know Your Pay</p>
              <p className="text-xs max-w-xs">Free US salary tax calculator covering all 50 states, updated for 2026.</p>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {[
                ["/calculator","Calculator"],["/job-offer-reality-check","Job Offer Check"],
                ["/cities","Cities"],["/faq","FAQ"],["/guides","Guides"],
                ["/methodology","Methodology"],["/all-pages","All Pages"],
                ["/about","About"],["/disclaimer","Disclaimer"],["/contact","Contact"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="hover:text-indigo-500 hover:underline transition">{label}</Link>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-300 mt-6">© {new Date().getFullYear()} Know Your Pay. Estimates only — not tax advice.</p>
        </footer>

      </div>
    </main>
  );
}
