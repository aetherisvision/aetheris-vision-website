"use client";

interface EmailVerificationStepProps {
  email: string;
  code: string;
  onCodeChange: (code: string) => void;
  onStartOver: () => void;
  submitting: boolean;
  error?: string;
  unavailable?: boolean;
  submitLabel?: string;
}

/** Shared, accessible second step for the public contact and intake forms. */
export default function EmailVerificationStep({
  email,
  code,
  onCodeChange,
  onStartOver,
  submitting,
  error,
  unavailable = false,
  submitLabel = "Confirm and submit",
}: EmailVerificationStepProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
        Email verification
      </p>
      <h3 className="mt-3 text-xl font-semibold text-white">Enter the six-digit code</h3>
      <p className="mt-3 text-sm leading-6 text-gray-400">
        We sent a confirmation code to <span className="font-medium text-white">{email}</span>.
        Your information will not be submitted until the code is confirmed.
      </p>

      <div className="mt-6 max-w-xs">
        <label
          htmlFor="email-verification-code"
          className="mb-2 block text-xs font-medium uppercase tracking-widest text-gray-400"
        >
          Confirmation code <span className="text-blue-400">*</span>
        </label>
        <input
          id="email-verification-code"
          name="verificationCode"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          minLength={6}
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(event) => onCodeChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
          aria-describedby="email-verification-help"
          className="min-h-12 w-full rounded-md border border-white/20 bg-[#0a1628] px-4 text-lg tracking-[0.35em] text-white outline-none transition placeholder:text-white/25 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/25"
          placeholder="000000"
        />
        <p id="email-verification-help" className="mt-2 text-xs leading-5 text-gray-500">
          The code expires in 10 minutes. Check your spam folder if it does not arrive.
        </p>
      </div>

      {unavailable && (
        <p role="status" className="mt-5 rounded-md border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
          Verification is temporarily unavailable. Please wait a moment and try again.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-5 rounded-md border border-red-300/30 bg-red-300/10 p-4 text-sm leading-6 text-red-100">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={submitting || code.length !== 6}
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-white px-7 text-sm font-semibold text-[#0a1628] transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Confirming…" : submitLabel}
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={onStartOver}
          className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/15 px-6 text-sm font-medium text-gray-300 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Change email or details
        </button>
      </div>
    </div>
  );
}
