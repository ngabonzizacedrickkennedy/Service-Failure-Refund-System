"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "@/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

/**
 * Shared chrome for the four auth screens: the indigo brand wash, the top bar,
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
          <LanguageSwitcher variant="dark" />
        </div>
      </header>

      <main className="auth-main">{children}</main>
    </div>
  );
}

/** Label + control + error message, stacked. */
export function AuthField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-field">
      <label className="auth-label">{label}</label>
      {children}
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  icon?: LucideIcon;
  invalid?: boolean;
};

export const AuthInput = forwardRef<HTMLInputElement, InputProps>(
  function AuthInput({ icon: Icon, invalid, className = "", ...rest }, ref) {
    return (
      <div className="auth-input-wrap">
        {Icon && <Icon className="auth-input-icon" />}
        <input
          ref={ref}
          className={`auth-input ${Icon ? "" : "no-icon"} ${invalid ? "is-invalid" : ""} ${className}`
            .replace(/\s+/g, " ")
            .trim()}
          {...rest}
        />
      </div>
    );
  }
);

type PasswordProps = Omit<InputProps, "type" | "icon"> & {
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
        <Lock className="auth-input-icon" />
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
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
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
