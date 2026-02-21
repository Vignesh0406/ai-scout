"use client";

import { type ChangeEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/";

  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"login" | "register" | "verify">("login");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function passwordIssues(pw: string) {
    const issues: string[] = [];
    if (pw.length < 8) issues.push("at least 8 characters");
    if (!/[a-z]/.test(pw)) issues.push("a lowercase letter");
    if (!/[A-Z]/.test(pw)) issues.push("an uppercase letter");
    if (!/[0-9]/.test(pw)) issues.push("a number");
    if (!/[^A-Za-z0-9]/.test(pw)) issues.push("a special character (e.g. #, @)");
    return issues;
  }

  async function register() {
    setError(null);
    setInfo(null);
    const e = email.trim();
    if (!e || !e.includes("@")) {
      setError("Enter a valid email");
      return;
    }

    if (!username.trim()) {
      setError("Enter a username");
      return;
    }

    const issues = passwordIssues(password);
    if (issues.length) {
      setError(`Password must include ${issues.join(", ")}.`);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setBusy("register");
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: e, password })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error ?? "Failed to create account");
      setPhase("verify");
      setInfo(
        j?.dev
          ? (typeof j?.code === "string" && j.code ? `Dev mode: OTP is ${j.code}` : "Dev mode: OTP printed in the server console.")
          : "OTP sent to your email."
      );
    } catch (err: any) {
      setError(err?.message ?? "Failed to create account");
    } finally {
      setBusy(null);
    }
  }

  async function resendVerificationCode() {
    setError(null);
    setInfo(null);

    try {
      setBusy("resend");
      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error ?? "Failed to resend code");
      setInfo(
        j?.dev
          ? (typeof j?.code === "string" && j.code ? `Dev mode: OTP is ${j.code}` : "Dev mode: OTP printed in the server console.")
          : "OTP resent to your email."
      );
    } catch (err: any) {
      setError(err?.message ?? "Failed to resend code");
    } finally {
      setBusy(null);
    }
  }

  async function verifyEmail() {
    setError(null);
    setInfo(null);

    try {
      setBusy("verify");
      const r = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error ?? "Invalid code");
      setInfo("Email verified. You can sign in now.");
      setTab("login");
      setPhase("login");
      setCode("");
    } catch (err: any) {
      setError(err?.message ?? "Invalid code");
    } finally {
      setBusy(null);
    }
  }

  async function login() {
    setError(null);
    setInfo(null);

    const e = email.trim();
    if (!e || !e.includes("@")) {
      setError("Enter a valid email");
      return;
    }
    if (!password) {
      setError("Enter your password");
      return;
    }

    try {
      setBusy("login");
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: e, password })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j?.error ?? "Failed to sign in");
      router.replace(next);
      router.refresh();
    } catch (err: any) {
      setError(err?.message ?? "Failed to sign in");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8 space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Welcome</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Your gateway to high-signal startup discovery</p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl p-8 shadow-elevation-2 space-y-6">
        <div className="flex gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setPhase("login");
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
              tab === "login"
                ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 shadow-md"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setPhase("register");
              setError(null);
              setInfo(null);
            }}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
              tab === "register"
                ? "bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 shadow-md"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Register
          </button>
        </div>

        {tab === "register" ? (
          <div className="form-group">
            <label className="label">Username</label>
            <input
              value={username}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              className="input-field"
              placeholder="your name"
              disabled={phase === "verify"}
            />
          </div>
        ) : null}

        <div className="form-group">
          <label className="label">Email address</label>
          <input
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            className="input-field"
            placeholder="you@domain.com"
            disabled={phase === "verify"}
          />
        </div>

        {tab === "login" ? (
          <div className="form-group">
            <label className="label">Password</label>
            <input
              value={password}
              type="password"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
        ) : (
          <div className="form-group">
            <label className="label">Create a password</label>
            <input
              value={password}
              type="password"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              disabled={phase === "verify"}
            />
          </div>
        )}

        {tab === "register" && phase !== "verify" ? (
          <div className="form-group">
            <label className="label">Confirm password</label>
            <input
              value={confirmPassword}
              type="password"
              onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
        ) : null}

        {phase === "verify" ? (
          <div className="form-group">
            <label className="label">Email verification code</label>
            <input
              value={code}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCode(e.target.value)}
              className="input-field"
              placeholder="000000"
            />
          </div>
        ) : null}

        {error ? (
          <div className="animate-fade-in rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-3 text-sm text-red-700 dark:text-red-400 font-medium">
            {error}
          </div>
        ) : null}
        {info ? (
          <div className="animate-fade-in rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium">
            {info}
          </div>
        ) : null}

        {tab === "login" ? (
          <button
            onClick={login}
            disabled={busy !== null}
            className="btn-primary w-full"
          >
            {busy === "login" ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            {phase === "verify" ? (
              <button
                onClick={verifyEmail}
                disabled={busy !== null}
                className="btn-primary w-full"
              >
                {busy === "verify" ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  "Verify email"
                )}
              </button>
            ) : (
              <button
                onClick={register}
                disabled={busy !== null}
                className="btn-primary w-full"
              >
                {busy === "register" ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : (
                  "Create account"
                )}
              </button>
            )}

            {phase === "verify" ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={resendVerificationCode}
                  disabled={busy !== null}
                  className="btn-secondary w-full"
                >
                  {busy === "resend" ? "Resending..." : "Resend code"}
                </button>
                <button
                  onClick={() => {
                    setPhase("register");
                    setCode("");
                    setInfo(null);
                  }}
                  disabled={busy !== null}
                  className="btn-secondary w-full"
                >
                  Edit details
                </button>
              </div>
            ) : null}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
