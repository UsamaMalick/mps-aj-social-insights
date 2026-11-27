"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/data/error-state";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: unknown;
  retry: () => void;
}

export default function ErrorPage({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="This page could not load"
      message="The data service may be unavailable. Check that the backend is running, then try again."
      action={
        <Button variant="outline" size="sm" className="mt-3" onClick={() => retry()}>
          Try again
        </Button>
      }
    />
  );
}
