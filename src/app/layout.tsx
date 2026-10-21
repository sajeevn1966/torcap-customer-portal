import type { Metadata } from "next";
import { Nunito_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider, themeInitScript } from "@/components/ThemeProvider";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  display: "swap",
});

// Free stand-in for the brand guideline's GT Super Ds Trial (a Grilli Type
// trial font licensed only for mockups, not production — see README §8).
// Playfair Display's high-contrast strokes are the closest free match to
// GT Super's display-serif character seen on the live site's headings.
const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sona Gold & Diamonds | Scheme Portal",
  description: "Customer portal for managing gold and jewellery savings schemes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${nunitoSans.variable} ${playfairDisplay.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before hydration so the correct theme applies with no flash */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-sans bg-sand-50 text-ink-900 dark:bg-surface dark:text-ink-100">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
