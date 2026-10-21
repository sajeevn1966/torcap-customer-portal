export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-white px-4 text-center dark:bg-surface">
      <p className="text-sm font-medium text-brand-600 dark:text-brand-400">404</p>
      <h1 className="font-display text-xl font-semibold text-ink-900 dark:text-ink-100">Page not found</h1>
      <p className="text-sm text-ink-500 dark:text-ink-300">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
    </div>
  );
}
