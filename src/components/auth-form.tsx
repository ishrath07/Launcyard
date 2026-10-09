"use client";

import { useActionState } from "react";
import { loginAction, signupAction } from "@/server/auth-actions";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className="panel" style={{ maxWidth: 440, margin: "1rem auto 3rem" }}>
      <h1 style={{ marginTop: 0 }}>{mode === "login" ? "Log in" : "Create your account"}</h1>
      <p className="muted">This account owns the store. Staff can be invited later, after they sign up.</p>
      {state?.error && <p className="error">{state.error}</p>}
      {mode === "signup" && (
        <label className="field">
          <span>Your name</span>
          <input name="name" required minLength={2} />
        </label>
      )}
      <label className="field">
        <span>Email</span>
        <input name="email" type="email" required />
      </label>
      <label className="field">
        <span>Password</span>
        <input name="password" type="password" required minLength={8} />
      </label>
      {next && <input type="hidden" name="next" value={next} />}
      <button className="btn" disabled={pending} type="submit">{pending ? "Please wait…" : mode === "login" ? "Log in" : "Continue to setup"}</button>
    </form>
  );
}
