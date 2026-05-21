"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { SyllableCounter } from "@/components/SyllableCounter";
import { TurnstileField, TurnstileHandle } from "@/components/TurnstileField";
import { useAnonymousId } from "@/hooks/useAnonymousId";
import { callCreateHaiku } from "@/lib/callables";
import { getFriendlyError } from "@/lib/errorMessages";
import { CONFIG_DEFAULTS } from "@chainku/shared";

const IS_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === "true";

export default function CreatePage() {
  const router = useRouter();
  const anonymousId = useAnonymousId();
  const [text, setText] = useState("");
  const [token, setToken] = useState<string | null>(IS_EMULATOR ? "EMULATOR_BYPASS" : null);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);

  const charLimit = CONFIG_DEFAULTS.maxLine1Length;

  function handleToken(t: string) {
    setToken(t);
    if (pendingSubmit) {
      setPendingSubmit(false);
      void doSubmit(t);
    }
  }

  function handleExpire() {
    setToken(null);
    setPendingSubmit(false);
  }

  async function doSubmit(t: string) {
    if (!anonymousId) return;
    setSubmitting(true);
    setError(null);
    try {
      const { haikuId } = await callCreateHaiku({
        line1Text: text.trim(),
        turnstileToken: t,
        callerUuid: anonymousId,
      });
      router.push(`/haiku/${haikuId}?created=1`);
    } catch (err) {
      setError(getFriendlyError(err));
      turnstileRef.current?.reset();
      setToken(IS_EMULATOR ? "EMULATOR_BYPASS" : null);
      setSubmitting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!anonymousId || submitting || !text.trim()) return;
    if (!token) {
      setPendingSubmit(true);
      turnstileRef.current?.execute();
      return;
    }
    void doSubmit(token);
  }

  const busy = submitting || pendingSubmit;

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="font-sans text-2xl font-semibold text-[#111111] mb-8">
        Start a new haiku.
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write the first line…"
            maxLength={charLimit}
            rows={2}
            className="font-serif text-xl py-3 leading-snug"
            aria-label="First line of the haiku"
            disabled={busy}
            autoFocus
          />
          <div className="flex items-center justify-between mt-1.5">
            <SyllableCounter text={text} target={5} />
            <span className="text-xs text-gray-muted tabular-nums">
              {text.length}/{charLimit}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-ui">
          Lines 2 and 3 will be proposed by others. You will choose.
        </p>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <TurnstileField
          ref={turnstileRef}
          onToken={handleToken}
          onExpire={handleExpire}
        />

        <Button
          type="submit"
          disabled={busy || !text.trim() || !anonymousId}
          className="self-start"
        >
          {busy ? "Submitting…" : "Start haiku"}
        </Button>
      </form>
    </div>
  );
}
