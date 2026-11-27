"use client";

import { useActionState, useEffect, useRef } from "react";
import { changeAdminPassword, type ChangePasswordState } from "@/actions/admin/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ChangePasswordState = { status: "idle" };

export function PasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState(changeAdminPassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the fields after a successful change so the passwords don't sit in the form.
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="max-w-xl space-y-4">
      {/* Lets password managers attach the new password to the right account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <div className="space-y-1">
        <Label htmlFor="current_password">Current password</Label>
        <Input id="current_password" name="current_password" type="password" autoComplete="current-password" required />
      </div>
      <div className="space-y-1">
        <Label htmlFor="new_password">New password</Label>
        <Input id="new_password" name="new_password" type="password" autoComplete="new-password" minLength={10} maxLength={200} required />
        <p className="text-xs text-muted-foreground">At least 10 characters.</p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="confirm_password">Confirm new password</Label>
        <Input id="confirm_password" name="confirm_password" type="password" autoComplete="new-password" minLength={10} maxLength={200} required />
      </div>

      {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Changing..." : "Change password"}
        </Button>
        {state.status === "success" && (
          <span className="text-sm text-muted-foreground">Password changed. Other sessions have been signed out.</span>
        )}
      </div>
    </form>
  );
}
