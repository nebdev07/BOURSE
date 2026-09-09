"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_RULESET } from "@/modules/recommendation/domain/ruleset";
import { useI18n } from "@/frontend/i18n/provider";

export default function SettingsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [rules, setRules] = useState(DEFAULT_RULESET);
  const [message, setMessage] = useState("");
  const [runAt, setRunAt] = useState("2026-08-28T08:00");
  const [ready, setReady] = useState(false);

  async function load() {
    const res = await fetch("/api/settings/ruleset");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    setRules(await res.json());
    setReady(true);
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveRules(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/settings/ruleset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rules),
    });
    const json = await res.json();
    setRules(json);
    setMessage(t.settings.saved(json.version));
  }

  async function schedule(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runAt: new Date(runAt).toISOString() }),
    });
    if (!res.ok) {
      setMessage(t.settings.emailFail);
      return;
    }
    setMessage(t.settings.emailOk);
  }

  const field = (key: keyof typeof DEFAULT_RULESET, label: string) => (
    <label key={key} className="text-sm">
      {label}
      <input
        className="field num"
        type="number"
        value={rules[key] as number | string}
        onChange={(e) => setRules({ ...rules, [key]: key === "version" ? e.target.value : Number(e.target.value) })}
        disabled={key === "version"}
      />
    </label>
  );

  if (!ready) return <p className="text-muted">{t.settings.loading}</p>;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-400">{t.settings.kicker}</p>
        <h2 className="mt-1 font-serif text-3xl">{t.settings.title}</h2>
        <p className="mt-2 text-sm text-muted">{t.settings.lead}</p>
      </div>
      {message && <p className="card border-brand-400/30 p-4 text-sm text-brand-500">{message}</p>}

      <section className="card p-5">
        <h3 className="font-serif text-xl">{t.settings.thresholds}</h3>
        <form onSubmit={saveRules} className="mt-4 grid gap-4 md:grid-cols-3">
          {field("minimumBuyScore", t.settings.minBuy)}
          {field("minimumMarginOfSafety", t.settings.minMos)}
          {field("minimumConfidence", t.settings.minConf)}
          {field("minimumDividendScore", t.settings.minDiv)}
          {field("minimumGrowthScore", t.settings.minGrowth)}
          {field("maximumPER", t.settings.maxPer)}
          {field("minimumROE", t.settings.minRoe)}
          <div className="md:col-span-3">
            <button className="btn-primary">{t.settings.save}</button>
          </div>
        </form>
      </section>

      <section className="card p-5">
        <h3 className="font-serif text-xl">{t.settings.email}</h3>
        <form onSubmit={schedule} className="mt-3 flex flex-wrap gap-3">
          <input className="field max-w-xs" type="datetime-local" value={runAt} onChange={(e) => setRunAt(e.target.value)} />
          <button className="btn-primary">{t.settings.schedule}</button>
        </form>
        <p className="mt-2 text-xs text-muted">{t.settings.emailHint}</p>
      </section>
    </div>
  );
}
