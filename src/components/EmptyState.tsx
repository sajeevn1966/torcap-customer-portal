export default function EmptyState({
  message,
  icon,
}: {
  message: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-100 bg-brand-50/40 px-6 py-14 text-center dark:border-surface-border dark:bg-surface-raised/40">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-400 shadow-sm dark:bg-surface dark:text-brand-300">
        {icon ?? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M9 12h6M9 16h4M7 3h7l5 5v11a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <p className="text-sm text-ink-500 dark:text-ink-300">{message}</p>
    </div>
  );
}
