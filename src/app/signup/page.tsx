"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/frontend/i18n/LanguageSwitcher";
import { useI18n } from "@/frontend/i18n/provider";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? t.auth.signupFail);
      return;
    }
    router.push("/alerts");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 px-4">
      <form onSubmit={submit} className="card w-full max-w-md space-y-4 p-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-brand-400">{t.brand.kicker}</p>
            <h1 className="font-serif text-3xl">{t.auth.signupTitle}</h1>
          </div>
          <LanguageSwitcher />
        </div>
        <p className="text-sm text-muted">{t.auth.signupLead}</p>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <label className="block text-sm">
          {t.auth.name}
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="block text-sm">
          {t.auth.email}
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block text-sm">
          {t.auth.passwordMin}
          <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
        <button className="btn-primary w-full">{t.nav.signup}</button>
        <p className="text-sm text-muted">
          {t.auth.hasAccount}{" "}
          <Link className="text-brand-500 underline" href="/login">
            {t.nav.login}
          </Link>
        </p>
      </form>
    </div>
  );
}
