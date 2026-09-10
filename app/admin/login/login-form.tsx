"use client";

import { useActionState } from "react";
import { sendMagicLink, type SendMagicLinkState } from "@/actions/admin/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: SendMagicLinkState = { status: "idle" };

const authErrorMessages = {
  context: "Open a new sign-in link in the same browser and profile where you requested it.",
  expired: "This sign-in link has expired or was already used. Request a new one.",
  exchange: "We could not complete that sign-in link. Request a new one and try again.",
} as const;

export function LoginForm({ authError }: { authError?: string }) {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);
  const callbackError =
    authError && authError in authErrorMessages
      ? authErrorMessages[authError as keyof typeof authErrorMessages]
      : undefined;

  if (state.status === "sent") {
    return (
      <p className="text-sm text-muted-foreground">
        Check your email for a sign-in link. You can close this tab.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="you@example.com" required autoFocus />
      </div>
      {callbackError && <p className="text-sm text-destructive">{callbackError}</p>}
      {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending..." : "Send sign-in link"}
      </Button>
    </form>
  );
}
