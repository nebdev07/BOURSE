import Link from "next/link";
import { copy } from "@/frontend/i18n/locale";

export const dynamic = "force-dynamic";

export default async function GuidePage() {
  const t = await copy();
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-400">{t.guide.kicker}</p>
        <h2 className="mt-1 font-serif text-3xl">{t.guide.title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">{t.guide.lead}</p>
      </div>

      <section className="card space-y-3 p-6">
        <h3 className="font-serif text-2xl">{t.guide.goalTitle}</h3>
        <p className="text-muted leading-relaxed">{t.guide.goalBody}</p>
      </section>

      <section className="card space-y-4 p-6">
        <h3 className="font-serif text-2xl">{t.guide.stepsTitle}</h3>
        <ol className="list-decimal space-y-3 pl-5 text-sm text-muted">
          <li>
            {t.guide.step1}{" "}
            <Link className="text-brand-500 underline" href="/dashboard">
              {t.nav.dashboard}
            </Link>
            {" · "}
            <Link className="text-brand-500 underline" href="/stocks">
              {t.nav.stocks}
            </Link>
          </li>
          <li>{t.guide.step2}</li>
          <li>
            {t.guide.step3}{" "}
            <Link className="text-brand-500 underline" href="/signup">
              {t.nav.signup}
            </Link>
          </li>
          <li>
            {t.guide.step4}{" "}
            <Link className="text-brand-500 underline" href="/portfolio">
              {t.nav.portfolio}
            </Link>
            {" · "}
            <Link className="text-brand-500 underline" href="/settings">
              {t.nav.settings}
            </Link>
          </li>
        </ol>
      </section>

      <section className="card space-y-3 p-6">
        <h3 className="font-serif text-2xl">{t.guide.statusTitle}</h3>
        <ul className="space-y-2 text-sm text-muted">
          <li>
            <span className="font-semibold text-ink">{t.status.BUY}</span> — {t.guide.buy}
          </li>
          <li>
            <span className="font-semibold text-ink">{t.status.ACCUMULATE}</span> — {t.guide.accumulate}
          </li>
          <li>
            <span className="font-semibold text-ink">{t.status.WATCH}</span> — {t.guide.watch}
          </li>
          <li>
            <span className="font-semibold text-ink">{t.status.WAIT}</span> — {t.guide.wait}
          </li>
          <li>
            <span className="font-semibold text-ink">{t.status.AVOID}</span> — {t.guide.avoid}
          </li>
        </ul>
      </section>

      <section className="card space-y-3 p-6">
        <h3 className="font-serif text-2xl">{t.guide.analysisTitle}</h3>
        <p className="text-sm text-muted leading-relaxed">{t.guide.analysisBody}</p>
      </section>

      <section className="card space-y-3 p-6">
        <h3 className="font-serif text-2xl">{t.guide.portfolioTitle}</h3>
        <p className="text-sm text-muted leading-relaxed">{t.guide.portfolioBody}</p>
      </section>

      <section className="card space-y-3 p-6">
        <h3 className="font-serif text-2xl">{t.guide.historyTitle}</h3>
        <p className="text-sm text-muted leading-relaxed">{t.guide.historyBody}</p>
      </section>

      <section className="card space-y-3 p-6">
        <h3 className="font-serif text-2xl">{t.guide.importTitle}</h3>
        <p className="text-sm text-muted leading-relaxed">{t.guide.importBody}</p>
      </section>

      <section className="card space-y-3 p-6">
        <h3 className="font-serif text-2xl">{t.guide.noteTitle}</h3>
        <p className="text-sm text-muted leading-relaxed">{t.guide.noteBody}</p>
      </section>

      <section className="card space-y-3 p-6">
        <h3 className="font-serif text-2xl">{t.guide.alertsTitle}</h3>
        <p className="text-sm text-muted leading-relaxed">{t.guide.alertsBody}</p>
      </section>

      <section className="card space-y-3 p-6">
        <h3 className="font-serif text-2xl">{t.guide.settingsTitle}</h3>
        <p className="text-sm text-muted leading-relaxed">{t.guide.settingsBody}</p>
      </section>

      <section className="card space-y-3 p-6">
        <h3 className="font-serif text-2xl">{t.guide.accountTitle}</h3>
        <p className="text-sm text-muted leading-relaxed">{t.guide.accountBody}</p>
      </section>

      <section className="card space-y-3 border border-amber-500/30 p-6">
        <h3 className="font-serif text-2xl">{t.guide.disclaimerTitle}</h3>
        <p className="text-sm text-muted leading-relaxed">{t.guide.disclaimerBody}</p>
      </section>
    </div>
  );
}
