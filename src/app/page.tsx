import Link from "next/link";
import { getDashboard } from "@/modules/application/workspace";
import { xof } from "@/frontend/lib/format";
import { copy } from "@/frontend/i18n/locale";
import { LanguageSwitcher } from "@/frontend/i18n/LanguageSwitcher";
import { StatusBadge } from "@/frontend/components/StatusBadge";
import { currentUser } from "@/app/api/_lib/session";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const t = await copy();
  const [data, user] = await Promise.all([getDashboard(), currentUser()]);
  return (
    <div className="min-h-screen bg-brand-50">
      <header className="border-b border-white/10 bg-brand-100/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-brand-400">{t.brand.kicker}</p>
            <p className="font-serif text-xl text-ink">{t.brand.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LanguageSwitcher />
            {user ? (
              <>
                <span className="hidden max-w-[12rem] truncate text-xs text-muted sm:inline">{user.email}</span>
                <Link href="/dashboard" className="rounded-full px-4 py-2 text-sm text-muted">
                  {t.nav.dashboard}
                </Link>
                <Link href="/portfolio" className="btn-primary">
                  {t.nav.portfolio}
                </Link>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-full px-4 py-2 text-sm text-muted">
                  {t.nav.login}
                </Link>
                <Link href="/signup" className="btn-primary">
                  {t.nav.signup}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-400">{t.landing.kicker}</p>
        <h1 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-ink sm:text-5xl">
          {t.landing.headline}
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">{t.landing.lead}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          {user ? (
            <>
              <Link href="/portfolio" className="btn-primary px-6 py-3">
                {t.landing.ctaPortfolio}
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 bg-brand-100 px-6 py-3 text-sm font-semibold text-ink"
              >
                {t.landing.ctaMarket}
              </Link>
            </>
          ) : (
            <>
              <Link href="/signup" className="btn-primary px-6 py-3">
                {t.landing.ctaAccount}
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 bg-brand-100 px-6 py-3 text-sm font-semibold text-ink"
              >
                {t.landing.ctaMarket}
              </Link>
            </>
          )}
          <Link
            href="/guide"
            className="rounded-full border border-white/15 bg-transparent px-6 py-3 text-sm font-semibold text-brand-500"
          >
            {t.nav.guide}
          </Link>
        </div>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {[
            [t.landing.analyzed, String(data.total)],
            [t.status.BUY, String(data.counts.BUY)],
            [t.status.ACCUMULATE, String(data.counts.ACCUMULATE)],
            [t.landing.toAvoid, String(data.counts.AVOID)],
          ].map(([label, value]) => (
            <div key={label} className="card px-5 py-5">
              <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
              <p className="mt-1 font-serif text-3xl">{value}</p>
            </div>
          ))}
        </div>
        <section className="card mt-10 overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4">
            <h2 className="font-serif text-2xl">{t.landing.opportunities}</h2>
          </div>
          <ul className="divide-y divide-white/5">
            {data.opportunities.slice(0, 5).map((r) => (
              <li key={r.symbol} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="font-semibold text-brand-500">{r.symbol}</span>
                <StatusBadge status={r.status} />
                <span className="num text-muted">{xof(r.price)}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
