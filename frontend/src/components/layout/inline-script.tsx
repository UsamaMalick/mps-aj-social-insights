interface InlineScriptProps {
  html: string;
}

/**
 * Runs a tiny script during HTML parsing, before first paint (see the Next.js "preventing
 * flash before hydration" guide). `text/plain` on the client avoids React's script warning.
 */
export function InlineScript({ html }: InlineScriptProps) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
