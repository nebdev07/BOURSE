import { loadStore, persist, uid } from "@/infrastructure/persistence/file-store";
import { getDashboard, personalRecommendations } from "@/modules/application/workspace";
import { latestRecommendations } from "@/modules/application/catalog";
import type { EmailPort } from "@/modules/shared-kernel/ports";
import type { RecommendationSnapshot } from "@/modules/shared-kernel/types";

export function renderMonthlyReport(
  asOf: string,
  recs: RecommendationSnapshot[] = latestRecommendations(),
): { subject: string; text: string; html: string } {
  const top = recs.filter((r) => r.status === "BUY" || r.status === "ACCUMULATE").slice(0, 5);
  const subject = `BRVM INVESTMENT ANALYZER — Analyse du ${formatFr(asOf)}`;
  const lines = [
    "BRVM INVESTMENT ANALYZER",
    "",
    `Analyse du ${formatFr(asOf)}`,
    "",
    "TOP OPPORTUNITÉS",
    "",
  ];
  top.forEach((r, i) => {
    lines.push(`${i + 1}. ${r.symbol}`);
    lines.push(r.status);
    lines.push(`Score : ${r.score}/100`);
    lines.push(`Confiance : ${r.confidence}/100`);
    lines.push(`Prix : ${fmt(r.price)} FCFA`);
    lines.push(`Valeur estimée : ${fmt(r.intrinsicValue)} FCFA`);
    lines.push(`Marge de sécurité : ${r.marginOfSafety ?? "n/a"} %`);
    lines.push("Pourquoi ?");
    r.reasons.forEach((x) => lines.push(`✓ ${x}`));
    lines.push("Risques :");
    (r.risks.length ? r.risks : ["⚠ aucun risque critique listé"]).forEach((x) => lines.push(`⚠ ${x}`));
    lines.push(`Prix d'entrée idéal : ${fmt(r.idealEntryPrice)} FCFA`);
    lines.push("");
  });
  const text = lines.join("\n");
  const html = `<div style="font-family:Georgia,serif;background:#ffffff;color:#14532d;max-width:640px;padding:24px">
    <h1 style="font-size:20px;color:#16a34a">BRVM INVESTMENT ANALYZER</h1>
    <p>Analyse du ${formatFr(asOf)}</p>
    <h2>TOP OPPORTUNITÉS</h2>
    ${top
      .map(
        (r, i) => `<section style="border-top:1px solid #bbf7d0;padding:12px 0">
      <h3>${i + 1}. ${r.symbol} — ${r.status}</h3>
      <p>Score : ${r.score}/100 · Confiance : ${r.confidence}/100</p>
      <p>Prix : ${fmt(r.price)} FCFA<br/>Valeur estimée : ${fmt(r.intrinsicValue)} FCFA<br/>Marge de sécurité : ${r.marginOfSafety ?? "n/a"} %</p>
      <p>Pourquoi ?<br/>${r.reasons.map((x) => `✓ ${x}`).join("<br/>")}</p>
      <p>Risques :<br/>${(r.risks.length ? r.risks : ["aucun risque critique"]).map((x) => `⚠ ${x}`).join("<br/>")}</p>
      <p>Prix d'entrée idéal : ${fmt(r.idealEntryPrice)} FCFA</p>
    </section>`,
      )
      .join("")}
  </div>`;
  return { subject, text, html };
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "n/a";
  return Math.round(n).toLocaleString("fr-FR");
}

function formatFr(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export async function sendDueReports(mailer: EmailPort): Promise<number> {
  const now = new Date().toISOString();
  const store = loadStore();
  let sent = 0;
  for (const report of store.scheduledReports.filter((r) => r.status === "PENDING" && r.runAt <= now)) {
    const asOf = report.runAt.slice(0, 10);
    const recs = report.userId ? personalRecommendations(report.userId) : latestRecommendations();
    const content = renderMonthlyReport(asOf, recs);
    const result = await mailer.send({ to: report.email, ...content });
    persist((s) => {
      const item = s.scheduledReports.find((x) => x.id === report.id);
      if (item) {
        item.status = result.ok ? "SENT" : "FAILED";
        item.sentAt = result.ok ? now : null;
      }
      s.emailLogs.push({
        id: uid(),
        sentAt: now,
        to: report.email,
        type: report.type,
        status: result.ok ? "SENT" : "FAILED",
        error: result.error,
      });
    });
    if (result.ok) sent += 1;
  }
  return sent;
}

export function createLogMailer(): EmailPort {
  return {
    async send(input) {
      if (!process.env.SMTP_HOST) {
        persist((s) => {
          s.emailLogs.push({
            id: uid(),
            sentAt: new Date().toISOString(),
            to: input.to,
            type: "LOG_ONLY",
            status: "SENT",
          });
        });
        return { ok: true };
      }
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: false,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
      });
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: input.to,
          subject: input.subject,
          text: input.text,
          html: input.html,
        });
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : "smtp error" };
      }
    },
  };
}

export async function adminSnapshot() {
  const d = await getDashboard();
  const store = loadStore();
  return {
    lastSync: d.lastSync,
    lastIngestion: d.lastIngestion,
    lastAnalysis: d.lastAnalysis,
    emailsSent: d.emailsSent,
    sourceFailures: d.sourceFailures,
    users: store.users.length,
    alerts: store.alerts.length,
  };
}
