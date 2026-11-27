"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";

import { ErrorState } from "@/components/data/error-state";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

interface ErrorPageProps {
  error: unknown;
  retry: () => void;
}

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  const { lang } = useParams<{ lang: string }>();
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title={t.common.errorTitle}
      message={t.common.errorBody}
      action={
        <Button variant="outline" onClick={() => retry()}>
          {t.common.tryAgain}
        </Button>
      }
    />
  );
}
