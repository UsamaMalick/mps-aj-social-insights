"use client";

import { RefreshCw } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { generateRecommendations, type GenerateState } from "../actions";

const INITIAL_STATE: GenerateState = { error: null, generated: null };

export function GenerateButton() {
  const [state, formAction, isPending] = useActionState(generateRecommendations, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <Button type="submit" disabled={isPending}>
        <RefreshCw className={isPending ? "animate-spin" : undefined} aria-hidden />
        {isPending ? "Generating…" : "Generate recommendations"}
      </Button>
      <p role="status" aria-live="polite" className="text-xs">
        {state.error ? (
          <span className="text-destructive">{state.error}</span>
        ) : state.generated !== null ? (
          <span className="text-muted-foreground">
            Generated {state.generated} recommendations from the latest data.
          </span>
        ) : null}
      </p>
    </form>
  );
}
