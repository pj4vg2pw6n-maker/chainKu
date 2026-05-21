"use client";
import { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { FirebaseError } from "firebase/app";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { SyllableCounter } from "@/components/SyllableCounter";
import { CountdownLabel } from "@/components/CountdownLabel";
import { TurnstileField, TurnstileHandle } from "@/components/TurnstileField";
import { useHaiku } from "@/hooks/useHaiku";
import { useAnonymousId } from "@/hooks/useAnonymousId";
import { hasProposed, markProposed } from "@/lib/proposalStore";
import { callSubmitProposal } from "@/lib/callables";
import { getFriendlyError } from "@/lib/errorMessages";
import { CONFIG_DEFAULTS } from "@chainku/shared";

const IS_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === "true";

export function ProposeClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const anonymousId = useAnonymousId();
  const { data: haiku, isLoading, error: fetchError } = useHaiku(id ?? "");

  const [text, setText] = useState("");
  const [token, setToken] = useState<string | null>(
    IS_EMULATOR ? "EMULATOR_BYPASS" : null
  );
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);

  const forLine: 2 | 3 | null =
    haiku?.status === "awaiting_line_2"
      ? 2
      : haiku?.status === "awaiting_line_3"
        ? 3
        : null;

  // Redirect if the haiku is not in a proposable state, or the caller is
  // the initiator, or they've already submitted for this line.
  useEffect(() => {
    if (!haiku || !anonymousId) return;
    if (
      !forLine ||
      haiku.initiatorId === anonymousId ||
      hasProposed(haiku.id, forLine)
    ) {
      router.replace(`/haiku/${id}`);
    }
  }, [haiku, anonymousId, forLine, id, router]);

  const charLimit = CONFIG_DEFAULTS.maxLine23Length;
  const syllableTarget = forLine === 2 ? 7 : 5;

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
    if (!anonymousId || !haiku || !forLine) return;
    setSubmitting(true);
    setError(null);
    try {
      await callSubmitProposal({
        haikuId: haiku.id,
        text: text.trim(),
        turnstileToken: t,
        callerUuid: anonymousId,
      });
      markProposed(haiku.id, forLine);
      router.push(`/haiku/${id}`);
    } catch (err) {
      // If the server says already-exists, sync localStorage and redirect so
      // the detail page shows the correct "already submitted" state.
      if (
        err instanceof FirebaseError &&
        err.code.replace("functions/", "") === "already-exists"
      ) {
        markProposed(haiku.id, forLine);
        router.replace(`/haiku/${id}`);
        return;
      }
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

  if (isLoading || !anonymousId) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <p className="text-sm text-gray-muted">Loading…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <p className="text-sm text-red-600">Failed to load haiku.</p>
      </div>
    );
  }

  if (!haiku) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <p className="text-sm text-gray-muted">Haiku not found.</p>
      </div>
    );
  }

  // Redirect is pending (wrong state / initiator / already proposed).
  if (
    !forLine ||
    haiku.initiatorId === anonymousId ||
    hasProposed(haiku.id, forLine)
  ) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <p className="text-sm text-gray-muted">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-12 flex flex-col gap-8">
      <Link
        href={`/haiku/${id}`}
        className="self-start text-sm text-gray-ui hover:text-[#111111] transition-colors duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
      >
        ← Back
      </Link>

      {/* Previous canonical lines, dimmed */}
      <div className="flex flex-col gap-0.5 opacity-40 select-none">
        <p className="font-serif text-xl leading-snug">{haiku.line1.text}</p>
        {forLine === 3 && haiku.line2 && (
          <p className="font-serif text-xl leading-snug">{haiku.line2.text}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Write line ${forLine}…`}
            maxLength={charLimit}
            rows={2}
            className="font-serif text-xl py-3 leading-snug"
            aria-label={`Line ${forLine} of the haiku`}
            disabled={busy}
            autoFocus
          />
          <div className="flex items-center justify-between mt-1.5">
            <SyllableCounter text={text} target={syllableTarget} />
            <span className="text-xs text-gray-muted tabular-nums">
              {text.length}/{charLimit}
            </span>
          </div>
        </div>

        <p className="text-sm text-gray-ui">
          Proposals open ·{" "}
          <CountdownLabel
            deadline={haiku.currentDeadline}
            className="text-gray-muted"
          />
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
          disabled={busy || !text.trim()}
          className="self-start"
        >
          {busy ? "Submitting…" : "Submit proposal"}
        </Button>
      </form>
    </div>
  );
}
