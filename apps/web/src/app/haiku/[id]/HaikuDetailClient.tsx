"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HaikuLines } from "@/components/HaikuLines";
import { CountdownLabel } from "@/components/CountdownLabel";
import { Button } from "@/components/ui/Button";
import { useHaiku } from "@/hooks/useHaiku";
import { useAnonymousId } from "@/hooks/useAnonymousId";
import { hasProposed } from "@/lib/proposalStore";
import { callGetProposalsForChoice, callChooseProposal, ProposalForChoice } from "@/lib/callables";
import { getFriendlyError } from "@/lib/errorMessages";
import { Haiku } from "@chainku/shared";

// ── Choice section (initiator only) ──────────────────────────────────────────

function ChoiceSection({
  haiku,
  anonymousId,
}: {
  haiku: Haiku;
  anonymousId: string;
}) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [chooseError, setChooseError] = useState<string | null>(null);

  const { data: proposals, isLoading, error: fetchError } = useQuery({
    queryKey: ["proposals", haiku.id],
    queryFn: () => callGetProposalsForChoice({ haikuId: haiku.id, callerUuid: anonymousId }),
    staleTime: 60_000,
  });

  async function handleConfirm() {
    if (!selectedId) return;
    setSubmitting(true);
    setChooseError(null);
    try {
      await callChooseProposal({
        haikuId: haiku.id,
        proposalId: selectedId,
        callerUuid: anonymousId,
      });
      await queryClient.invalidateQueries({ queryKey: ["haiku", haiku.id] });
    } catch (err) {
      setChooseError(getFriendlyError(err));
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-gray-muted">Loading proposals…</p>;
  }

  if (fetchError) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {getFriendlyError(fetchError)}
      </p>
    );
  }

  if (!proposals?.length) {
    return <p className="text-sm text-gray-muted">No proposals yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-ui">
        Choose a line.{" "}
        <CountdownLabel deadline={haiku.currentDeadline} className="text-gray-muted" />
      </p>

      <div className="flex flex-col gap-2">
        {(proposals as ProposalForChoice[]).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedId(p.id)}
            className={[
              "text-left px-4 py-3 rounded-card border transition-colors duration-150",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              selectedId === p.id
                ? "border-accent bg-accent/5"
                : "border-gray-border hover:border-gray-ui bg-white",
            ].join(" ")}
          >
            <p className="font-serif text-lg leading-snug">{p.text}</p>
          </button>
        ))}
      </div>

      {chooseError && (
        <p role="alert" className="text-sm text-red-600">
          {chooseError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button
          onClick={handleConfirm}
          disabled={!selectedId || submitting}
          className="self-start"
        >
          {submitting ? "Confirming…" : "Confirm choice"}
        </Button>
        <p className="text-xs text-gray-muted">
          If you don&apos;t choose in time, one will be picked at random.
        </p>
      </div>
    </div>
  );
}

// ── Copy link button ──────────────────────────────────────────────────────────

function CopyLinkButton({ haikuId }: { haikuId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(`${window.location.origin}/haiku/${haikuId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleCopy}>
      {copied ? "Copied!" : "Copy link"}
    </Button>
  );
}

// ── Action section ────────────────────────────────────────────────────────────

function ActionSection({
  haiku,
  anonymousId,
}: {
  haiku: Haiku;
  anonymousId: string | null;
}) {
  const { status, initiatorId, currentDeadline } = haiku;
  const isInitiator = !!anonymousId && anonymousId === initiatorId;

  if (status === "awaiting_line_2" || status === "awaiting_line_3") {
    const forLine: 2 | 3 = status === "awaiting_line_2" ? 2 : 3;

    if (isInitiator) {
      return (
        <p className="text-sm text-gray-ui">
          Collecting proposals ·{" "}
          <CountdownLabel deadline={currentDeadline} className="text-gray-muted" />
        </p>
      );
    }

    // Need anonymousId loaded before we can check localStorage
    if (anonymousId === null) {
      return <p className="text-sm text-gray-muted">Loading…</p>;
    }

    if (hasProposed(haiku.id, forLine)) {
      return (
        <p className="text-sm text-gray-ui">
          Your proposal has been submitted. Result visible after window closes.
        </p>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-gray-ui">
          Proposals open ·{" "}
          <CountdownLabel deadline={currentDeadline} className="text-gray-muted" />
        </p>
        <Link
          href={`/haiku/${haiku.id}/propose`}
          className="inline-flex items-center justify-center self-start px-4 py-2 rounded-card
            bg-accent text-white text-sm font-medium font-sans
            hover:bg-accent-light transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Propose a line
        </Link>
      </div>
    );
  }

  if (status === "awaiting_choice_2" || status === "awaiting_choice_3") {
    if (isInitiator) {
      return (
        <ChoiceSection haiku={haiku} anonymousId={anonymousId} />
      );
    }
    return (
      <p className="text-sm text-gray-ui">
        The initiator is choosing ·{" "}
        <CountdownLabel deadline={currentDeadline} className="text-gray-muted" />
      </p>
    );
  }

  if (status === "completed") {
    return <CopyLinkButton haikuId={haiku.id} />;
  }

  return null;
}

// ── Main component ────────────────────────────────────────────────────────────

export function HaikuDetailClient() {
  const { id } = useParams<{ id: string }>();
  const { data: haiku, isLoading, error } = useHaiku(id ?? "");
  const anonymousId = useAnonymousId();

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 animate-pulse">
        <div className="flex flex-col gap-2 mb-10">
          <div className="h-8 bg-gray-100 rounded w-3/4" />
          <div className="h-8 bg-gray-100 rounded w-1/2" />
          <div className="h-8 bg-gray-100 rounded w-2/3" />
        </div>
        <div className="h-4 bg-gray-100 rounded w-1/3" />
      </div>
    );
  }

  if (error) {
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

  return (
    <div className="max-w-xl mx-auto px-4 py-12 flex flex-col gap-10">
      <HaikuLines
        line1={haiku.line1.text}
        line2={haiku.line2?.text ?? null}
        line3={haiku.line3?.text ?? null}
        size="large"
      />
      <ActionSection haiku={haiku} anonymousId={anonymousId} />
    </div>
  );
}
