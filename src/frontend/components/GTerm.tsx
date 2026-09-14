"use client";

import { InfoBubble, TermLabel } from "@/frontend/components/InfoBubble";
import { useI18n } from "@/frontend/i18n/provider";
import type { Messages } from "@/frontend/i18n/dictionary";

type GlossaryKey = keyof Omit<Messages["glossary"], "beginner" | "expert">;

/** Libellé + info-bulle depuis le glossaire i18n (pages client). */
export function GTerm({ id, className }: { id: GlossaryKey; className?: string }) {
  const { t } = useI18n();
  const entry = t.glossary[id] as { label: string; beginner: string; expert: string };
  return (
    <TermLabel
      entry={entry}
      levelLabels={{ beginner: t.glossary.beginner, expert: t.glossary.expert }}
      className={className}
    />
  );
}

/** Info-bulle seule (quand le libellé est déjà affiché à part). */
export function GHelp({ id }: { id: GlossaryKey }) {
  const { t } = useI18n();
  const entry = t.glossary[id] as { label: string; beginner: string; expert: string };
  return (
    <InfoBubble
      term={entry.label}
      beginner={entry.beginner}
      expert={entry.expert}
      levelLabels={{ beginner: t.glossary.beginner, expert: t.glossary.expert }}
    />
  );
}
