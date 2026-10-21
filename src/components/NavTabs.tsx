"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/overview",
    label: "Overview",
    icon: (
      <path
        d="M4 11.5L12 4l8 7.5M6 9.5V20h12V9.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/schemes",
    label: "My Schemes",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
        <path d="M8.2 12.3l2.6 2.6 5-5.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: (
      <path
        d="M7 3h10l3 4v13a1 1 0 01-1 1H5a1 1 0 01-1-1V7l3-4zM9 10h6M9 14h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: (
      <path
        d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-0.5 sm:gap-1">
      {TABS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-label={tab.label}
            className={`group flex shrink-0 items-center justify-center gap-1.5 rounded-full p-2.5 text-sm font-medium transition md:px-3.5 md:py-1.5 ${
              active
                ? "bg-gradient-to-b from-brand-500 to-brand-600 text-white shadow-sm shadow-brand-500/30"
                : "text-ink-500 hover:bg-brand-50 hover:text-brand-700 dark:text-ink-300 dark:hover:bg-surface-raised dark:hover:text-brand-300"
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden
              className={`shrink-0 ${active ? "opacity-100" : "opacity-60 transition-opacity group-hover:opacity-100"}`}
            >
              {tab.icon}
            </svg>
            <span className="hidden whitespace-nowrap md:inline">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
