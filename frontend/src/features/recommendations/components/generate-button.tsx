"use client";

import { RefreshCw } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { interpolate } from "@/i18n/interpolate";
import { createFormat } from "@/lib/format";

import { generateRecommendations, type GenerateState } from "../actions";

const INITIAL_STATE: GenerateState = { error: null, failed: false, generated: null };

interface GenerateButtonProps {
  locale: Locale;
}

export function GenerateButton({ locale }: GenerateButtonProps) {
  const t = getDictionary(locale).recommendations;
  const [state, formAction, isPending] = useActionState(generateRecommendations, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <Button type="submit" variant="primary" size="lg" disabled={isPending}>
        <RefreshCw className={isPending ? "animate-spin" : undefined} aria-hidden />
        {isPending ? t.generating : t.generate}
      </Button>
      <p role="status" aria-live="polite" className="min-h-4 text-xs">
        {state.failed ? (
          <span className="text-destructive">
            {interpolate(t.generateFailed, { message: state.error ?? t.unexpectedError })}
          </span>
        ) : state.generated !== null ? (
          <span className="text-ink-2">
            {interpolate(t.generated, { count: createFormat(locale).integer(state.generated) })}
          </span>
        ) : null}
      </p>
    </form>
  );
}
