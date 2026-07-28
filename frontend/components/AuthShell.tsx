"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "@/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

/**
 * Shared chrome for the four auth screens: the yellow brand wash, the top bar,
 * and the centred content column. Styling lives in the `.auth-*` block of
 * app/globals.css so all four pages stay in lockstep.
 */
export function AuthShell({
  navRight,
  children,
}: {
  /** Right-hand nav slot — usually the link to the opposite auth page. */
  navRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-page">
      <div className="auth-wash" aria-hidden="true" />

      <header className="auth-nav">
        <Link href="/" className="auth-wordmark">
          SSFRS
        </Link>
        <div className="auth-nav-right">
          {navRight}
          {/* Light variant: the nav sits on yellow, so its ink must be dark. */}
          <LanguageSwitcher variant="light" />
        </div>
      </header>

      <main className="auth-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}

/**
 * Groups a control with its error message. There is no visible label —
 * the reference design is label-less, so callers pass the field name as
 * both `placeholder` and `aria-label` on the control itself.
 */
export function AuthField({
  error,
  children,
}: {
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-field">
      {children}
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

/** Plain square field — the reference design carries no leading icon. */
export const AuthInput = forwardRef<HTMLInputElement, InputProps>(
  function AuthInput({ invalid, className = "", ...rest }, ref) {
    return (
      <div className="auth-input-wrap">
        <input
          ref={ref}
          className={`auth-input ${invalid ? "is-invalid" : ""} ${className}`
            .replace(/\s+/g, " ")
            .trim()}
          {...rest}
        />
      </div>
    );
  }
);

type PasswordProps = InputProps & {
  showLabel?: string;
  hideLabel?: string;
};

/** Password field that owns its own reveal toggle. */
export const AuthPasswordInput = forwardRef<HTMLInputElement, PasswordProps>(
  function AuthPasswordInput(
    { invalid, className = "", showLabel = "Show password", hideLabel = "Hide password", ...rest },
    ref
  ) {
    const [visible, setVisible] = useState(false);
    return (
      <div className="auth-input-wrap">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={`auth-input has-toggle ${invalid ? "is-invalid" : ""} ${className}`.trim()}
          {...rest}
        />
        <button
          type="button"
          className="auth-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    );
  }
);

/** Outlined pill CTA with the inline spinner state. */
export function AuthSubmit({
  loading,
  loadingLabel,
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <button type="submit" className="auth-submit" disabled={loading} {...rest}>
      {loading ? (
        <>
          <span className="auth-spinner" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
