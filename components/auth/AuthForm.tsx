import Link from "next/link";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (formData: FormData) => Promise<void>;
  redirectTo?: string;
  error?: string;
  message?: string;
};

const inputClass =
  "h-10 w-full rounded-lg border border-white/10 bg-[#0c0d0e] px-3 text-[14px] text-white outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-tertiary hover:border-white/15 focus:border-brand focus:ring-1 focus:ring-brand/40";

const primaryButtonClass =
  "flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand text-[14px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.16)] transition-all hover:opacity-90 active:scale-[0.99]";

export function AuthForm({
  mode,
  action,
  redirectTo,
  error,
  message,
}: AuthFormProps) {
  const isLogin = mode === "login";
  const redirectQuery = redirectTo
    ? `&redirectTo=${encodeURIComponent(redirectTo)}`
    : "";

  return (
    <div className="space-y-5">
      {error ? (
        <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-[13px] text-red-300">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-300">
          {message}
        </p>
      ) : null}

      <form action={action} className="space-y-4">
        {redirectTo ? (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        ) : null}
        {!isLogin ? (
          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-[12px] font-medium text-secondary"
            >
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              className={inputClass}
              placeholder="Your name"
            />
          </div>
        ) : null}
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[12px] font-medium text-secondary">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={inputClass}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-[12px] font-medium text-secondary">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            required
            minLength={isLogin ? 1 : 12}
            maxLength={128}
            className={inputClass}
            placeholder="••••••••"
          />
          {!isLogin ? (
            <p className="mt-1.5 text-[11px] text-tertiary">
              Use at least 12 characters.
            </p>
          ) : null}
        </div>
        <button type="submit" className={primaryButtonClass}>
          {isLogin ? "Log in" : "Sign up"}
          <kbd className="hidden rounded border border-white/15 bg-white/8 px-1.5 py-0.5 font-mono text-[10px] text-white/70 sm:inline">
            ↵
          </kbd>
        </button>
      </form>

      <p className="text-center text-[13px] text-secondary">
        {isLogin ? (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href={`/?modal=signup${redirectQuery}`}
              className="text-white transition-opacity hover:opacity-80"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={`/?modal=login${redirectQuery}`}
              className="text-white transition-opacity hover:opacity-80"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
