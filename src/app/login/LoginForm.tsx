"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";

type Step = "details" | "otp";

export default function LoginForm({ whatsappEnabled }: { whatsappEnabled: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [identifier, setIdentifier] = useState("");
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [whatsappMasked, setWhatsappMasked] = useState("");
  // Seconds left before the current code expires. Driven by an absolute
  // end time (not a decrementing counter) so it stays accurate even if the
  // browser throttles timers while the tab is in the background.
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== "otp" || expiresAt === null) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [step, expiresAt]);

  const expired = step === "otp" && secondsLeft <= 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  async function sendCode() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, mobile }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message ?? "We Couldn't Find That Account.");
        return;
      }
      if (json.data?.otpRequired === false) {
        // WhatsApp sign-in is switched off in Company settings — the match
        // on Step 1/2 alone was enough, and the server already started the
        // session, so just continue straight into the portal.
        router.push("/overview");
        router.refresh();
        return;
      }
      setWhatsappMasked(json.data?.whatsappMasked ?? "");
      const ttl = json.data?.expiresInSeconds ?? 300;
      setExpiresAt(Date.now() + ttl * 1000);
      setSecondsLeft(ttl);
      setCode("");
      setStep("otp");
    } catch {
      setError("Something Went Wrong. Please Try Again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    void sendCode();
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error?.message ?? "We Couldn't Verify That Code.");
        return;
      }
      router.push("/overview");
      router.refresh();
    } catch {
      setError("Something Went Wrong. Please Try Again.");
    } finally {
      setLoading(false);
    }
  }

  function handleChangeDetails() {
    setStep("details");
    setCode("");
    setError(null);
  }

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-brand-700 to-surface px-4">
      {/* Small heart mark tiled across the whole background — matches the
          live site's own footer treatment exactly, rather than a generic
          dot-grid or a couple of large single corner watermarks. */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
        <defs>
          <pattern id="heart-tile" width="110" height="110" patternUnits="userSpaceOnUse">
            <image href="/sona-mark.png" x="5" y="5" width="60" height="60" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#heart-tile)" />
      </svg>

      {/* A little extra depth near the card, echoing the guideline's soft glow */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-gold-400/10 blur-3xl" />

      <div className="relative w-full max-w-sm rounded-3xl border border-ink-100 bg-white p-8 shadow-2xl shadow-black/20 dark:border-surface-border dark:bg-surface-raised sm:p-10">
        <Logo height={44} />

        {step === "details" ? (
          <>
            <h1 className="font-display mt-8 text-2xl font-semibold text-ink-900 dark:text-ink-100">
              Sign In To Your Account
            </h1>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-300">
              {whatsappEnabled
                ? "Enter Your Registered Email Or ID Number, Along With Your WhatsApp Number."
                : "Enter Your Registered Email Or ID Number, Along With Your Mobile Number."}
            </p>

            <form onSubmit={handleSendCode} className="mt-8 space-y-4">
              <div>
                <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-100">
                  Email Or ID Number
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-ink-300 dark:text-ink-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <input
                    id="identifier"
                    name="identifier"
                    type="text"
                    autoComplete="username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Email Or National/Iqama ID Number"
                    className="w-full rounded-xl border border-ink-100 bg-white py-3 pl-11 pr-4 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-surface-border dark:bg-surface dark:text-ink-100 dark:focus:ring-brand-500/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="mobile" className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-100">
                  {whatsappEnabled ? "Registered WhatsApp Number" : "Registered Mobile Number"}
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-ink-300 dark:text-ink-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path
                        d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <input
                    id="mobile"
                    name="mobile"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 0501234567"
                    className="w-full rounded-xl border border-ink-100 bg-white py-3 pl-11 pr-4 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-surface-border dark:bg-surface dark:text-ink-100 dark:focus:ring-brand-500/20"
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || identifier.trim().length < 3 || mobile.trim().length < 5}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 transition hover:bg-brand-600 hover:shadow-md hover:shadow-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {loading
                  ? whatsappEnabled
                    ? "Sending Code…"
                    : "Signing In…"
                  : whatsappEnabled
                    ? "Send WhatsApp Code"
                    : "Login"}
                {!loading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              <p className="text-center text-xs text-ink-300 dark:text-ink-500">
                Both Details Must Match The Same Account On File.
              </p>
            </form>
          </>
        ) : (
          <>
            <h1 className="font-display mt-8 text-2xl font-semibold text-ink-900 dark:text-ink-100">
              Enter The Code
            </h1>
            <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-300">
              We Sent A 6-Digit Code To Your WhatsApp Number Ending In{" "}
              <span className="font-semibold text-ink-700 dark:text-ink-100">{whatsappMasked}</span>.
            </p>

            <form onSubmit={handleVerifyCode} className="mt-8 space-y-4">
              <div>
                <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-100">
                  WhatsApp Code
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  disabled={expired}
                  className="w-full rounded-xl border border-ink-100 bg-white py-3 px-4 text-center text-lg tracking-[0.5em] text-ink-900 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-surface-border dark:bg-surface dark:text-ink-100 dark:focus:ring-brand-500/20"
                />
              </div>

              <p
                aria-live="polite"
                className={`text-center text-sm ${
                  expired ? "font-medium text-red-600 dark:text-red-300" : "text-ink-500 dark:text-ink-300"
                }`}
              >
                {expired ? (
                  "Code Expired. Please Resend A New Code."
                ) : (
                  <>
                    Code Expires In{" "}
                    <span className="font-semibold tabular-nums text-brand-600 dark:text-brand-300">
                      {mm}:{ss}
                    </span>
                  </>
                )}
              </p>

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || expired || code.trim().length < 4}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-500/20 transition hover:bg-brand-600 hover:shadow-md hover:shadow-brand-500/25 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? "Verifying…" : "Verify & Sign In"}
                {!loading && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              <div className="flex items-center justify-between text-xs text-ink-300 dark:text-ink-500">
                <button type="button" onClick={handleChangeDetails} className="underline-offset-2 hover:text-brand-500 hover:underline">
                  Change Details
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void sendCode()}
                  className={`underline-offset-2 hover:text-brand-500 hover:underline disabled:opacity-50 ${
                    expired ? "font-semibold text-brand-600 dark:text-brand-300" : ""
                  }`}
                >
                  Resend Code
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
