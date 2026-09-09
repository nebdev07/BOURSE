"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/frontend/i18n/LanguageSwitcher";
import { useI18n } from "@/frontend/i18n/provider";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? t.auth.loginFail);
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
            <h1 className="font-serif text-3xl">{t.auth.loginTitle}</h1>
          </div>
          <LanguageSwitcher />
        </div>
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <label className="block text-sm">
          {t.auth.email}
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block text-sm">
          {t.auth.password}
          <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button className="btn-primary w-full">{t.auth.enter}</button>
        <p className="text-sm text-muted">
          {t.auth.noAccount}{" "}
          <Link className="text-brand-500 underline" href="/signup">
            {t.nav.signup}
          </Link>
        </p>
      </form>
    </div>
  );
}
