"use client";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";

export interface TurnstileHandle {
  execute: () => void;
  reset: () => void;
}

interface Props {
  onToken: (token: string) => void;
  onExpire: () => void;
}

const siteKey =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

export const TurnstileField = forwardRef<TurnstileHandle, Props>(
  function TurnstileField({ onToken, onExpire }, ref) {
    const innerRef = useRef<TurnstileInstance>(null);

    useImperativeHandle(ref, () => ({
      execute: () => innerRef.current?.execute(),
      reset: () => innerRef.current?.reset(),
    }));

    if (process.env.NEXT_PUBLIC_USE_EMULATOR === "true") {
      return null;
    }

    return (
      <Turnstile
        ref={innerRef}
        siteKey={siteKey}
        options={{ size: "invisible", execution: "render" }}
        onSuccess={onToken}
        onExpire={onExpire}
      />
    );
  }
);
