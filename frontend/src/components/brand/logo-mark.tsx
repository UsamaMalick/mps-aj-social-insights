interface LogoMarkProps {
  size: number;
  tileColor: string;
  bubbleColor: string;
  /** Accessible name; omit when a visible title sits next to the mark. */
  title?: string;
}

/**
 * The AJ Social Insights mark: a speech bubble (social) holding rising bars (insights).
 * Used for the header logo and, via ImageResponse, the favicon and Apple touch icon.
 */
export function LogoMark({ size, tileColor, bubbleColor, title }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect width="32" height="32" rx="8" fill={tileColor} />
      <path
        d="M8.5 7.5h15a2.5 2.5 0 0 1 2.5 2.5v9a2.5 2.5 0 0 1-2.5 2.5H15l-4.5 4v-4h-2A2.5 2.5 0 0 1 6 19v-9a2.5 2.5 0 0 1 2.5-2.5Z"
        fill={bubbleColor}
      />
      <rect x="10.25" y="14.5" width="3" height="4.5" rx="0.9" fill={tileColor} />
      <rect x="14.5" y="12.25" width="3" height="6.75" rx="0.9" fill={tileColor} />
      <rect x="18.75" y="10" width="3" height="9" rx="0.9" fill={tileColor} />
    </svg>
  );
}
